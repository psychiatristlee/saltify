/**
 * Admin: publish all blog post drafts (optionally filter by language /
 * date range), and optionally flip blogConfig.autoPublish so future
 * cron-generated posts go live immediately.
 *
 * Auth: X-Cron-Secret (same convention as the other admin endpoints).
 *
 * Query params:
 *   - lang=ko,en,ja,zh-CN  (comma-separated; default: all)
 *   - sinceDays=N  only publish drafts created in last N days (default: all)
 *   - autoPublish=1  also set blogConfig.autoPublish = true
 *   - dryRun=1  preview only
 */

import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/server/firebaseAdmin';

export const runtime = 'nodejs';
export const maxDuration = 120;

const CRON_SECRET = process.env.CRON_SECRET || '';

export async function POST(req: NextRequest) {
  const provided =
    req.headers.get('x-cron-secret') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    new URL(req.url).searchParams.get('secret') ||
    '';
  if (!CRON_SECRET || provided !== CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const langs = url.searchParams.get('lang')?.split(',').map((s) => s.trim()).filter(Boolean);
  const sinceDays = url.searchParams.get('sinceDays');
  const dryRun = url.searchParams.get('dryRun') === '1';
  const setAutoPublish = url.searchParams.get('autoPublish') === '1';

  const cutoff = sinceDays
    ? Date.now() - parseInt(sinceDays, 10) * 86400000
    : 0;

  const db = adminDb();
  const snap = await db
    .collection('blogPosts')
    .where('status', '==', 'draft')
    .get();

  const matches: Array<{ id: string; lang: string; title: string; createdAt: number }> = [];
  snap.forEach((doc) => {
    const data = doc.data() as {
      language?: string;
      title?: string;
      createdAt?: { toMillis(): number };
    };
    const lang = data.language || '?';
    const createdAtMs = data.createdAt?.toMillis?.() ?? 0;
    if (langs && !langs.includes(lang)) return;
    if (cutoff && createdAtMs < cutoff) return;
    matches.push({ id: doc.id, lang, title: data.title || '?', createdAt: createdAtMs });
  });

  if (dryRun) {
    return NextResponse.json({ dryRun: true, count: matches.length, matches });
  }

  const now = Timestamp.now();
  let published = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const m of matches) {
    try {
      await db.collection('blogPosts').doc(m.id).update({
        status: 'published',
        publishedAt: now,
        updatedAt: now,
      });
      published++;
    } catch (err) {
      errors.push({ id: m.id, error: err instanceof Error ? err.message : 'unknown' });
    }
  }

  if (setAutoPublish) {
    try {
      await db.doc('blogConfig/default').set({ autoPublish: true, updatedAt: now }, { merge: true });
    } catch (err) {
      console.error('[publish-drafts] failed to set autoPublish', err);
    }
  }

  return NextResponse.json({
    published,
    failed: errors.length,
    errors,
    autoPublishSet: setAutoPublish,
  });
}
