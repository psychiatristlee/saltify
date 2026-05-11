/**
 * Persistence for tycoon mode — daily totals + running cash position.
 *
 * Schema:
 *   /tycoonJournals/{userId}                       (summary doc)
 *     - currentDay: number
 *     - currentCash: number       ← carries between sessions
 *     - totalRevenue: number
 *     - totalCogs: number
 *     - totalProfit: number
 *     - totalServed: number
 *     - totalLost: number
 *     - lastPlayedAt: Timestamp
 *
 *   /tycoonJournals/{userId}/days/{dayNumber}
 *     - dayNumber: number
 *     - revenue, cogs, wages, netProfit
 *     - served, lost, satisfaction
 *     - cashEnd: number
 *     - completedAt: Timestamp
 */

import {
  doc, getDoc, setDoc, serverTimestamp, increment,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { STARTING_CASH } from '../data/economy';

export interface JournalSummary {
  currentDay: number;
  currentCash: number;
  totalRevenue: number;
  totalServed: number;
  totalLost: number;
  upgradesOwned?: Record<string, number>;
  pendingMarketing?: string[];
}

export async function loadJournal(userId: string): Promise<JournalSummary> {
  const ref = doc(db, 'tycoonJournals', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return {
      currentDay: 1,
      currentCash: STARTING_CASH,
      totalRevenue: 0,
      totalServed: 0,
      totalLost: 0,
    };
  }
  const d = snap.data();
  return {
    currentDay: typeof d.currentDay === 'number' ? d.currentDay : 1,
    currentCash: typeof d.currentCash === 'number' ? d.currentCash : STARTING_CASH,
    totalRevenue: typeof d.totalRevenue === 'number' ? d.totalRevenue : 0,
    totalServed: typeof d.totalServed === 'number' ? d.totalServed : 0,
    totalLost: typeof d.totalLost === 'number' ? d.totalLost : 0,
    upgradesOwned: (d.upgradesOwned as Record<string, number> | undefined) ?? {},
    pendingMarketing: (d.pendingMarketing as string[] | undefined) ?? [],
  };
}

export interface DayRecord {
  dayNumber: number;
  revenue: number;
  cogs: number;
  wages: number;
  netProfit: number;
  served: number;
  lost: number;
  satisfaction: number;
  cashEnd: number;
  goalHit: boolean;
  goalBonus: number;
  upgradesOwned: Record<string, number>;
  pendingMarketing: string[];
}

export async function saveDayResult(userId: string, day: DayRecord): Promise<void> {
  const dayRef = doc(db, 'tycoonJournals', userId, 'days', String(day.dayNumber));
  await setDoc(dayRef, {
    ...day,
    completedAt: serverTimestamp(),
  });

  const summaryRef = doc(db, 'tycoonJournals', userId);
  await setDoc(summaryRef, {
    currentDay: day.dayNumber + 1,
    currentCash: day.cashEnd,
    totalRevenue: increment(day.revenue),
    totalCogs: increment(day.cogs),
    totalProfit: increment(day.netProfit),
    totalServed: increment(day.served),
    totalLost: increment(day.lost),
    upgradesOwned: day.upgradesOwned,
    pendingMarketing: day.pendingMarketing,
    lastPlayedAt: serverTimestamp(),
  }, { merge: true });
}
