'use client';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const ERROR_COPY: Record<string, string> = {
  missing_token: 'That sign-in link was missing a token. Request a new one.',
  invalid_token: 'That sign-in link has expired. Request a new one.',
  oauth_unconfigured: 'GitHub sign-in is not configured. Use email below.',
  oauth_denied: 'GitHub sign-in was cancelled.',
  oauth_missing_params: 'GitHub sign-in did not complete. Try again.',
  oauth_bad_state: 'GitHub sign-in security check failed. Try again.',
  oauth_token_exchange: 'Could not complete GitHub sign-in. Try again.',
  oauth_api: 'Could not reach GitHub. Try again.',
};

function UrlErrorBanner() {
  const params = useSearchParams();
  const code = params.get('error');
  if (!code || !ERROR_COPY[code]) return null;
  return (
    <div className="card p-3 mb-4 border-red-500/30 bg-red-500/5">
      <p className="text-sm text-red-400 font-mono text-center">{ERROR_COPY[code]}</p>
    </div>
  );
}

// Small Suspense-wrapped child that reads ?email=&from= and prefills the
// parent's state. Needs Suspense because useSearchParams opts out of static
// rendering otherwise (Next.js 14 requirement).
function PrefillFromQuery({
  onPrefill,
}: {
  onPrefill: (email: string, fromWelcome: boolean) => void;
}) {
  const sp = useSearchParams();
  useEffect(() => {
    if (!sp) return;
    const e = sp.get('email');
    const from = sp.get('from');
    if (e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      onPrefill(e, from === 'welcome');
    }
  }, [sp, onPrefill]);
  return null;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);


  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('sending');
    setError(null);
    try {
      const res = await fetch('/api/auth/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Could not send sign-in link');
        setStatus('error');
        return;
      }
      setStatus('sent');
    } catch (err) {
      setError('Network error');
      setStatus('error');
    }
  }

  async function onCodeSubmit(e: FormEvent) {
    e.preventDefault();
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) {
      setVerifyError('Enter all 6 digits.');
      return;
    }
    setVerifying(true);
    setVerifyError(null);
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: digits }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data?.error || 'Verification failed');
        return;
      }
      // Session cookie was set by the response; navigate to the dashboard.
      window.location.href = data.redirect || '/dashboard';
    } catch (err) {
      setVerifyError('Network error');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-3rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent/80 mb-3">
            ┌── sign in ──┐
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Operator sign-in</h1>
          <p className="text-muted text-sm">
            One tap with GitHub, or get a one-time email link.
          </p>
        </div>

        <Suspense fallback={null}>
          <PrefillFromQuery
            onPrefill={(e, fromWelcome) => {
              setEmail(e);
              if (fromWelcome) setStatus('sent');
            }}
          />
          <UrlErrorBanner />
        </Suspense>

        {status === 'sent' ? (
          <div className="card p-6">
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mb-4">
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="font-semibold mb-2">Check your inbox</h2>
              <p className="text-muted text-sm mb-1">
                We sent a sign-in code to
              </p>
              <p className="font-mono text-sm text-ink break-all">{email}</p>
            </div>

            <form onSubmit={onCodeSubmit} className="space-y-3">
              <label htmlFor="code" className="label">Enter the 6-digit code</label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9 ]*"
                maxLength={7}
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={verifying}
                placeholder="123 456"
                className="input text-center font-mono text-xl tracking-[0.3em]"
              />

              {verifyError && (
                <p className="text-sm text-red-400 font-mono text-center">{verifyError}</p>
              )}

              <button
                type="submit"
                disabled={verifying || code.replace(/\D/g, '').length !== 6}
                className="btn-primary w-full !py-3"
              >
                {verifying ? 'Verifying…' : 'Sign in →'}
              </button>
            </form>

            <p className="text-muted text-xs mt-5 text-center leading-relaxed">
              Or click the link in your email. The code/link expires in 15 minutes.<br/>
              Didn&apos;t arrive? Check spam or{' '}
              <button
                onClick={() => { setStatus('idle'); setCode(''); setVerifyError(null); }}
                className="underline hover:no-underline"
              >
                try again
              </button>
              .
            </p>
          </div>
        ) : (
          <div className="card p-6 space-y-5">
            <a
              href="/api/auth/github/start"
              className="btn-primary w-full !py-3 flex items-center justify-center gap-2 !bg-ink hover:!bg-ink/90 !text-bg !border !border-white/10"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .5C5.65.5.5 5.65.5 12.02c0 5.1 3.29 9.42 7.86 10.95.58.11.79-.25.79-.56 0-.27-.01-1.18-.02-2.13-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.58.23 2.75.11 3.04.73.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.16 0 1.56-.01 2.82-.01 3.2 0 .31.21.68.8.56C20.21 21.44 23.5 17.12 23.5 12.02 23.5 5.65 18.35.5 12 .5z"/>
              </svg>
              <span>Continue with GitHub</span>
            </a>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-muted text-xs font-mono uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="label">Email</label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'sending'}
                  placeholder="you@example.com"
                  className="input"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 font-mono">{error}</p>
              )}

              <button
                type="submit"
                disabled={status === 'sending' || !email.trim()}
                className="btn-primary w-full !py-3 !bg-transparent !text-ink !border !border-white/15 hover:!bg-white/5"
              >
                {status === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
              </button>
            </form>

            <p className="text-xs text-muted text-center pt-1">
              Don&apos;t have an account?{' '}
              <Link href="/pricing" className="text-accent hover:underline">
                View plans
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
