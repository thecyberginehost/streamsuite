import { NextResponse } from 'next/server';
import {
  bindGithubToCustomer,
  createSession,
  findCustomerByAnyEmail,
  getCustomerByGithubId,
} from '@/lib/db';
import { attachSessionCookie, getClientIp, getUserAgent, OAUTH_STATE_COOKIE } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PUBLIC_BASE = process.env.NEXTAUTH_URL || 'https://streamsuite.io';
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

type GhUser = { id: number; login: string; name: string | null };
type GhEmail = { email: string; verified: boolean; primary: boolean };

function clearStateCookieOn(res: NextResponse): NextResponse {
  res.cookies.set(OAUTH_STATE_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}

function loginError(code: string): NextResponse {
  return clearStateCookieOn(NextResponse.redirect(`${PUBLIC_BASE}/login?error=${code}`));
}

export async function GET(req: Request) {
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return loginError('oauth_unconfigured');
  }

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  if (errorParam) {
    // user denied or GitHub returned an OAuth error
    return loginError('oauth_denied');
  }
  if (!code || !stateParam) {
    return loginError('oauth_missing_params');
  }

  // State check — value must equal the httpOnly cookie set at /start.
  const cookieHeader = req.headers.get('cookie') || '';
  const stateCookie = cookieHeader
    .split(';')
    .map(s => s.trim())
    .find(c => c.startsWith(`${OAUTH_STATE_COOKIE}=`))
    ?.split('=')[1];
  if (!stateCookie || stateCookie !== stateParam) {
    return loginError('oauth_bad_state');
  }

  // Exchange code for access token.
  let accessToken: string;
  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${PUBLIC_BASE}/api/auth/github/callback`,
      }),
    });
    const tokenJson = await tokenRes.json() as { access_token?: string; error?: string };
    if (!tokenJson.access_token) {
      console.error('github-oauth: token exchange failed', tokenJson);
      return loginError('oauth_token_exchange');
    }
    accessToken = tokenJson.access_token;
  } catch (err) {
    console.error('github-oauth: token fetch error', err);
    return loginError('oauth_token_exchange');
  }

  // Fetch user + verified emails.
  let user: GhUser;
  let emails: GhEmail[];
  try {
    const [userRes, emailsRes] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' },
      }),
      fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' },
      }),
    ]);
    if (!userRes.ok || !emailsRes.ok) {
      console.error('github-oauth: api error', userRes.status, emailsRes.status);
      return loginError('oauth_api');
    }
    user = await userRes.json();
    emails = await emailsRes.json();
  } catch (err) {
    console.error('github-oauth: api fetch error', err);
    return loginError('oauth_api');
  }

  // 1. Existing GitHub binding takes precedence.
  let customer = getCustomerByGithubId(user.id);

  // 2. Otherwise, look up by any verified email that matches a customer row.
  if (!customer) {
    const verified = emails
      .filter(e => e.verified && typeof e.email === 'string')
      .map(e => e.email.trim().toLowerCase());
    customer = findCustomerByAnyEmail(verified);
    if (customer) {
      bindGithubToCustomer(customer.email, user.id, user.login);
    }
  }

  if (!customer) {
    return clearStateCookieOn(NextResponse.redirect(`${PUBLIC_BASE}/login/no-subscription`));
  }

  const sessionToken = createSession(customer.email, {
    ip: await getClientIp(),
    userAgent: await getUserAgent(),
  });

  return clearStateCookieOn(
    attachSessionCookie(NextResponse.redirect(`${PUBLIC_BASE}/dashboard`), sessionToken),
  );
}
