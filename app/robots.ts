import type { MetadataRoute } from 'next';

const BASE = process.env.NEXTAUTH_URL || 'https://streamsuite.io';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Hide non-public routes from search engines. The admin subdomain is
        // already physically isolated (it 404s on the main domain), but the
        // user-facing dashboard / login / auth-API surfaces would just confuse
        // crawlers if indexed.
        disallow: [
          '/api/',
          '/dashboard',
          '/login',
          '/admin',
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
