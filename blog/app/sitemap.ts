import type { MetadataRoute } from 'next';
import { getPublishedPostsServer } from '@/lib/services/blogServer';

const BASE = 'https://salt-bbang.com';

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPostsServer();

  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: p.updatedAt || p.publishedAt || undefined,
    changeFrequency: 'weekly',
    priority: 0.7,
    alternates: {
      languages: {
        ko: `${BASE}/blog/${p.slug}`,
      },
    },
  }));

  // Every locale entry advertises the same alternate set — hreflang is only
  // honoured when the annotations are reciprocal across all URLs.
  const LANGUAGES = {
    ko: `${BASE}/`,
    en: `${BASE}/en`,
    ja: `${BASE}/ja`,
    'zh-Hans': `${BASE}/zh`,
    'x-default': `${BASE}/`,
  };

  const localeEntries: MetadataRoute.Sitemap = (['en', 'ja', 'zh'] as const).map(
    (code) => ({
      url: `${BASE}/${code}`,
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: { languages: LANGUAGES },
    })
  );

  return [
    {
      url: `${BASE}/`,
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: { languages: LANGUAGES },
    },
    ...localeEntries,
    {
      url: `${BASE}/blog`,
      lastModified:
        posts[0]?.updatedAt || posts[0]?.publishedAt || undefined,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE}/menu/jp`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/privacy`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    ...postEntries,
  ];
}
