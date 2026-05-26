/** @type {import('next').NextConfig} */

// Content-Security-Policy.
// 'unsafe-inline' on script-src is required because Next.js 14 inlines its
// runtime bootstrap script. Moving to nonce-based CSP would require a
// middleware that injects per-request nonces — deferred.
// 'unsafe-inline' on style-src is required because some components emit
// inline style="..." attributes (email-template-styled markup).
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.stripe.com https://va-bsc-01.streamsuite.io",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://buy.stripe.com",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join('; ');

const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: cspDirectives },
        ],
      },
    ];
  },
};

export default nextConfig;
