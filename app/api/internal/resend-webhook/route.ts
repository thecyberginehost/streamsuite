import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'node:crypto';
import { Resend } from 'resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Resend uses Svix for webhook signing. To enable:
// 1. Resend dashboard → Webhooks → Add endpoint → URL = https://streamsuite.io/api/internal/resend-webhook
// 2. Subscribe to events: email.bounced, email.complained
//    (also: email.delivery_delayed if you want soft-bounce visibility)
// 3. Copy the signing secret (starts with `whsec_`) into .env.local as RESEND_WEBHOOK_SECRET
// 4. pm2 reload streamsuite
//
// Until step 3 happens, this endpoint returns 503. Signed requests with no
// configured secret are rejected explicitly — never silently accept.

const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;
const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'StreamSuite <noreply@send.streamsuite.io>';
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'aamore@streamsuite.io';

// Svix signature format: header `svix-signature` = "v1,<sig1> v1,<sig2> ..."
// (multiple sigs allowed during secret rotation). Body that's signed is
// `${msg_id}.${timestamp}.${raw_body}`. Secret is `whsec_<base64>` — decode
// the base64 part for the HMAC key.
function verifySvixSignature(opts: {
  msgId: string;
  timestamp: string;
  body: string;
  signatureHeader: string;
  secret: string;
}): boolean {
  if (!opts.msgId || !opts.timestamp || !opts.signatureHeader) return false;
  // Reject stale timestamps (>5 min skew) — anti-replay.
  const tsSec = parseInt(opts.timestamp, 10);
  if (!tsSec) return false;
  const ageSec = Math.abs(Math.floor(Date.now() / 1000) - tsSec);
  if (ageSec > 300) return false;

  const secret = opts.secret.replace(/^whsec_/, '');
  let key: Buffer;
  try { key = Buffer.from(secret, 'base64'); } catch { return false; }

  const signed = `${opts.msgId}.${opts.timestamp}.${opts.body}`;
  const expected = crypto.createHmac('sha256', key).update(signed).digest('base64');

  for (const part of opts.signatureHeader.split(' ')) {
    const [version, sig] = part.split(',');
    if (version !== 'v1' || !sig) continue;
    // Constant-time compare.
    const a = Buffer.from(expected);
    const b = Buffer.from(sig);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true;
  }
  return false;
}

async function alertOperator(subject: string, html: string, text: string) {
  if (!RESEND_KEY) return;
  try {
    const resend = new Resend(RESEND_KEY);
    await resend.emails.send({ from: FROM_EMAIL, to: NOTIFY_EMAIL, subject, html, text });
  } catch (e) {
    console.error('resend-webhook: operator alert send failed', e);
  }
}

export async function POST(req: Request) {
  if (!RESEND_WEBHOOK_SECRET) {
    console.error('resend-webhook: RESEND_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const h = await headers();
  const msgId = h.get('svix-id') || '';
  const timestamp = h.get('svix-timestamp') || '';
  const signatureHeader = h.get('svix-signature') || '';
  const body = await req.text();

  const valid = verifySvixSignature({
    msgId, timestamp, body, signatureHeader, secret: RESEND_WEBHOOK_SECRET,
  });
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let event: any;
  try { event = JSON.parse(body); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const type = event?.type as string;
  const data = event?.data || {};
  const to = Array.isArray(data?.to) ? data.to.join(', ') : (data?.to || 'unknown');
  const emailSubject = data?.subject || '';
  const emailId = data?.email_id || data?.id || '';
  const bounceReason = data?.bounce?.message || data?.reason || '';

  switch (type) {
    case 'email.bounced': {
      const subject = `[StreamSuite] 🚨 BOUNCE — ${to}`;
      const text = `Email bounce detected.\n\nTo:       ${to}\nSubject:  ${emailSubject}\nEmail ID: ${emailId}\nReason:   ${bounceReason}\n\nCustomer may not have received their welcome/sign-in email. Investigate.`;
      const html = `<p><strong>🚨 Email bounce</strong></p><table><tr><td><b>To</b></td><td><code>${to}</code></td></tr><tr><td><b>Subject</b></td><td>${emailSubject}</td></tr><tr><td><b>Email ID</b></td><td><code>${emailId}</code></td></tr><tr><td><b>Reason</b></td><td>${bounceReason}</td></tr></table><p>Customer likely did not receive their welcome/sign-in email. Investigate the address and reach out if needed.</p>`;
      await alertOperator(subject, html, text);
      break;
    }
    case 'email.complained': {
      const subject = `[StreamSuite] ⚠️ SPAM COMPLAINT — ${to}`;
      const text = `Spam complaint received.\n\nTo:       ${to}\nSubject:  ${emailSubject}\nEmail ID: ${emailId}\n\nRecipient marked StreamSuite email as spam. Hurts deliverability — consider blocking this address from future sends.`;
      const html = `<p><strong>⚠️ Spam complaint</strong></p><table><tr><td><b>To</b></td><td><code>${to}</code></td></tr><tr><td><b>Subject</b></td><td>${emailSubject}</td></tr><tr><td><b>Email ID</b></td><td><code>${emailId}</code></td></tr></table><p>Recipient marked StreamSuite email as spam. This hurts deliverability — consider blocking this address from future sends.</p>`;
      await alertOperator(subject, html, text);
      break;
    }
    default: {
      // email.sent, email.delivered, email.opened, email.clicked — ignore.
      break;
    }
  }

  return NextResponse.json({ ok: true });
}
