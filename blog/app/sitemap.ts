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

  return [
    {
      url: `${BASE}/`,
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: {
        languages: {
          ko: `${BASE}/`,
          en: `${BASE}/`,
          ja: `${BASE}/`,
          zh: `${BASE}/`,
        },
      },
    },
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
