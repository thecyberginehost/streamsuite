// NOWPayments REST API client (mode-aware: prod | sandbox).
//
// PROD setup (.env.local):
//   NOWPAYMENTS_API_KEY=...      from https://account.nowpayments.io/store/api-keys
//   NOWPAYMENTS_IPN_SECRET=...   from https://account.nowpayments.io/store/ipn-settings
//   NOWPAYMENTS_BASE_URL=https://api.nowpayments.io/v1                    (optional)
//
// SANDBOX setup (.env.local, optional — only required if you ever pass mode='sandbox'):
//   NOWPAYMENTS_SANDBOX_API_KEY=...    from https://account-sandbox.nowpayments.io
//   NOWPAYMENTS_SANDBOX_IPN_SECRET=...
//   NOWPAYMENTS_SANDBOX_BASE_URL=https://api-sandbox.nowpayments.io/v1    (optional)
//
// IPN webhook URL configured in BOTH NOWPayments dashboards:
//   https://streamsuite.io/api/nowpayments/webhook
// The handler reads the mode from order_id and verifies with the right secret.

import crypto from 'node:crypto';

export type NOWPaymentsMode = 'prod' | 'sandbox';

function modeConfig(mode: NOWPaymentsMode) {
  if (mode === 'sandbox') {
    return {
      baseUrl: process.env.NOWPAYMENTS_SANDBOX_BASE_URL || 'https://api-sandbox.nowpayments.io/v1',
      apiKey:  process.env.NOWPAYMENTS_SANDBOX_API_KEY || '',
      ipnSecret: process.env.NOWPAYMENTS_SANDBOX_IPN_SECRET || '',
    };
  }
  return {
    baseUrl: process.env.NOWPAYMENTS_BASE_URL || 'https://api.nowpayments.io/v1',
    apiKey:  process.env.NOWPAYMENTS_API_KEY || '',
    ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET || '',
  };
}

// Tier → USD price. Matches Stripe Payment Link prices in /pricing.
export const TIER_PRICES_USD: Record<string, number> = {
  realtime: 399,
  mempool: 999,
  fullnode: 2499,
};

// Currencies we accept. Maps friendly UI label → NOWPayments currency code.
// Codes from https://documenter.getpostman.com/view/7907941/2s9YsGittd
export const SUPPORTED_PAY_CURRENCIES: Array<{
  code: string;       // NOWPayments code (sent in API)
  label: string;      // shown to customer
  chain: string;
  token: string;
}> = [
  { code: 'usdtbsc',  label: 'USDT on BSC',       chain: 'BSC',      token: 'USDT' },
  { code: 'usdcbsc',  label: 'USDC on BSC',       chain: 'BSC',      token: 'USDC' },
  { code: 'bnbbsc',   label: 'BNB on BSC',        chain: 'BSC',      token: 'BNB'  },
  { code: 'usdterc20',label: 'USDT on Ethereum',  chain: 'Ethereum', token: 'USDT' },
  { code: 'usdc',     label: 'USDC on Ethereum',  chain: 'Ethereum', token: 'USDC' },
  { code: 'eth',      label: 'ETH on Ethereum',   chain: 'Ethereum', token: 'ETH'  },
  { code: 'usdcbase', label: 'USDC on Base',      chain: 'Base',     token: 'USDC' },
  { code: 'ethbase',  label: 'ETH on Base',       chain: 'Base',     token: 'ETH'  },
  { code: 'usdcarb',  label: 'USDC on Arbitrum',  chain: 'Arbitrum', token: 'USDC' },
  { code: 'etharb',   label: 'ETH on Arbitrum',   chain: 'Arbitrum', token: 'ETH'  },
  { code: 'usdcop',   label: 'USDC on Optimism',  chain: 'Optimism', token: 'USDC' },
  { code: 'usdtop',   label: 'USDT on Optimism',  chain: 'Optimism', token: 'USDT' },
];

export function isSupportedPayCurrency(code: string): boolean {
  return SUPPORTED_PAY_CURRENCIES.some(c => c.code === code.toLowerCase());
}

// One-time payment grants this many days of access. After expiry the
// scheduled key-revoke job (TODO) will flip status → past_due.
export const CRYPTO_ACCESS_DAYS = 30;

export type NOWPaymentsInvoice = {
  id: string;                  // NOWPayments invoice id
  order_id: string;            // our order_id (we set this — encodes email + tier + mode)
  invoice_url: string;         // hosted checkout URL — redirect customer here
  pay_address?: string;
  pay_amount?: number;
  pay_currency?: string;
  price_amount: number;
  price_currency: string;
  created_at?: string;
  mode: NOWPaymentsMode;
};

// Create an invoice — returns the hosted-checkout URL to redirect the customer.
// order_id encodes tier|email|random|mode so the webhook can recover them and
// pick the correct IPN secret to verify with.
export async function createInvoice(opts: {
  email: string;
  tier: string;
  pay_currency: string;
  mode?: NOWPaymentsMode;     // default 'prod'
}): Promise<NOWPaymentsInvoice> {
  const mode: NOWPaymentsMode = opts.mode === 'sandbox' ? 'sandbox' : 'prod';
  const cfg = modeConfig(mode);
  if (!cfg.apiKey) {
    throw new Error(
      mode === 'sandbox'
        ? 'NOWPAYMENTS_SANDBOX_API_KEY is not set — add it to .env.local to use sandbox mode'
        : 'NOWPAYMENTS_API_KEY is not set'
    );
  }
  const price = TIER_PRICES_USD[opts.tier];
  if (!price) throw new Error(`Unknown tier: ${opts.tier}`);

  // order_id format: "<tier>|<email>|<random>|<mode>"  (parseable in webhook)
  const orderId = [
    opts.tier,
    opts.email,
    crypto.randomBytes(6).toString('hex'),
    mode,
  ].join('|');

  const callbackBase = process.env.NEXTAUTH_URL || 'https://streamsuite.io';
  const body = {
    price_amount: price,
    price_currency: 'usd',
    pay_currency: opts.pay_currency,
    order_id: orderId,
    order_description: `StreamSuite ${opts.tier} — ${CRYPTO_ACCESS_DAYS} days${mode === 'sandbox' ? ' [SANDBOX]' : ''}`,
    ipn_callback_url: `${callbackBase}/api/nowpayments/webhook`,
    success_url: `${callbackBase}/thanks?via=crypto${mode === 'sandbox' ? '&mode=sandbox' : ''}`,
    cancel_url:  `${callbackBase}/pricing#bsc`,
    is_fixed_rate: true,         // lock the exchange rate at invoice creation
    is_fee_paid_by_user: false,  // we eat the 0.5% fee for simpler UX
  };

  const res = await fetch(`${cfg.baseUrl}/invoice`, {
    method: 'POST',
    headers: {
      'x-api-key': cfg.apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NOWPayments [${mode}] invoice creation failed: HTTP ${res.status} ${text.slice(0, 200)}`);
  }

  const j = await res.json() as any;
  return {
    id: String(j.id ?? j.invoice_id ?? ''),
    order_id: orderId,
    invoice_url: j.invoice_url,
    pay_address: j.pay_address,
    pay_amount: j.pay_amount,
    pay_currency: j.pay_currency,
    price_amount: j.price_amount,
    price_currency: j.price_currency,
    created_at: j.created_at,
    mode,
  };
}

// Verify IPN webhook signature with the secret matching the given mode.
// NOWPayments signs the JSON body with HMAC-SHA512 using the IPN secret.
// The signature is sent in the `x-nowpayments-sig` header.
//
// IMPORTANT: the body must be canonicalized (keys sorted alphabetically)
// before HMAC computation — that's how NOWPayments signs it.
export function verifyIpnSignature(
  rawBody: string,
  signature: string,
  mode: NOWPaymentsMode = 'prod',
): boolean {
  const cfg = modeConfig(mode);
  if (!cfg.ipnSecret) {
    // Allow bypass in dev when secret isn't set, but never in production
    if (process.env.NODE_ENV === 'production') return false;
    return true;
  }
  if (!signature) return false;

  try {
    const parsed = JSON.parse(rawBody);
    const sorted = canonicalize(parsed);
    const expected = crypto
      .createHmac('sha512', cfg.ipnSecret)
      .update(sorted)
      .digest('hex');
    return safeCompare(expected, signature.toLowerCase());
  } catch {
    return false;
  }
}

// Recursive canonical JSON: sort object keys alphabetically.
function canonicalize(v: any): string {
  if (v === null || v === undefined) return 'null';
  if (Array.isArray(v)) return '[' + v.map(canonicalize).join(',') + ']';
  if (typeof v === 'object') {
    const keys = Object.keys(v).sort();
    return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalize(v[k])).join(',') + '}';
  }
  return JSON.stringify(v);
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Parse our order_id back into its parts.
// New format:  tier|email|random|mode
// Legacy:      tier|email|random  (mode defaults to 'prod' for back-compat)
export function parseOrderId(
  orderId: string,
): { tier: string; email: string; mode: NOWPaymentsMode } | null {
  const parts = orderId.split('|');
  if (parts.length < 3) return null;
  const [tier, email] = parts;
  if (!tier || !email) return null;
  const mode: NOWPaymentsMode =
    parts.length >= 4 && parts[3] === 'sandbox' ? 'sandbox' : 'prod';
  return { tier, email, mode };
}
