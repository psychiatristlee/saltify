/**
 * Admin: scan every published blog post's HTML content for <img> tags whose
 * src returns 4xx (e.g. file deleted by cleanup-menu). Strip those <img>
 * tags, fix images[] / coverImage too, and write back.
 *
 * Auth: X-Cron-Secret.
 *
 * Query params:
 *   - dryRun=1   preview without modifying
 *   - status     'published' (default) | 'all'
 */

import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/server/firebaseAdmin';

export const runtime = 'nodejs';
export const maxDuration = 240;

const CRON_SECRET = process.env.CRON_SECRET || '';

async function isReachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if (res.ok) return true;
    // Some Firebase Storage URLs don't allow HEAD; retry as GET range
    if (res.status === 405 || res.status === 400) {
      const r2 = await fetch(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-1' },
        redirect: 'follow',
      });
      return r2.ok || r2.status === 206;
    }
    return false;
  } catch {
    return false;
  }
}

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
  const dryRun = url.searchParams.get('dryRun') === '1';
  const statusFilter = url.searchParams.get('status') || 'published';

  const db = adminDb();
  const baseQuery = statusFilter === 'all'
    ? db.collection('blogPosts')
    : db.collection('blogPosts').where('status', '==', 'published');
  const snap = await baseQuery.get();

  // Gather every image URL referenced anywhere
  const allUrls = new Set<string>();
  const docs: Array<{ id: string; data: Record<string, unknown> }> = [];
  snap.forEach((d) => {
    const data = d.data() as { content?: string; images?: string[]; coverImage?: string };
    docs.push({ id: d.id, data });
    if (data.coverImage) allUrls.add(data.coverImage);
    (data.images || []).forEach((u) => allUrls.add(u));
    if (typeof data.content === 'string') {
      const m = data.content.match(/<img[^>]+src=["']([^"']+)["']/gi) || [];
      for (const tag of m) {
        const sm = tag.match(/src=["']([^"']+)["']/i);
        if (sm) allUrls.add(sm[1]);
      }
    }
  });

  // HEAD-check every URL once
  const reachability = new Map<string, boolean>();
  await Promise.all(
    [...allUrls].map(async (u) => {
      reachability.set(u, await isReachable(u));
    })
  );

  const broken = [...reachability.entries()].filter(([, ok]) => !ok).map(([u]) => u);
  const brokenSet = new Set(broken);

  // Fix each affected doc
  const summary: Array<{
    id: string; title?: string; removedFromContent: number;
    coverFixed: boolean; imagesFiltered: number;
  }> = [];

  for (const { id, data } of docs) {
    const content = (data.content as string | undefined) || '';
    const imagesArr: string[] = ((data.images as string[]) || []).slice();
    const cover = (data.coverImage as string | undefined) || '';

    let removedFromContent = 0;
    const newContent = content.replace(/<img[^>]*>/gi, (tag) => {
      const sm = tag.match(/src=["']([^"']+)["']/i);
      if (sm && brokenSet.has(sm[1])) {
        removedFromContent++;
        return '';
      }
      return tag;
    });

    const newImages = imagesArr.filter((u) => !brokenSet.has(u));
    const imagesFiltered = imagesArr.length - newImages.length;

    let newCover = cover;
    let coverFixed = false;
    if (cover && brokenSet.has(cover)) {
      // Replace with first reachable image found in content / images[]
      const m = newContent.match(/<img[^>]+src=["']([^"']+)["']/i);
      newCover = (m && m[1]) || newImages[0] || '';
      coverFixed = true;
    }

    if (removedFromContent === 0 && imagesFiltered === 0 && !coverFixed) continue;

    summary.push({
      id,
      title: data.title as string | undefined,
      removedFromContent,
      coverFixed,
      imagesFiltered,
    });

    if (!dryRun) {
      await db.collection('blogPosts').doc(id).update({
        content: newContent,
        images: newImages,
        coverImage: newCover,
        updatedAt: Timestamp.now(),
      });
    }
  }

  return NextResponse.json({
    dryRun,
    scanned: docs.length,
    uniqueImages: allUrls.size,
    brokenCount: broken.length,
    brokenSample: broken.slice(0, 5),
    affectedPosts: summary.length,
    posts: summary,
  });
}
