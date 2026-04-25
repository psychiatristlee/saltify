/**
 * Client-side AI service.
 *
 * Gemini is called via server API routes (/api/analyze-photo, /api/generate-blog,
 * /api/refine-blog) — the API key is no longer exposed to the browser, and all
 * retry logic lives on the server.
 *
 * Client still adds:
 *  - Concurrency-limited queue so we don't send N parallel analyze requests
 *  - Content-hash cache in localStorage to avoid re-analyzing the same file
 *  - RateLimitError with retryAfter so the UI can show a useful toast
 */

export interface GeneratedPost {
  title: string;
  slug: string;
  description: string;
  content: string;
  tags: string[];
}

export class RateLimitError extends Error {
  retryAfter?: number;
  constructor(message: string, retryAfter?: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

// ---------- Concurrency-limited queue ----------
type Job<T> = () => Promise<T>;
const queue: Array<() => void> = [];
let running = 0;
const CONCURRENCY = 1;

function runQueued<T>(job: Job<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const run = async () => {
      running++;
      try {
        resolve(await job());
      } catch (e) {
        reject(e);
      } finally {
        running--;
        drain();
      }
    };
    queue.push(run);
    drain();
  });
}

function drain() {
  while (running < CONCURRENCY && queue.length > 0) {
    const next = queue.shift();
    if (next) next();
  }
}

// ---------- Content-hash cache (localStorage) ----------
const CACHE_PREFIX = 'saltbbang-photo-tags:';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function readCache(hash: string): string[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + hash);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { tags: string[]; ts: number };
    if (Date.now() - parsed.ts > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_PREFIX + hash);
      return null;
    }
    return parsed.tags;
  } catch {
    return null;
  }
}

function writeCache(hash: string, tags: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_PREFIX + hash, JSON.stringify({ tags, ts: Date.now() }));
  } catch {
    // quota exceeded — not critical
  }
}

// ---------- Helpers ----------
async function fileToBase64(file: File): Promise<{ base64: string; hash: string; size: number }> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  // Chunk to avoid call stack overflow on large files
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  const base64 = btoa(binary);
  const hash = await sha256Hex(buf);
  return { base64, hash, size: bytes.length };
}

async function throwFromResponse(res: Response, defaultMsg: string): Promise<never> {
  const data = await res.json().catch(() => ({} as { error?: string; retryAfter?: number }));
  if (res.status === 429) {
    throw new RateLimitError(
      data.error || 'AI 분석 요청량이 많아 잠시 후 다시 시도해 주세요.',
      data.retryAfter
    );
  }
  throw new Error(data.error || `${defaultMsg} (${res.status})`);
}

// ---------- Public API ----------
export async function analyzePhotoForMenuTags(file: File): Promise<string[]> {
  if (!file.type.startsWith('image/')) return [];

  const { base64, hash, size } = await fileToBase64(file);

  const cached = readCache(hash);
  if (cached) {
    console.log('[analyze-photo] cache hit', { hash: hash.slice(0, 8), tags: cached });
    return cached;
  }

  return runQueued(async () => {
    console.log('[analyze-photo] calling server', { hash: hash.slice(0, 8), size });
    const res = await fetch('/api/analyze-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
    });
    if (!res.ok) await throwFromResponse(res, 'AI 분석 실패');
    const data = (await res.json()) as { tags: string[] };
    writeCache(hash, data.tags);
    return data.tags;
  });
}

export async function generateBlogPost(imageUrls: string[]): Promise<GeneratedPost> {
  const res = await fetch('/api/generate-blog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrls }),
  });
  if (!res.ok) await throwFromResponse(res, '블로그 생성 실패');
  const data = (await res.json()) as { post: GeneratedPost };
  return data.post;
}

export async function refineBlogPost(
  current: GeneratedPost,
  feedback: string,
  imageUrls: string[]
): Promise<GeneratedPost> {
  const res = await fetch('/api/refine-blog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ current, feedback, imageUrls }),
  });
  if (!res.ok) await throwFromResponse(res, '수정 실패');
  const data = (await res.json()) as { post: GeneratedPost };
  return data.post;
}
