import { NextRequest, NextResponse } from 'next/server';
import { verifyIpnSignature, parseOrderId, CRYPTO_ACCESS_DAYS } from '@/lib/nowpayments';
import { upsertCustomerFromCryptoPayment, setCustomerApiKey, getCustomerByEmail, db, generateApiKey, createMagicToken } from '@/lib/db';
import { Resend } from 'resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/nowpayments/webhook
// IPN payload from NOWPayments. Signature in x-nowpayments-sig header.
//
// Lifecycle (per NOWPayments docs):
//   waiting → confirming → confirmed → sending → finished   (success path)
//   waiting → confirming → failed                            (failure)
//   waiting → expired                                        (timeout)
//
// We only provision the customer on `finished`.
export async function POST(req: NextRequest) {
  const sig = req.headers.get('x-nowpayments-sig') || '';
  const rawBody = await req.text();

  // Peek at order_id to figure out which mode this is, so we can verify
  // the signature with the correct secret. Body remains unparsed beyond
  // this lookup until after signature verification.
  let prelim: any;
  try {
    prelim = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const orderId = String(prelim.order_id || '');
  const parsed = parseOrderId(orderId);
  if (!parsed) {
    console.error(`nowpayments webhook: unparseable order_id "${orderId}"`);
    return NextResponse.json({ error: 'unparseable order_id' }, { status: 400 });
  }

  if (!verifyIpnSignature(rawBody, sig, parsed.mode)) {
    console.error(`nowpayments webhook: invalid signature (mode=${parsed.mode})`);
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  const payload = prelim;
  const status = String(payload.payment_status || '').toLowerCase();
  const invoiceId = String(payload.invoice_id || payload.payment_id || '');

  // ── SANDBOX BRANCH ──────────────────────────────────────────────────────
  // Log + acknowledge. Never write to the customers/keys tables.
  if (parsed.mode === 'sandbox') {
    console.log(`[SANDBOX] nowpayments webhook OK: invoice=${invoiceId} status=${status} tier=${parsed.tier} email=${parsed.email}`);
    return NextResponse.json({ ok: true, mode: 'sandbox', status, invoice_id: invoiceId });
  }

  // ── PROD BRANCH ─────────────────────────────────────────────────────────
  // Idempotency: if we've already processed this invoice, no-op.
  if (invoiceId) {
    const seen = db().prepare(
      "SELECT 1 FROM processed_stripe_events WHERE event_id = ?"
    ).get(`nowpayments:${invoiceId}:${status}`);
    if (seen) {
      return NextResponse.json({ ok: true, idempotent: true });
    }
  }

  if (status !== 'finished' && status !== 'confirmed') {
    console.log(`nowpayments: invoice=${invoiceId} status=${status} order=${orderId}`);
    return NextResponse.json({ ok: true, status });
  }

  const paidUntil = Date.now() + CRYPTO_ACCESS_DAYS * 24 * 60 * 60 * 1000;

  const customer = upsertCustomerFromCryptoPayment({
    email: parsed.email,
    tier: parsed.tier,
    invoice_id: invoiceId,
    paid_until: paidUntil,
  });

  if (!customer.api_key) {
    const apiKey = generateApiKey();
    setCustomerApiKey(parsed.email, apiKey);
  }

  db().prepare(
    "INSERT OR IGNORE INTO processed_stripe_events (event_id, type, processed_at) VALUES (?, ?, ?)"
  ).run(`nowpayments:${invoiceId}:${status}`, 'nowpayments.finished', Date.now());

  await sendWelcomeEmail(parsed.email, parsed.tier).catch(e => {
    console.error('welcome email failed:', e?.message || e);
  });

  return NextResponse.json({ ok: true, provisioned: true });
}

async function sendWelcomeEmail(email: string, tier: string): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn('nowpayments webhook: RESEND_API_KEY not set, skipping email');
    return;
  }
  const customer = getCustomerByEmail(email);
  if (!customer) return;

  // SECURITY: the API key is NEVER included in this email.
  // Same policy as the Stripe webhook — email is forwardable, archived, and
  // indexed by providers. We send a 6-digit sign-in code with 7-day TTL; the
  // customer types it at /login to reach the dashboard, where the key lives.

  const baseUrl = process.env.NEXTAUTH_URL || 'https://streamsuite.io';
  const { code: welcomeCode } = createMagicToken(email, 7 * 24 * 60 * 60 * 1000);
  const codeDisplay = `${welcomeCode.slice(0, 3)} ${welcomeCode.slice(3)}`;
  const loginUrl = `${baseUrl}/login?email=${encodeURIComponent(email)}&from=welcome`;
  const paidUntilIso = customer.crypto_paid_until
    ? new Date(customer.crypto_paid_until).toISOString().slice(0, 10)
    : '';
  const tierLabel: Record<string, string> = {
    realtime: 'Real-Time',
    mempool: 'Mempool',
    fullnode: 'Full Node',
  };
  const label = tierLabel[tier] || tier;

  const resend = new Resend(resendKey);
  const fromEmail = process.env.FROM_EMAIL || 'StreamSuite <noreply@streamsuite.io>';

  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: `StreamSuite ${label} — crypto payment received`,
    text: [
      `Payment received. Your ${label} subscription is active until ${paidUntilIso}.`,
      `Operator ID: ${customer.operator_id ?? ''}`,
      ``,
      `Your API key lives on your dashboard — never in email. Sign in to grab it,`,
      `view live request stats, and rotate the key if you ever need to.`,
      ``,
      `Sign-in code (valid 7 days):`,
      ``,
      `    ${codeDisplay}`,
      ``,
      `Type this at ${loginUrl} (use Safari/Chrome, not your email app's in-app`,
      `browser — those drop session cookies on refresh).`,
      ``,
      `Why isn't the API key in this email? Email is forwardable, archived, and`,
      `indexed. We keep credentials behind your dashboard so they never leak`,
      `through your inbox.`,
      ``,
      `Docs:    https://streamsuite.io/docs`,
      `Support: support@streamsuite.io`,
      ``,
      `Heads up: this is a one-time crypto payment good for ${CRYPTO_ACCESS_DAYS} days.`,
      `We'll email you a renewal reminder before access expires on ${paidUntilIso}.`,
      ``,
      `— StreamSuite`,
    ].join('\n'),
  });
}
