import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSessionEmail } from '@/lib/auth';
import { getCustomerByEmail } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const RETURN_URL = (process.env.NEXTAUTH_URL || 'https://streamsuite.io') + '/dashboard';

export async function POST() {
  if (!STRIPE_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }
  // API routes return 401 JSON on missing session instead of redirecting —
  // a 307 → /login → 405 HTML cascade breaks res.json() on the client.
  const email = await getSessionEmail();
  if (!email) {
    return NextResponse.json(
      { error: 'Session expired. Refresh the page and sign in again.' },
      { status: 401 }
    );
  }
  const customer = getCustomerByEmail(email);
  if (!customer || !customer.stripe_customer_id) {
    return NextResponse.json(
      { error: 'No Stripe customer record found for this account' },
      { status: 404 }
    );
  }

  const stripe = new Stripe(STRIPE_SECRET);
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url: RETURN_URL,
    });
    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error('billing portal session create failed:', e?.message || e);
    return NextResponse.json(
      { error: e?.message || 'Stripe billing portal error' },
      { status: 500 }
    );
  }
}
