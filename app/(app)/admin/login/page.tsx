'use client';

import { useState, FormEvent } from 'react';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Login failed');
        return;
      }
      window.location.href = data.redirect || '/admin/customers';
    } catch (err) {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-3rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-400/80 mb-3">
            ┌── operator login ──┐
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Admin sign-in</h1>
          <p className="text-muted text-sm">
            Restricted area. Operator credentials only.
          </p>
        </div>

        <form onSubmit={onSubmit} className="card p-6 space-y-4">
          <div>
            <label htmlFor="username" className="label">Username</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              autoCapitalize="off"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={submitting}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="password" className="label">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              className="input"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 font-mono">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !username.trim() || !password}
            className="btn-primary w-full !py-3"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-muted text-[11px] font-mono mt-6 text-center">
          this is an operator-only endpoint · all attempts logged
        </p>
      </div>
    </main>
  );
}
