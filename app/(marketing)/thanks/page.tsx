import Link from 'next/link';

export const metadata = {
  title: 'Thanks — StreamSuite',
  description: 'Your StreamSuite subscription is being provisioned.',
};

// Server component: searchParams is provided by Next.js via props.
// /thanks?via=crypto comes from the NOWPayments success_url; everything else
// (including unbranded direct visits) gets the default subscription copy.
export default function ThanksPage({
  searchParams,
}: {
  searchParams: { via?: string };
}) {
  const isCrypto = (searchParams?.via || '').toLowerCase() === 'crypto';

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6 py-24">
      <div className="max-w-xl text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-8">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold mb-4">
          {isCrypto ? 'Payment received — provisioning' : 'Thanks — payment received'}
        </h1>
        <p className="text-muted text-lg mb-8 leading-relaxed">
          {isCrypto ? (
            <>
              We&apos;ve seen your transaction on-chain and your operator slot is being
              provisioned now. Check the inbox you paid with &mdash; a one-time sign-in
              code lands within a minute, and the link in that email drops you straight
              into the dashboard to enter it.
            </>
          ) : (
            <>
              Your StreamSuite subscription is being provisioned now. We&apos;ll email
              you a sign-in code within a few minutes &mdash; type it on the login
              page and your API key + endpoints are waiting on your dashboard.
            </>
          )}
        </p>
        <div className="bg-surface border border-divider rounded-lg p-6 text-left mb-8">
          <p className="text-sm text-muted mb-2 font-semibold uppercase tracking-wide">What happens next</p>
          {isCrypto ? (
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>We wait for on-chain confirmation (usually under 60 seconds on Base/BSC, longer on Ethereum L1).</li>
              <li>You get a welcome email with a 6-digit sign-in code (valid 7 days). <strong>The API key is NOT in the email</strong> &mdash; we keep credentials off email entirely so they never leak through your inbox.</li>
              <li>Click the link in the email; it lands you on /login with your email already filled &mdash; just type the 6-digit code.</li>
              <li>Your dashboard shows the API key, endpoint URL, live request stats, and rotation controls.</li>
              <li>Crypto access is good for <strong>30 days</strong> as a one-time payment. We&apos;ll email a renewal reminder before expiry.</li>
            </ol>
          ) : (
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>We verify the payment landed and generate your operator slot.</li>
              <li>You get an email with a sign-in code (valid 7 days). <strong>The API key is NOT in the email</strong> &mdash; we keep credentials off email entirely so they never leak through your inbox.</li>
              <li>Type the code at <code className="bg-divider/30 px-1 rounded text-xs">streamsuite.io/login</code> to reach your dashboard. Your API key, endpoint URLs, live stats, and rotation controls all live there.</li>
              <li>Start hitting <code className="bg-divider/30 px-1 rounded text-xs">va-bsc-01.streamsuite.io</code> &mdash; no rate limits, no warmup.</li>
            </ol>
          )}
        </div>
        <p className="text-sm text-muted">
          Need help or didn&apos;t receive the sign-in code?{' '}
          <a href="mailto:support@streamsuite.io" className="underline hover:no-underline">
            support@streamsuite.io
          </a>
        </p>
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Link href="/login" className="btn-primary">Go to sign-in →</Link>
          <Link href="/" className="btn-ghost">← Back to home</Link>
        </div>
      </div>
    </main>
  );
}
