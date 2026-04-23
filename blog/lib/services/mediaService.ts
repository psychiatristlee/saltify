import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc,
  query, orderBy, Timestamp,
} from 'firebase/firestore';
import { storage, db } from '../firebase';

const STORAGE_PATH = 'blog-media';
const COLLECTION = 'mediaItems';

export interface MediaItem {
  id: string;
  url: string;
  path: string;              // Storage full path
  name: string;
  type: 'image' | 'video';
  tags: string[];            // menu item ids (from MENU_BREADS / MENU_DRINKS)
  createdAt: Timestamp;
}

export async function uploadMediaRaw(file: File): Promise<{ url: string; path: string; type: 'image' | 'video' }> {
  const ext = file.name.split('.').pop() || '';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const storageRef = ref(storage, `${STORAGE_PATH}/${fileName}`);

  await uploadBytes(storageRef, file, { contentType: file.type });
  const url = await getDownloadURL(storageRef);
  const type: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';
  return { url, path: storageRef.fullPath, type };
}

export async function createMediaDoc(data: {
  url: string;
  path: string;
  name: string;
  type: 'image' | 'video';
  tags: string[];
}): Promise<string> {
  const ref = doc(collection(db, COLLECTION));
  await setDoc(ref, {
    ...data,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function listMedia(): Promise<MediaItem[]> {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MediaItem));
}

export async function updateMediaTags(id: string, tags: string[]): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { tags });
}

export async function deleteMedia(item: MediaItem): Promise<void> {
  try {
    await deleteObject(ref(storage, item.path));
  } catch {
    // storage object may already be gone; continue to delete metadata
  }
  await deleteDoc(doc(db, COLLECTION, item.id));
}
