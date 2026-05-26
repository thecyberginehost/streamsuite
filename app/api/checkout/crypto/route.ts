import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Crypto checkout (NOWPayments) is in final testing — production dashboard
// provisioning (API key + IPN secret + payout wallets) needs end-to-end
// verification before this endpoint can safely create real-money invoices.
//
// Until then this returns 503 with a structured message so the front-end
// (or anyone hitting the API directly) gets a clear "temporarily unavailable"
// rather than a half-working invoice. The waitlist UI lives at
// /checkout/crypto/[tier].
//
// To re-enable: revert this file to the prior version that calls
// createInvoice() from lib/nowpayments. Backend webhook (/api/nowpayments/
// webhook) stays live so any stuck invoice from earlier sandbox testing
// still gets processed if it eventually fires.

export async function POST() {
  return NextResponse.json(
    {
      error: 'crypto checkout temporarily unavailable',
      detail: 'NOWPayments integration is in final testing. Card billing is live via /pricing. Join the crypto waitlist at /checkout/crypto/realtime.',
      retry_after_days: 14,
    },
    { status: 503, headers: { 'Retry-After': '1209600' } },
  );
}
