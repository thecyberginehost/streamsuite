import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Resend } from 'resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYNC_SECRET = process.env.STREAMSUITE_SYNC_SECRET;
const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'StreamSuite <noreply@send.streamsuite.io>';
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'aamore@streamsuite.io';

function constTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

export async function POST(req: Request) {
  if (!SYNC_SECRET || !RESEND_KEY) {
    return NextResponse.json({ error: 'Alert pipeline not configured' }, { status: 503 });
  }
  const auth = (await headers()).get('authorization') || '';
  const presented = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!constTimeEqual(presented, SYNC_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { severity?: string; kind?: string; subject?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const severity = (body.severity || 'info').toUpperCase();
  const kind = body.kind || 'generic';
  const subject = body.subject || `[StreamSuite][${severity}] ${kind}`;
  const text = body.text || JSON.stringify(body);

  const html = `<!doctype html><html><body style="font-family:'JetBrains Mono','SF Mono',monospace;background:#0a0a0a;color:#e6e6e6;padding:24px;">
    <div style="border:1px solid ${severity === 'CRITICAL' ? '#f87171' : severity === 'WARNING' ? '#fbbf24' : '#34d399'};background:#0d1117;border-radius:6px;padding:24px;max-width:640px;">
      <p style="color:${severity === 'CRITICAL' ? '#f87171' : severity === 'WARNING' ? '#fbbf24' : '#34d399'};font-size:11px;letter-spacing:0.2em;margin:0 0 16px;text-transform:uppercase;">── ${severity} / ${kind} ──</p>
      <pre style="margin:0;white-space:pre-wrap;font-size:13px;color:#e6e6e6;">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    </div>
  </body></html>`;

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
      console.error('alert: resend error', error);
      return NextResponse.json({ error: 'Send failed', detail: error }, { status: 502 });
    }
    return NextResponse.json({ ok: true, id: data?.id });
  } catch (err: any) {
    console.error('alert: resend throw', err);
    return NextResponse.json({ error: 'Send failed', message: err.message }, { status: 502 });
  }
}
