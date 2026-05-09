/**
 * Persistence for tycoon mode — daily totals (영업 일지).
 *
 * Schema:
 *   /tycoonJournals/{userId}                       (summary doc)
 *     - currentDay: number
 *     - totalRevenue: number
 *     - totalServed: number
 *     - totalLost: number
 *     - lastPlayedAt: Timestamp
 *
 *   /tycoonJournals/{userId}/days/{dayNumber}      (per-day record)
 *     - dayNumber: number
 *     - revenue: number
 *     - served: number
 *     - lost: number
 *     - satisfaction: number  (0..1)
 *     - completedAt: Timestamp
 */

import {
  doc, getDoc, setDoc, serverTimestamp, increment,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

export interface JournalSummary {
  currentDay: number;
  totalRevenue: number;
  totalServed: number;
  totalLost: number;
}

export async function loadJournal(userId: string): Promise<JournalSummary> {
  const ref = doc(db, 'tycoonJournals', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return { currentDay: 1, totalRevenue: 0, totalServed: 0, totalLost: 0 };
  }
  const d = snap.data();
  return {
    currentDay: typeof d.currentDay === 'number' ? d.currentDay : 1,
    totalRevenue: typeof d.totalRevenue === 'number' ? d.totalRevenue : 0,
    totalServed: typeof d.totalServed === 'number' ? d.totalServed : 0,
    totalLost: typeof d.totalLost === 'number' ? d.totalLost : 0,
  };
}

export interface DayRecord {
  dayNumber: number;
  revenue: number;
  served: number;
  lost: number;
  satisfaction: number;
}

export async function saveDayResult(userId: string, day: DayRecord): Promise<void> {
  // Per-day record
  const dayRef = doc(db, 'tycoonJournals', userId, 'days', String(day.dayNumber));
  await setDoc(dayRef, {
    ...day,
    completedAt: serverTimestamp(),
  });

  // Summary increments
  const summaryRef = doc(db, 'tycoonJournals', userId);
  await setDoc(summaryRef, {
    currentDay: day.dayNumber + 1,
    totalRevenue: increment(day.revenue),
    totalServed: increment(day.served),
    totalLost: increment(day.lost),
    lastPlayedAt: serverTimestamp(),
  }, { merge: true });
}
