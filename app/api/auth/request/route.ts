import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createMagicToken, getCustomerByEmail } from '@/lib/db';
import { authRequestByIp, authRequestByEmail } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FROM_EMAIL = process.env.FROM_EMAIL || 'StreamSuite <noreply@send.streamsuite.io>';
const BASE_URL = process.env.NEXTAUTH_URL || 'https://streamsuite.io';
const RESEND_KEY = process.env.RESEND_API_KEY;

function isValidEmail(s: unknown): s is string {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 320;
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : null;
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  // Rate limit BEFORE the customer lookup so an attacker can't probe customer
  // membership via timing differences. Both limits return identical 429.
  const ip = (await getClientIp()) || 'unknown';
  const ipCheck = authRequestByIp.check(ip);
  if (!ipCheck.ok) {
    return NextResponse.json(
      { error: `Too many sign-in requests. Try again in ${ipCheck.resetIn ?? 60}s.` },
      { status: 429 },
    );
  }
  const emailCheck = authRequestByEmail.check(email);
  if (!emailCheck.ok) {
    return NextResponse.json(
      { error: `Too many requests for that email. Try again in ${emailCheck.resetIn ?? 60}s.` },
      { status: 429 },
    );
  }

  // Paid-only: return identical success response whether or not this email
  // has a customer row. Prevents enumeration of who is a customer.
  const customer = getCustomerByEmail(email);
  if (!customer) {
    return NextResponse.json({ ok: true });
  }

  const { code } = createMagicToken(email);

  if (!RESEND_KEY) {
    console.error('auth-request: RESEND_API_KEY not set');
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Sign-in code for ${email}: ${code}`);
      return NextResponse.json({ ok: true, dev_code: code });
    }
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
  }

  const codeDisplay = `${code.slice(0, 3)} ${code.slice(3)}`;
  const loginUrl = `${BASE_URL}/login`;

  const html = `
    <!doctype html>
    <html><body style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#0a0a0a;color:#e6e6e6;">
      <div style="background:#111;border:1px solid #2a2a2a;border-radius:4px;padding:32px;">
        <h2 style="margin:0 0 8px;font-family:'JetBrains Mono','SF Mono',monospace;font-size:18px;letter-spacing:0.04em;">STREAMSUITE / SIGN IN</h2>
        <p style="color:#999;margin:0 0 24px;font-size:14px;">One-time code. Expires in 15 minutes.</p>

        <div style="background:#0a0a0a;border:1px solid #2a2a2a;border-radius:4px;padding:24px;margin:0 0 20px;text-align:center;">
          <p style="color:#999;margin:0 0 8px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">Sign-in code</p>
          <p style="margin:0;font-family:'JetBrains Mono','SF Mono',monospace;font-size:36px;font-weight:600;color:#4ade80;letter-spacing:0.15em;">${codeDisplay}</p>
        </div>

        <p style="color:#bbb;margin:0 0 8px;font-size:13px;text-align:center;line-height:1.6;">
          Type this code on <a href="${loginUrl}" style="color:#4ade80;text-decoration:none;">${loginUrl}</a>
        </p>

        <p style="color:#666;font-size:11px;margin:32px 0 0;text-align:center;">If you didn't request this, ignore this email.</p>
      </div>
    </body></html>
  `;
  const text = [
    `StreamSuite sign-in code (expires in 15 min):`,
    ``,
    `    ${codeDisplay}`,
    ``,
    `Type this code on ${loginUrl}`,
    ``,
    `If you didn't request this, ignore this email.`,
  ].join('\n');

  const resend = new Resend(RESEND_KEY);
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `StreamSuite sign-in code: ${codeDisplay}`,
      html,
      text,
    });
  } catch (err) {
    console.error('auth-request: resend error', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
