import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { PostLanguage } from './blogService';

const DOC_PATH = 'blogConfig/default';

export type DailyCounts = Record<PostLanguage, number>;

export interface BlogConfig {
  dailyCounts: DailyCounts;
  // Track when auto-generation last ran (yyyy-mm-dd) per language
  lastGeneratedDate: Partial<Record<PostLanguage, string>>;
  updatedAt?: Timestamp;
}

const DEFAULT_CONFIG: BlogConfig = {
  dailyCounts: {
    ko: 1,
    en: 0,
    'zh-CN': 0,
    'zh-TW': 0,
    ja: 0,
  },
  lastGeneratedDate: {},
};

export async function getBlogConfig(): Promise<BlogConfig> {
  const snap = await getDoc(doc(db, DOC_PATH));
  if (!snap.exists()) return DEFAULT_CONFIG;
  const data = snap.data() as Partial<BlogConfig>;
  return {
    dailyCounts: { ...DEFAULT_CONFIG.dailyCounts, ...(data.dailyCounts || {}) },
    lastGeneratedDate: data.lastGeneratedDate || {},
    updatedAt: data.updatedAt,
  };
}

export async function saveBlogConfig(cfg: Pick<BlogConfig, 'dailyCounts'>): Promise<void> {
  await setDoc(
    doc(db, DOC_PATH),
    { dailyCounts: cfg.dailyCounts, updatedAt: Timestamp.now() },
    { merge: true }
  );
}

export async function markGenerated(
  date: string,
  language: PostLanguage
): Promise<void> {
  await setDoc(
    doc(db, DOC_PATH),
    {
      [`lastGeneratedDate.${language}`]: date,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
}
