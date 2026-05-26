import { NextRequest, NextResponse } from 'next/server';
import { createInvoice, isSupportedPayCurrency, TIER_PRICES_USD } from '@/lib/nowpayments';
import { getCustomerByEmail, getAcceptingGroup } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/checkout/crypto
// Body: { tier: 'realtime'|'mempool'|'fullnode', email: string, pay_currency: string }
// Returns: { invoice_url: string } — redirect the customer here.
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const tier = String(body.tier || '').toLowerCase();
  const email = String(body.email || '').trim().toLowerCase();
  const pay_currency = String(body.pay_currency || '').toLowerCase();
  const mode: 'prod' | 'sandbox' = body.mode === 'sandbox' ? 'sandbox' : 'prod';

  if (!TIER_PRICES_USD[tier]) {
    return NextResponse.json({ error: 'unknown tier' }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'invalid email' }, { status: 400 });
  }
  if (!isSupportedPayCurrency(pay_currency)) {
    return NextResponse.json({ error: 'unsupported pay currency' }, { status: 400 });
  }

  // In SANDBOX mode skip business-logic gates (active sub, capacity) — it's a test.
  if (mode === 'prod') {
    // Block if customer already has an active sub (avoids accidental double-purchase).
    const existing = getCustomerByEmail(email);
    if (existing && existing.status === 'active') {
      return NextResponse.json(
        { error: 'this email already has an active subscription — sign in to manage' },
        { status: 409 }
      );
    }

    // Tier-specific capacity gate (Full Node hard-cap of 1 per box).
    const accepting = getAcceptingGroup(tier === 'fullnode' ? 'fullnode' : undefined);
    if (!accepting) {
      return NextResponse.json(
        { error: tier === 'fullnode'
            ? 'Full Node slot is currently taken; join the waitlist'
            : 'all slots currently full; join the waitlist' },
        { status: 409 }
      );
    }
  }

  try {
    const invoice = await createInvoice({ email, tier, pay_currency, mode });
    return NextResponse.json({ invoice_url: invoice.invoice_url, invoice_id: invoice.id });
  } catch (e: any) {
    console.error('crypto checkout error:', e?.message || e);
    return NextResponse.json(
      { error: e?.message || 'invoice creation failed' },
      { status: 502 }
    );
  }
}
