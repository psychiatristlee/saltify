/**
 * Server-side Gemini helper.
 * Handles: model selection via env, exponential backoff + jitter,
 * Retry-After honoring, detailed error logging.
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || '';
export const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

if (!API_KEY && process.env.NODE_ENV === 'production') {
  console.warn('[gemini] GEMINI_API_KEY is not set');
}

let _cached: GenerativeModel | null = null;
export function getGeminiModel(): GenerativeModel {
  if (_cached) return _cached;
  _cached = new GoogleGenerativeAI(API_KEY).getGenerativeModel({ model: MODEL_NAME });
  return _cached;
}

export class GeminiError extends Error {
  status?: number;
  retryAfter?: number;  // seconds
  attempts: number;
  constructor(message: string, opts: { status?: number; retryAfter?: number; attempts: number }) {
    super(message);
    this.status = opts.status;
    this.retryAfter = opts.retryAfter;
    this.attempts = opts.attempts;
  }
}

function extractStatus(err: unknown): number | undefined {
  if (typeof err !== 'object' || !err) return;
  const anyErr = err as { status?: number; message?: string };
  if (typeof anyErr.status === 'number') return anyErr.status;
  const msg = anyErr.message || '';
  // Google SDK messages like: "[429 ] Resource exhausted"
  const m = msg.match(/\[(\d{3})/);
  return m ? parseInt(m[1], 10) : undefined;
}

function extractRetryAfter(err: unknown): number | undefined {
  if (typeof err !== 'object' || !err) return;
  const anyErr = err as {
    response?: { headers?: Record<string, string> | Headers };
    errorDetails?: Array<{ '@type'?: string; retryDelay?: string }>;
  };

  // Google AI errorDetails include RetryInfo like { retryDelay: "27s" }
  const details = anyErr.errorDetails;
  if (Array.isArray(details)) {
    for (const d of details) {
      if (d?.retryDelay && typeof d.retryDelay === 'string') {
        const m = d.retryDelay.match(/^(\d+(?:\.\d+)?)s$/);
        if (m) return Math.ceil(parseFloat(m[1]));
      }
    }
  }

  // HTTP Retry-After header if present
  const headers = anyErr.response?.headers;
  if (headers) {
    const v =
      typeof (headers as Headers).get === 'function'
        ? (headers as Headers).get('retry-after') || (headers as Headers).get('Retry-After')
        : (headers as Record<string, string>)['retry-after'] ||
          (headers as Record<string, string>)['Retry-After'];
    if (v) {
      const parsed = parseInt(v, 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return undefined;
}

interface BackoffOpts {
  maxRetries?: number;      // default 4 (→ up to 5 total attempts)
  baseDelayMs?: number;     // default 1000
  maxDelayMs?: number;      // cap, default 30000
  logContext?: Record<string, unknown>;
}

export async function callGemini<T>(fn: () => Promise<T>, opts: BackoffOpts = {}): Promise<T> {
  const maxRetries = opts.maxRetries ?? 4;
  const baseDelay = opts.baseDelayMs ?? 1000;
  const maxDelay = opts.maxDelayMs ?? 30000;
  let attempt = 0;

  for (;;) {
    attempt++;
    try {
      return await fn();
    } catch (err) {
      const status = extractStatus(err);
      const retryAfter = extractRetryAfter(err);
      const msg = err instanceof Error ? err.message : String(err);

      const retryable =
        status === 429 ||
        status === 503 ||
        status === 500 ||
        /resource exhausted|quota|rate.?limit|temporarily|unavailable/i.test(msg);

      console.error('[gemini] call failed', {
        attempt,
        maxAttempts: maxRetries + 1,
        status,
        retryAfter,
        model: MODEL_NAME,
        retryable,
        message: msg.slice(0, 300),
        ...opts.logContext,
      });

      if (!retryable || attempt > maxRetries) {
        throw new GeminiError(msg, { status, retryAfter, attempts: attempt });
      }

      // Honor Retry-After first, else exponential backoff with jitter (±30%)
      const expDelay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      const jitter = expDelay * (0.7 + Math.random() * 0.6);
      const delayMs = retryAfter ? retryAfter * 1000 : jitter;
      console.warn(`[gemini] retrying in ${Math.round(delayMs)}ms (attempt ${attempt + 1})`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

/**
 * Fetch a public URL and return a Gemini inline image part.
 */
export async function urlToImagePart(url: string) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`image fetch failed: ${url} (${res.status})`);
  const buf = await res.arrayBuffer();
  const base64 = Buffer.from(buf).toString('base64');
  const mimeType = res.headers.get('content-type') || 'image/jpeg';
  return {
    part: { inlineData: { data: base64, mimeType } },
    size: buf.byteLength,
  };
}

export function stripJsonFence(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}
