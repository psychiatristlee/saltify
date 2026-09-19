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
    'zh-Hant': `${BASE}/zh-hant`,
    'x-default': `${BASE}/`,
  };

  const localeEntries: MetadataRoute.Sitemap = (['en', 'ja', 'zh', 'zh-hant'] as const).map(
    (code) => ({
      url: `${BASE}/${code}`,
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: { languages: LANGUAGES },
    })
  );

  // The menu board is published in Korean and Japanese only.
  const MENU_LANGUAGES = {
    ko: `${BASE}/menu`,
    ja: `${BASE}/menu/jp`,
    'x-default': `${BASE}/menu`,
  };

  const menuEntries: MetadataRoute.Sitemap = (['/menu', '/menu/jp'] as const).map(
    (path) => ({
      url: `${BASE}${path}`,
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: { languages: MENU_LANGUAGES },
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
    ...menuEntries,
    {
      url: `${BASE}/privacy`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    ...postEntries,
  ];
}
