import type { MetadataRoute } from 'next';
import { DOCS_METHODS } from './(marketing)/docs/page';

const BASE = process.env.NEXTAUTH_URL || 'https://streamsuite.io';

// Public marketing + legal + utility pages. Excludes dashboard/admin/api.
// Update lastModified when content changes materially. The lastModified date
// here is the most recent meaningful site content change (mostly auto-fine
// since search engines use it as a hint, not gospel).
//
// Per-method docs anchors are emitted as separate sitemap URLs so each RPC
// method gets indexed individually. Google ranks long-tail queries like
// "eth_getBlockByNumber BSC RPC" against the most specific URL it knows.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const methodAnchors: MetadataRoute.Sitemap = DOCS_METHODS.map((m) => ({
    url: `${BASE}/docs#${m.anchor}`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.55,
  }));

  return [
    { url: `${BASE}/`,                 lastModified, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/pricing`,          lastModified, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/bench`,            lastModified, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/benchmarks`,       lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/docs`,             lastModified, changeFrequency: 'weekly',  priority: 0.8 },
    ...methodAnchors,
    { url: `${BASE}/status`,           lastModified, changeFrequency: 'daily',   priority: 0.5 },
    { url: `${BASE}/support`,          lastModified, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/request-access`,   lastModified, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/legal/terms`,      lastModified, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/legal/privacy`,    lastModified, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/legal/refunds`,    lastModified, changeFrequency: 'yearly',  priority: 0.3 },
  ];
}
