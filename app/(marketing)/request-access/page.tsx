import type { Metadata } from 'next';
import { Suspense } from 'react';
import RequestForm from './RequestForm';

export const metadata: Metadata = {
  title: 'Request Access | StreamSuite',
  description:
    'Request access to dedicated BSC RPC endpoints, custom chain nodes, or colocated bot hosting. We reply within 24 hours.',
};

export default function RequestAccess() {
  return (
    <div className="max-w-3xl mx-auto px-6 pt-16 pb-20 md:pt-20">
      <div className="pill mb-5">
        <span>Get in touch</span>
      </div>
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-ink mb-5">
        Request Access
      </h1>
      <p className="text-lg text-muted max-w-2xl leading-relaxed mb-10">
        Tell us what you&apos;re building. We read every request personally and reply within 24 hours
        Usually faster.
      </p>

      <Suspense fallback={<div className="card p-8 text-muted">Loading form...</div>}>
        <RequestForm />
      </Suspense>

      <div className="mt-10 text-sm text-muted">
        Prefer email?{' '}
        <a href="mailto:support@streamsuite.io" className="text-accent hover:text-accent-bright">
          support@streamsuite.io
        </a>
      </div>
    </div>
  );
}
