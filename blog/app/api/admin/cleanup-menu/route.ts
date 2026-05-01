/**
 * Admin cleanup: when a menu is discontinued, remove every media item that
 * was tagged with it. Both the Firebase Storage object and the Firestore
 * mediaItems doc are deleted.
 *
 * Auth: same X-Cron-Secret as /api/cron/auto-blog (server-side).
 *
 * Query params:
 *   - menuIds  : comma-separated list of menu ids to purge.
 *                Defaults to DISCONTINUED_MENU_IDS exported from breadData.
 *   - dryRun=1 : list matches without deleting. Recommended first run.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
import { adminDb } from '@/lib/server/firebaseAdmin';
import { DISCONTINUED_MENU_IDS } from '@/lib/breadData';

export const runtime = 'nodejs';
export const maxDuration = 120;

const CRON_SECRET = process.env.CRON_SECRET || '';

export async function POST(req: NextRequest) {
  // Auth (same convention as cron route)
  const provided =
    req.headers.get('x-cron-secret') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    new URL(req.url).searchParams.get('secret') ||
    '';
  if (!CRON_SECRET || provided !== CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const menuIdsParam = url.searchParams.get('menuIds');
  const dryRun = url.searchParams.get('dryRun') === '1';
  const targetIds = (menuIdsParam
    ? menuIdsParam.split(',').map((s) => s.trim()).filter(Boolean)
    : [...DISCONTINUED_MENU_IDS]
  );

  if (targetIds.length === 0) {
    return NextResponse.json({ error: 'no menu ids' }, { status: 400 });
  }

  const targetSet = new Set(targetIds);
  const db = adminDb();

  const snap = await db.collection('mediaItems').get();
  const matches: Array<{ id: string; path?: string; url?: string; tags: string[]; type?: string }> = [];

  snap.forEach((doc) => {
    const data = doc.data() as { tags?: string[]; path?: string; url?: string; type?: string };
    const tags = data.tags || [];
    if (tags.some((t) => targetSet.has(t))) {
      matches.push({
        id: doc.id,
        path: data.path,
        url: data.url,
        tags,
        type: data.type,
      });
    }
  });

  console.log('[cleanup-menu] matches', { count: matches.length, targets: targetIds, dryRun });

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      menuIds: targetIds,
      count: matches.length,
      matches,
    });
  }

  // Actually delete: Storage object first (best-effort), then Firestore doc.
  const bucket = getStorage().bucket();
  const deleted: string[] = [];
  const errors: Array<{ id: string; error: string }> = [];

  for (const m of matches) {
    try {
      if (m.path) {
        try {
          await bucket.file(m.path).delete({ ignoreNotFound: true });
        } catch (storageErr) {
          // Storage error shouldn't stop us from removing the Firestore record
          console.warn('[cleanup-menu] storage delete failed', m.path, storageErr);
        }
      }
      await db.collection('mediaItems').doc(m.id).delete();
      deleted.push(m.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown';
      errors.push({ id: m.id, error: msg });
      console.error('[cleanup-menu] doc delete failed', m.id, err);
    }
  }

  return NextResponse.json({
    menuIds: targetIds,
    matched: matches.length,
    deleted: deleted.length,
    failed: errors.length,
    errors,
  });
}
