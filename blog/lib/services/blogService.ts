import {
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, Timestamp, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export type PostStatus = 'draft' | 'published';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;        // SEO meta description
  content: string;             // HTML content
  coverImage: string;          // main image URL
  images: string[];            // all image URLs used
  tags: string[];
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
}): Promise<string> {
  const slug = generateSlug(data.title) + '-' + Date.now().toString(36);
  const ref = doc(collection(db, COLLECTION));
  const now = Timestamp.now();
  await setDoc(ref, {
    ...data,
    slug,
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
  const q = query(
    collection(db, COLLECTION),
    where('status', '==', 'published'),
    orderBy('publishedAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlogPost));
}

export async function getAllPosts(): Promise<BlogPost[]> {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlogPost));
}
