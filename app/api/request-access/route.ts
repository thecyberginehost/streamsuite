import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { requestAccessByIp, requestAccessByEmail } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TO = process.env.NOTIFY_EMAIL || 'hello@streamsuite.io';
const FROM = process.env.FROM_EMAIL || 'StreamSuite <noreply@streamsuite.io>';

const planLabels: Record<string, string> = {
  'bsc-realtime': 'BSC Real-Time ($399/mo)',
  'bsc-mempool': 'BSC Mempool ($999/mo)',
  'bsc-fullnode': 'BSC Full Node ($2,499/mo)',
  'custom-chain': 'Custom Chain Node',
  'colocated-bot': 'Colocated Bot',
  other: 'Other',
};

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function valid(input: unknown, max = 2000): input is string {
  return typeof input === 'string' && input.length > 0 && input.length <= max;
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, email, handle, plan, chain, strategy, volume, notes } = body ?? {};

  if (!valid(name, 200) || !valid(email, 200) || !valid(handle, 200) || !valid(plan, 64)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  // Rate limit AFTER basic validation but BEFORE planLabels check + email send.
  // Twin keys (IP + email) — same pattern as /api/auth/request.
  const ip = (await getClientIp()) || 'unknown';
  const ipCheck = requestAccessByIp.check(ip);
  if (!ipCheck.ok) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${Math.ceil((ipCheck.resetIn ?? 60) / 60)}m.` },
      { status: 429 },
    );
  }
  const emailCheck = requestAccessByEmail.check(email.toLowerCase());
  if (!emailCheck.ok) {
    return NextResponse.json(
      { error: `Too many requests from that email. We already have your message — we'll be in touch.` },
      { status: 429 },
    );
  }

  if (!planLabels[plan]) {
    return NextResponse.json({ error: 'Invalid plan selection' }, { status: 400 });
  }
  if (plan === 'custom-chain' && !valid(chain, 200)) {
    return NextResponse.json({ error: 'Chain is required for custom chain requests' }, { status: 400 });
  }
  if (plan === 'colocated-bot' && !valid(strategy, 4000)) {
    return NextResponse.json({ error: 'Strategy description is required for colocated bot requests' }, { status: 400 });
  }

  const planLabel = planLabels[plan];
  const subject = `StreamSuite access request: ${planLabel} (${name})`;

  const rows: [string, string][] = [
    ['Name', name],
    ['Email', email],
    ['Handle', handle],
    ['Interest', planLabel],
    ...(plan === 'custom-chain' ? ([['Chain', chain]] as [string, string][]) : []),
    ...(plan === 'colocated-bot' ? ([['Strategy', strategy]] as [string, string][]) : []),
    ['Expected volume', typeof volume === 'string' ? volume : 'Not sure'],
    ['Notes', typeof notes === 'string' ? (notes || '(none)') : '(none)'],
  ];

  const textBody =
    `New access request\n\n` +
    rows.map(([k, v]) => `${k}: ${v}`).join('\n') +
    `\n\nSubmitted via streamsuite.io/request-access`;

  const htmlBody = `
    <!doctype html>
    <html><body style="font-family:system-ui,-apple-system,sans-serif;background:#f5f6f8;padding:24px;color:#0f172a">
      <div style="max-width:640px;margin:auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e2e8f0">
        <div style="font-size:12px;letter-spacing:.1em;color:#059669;text-transform:uppercase;margin-bottom:8px">StreamSuite</div>
        <h1 style="margin:0 0 16px;font-size:22px">New access request</h1>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          ${rows
            .map(
              ([k, v]) => `
            <tr>
              <td style="padding:10px 0;color:#64748b;vertical-align:top;width:140px;border-bottom:1px solid #f1f5f9">${esc(k)}</td>
              <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;white-space:pre-wrap;word-break:break-word">${esc(v)}</td>
            </tr>`
            )
            .join('')}
        </table>
        <p style="margin:20px 0 0;color:#94a3b8;font-size:12px">Submitted via streamsuite.io/request-access</p>
      </div>
    </body></html>
  `;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    await resend.emails.send({
      from: FROM,
      to: [TO],
      replyTo: email,
      subject,
      text: textBody,
      html: htmlBody,
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[request-access] Resend send failed:', err);
    return NextResponse.json(
      { error: 'We could not deliver your request. Please email hello@streamsuite.io directly.' },
      { status: 502 }
    );
  }
}
