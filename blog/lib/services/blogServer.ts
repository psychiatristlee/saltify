/**
 * Server-side blog post fetcher using Firestore REST API.
 * Public read is allowed by security rules (blogPosts collection).
 * Used by server components for SEO-optimized metadata generation.
 */

const PROJECT_ID = 'saltify-game';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

export interface ServerBlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  coverImage: string;
  images: string[];
  tags: string[];
  language?: string;
  status: 'draft' | 'published';
  publishedAt: Date | null;
  updatedAt: Date | null;
  createdAt: Date | null;
}

interface FirestoreValue {
  stringValue?: string;
  timestampValue?: string;
  arrayValue?: { values?: FirestoreValue[] };
  nullValue?: null;
  booleanValue?: boolean;
  integerValue?: string;
}

interface FirestoreDoc {
  name: string;
  fields?: Record<string, FirestoreValue>;
  createTime?: string;
  updateTime?: string;
}

function parseValue(v: FirestoreValue | undefined): unknown {
  if (!v) return null;
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.timestampValue !== undefined) return new Date(v.timestampValue);
  if (v.arrayValue) return (v.arrayValue.values || []).map(parseValue);
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.integerValue !== undefined) return Number(v.integerValue);
  return null;
}

function parseDoc(doc: FirestoreDoc): ServerBlogPost {
  const f = doc.fields || {};
  const id = doc.name.split('/').pop() || '';
  return {
    id,
    slug: (parseValue(f.slug) as string) || '',
    title: (parseValue(f.title) as string) || '',
    description: (parseValue(f.description) as string) || '',
    content: (parseValue(f.content) as string) || '',
    coverImage: (parseValue(f.coverImage) as string) || '',
    images: (parseValue(f.images) as string[]) || [],
    tags: (parseValue(f.tags) as string[]) || [],
    language: (parseValue(f.language) as string) || undefined,
    status: (parseValue(f.status) as 'draft' | 'published') || 'draft',
    publishedAt: (parseValue(f.publishedAt) as Date) || null,
    updatedAt: (parseValue(f.updatedAt) as Date) || null,
    createdAt: (parseValue(f.createdAt) as Date) || null,
  };
}

export async function getPostBySlugServer(slug: string): Promise<ServerBlogPost | null> {
  // Use runQuery to find by slug
  const query = {
    structuredQuery: {
      from: [{ collectionId: 'blogPosts' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'slug' },
          op: 'EQUAL',
          value: { stringValue: slug },
        },
      },
      limit: 1,
    },
  };

  try {
    const res = await fetch(`${BASE_URL}:runQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query),
      next: { revalidate: 60 }, // cache for 60s
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ document?: FirestoreDoc }>;
    const doc = data.find((r) => r.document)?.document;
    if (!doc) return null;
    const post = parseDoc(doc);
    if (post.status !== 'published') return null;
    return post;
  } catch (err) {
    console.error('getPostBySlugServer failed:', err);
    return null;
  }
}

export async function getPublishedPostsServer(): Promise<ServerBlogPost[]> {
  // Filter only on `status` — sort client-side. status+publishedAt orderBy
  // requires a composite index, which has historically been the cause of
  // mysterious empty homepages. Published-post counts will never be huge
  // enough to need server-side ordering here.
  const query = {
    structuredQuery: {
      from: [{ collectionId: 'blogPosts' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'status' },
          op: 'EQUAL',
          value: { stringValue: 'published' },
        },
      },
    },
  };

  try {
    const res = await fetch(`${BASE_URL}:runQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query),
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(
        '[getPublishedPostsServer] non-ok response',
        res.status,
        body.slice(0, 400)
      );
      return [];
    }
    const data = (await res.json()) as Array<{ document?: FirestoreDoc }>;
    const posts = data.filter((r) => r.document).map((r) => parseDoc(r.document!));
    posts.sort((a, b) => {
      const ta = a.publishedAt?.getTime() ?? 0;
      const tb = b.publishedAt?.getTime() ?? 0;
      return tb - ta;
    });
    console.log('[getPublishedPostsServer] loaded', posts.length, 'posts');
    return posts;
  } catch (err) {
    console.error('[getPublishedPostsServer] failed:', err);
    return [];
  }
}
