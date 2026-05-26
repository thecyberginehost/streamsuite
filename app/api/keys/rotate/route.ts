import { NextResponse } from 'next/server';
import { getSessionEmail } from '@/lib/auth';
import { getCustomerByEmail, generateApiKey, setCustomerApiKey } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const email = await getSessionEmail();
  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const customer = getCustomerByEmail(email);
  if (!customer) {
    // Session is valid but no customer row — shouldn't happen given magic-link
    // path is paid-only, but defend against it.
    return NextResponse.json({ error: 'No subscription' }, { status: 403 });
  }

  if (customer.status === 'cancelled') {
    return NextResponse.json({ error: 'Subscription cancelled' }, { status: 403 });
  }

  const newKey = generateApiKey();
  setCustomerApiKey(email, newKey);

  return NextResponse.json({
    ok: true,
    api_key: newKey,
    sync_seconds: 5,
    notice: 'Old key is invalidated immediately on our side and removed from the edge within 5 seconds.',
  });
}
