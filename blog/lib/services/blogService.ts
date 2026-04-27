import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, Timestamp, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export type PostStatus = 'draft' | 'published';
export type PostLanguage = 'ko' | 'en' | 'zh-CN' | 'ja';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;        // SEO meta description
  content: string;             // HTML content
  coverImage: string;          // main image URL
  images: string[];            // all image URLs used
  tags: string[];
  language: PostLanguage;      // post language (default 'ko')
  status: PostStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt: Timestamp | null;
}

const COLLECTION = 'blogPosts';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[가-힣]+/g, (match) => {
      // Simple transliteration isn't practical; use timestamp-based slug for Korean
      return match;
    })
    .replace(/[^\w가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^-|-$/g, '') || `post-${Date.now()}`;
}

export async function createPost(data: {
  title: string;
  description: string;
  content: string;
  coverImage: string;
  images: string[];
  tags: string[];
  status: PostStatus;
  language?: PostLanguage;
  slug?: string;
}): Promise<string> {
  const baseSlug = data.slug?.trim() || generateSlug(data.title);
  const slug = baseSlug + '-' + Date.now().toString(36);
  const ref = doc(collection(db, COLLECTION));
  const now = Timestamp.now();
  await setDoc(ref, {
    ...data,
    slug,
    language: data.language || 'ko',
    createdAt: now,
    updatedAt: now,
    publishedAt: data.status === 'published' ? now : null,
  });
  return ref.id;
}

export async function updatePost(id: string, data: Partial<Omit<BlogPost, 'id' | 'createdAt'>>): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  const updates: Record<string, unknown> = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  if (data.status === 'published' && !data.publishedAt) {
    updates.publishedAt = serverTimestamp();
  }
  await updateDoc(ref, updates);
}

export async function deletePost(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as BlogPost;
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const q = query(collection(db, COLLECTION), where('slug', '==', slug));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as BlogPost;
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  // Filter only — sort client-side. Avoids needing a composite index.
  const q = query(collection(db, COLLECTION), where('status', '==', 'published'));
  const snap = await getDocs(q);
  const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlogPost));
  posts.sort((a, b) => {
    const ta = a.publishedAt?.toMillis?.() ?? 0;
    const tb = b.publishedAt?.toMillis?.() ?? 0;
    return tb - ta;
  });
  return posts;
}

export async function getAllPosts(): Promise<BlogPost[]> {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlogPost));
}

/**
 * For each image URL, return the most-recent post-creation timestamp that
 * referenced it. Photos never used → not present in the map.
 *
 * Used by auto-generation to penalize photos that were used recently:
 * recently-used photos drop in score, but stay eligible (we don't hard-block
 * reuse across blogs anymore — a photo can show up in multiple posts as long
 * as it's not duplicated within one post).
 */
export async function getImageUsageMap(): Promise<Map<string, number>> {
  const posts = await getAllPosts();
  const m = new Map<string, number>();
  for (const p of posts) {
    const ts = p.createdAt?.toMillis?.() ?? 0;
    const urls = new Set<string>();
    (p.images || []).forEach((u) => urls.add(u));
    if (p.coverImage) urls.add(p.coverImage);
    for (const u of urls) {
      const prev = m.get(u) ?? 0;
      if (ts > prev) m.set(u, ts);
    }
  }
  return m;
}

/** @deprecated kept for backwards-compatibility callers — soft-penalty
 *  selection is preferred via getImageUsageMap(). */
export async function getAllUsedImageUrls(): Promise<Set<string>> {
  const m = await getImageUsageMap();
  return new Set(m.keys());
}
