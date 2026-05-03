/**
 * Menu items — Firestore CRUD + cover image upload.
 *
 * Read is public (anyone signed-in can browse). Writes are admin-only via
 * Firestore rules.
 */

import {
  collection, doc, getDocs, setDoc, deleteDoc, query, where,
  Timestamp, serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, auth } from '../../lib/firebase';
import { getStorage } from 'firebase/storage';

const storage = getStorage();
const COLLECTION = 'menuItems';
const STORAGE_PATH = 'menu-images';

export type MenuCategory = 'bread' | 'drink' | 'tteok' | 'other';

export interface MenuItem {
  id: string;
  name: string;            // Korean primary name
  nameEn?: string;
  nameJa?: string;
  nameZh?: string;
  description?: string;
  price: number;           // KRW (no decimals)
  image: string;           // Storage URL
  imagePath?: string;      // Storage object path (for deletion)
  category: MenuCategory;
  available: boolean;      // false = hidden / out of stock
  sortOrder: number;       // ascending — lower shown first
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type MenuItemDraft = Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>;

// -------- Image handling --------

export async function uploadMenuImage(file: File): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const r = ref(storage, `${STORAGE_PATH}/${fileName}`);
  await uploadBytes(r, file, { contentType: file.type });
  const url = await getDownloadURL(r);
  return { url, path: r.fullPath };
}

async function deleteImageIfExists(path?: string): Promise<void> {
  if (!path) return;
  try {
    await deleteObject(ref(storage, path));
  } catch {
    // best-effort; don't fail item deletion on missing image
  }
}

// -------- CRUD --------

export async function listMenuItems(opts?: { onlyAvailable?: boolean }): Promise<MenuItem[]> {
  // Sort client-side by sortOrder to keep one Firestore index sufficient.
  const q = opts?.onlyAvailable
    ? query(collection(db, COLLECTION), where('available', '==', true))
    : query(collection(db, COLLECTION));
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MenuItem));
  items.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
  return items;
}

export async function createMenuItem(draft: MenuItemDraft): Promise<string> {
  if (!auth.currentUser) throw new Error('not authenticated');
  const docRef = doc(collection(db, COLLECTION));
  await setDoc(docRef, {
    ...draft,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateMenuItem(id: string, patch: Partial<MenuItemDraft>): Promise<void> {
  await setDoc(
    doc(db, COLLECTION, id),
    { ...patch, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function deleteMenuItem(item: MenuItem): Promise<void> {
  await deleteImageIfExists(item.imagePath);
  await deleteDoc(doc(db, COLLECTION, item.id));
}
