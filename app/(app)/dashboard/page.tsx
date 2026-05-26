import { requireSession } from '@/lib/auth';
import { getCustomerByEmail } from '@/lib/db';
import { DashboardClient } from './_components/DashboardClient';
import Link from 'next/link';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const tierLabel: Record<string, string> = {
  realtime: 'BSC Real-Time',
  mempool: 'BSC Mempool',
  fullnode: 'BSC Full Node',
};

const tierPrice: Record<string, string> = {
  realtime: '$399/mo',
  mempool: '$999/mo',
  fullnode: '$2,499/mo',
};

export default async function DashboardPage() {
  const email = await requireSession();
  const customer = getCustomerByEmail(email);

  if (!customer || customer.status === 'pending' || !customer.api_key) {
    return (
      <main className="px-4 sm:px-6 py-12 max-w-4xl mx-auto">
        <div className="card p-6 sm:p-8 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent/80 mb-3">
            {customer ? '── provisioning ──' : '── no subscription ──'}
          </p>
          <h1 className="text-2xl font-semibold mb-3">
            {customer ? 'Provisioning your operator slot' : 'No active subscription'}
          </h1>
          <p className="text-muted mb-6">
            {customer
              ? "Your payment was received. We're generating your API key — refresh in a few seconds."
              : `We don't see an active subscription for ${email}. Choose a plan to get started.`}
          </p>
          {!customer && (
            <Link href="/pricing" className="btn-primary inline-flex">
              View plans →
            </Link>
          )}
          {customer && (
            <p className="font-mono text-xs text-muted mt-4">
              Email: <span className="text-ink">{email}</span>
            </p>
          )}
        </div>
      </main>
    );
  }

  return (
    <DashboardClient
      email={email}
      operatorId={customer.operator_id || 'VA-BSC-01-XXXX'}
      status={customer.status}
      tier={customer.tier}
      label={tierLabel[customer.tier] || customer.tier}
      price={tierPrice[customer.tier] || ''}
      apiKey={customer.api_key}
      endpointHost="va-bsc-01.streamsuite.io"
    />
  );
}
