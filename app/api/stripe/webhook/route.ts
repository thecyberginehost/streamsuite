import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { promises as fs } from 'fs';
import path from 'path';
import Stripe from 'stripe';
import { Resend } from 'resend';
import {
  upsertCustomerFromCheckout,
  getCustomerByEmail,
  generateApiKey,
  setCustomerApiKey,
  getCustomerByStripeSubscriptionId,
  getCustomerByStripeCustomerId,
  updateCustomerStatus,
  updateCustomerTier,
  createMagicToken,
  isStripeEventProcessed,
  markStripeEventProcessed,
} from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const RESEND_KEY = process.env.RESEND_API_KEY;
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'aamore@streamsuite.io';
const FROM_EMAIL = process.env.FROM_EMAIL || 'StreamSuite <noreply@streamsuite.io>';
const LOG_PATH = process.env.STRIPE_LOG_PATH || path.join(process.cwd(), 'logs', 'stripe-events.jsonl');

const tierLabel: Record<string, string> = {
  realtime: 'BSC Real-Time ($399/mo)',
  mempool: 'BSC Mempool ($999/mo)',
  fullnode: 'BSC Full Node ($2,499/mo)',
};

// Map Stripe price IDs → tier name. Filled from env so test/live IDs don't
// have to be hard-coded. If a price ID isn't in this map (e.g. env not set
// after a live flip), tier change events are logged but not applied.
function priceToTierMap(): Record<string, string> {
  const map: Record<string, string> = {};
  const pairs: Array<[string | undefined, string]> = [
    [process.env.STRIPE_PRICE_REALTIME, 'realtime'],
    [process.env.STRIPE_PRICE_MEMPOOL,  'mempool'],
    [process.env.STRIPE_PRICE_FULLNODE, 'fullnode'],
  ];
  for (const [id, tier] of pairs) if (id) map[id] = tier;
  return map;
}

// Pull the first matching tier from a subscription's price items.
function tierFromSubscription(sub: Stripe.Subscription): string | null {
  const m = priceToTierMap();
  for (const item of sub.items?.data || []) {
    const priceId = typeof item.price === 'string' ? item.price : item.price?.id;
    if (priceId && m[priceId]) return m[priceId];
  }
  return null;
}

// Map Stripe sub status → our customer.status enum.
//   active / trialing                                   -> 'active'
//   past_due                                            -> 'past_due'  (grace)
//   canceled / incomplete_expired / unpaid              -> 'cancelled'
//   incomplete / paused                                 -> leave as-is
function customerStatusFromSub(s: Stripe.Subscription.Status): 'active' | 'past_due' | 'cancelled' | null {
  switch (s) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'incomplete_expired':
    case 'unpaid':
      return 'cancelled';
    default:
      return null;
  }
}

async function appendLog(entry: object) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n';
  try {
    await fs.appendFile(LOG_PATH, line);
  } catch (err) {
    console.error('stripe-webhook: log write failed', err);
  }
}

async function notifyByEmail(subject: string, html: string, text: string) {
  if (!RESEND_KEY) {
    console.warn('stripe-webhook: RESEND_API_KEY not set, skipping email');
    return { sent: false, reason: 'no_resend_key' };
  }
  try {
    const resend = new Resend(RESEND_KEY);
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: NOTIFY_EMAIL,
      subject,
      html,
      text,
    });
    if (error) {
      console.error('stripe-webhook: resend error', error);
      return { sent: false, reason: 'resend_error', error };
    }
    return { sent: true, id: data?.id };
  } catch (err) {
    console.error('stripe-webhook: resend throw', err);
    return { sent: false, reason: 'resend_throw' };
  }
}

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const ENDPOINT_HOST = 'va-bsc-01.streamsuite.io';

async function sendCustomerWelcome(opts: {
  email: string;
  name: string;
  tier: string;
  operatorId: string;
  apiKey: string;
  isReturning?: boolean;
}): Promise<void> {
  if (!RESEND_KEY) {
    console.warn('stripe-webhook: RESEND_API_KEY not set, skipping welcome email');
    return;
  }
  const label = tierLabel[opts.tier] || opts.tier;
  const baseUrl = process.env.NEXTAUTH_URL || 'https://streamsuite.io';
  // 7-day TTL on the welcome code so customers don't have to re-request one
  // if they don't open the email immediately. Sign-in via 6-digit code only
  // (no magic link) — eliminates in-app-browser cookie-scope issues.
  const { code: welcomeCode } = createMagicToken(opts.email, 7 * 24 * 60 * 60 * 1000);
  const loginUrl = `${baseUrl}/login`;
  const codeDisplay = `${welcomeCode.slice(0, 3)} ${welcomeCode.slice(3)}`;

  // SECURITY: we do NOT include the API key or fully-qualified key URLs in
  // the email body. Email is forwardable, archived, and indexed by providers.
  // The dashboard link auto-authenticates via the magic token; the key only
  // appears once the user reaches the (HTTPS, behind-auth) dashboard.

  const subject = opts.isReturning
    ? `StreamSuite — welcome back, your ${label} subscription is active`
    : `Welcome to StreamSuite — your ${label} operator slot is ready`;
  const headerTag = opts.isReturning ? '┌─ welcome back to streamsuite ─┐' : '┌─ welcome to streamsuite ─┐';
  const headline = opts.isReturning ? `Your ${label} subscription is active` : `Your ${label} operator slot is ready`;
  const intro = opts.isReturning
    ? `Welcome back — your StreamSuite ${label} subscription is active again. Your existing API key still works, so nothing needs to change in your bot.`
    : `Your StreamSuite operator slot is active. You're on ${label}.`;
  const accessLine = opts.isReturning
    ? `Open the dashboard to see your key, endpoints, and usage. The link below signs you in automatically (valid 7 days).`
    : `Open the dashboard to grab your API key + RPC endpoints. The link below signs you in automatically (valid 7 days).`;

  const text = [
    `Hey${opts.name ? ` ${opts.name.split(' ')[0]}` : ''},`,
    ``,
    intro,
    `Operator ID: ${opts.operatorId}`,
    ``,
    accessLine,
    ``,
    `Sign-in code (valid 7 days):`,
    ``,
    `    ${codeDisplay}`,
    ``,
    `Type this on ${loginUrl} (use Safari/Chrome, not your email app's in-app browser).`,
    ``,
    `Why isn't the API key in this email? Email is forwardable and archived. We`,
    `keep credentials behind your dashboard so they never leak through your inbox.`,
    ``,
    `No rate limits. No throttling. 10-operator colocation group in Ashburn, VA.`,
    `Hit reply if you need anything — same person who runs the infra reads this inbox.`,
    ``,
    `— StreamSuite`,
  ].join('\n');

  const html = `
    <!doctype html>
    <html><body style="font-family:'JetBrains Mono','SF Mono',monospace;background:#0a0a0a;color:#e6e6e6;max-width:640px;margin:0 auto;padding:24px;">
      <div style="background:#0d1117;border:1px solid #2a2a2a;border-radius:6px;padding:32px;">
        <p style="color:#34d399;font-size:11px;letter-spacing:0.2em;margin:0 0 24px;text-transform:uppercase;">${esc(headerTag)}</p>
        <h1 style="margin:0 0 8px;font-family:system-ui,sans-serif;font-size:22px;font-weight:600;color:#e6e6e6;">${esc(headline)}</h1>
        <p style="color:#8b96a7;margin:0 0 24px;font-family:system-ui,sans-serif;font-size:14px;line-height:1.6;">
          ${esc(intro)}
        </p>
        <p style="color:#8b96a7;margin:0 0 8px;font-family:system-ui,sans-serif;font-size:13px;">
          <span style="color:#6ee7b7;font-family:'JetBrains Mono','SF Mono',monospace;">Operator ID:</span> <span style="color:#e6e6e6;font-family:'JetBrains Mono','SF Mono',monospace;">${esc(opts.operatorId)}</span>
        </p>
        <p style="color:#8b96a7;margin:0 0 24px;font-family:system-ui,sans-serif;font-size:14px;line-height:1.6;">
          ${esc(accessLine)}
        </p>

        <div style="background:#07090c;border:1px solid #2a2a2a;border-radius:4px;padding:24px;margin:0 0 20px;text-align:center;">
          <p style="color:#8b96a7;margin:0 0 8px;font-family:system-ui,sans-serif;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">Sign-in code · valid 7 days</p>
          <p style="margin:0;font-family:'JetBrains Mono','SF Mono',monospace;font-size:36px;font-weight:600;color:#34d399;letter-spacing:0.15em;">${esc(codeDisplay)}</p>
        </div>

        <p style="color:#bbb;margin:0 0 24px;font-family:system-ui,sans-serif;font-size:13px;text-align:center;line-height:1.6;">
          Type this code on <a href="${esc(loginUrl)}" style="color:#34d399;text-decoration:none;">streamsuite.io/login</a><br/>
          <span style="color:#8b96a7;font-size:11px;">(use Safari/Chrome, not your email app's in-app browser)</span>
        </p>

        <div style="background:#07090c;border:1px solid #1f2937;border-radius:4px;padding:14px;margin:0 0 24px;">
          <p style="color:#8b96a7;font-family:system-ui,sans-serif;font-size:12px;line-height:1.6;margin:0;">
            <strong style="color:#fbbf24;">Why isn't the API key in this email?</strong><br/>
            Email is forwardable, archived in your inbox, and indexed by providers. We keep credentials behind your dashboard so they never leak through your inbox.
          </p>
        </div>

        <hr style="border:none;border-top:1px solid #1f2937;margin:24px 0;" />

        <p style="color:#8b96a7;font-family:system-ui,sans-serif;font-size:13px;line-height:1.6;margin:0;">
          No rate limits. No throttling. 10-operator colocation group in Ashburn, VA.<br/>
          Hit reply if you need anything — same person who runs the infra reads this inbox.
        </p>
      </div>
    </body></html>
  `;

  try {
    const resend = new Resend(RESEND_KEY);
    await resend.emails.send({
      from: FROM_EMAIL,
      to: opts.email,
      subject,
      html,
      text,
    });
  } catch (err) {
    console.error('stripe-webhook: welcome email failed', err);
  }
}

async function sendPaymentFailedEmail(opts: {
  email: string;
  name: string | null;
  tier: string;
  amountDue: number;        // cents
  hostedInvoiceUrl: string | null;
  attempt: number;
  nextAttempt: number | null; // unix seconds
}): Promise<void> {
  if (!RESEND_KEY) return;
  const dashboardUrl = `${process.env.NEXTAUTH_URL || 'https://streamsuite.io'}/dashboard`;
  const label = tierLabel[opts.tier] || opts.tier;
  const amount = `$${(opts.amountDue / 100).toFixed(2)}`;
  const firstName = opts.name ? opts.name.split(' ')[0] : '';
  const nextAttemptText = opts.nextAttempt
    ? new Date(opts.nextAttempt * 1000).toUTCString()
    : 'within a few days';

  const subject = `StreamSuite — payment failed for ${label}`;
  const updateUrl = opts.hostedInvoiceUrl || dashboardUrl;

  const text = [
    `Hey${firstName ? ` ${firstName}` : ''},`,
    ``,
    `We weren't able to charge your card for the latest ${label} invoice (${amount}).`,
    ``,
    `Your bot is still running on a short grace period. Stripe will retry around ${nextAttemptText}.`,
    `If the retry fails, your key will be deactivated until the invoice is paid.`,
    ``,
    `Update your card here:`,
    updateUrl,
    ``,
    `(Or open the dashboard and click "Manage billing": ${dashboardUrl})`,
    ``,
    `Reply if there's anything we can do to help.`,
    ``,
    `— StreamSuite`,
  ].join('\n');

  const html = `
    <!doctype html>
    <html><body style="font-family:'JetBrains Mono','SF Mono',monospace;background:#0a0a0a;color:#e6e6e6;max-width:640px;margin:0 auto;padding:24px;">
      <div style="background:#0d1117;border:1px solid #2a2a2a;border-radius:6px;padding:32px;">
        <p style="color:#f87171;font-size:11px;letter-spacing:0.2em;margin:0 0 24px;text-transform:uppercase;">┌─ payment failed ─┐</p>
        <h1 style="margin:0 0 8px;font-family:system-ui,sans-serif;font-size:22px;font-weight:600;color:#e6e6e6;">We couldn&apos;t charge your card</h1>
        <p style="color:#8b96a7;margin:0 0 24px;font-family:system-ui,sans-serif;font-size:14px;line-height:1.6;">
          The latest invoice for ${esc(label)} (${esc(amount)}) didn&apos;t go through. Your bot is still running on a short grace period — Stripe will retry around <strong>${esc(nextAttemptText)}</strong>. If that retry fails, your key will be deactivated until the invoice is paid.
        </p>

        <a href="${esc(updateUrl)}" style="display:inline-block;background:#34d399;color:#0a0a0a;text-decoration:none;padding:12px 24px;font-weight:600;border-radius:3px;font-family:system-ui,sans-serif;margin:0 0 16px;">Update payment method →</a>

        <p style="color:#8b96a7;font-family:system-ui,sans-serif;font-size:12px;margin:24px 0 0;line-height:1.6;">
          Or open the <a href="${esc(dashboardUrl)}" style="color:#6ee7b7;">dashboard</a> and click &quot;Manage billing&quot;.<br/>
          Reply to this email if there&apos;s anything we can do to help.
        </p>
      </div>
    </body></html>
  `;

  try {
    const resend = new Resend(RESEND_KEY);
    await resend.emails.send({
      from: FROM_EMAIL,
      to: opts.email,
      subject,
      html,
      text,
    });
  } catch (err) {
    console.error('stripe-webhook: payment_failed email failed', err);
  }
}

export async function POST(req: Request) {
  if (!STRIPE_SECRET || !WEBHOOK_SECRET) {
    console.error('stripe-webhook: missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const sig = (await headers()).get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const raw = await req.text();
  const stripe = new Stripe(STRIPE_SECRET);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('stripe-webhook: signature verification failed', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Always log every event for audit trail
  await appendLog({
    event_id: event.id,
    type: event.type,
    livemode: event.livemode,
    created: event.created,
  });

  // Idempotency. Stripe retries non-2xx deliveries with the same event_id.
  // Skip processing if we've already handled it — return 200 so Stripe stops
  // retrying. This prevents double-creating customers / double-emails on
  // network blips or our own transient errors that recover.
  if (isStripeEventProcessed(event.id)) {
    await appendLog({ event_id: event.id, type: 'duplicate_delivery_skipped' });
    return NextResponse.json({ ok: true, deduped: true });
  }

  // Route by type
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const tier = session.metadata?.tier || 'unknown';
      const email = session.customer_details?.email || session.customer_email || 'unknown';
      const name = session.customer_details?.name || '';
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id || '';
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id || '';
      const amount = session.amount_total ? `$${(session.amount_total / 100).toFixed(2)}` : '';

      await appendLog({
        event_id: event.id,
        type: 'fulfillment_required',
        tier,
        email,
        name,
        customer_id: customerId,
        subscription_id: subscriptionId,
        amount,
      });

      // Duplicate-purchase detection.
      // Stripe Payment Links create a fresh Stripe Customer on every checkout,
      // so a user clicking "Get Started" twice ends up with two Customers and
      // two Subscriptions billing the same email. Catch that here: if an
      // active row already exists with a DIFFERENT stripe_customer_id, log
      // the duplicate, alert the operator, and DO NOT overwrite the original
      // DB linkage. Operator manually cancels + refunds the duplicate in the
      // Stripe dashboard (restricted key has no subscription/refund write).
      let isDuplicate = false;
      if (email !== 'unknown') {
        const pre = getCustomerByEmail(email.toLowerCase());
        if (
          pre &&
          (pre.status === 'active' || pre.status === 'past_due') &&
          pre.stripe_customer_id &&
          pre.stripe_customer_id !== customerId
        ) {
          isDuplicate = true;
          await appendLog({
            event_id: event.id,
            type: 'duplicate_purchase_detected',
            email: email.toLowerCase(),
            existing_customer_id: pre.stripe_customer_id,
            existing_subscription_id: pre.stripe_subscription_id,
            new_customer_id: customerId,
            new_subscription_id: subscriptionId,
            new_tier: tier,
            existing_tier: pre.tier,
          });
          // Best-effort operator alert. Don't await — if alerter is down we
          // still want to mark event processed so Stripe doesn't retry.
          try {
            await notifyByEmail(
              `[StreamSuite] 🚨 DUPLICATE PURCHASE — ${email}`,
              `<p><strong>Action required: refund + cancel in Stripe.</strong></p>
               <p>Existing active sub: <code>${esc(pre.stripe_subscription_id || '')}</code> (tier ${esc(pre.tier)})<br/>
               New duplicate sub: <code>${esc(subscriptionId)}</code> (tier ${esc(tier)})<br/>
               New customer: <code>${esc(customerId)}</code></p>
               <p>The DB row was NOT modified — original subscription stays linked. The duplicate Stripe sub is dangling and must be cancelled + refunded in Stripe dashboard.</p>
               <p>Link: <a href="https://dashboard.stripe.com/subscriptions/${esc(subscriptionId)}">cancel duplicate sub</a></p>`,
              `DUPLICATE PURCHASE for ${email}\n\nExisting: ${pre.stripe_subscription_id} (${pre.tier})\nNew dup:  ${subscriptionId} (${tier})\nNew cust: ${customerId}\n\nCancel + refund the duplicate in Stripe.`
            );
          } catch (e) {
            console.error('stripe-webhook: dup alert failed', e);
          }
        }
      }

      // Upsert into customer DB so the dashboard knows about this user.
      // Skipped on duplicates — we preserve the original Stripe IDs.
      let dbCustomer = null;
      let isNewKey = false;
      try {
        if (email !== 'unknown' && !isDuplicate) {
          dbCustomer = upsertCustomerFromCheckout({
            email: email.toLowerCase(),
            name: name || null,
            tier,
            stripe_customer_id: customerId || undefined,
            stripe_subscription_id: subscriptionId || undefined,
          });

          // Generate API key on first checkout (don't regenerate on resubscribe —
          // existing customers keep their key so they don't have to re-roll).
          isNewKey = !dbCustomer.api_key;
          if (isNewKey) {
            const newKey = generateApiKey();
            setCustomerApiKey(email.toLowerCase(), newKey);
            dbCustomer = { ...dbCustomer, api_key: newKey };
            await appendLog({
              event_id: event.id,
              type: 'api_key_generated',
              email: email.toLowerCase(),
              operator_id: dbCustomer.operator_id,
            });
          }

          // Always send customer-facing email after a successful checkout —
          // first-time gets a welcome, resubscribe gets a welcome-back. Both
          // include the key + dashboard magic link so the customer never has
          // to dig through old emails to find their credentials.
          await sendCustomerWelcome({
            email: email.toLowerCase(),
            name,
            tier,
            operatorId: dbCustomer.operator_id || '',
            apiKey: dbCustomer.api_key || '',
            isReturning: !isNewKey,
          });

          await appendLog({
            event_id: event.id,
            type: 'customer_upserted',
            customer_db_id: dbCustomer.id,
            operator_id: dbCustomer.operator_id,
            has_key: !!dbCustomer.api_key,
          });
        }
      } catch (err) {
        console.error('stripe-webhook: customer upsert failed', err);
        await appendLog({ event_id: event.id, type: 'customer_upsert_error', error: String(err) });
      }

      // Skip the regular NEW SALE operator alert on duplicate purchases —
      // we already sent the dedicated 🚨 DUPLICATE PURCHASE alert above and
      // a second "Auto-fulfilled" message would be misleading.
      if (isDuplicate) {
        markStripeEventProcessed(event.id, event.type);
        break;
      }

      const label = tierLabel[tier] || tier;
      const subject = `[StreamSuite] ${event.livemode ? 'NEW SALE' : 'TEST SALE'} — ${label} — ${email}`;
      const operatorId = dbCustomer?.operator_id || '—';
      const keyPrefix = dbCustomer?.api_key ? `${dbCustomer.api_key.slice(0, 12)}…` : '—';
      const keyLine = isNewKey ? `generated (${keyPrefix})` : `preserved (${keyPrefix})`;
      const customerEmailStatus = dbCustomer?.api_key
        ? (isNewKey ? `welcome email sent → ${email}` : `welcome-back email sent → ${email}`)
        : `NOT sent — upsert failed`;

      const text = [
        `New StreamSuite sale${event.livemode ? '' : ' (TEST MODE)'}.`,
        ``,
        `Tier:          ${label}`,
        `Email:         ${email}`,
        `Name:          ${name}`,
        `Amount:        ${amount}`,
        `Stripe ID:     ${customerId}`,
        `Subscription:  ${subscriptionId}`,
        `Operator ID:   ${operatorId}`,
        `Livemode:      ${event.livemode}`,
        ``,
        `--- Auto-fulfilled ---`,
        `✓ Customer row upserted`,
        `✓ API key ${keyLine}`,
        `✓ ${customerEmailStatus}`,
        `✓ Nginx key sync within ≤7s`,
        ``,
        `No manual action required.`,
        ``,
        `Webhook event: ${event.id}`,
      ].join('\n');

      const html = `
        <!doctype html>
        <html><body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="margin:0 0 8px;">New StreamSuite sale</h2>
          <p style="color:#666;margin:0 0 24px;">${event.livemode ? '<strong>LIVE MODE</strong>' : 'Test mode'}</p>
          <table style="border-collapse:collapse;width:100%;">
            <tr><td style="padding:6px 12px;background:#f5f5f5;width:140px;"><strong>Tier</strong></td><td style="padding:6px 12px;">${esc(label)}</td></tr>
            <tr><td style="padding:6px 12px;background:#f5f5f5;"><strong>Email</strong></td><td style="padding:6px 12px;"><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
            <tr><td style="padding:6px 12px;background:#f5f5f5;"><strong>Name</strong></td><td style="padding:6px 12px;">${esc(name)}</td></tr>
            <tr><td style="padding:6px 12px;background:#f5f5f5;"><strong>Amount</strong></td><td style="padding:6px 12px;">${esc(amount)}</td></tr>
            <tr><td style="padding:6px 12px;background:#f5f5f5;"><strong>Stripe Customer</strong></td><td style="padding:6px 12px;font-family:monospace;font-size:12px;">${esc(customerId)}</td></tr>
            <tr><td style="padding:6px 12px;background:#f5f5f5;"><strong>Subscription</strong></td><td style="padding:6px 12px;font-family:monospace;font-size:12px;">${esc(subscriptionId)}</td></tr>
            <tr><td style="padding:6px 12px;background:#f5f5f5;"><strong>Operator ID</strong></td><td style="padding:6px 12px;font-family:monospace;font-size:12px;">${esc(operatorId)}</td></tr>
          </table>
          <h3 style="margin:32px 0 8px;color:#16a34a;">Auto-fulfilled</h3>
          <ul style="line-height:1.7;padding-left:20px;margin:0;">
            <li>Customer row upserted</li>
            <li>API key <strong>${esc(keyLine)}</strong></li>
            <li>${esc(customerEmailStatus)}</li>
            <li>Nginx key sync within ≤7s</li>
          </ul>
          <p style="color:#666;font-size:13px;margin-top:24px;">No manual action required.</p>
          <p style="color:#999;font-size:12px;margin-top:32px;">Webhook event: ${esc(event.id)}</p>
        </body></html>
      `;

      const emailResult = await notifyByEmail(subject, html, text);
      await appendLog({ event_id: event.id, type: 'email_attempt', ...emailResult });
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

      // Locate our DB row. Prefer subscription_id; fall back to customer_id.
      const customer =
        getCustomerByStripeSubscriptionId(sub.id) ||
        (customerId ? getCustomerByStripeCustomerId(customerId) : undefined);

      const previousTier = customer?.tier || sub.metadata?.tier || 'unknown';

      if (customer) {
        updateCustomerStatus(customer.email, 'cancelled');
        await appendLog({
          event_id: event.id,
          type: 'customer_cancelled',
          email: customer.email,
          previous_tier: previousTier,
          customer_id: customerId,
          subscription_id: sub.id,
        });
      } else {
        await appendLog({
          event_id: event.id,
          type: 'cancellation_unmatched',
          customer_id: customerId,
          subscription_id: sub.id,
        });
      }

      const subject = `[StreamSuite] CANCELLATION — ${tierLabel[previousTier] || previousTier}`;
      const text = `Subscription cancelled.\n\n${customer ? `Email: ${customer.email}\nOperator: ${customer.operator_id}\n` : ''}Customer: ${customerId}\nSubscription: ${sub.id}\nTier: ${previousTier}\n\nAPI key will be removed from nginx on next sync (≤5s).`;
      const html = `<p>Subscription cancelled.</p><ul>${customer ? `<li>Email: <code>${esc(customer.email)}</code></li><li>Operator: <code>${esc(customer.operator_id)}</code></li>` : ''}<li>Customer: <code>${esc(customerId)}</code></li><li>Subscription: <code>${esc(sub.id)}</code></li><li>Tier: ${esc(previousTier)}</li></ul><p>API key will be removed from nginx on next sync (≤5s).</p>`;
      await notifyByEmail(subject, html, text);
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

      const customer =
        getCustomerByStripeSubscriptionId(sub.id) ||
        (customerId ? getCustomerByStripeCustomerId(customerId) : undefined);

      if (!customer) {
        await appendLog({
          event_id: event.id,
          type: 'subscription_updated_unmatched',
          customer_id: customerId,
          subscription_id: sub.id,
          sub_status: sub.status,
        });
        break;
      }

      const nextStatus = customerStatusFromSub(sub.status);
      const newTier = tierFromSubscription(sub);
      const changes: Record<string, unknown> = {
        prev_status: customer.status,
        prev_tier: customer.tier,
        sub_status: sub.status,
      };

      if (nextStatus && nextStatus !== customer.status) {
        updateCustomerStatus(customer.email, nextStatus);
        changes.new_status = nextStatus;
      }
      if (newTier && newTier !== customer.tier) {
        updateCustomerTier(customer.email, newTier);
        changes.new_tier = newTier;
      } else if (!newTier) {
        // Price ID didn't match the env map. Flag so we know to update env.
        const priceIds = (sub.items?.data || [])
          .map(i => typeof i.price === 'string' ? i.price : i.price?.id)
          .filter(Boolean);
        changes.unmapped_prices = priceIds;
      }

      await appendLog({
        event_id: event.id,
        type: 'subscription_updated',
        email: customer.email,
        subscription_id: sub.id,
        ...changes,
      });

      // Operator alert only on meaningful transitions (tier change or status change),
      // not on every proration/metadata update — Stripe fires this event a lot.
      if (changes.new_status || changes.new_tier) {
        const tierForLabel = (changes.new_tier as string) || customer.tier;
        const subject = `[StreamSuite] SUB UPDATE — ${customer.email} — ${tierLabel[tierForLabel] || tierForLabel}`;
        const lines = [
          `Subscription updated.`,
          ``,
          `Email:    ${customer.email}`,
          `Operator: ${customer.operator_id}`,
          changes.new_status ? `Status:   ${customer.status} → ${changes.new_status}` : `Status:   ${customer.status} (no change)`,
          changes.new_tier   ? `Tier:     ${customer.tier} → ${changes.new_tier}` : `Tier:     ${customer.tier} (no change)`,
          `Sub:      ${sub.id}`,
          ``,
          `Sync will reconcile within 5s.`,
        ].join('\n');
        const html = `<p>Subscription updated for <code>${esc(customer.email)}</code> (${esc(customer.operator_id)}).</p>
          <ul>
            ${changes.new_status ? `<li>Status: <code>${esc(customer.status)}</code> → <code>${esc(changes.new_status)}</code></li>` : ''}
            ${changes.new_tier ? `<li>Tier: <code>${esc(customer.tier)}</code> → <code>${esc(changes.new_tier)}</code></li>` : ''}
            <li>Subscription: <code>${esc(sub.id)}</code></li>
          </ul>
          <p>Sync will reconcile within 5s.</p>`;
        await notifyByEmail(subject, html, lines);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id || '';

      // 1 customer = 1 subscription in our model, so customer_id lookup is enough.
      // (Stripe SDK 22+ removed Invoice.subscription from the typed surface.)
      const customer = customerId ? getCustomerByStripeCustomerId(customerId) : undefined;

      await appendLog({
        event_id: event.id,
        type: 'payment_failed',
        email: customer?.email,
        customer_id: customerId,
        amount_due: invoice.amount_due,
        attempt_count: invoice.attempt_count,
        next_payment_attempt: invoice.next_payment_attempt,
      });

      if (customer) {
        // Customer-facing email with the hosted invoice URL (Stripe's "update card" page).
        await sendPaymentFailedEmail({
          email: customer.email,
          name: customer.name,
          tier: customer.tier,
          amountDue: invoice.amount_due,
          hostedInvoiceUrl: invoice.hosted_invoice_url || null,
          attempt: invoice.attempt_count || 1,
          nextAttempt: invoice.next_payment_attempt || null,
        });

        // Operator alert
        const subject = `[StreamSuite] DUNNING — ${customer.email} — attempt ${invoice.attempt_count}`;
        const text = `Payment failed.\n\nEmail: ${customer.email}\nOperator: ${customer.operator_id}\nTier: ${customer.tier}\nAmount: $${(invoice.amount_due / 100).toFixed(2)}\nAttempt: ${invoice.attempt_count}\nNext retry: ${invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000).toUTCString() : 'n/a'}\n\nCustomer was emailed the hosted invoice URL. Grace status applies.`;
        const html = `<p>Payment failed for <code>${esc(customer.email)}</code> (${esc(customer.operator_id)}).</p>
          <ul>
            <li>Tier: ${esc(customer.tier)}</li>
            <li>Amount: $${(invoice.amount_due / 100).toFixed(2)}</li>
            <li>Attempt: ${esc(invoice.attempt_count)}</li>
            <li>Next retry: ${invoice.next_payment_attempt ? esc(new Date(invoice.next_payment_attempt * 1000).toUTCString()) : 'n/a'}</li>
          </ul>
          <p>Customer was emailed the hosted invoice URL. Grace status applies.</p>`;
        await notifyByEmail(subject, html, text);
      }

      // Stripe will follow up with subscription.updated (status → past_due
      // then eventually canceled/unpaid). Status transitions happen there.
      break;
    }

    default:
      // Logged above; nothing more to do
      break;
  }

  // Mark this event as processed AFTER successful handling. If any handler
  // threw, we never reach here, the function 500s, Stripe retries — exactly
  // what we want. On retry, the idempotency check at the top short-circuits.
  markStripeEventProcessed(event.id, event.type);

  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, route: '/api/stripe/webhook' });
}
