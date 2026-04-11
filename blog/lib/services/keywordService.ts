import {
  collection, doc, getDocs, setDoc, deleteDoc, query, orderBy, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION = 'trackedKeywords';

export interface TrackedKeyword {
  id: string;
  keyword: string;
  lastRank: number | null;       // null = not found within top 100
  lastCheckedAt: Timestamp | null;
  createdAt: Timestamp;
}

export async function listKeywords(): Promise<TrackedKeyword[]> {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TrackedKeyword));
}

export async function addKeyword(keyword: string): Promise<string> {
  const ref = doc(collection(db, COLLECTION));
  await setDoc(ref, {
    keyword: keyword.trim(),
    lastRank: null,
    lastCheckedAt: null,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function updateKeywordRank(id: string, rank: number | null): Promise<void> {
  await setDoc(
    doc(db, COLLECTION, id),
    { lastRank: rank, lastCheckedAt: Timestamp.now() },
    { merge: true }
  );
}

export async function deleteKeyword(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
