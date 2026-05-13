/**
 * Web Audio API sound synthesis for the tycoon mode.
 *
 * Doesn't ship audio files — every sound is a few oscillators with an
 * envelope. Keeps bundle size flat and the SFX feel cohesive.
 *
 * Lazy-initialised on first play() so we don't poke at AudioContext until
 * the user interacts (browser autoplay policy).
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let muted = false;

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
      if (!AC) return null;
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.4;
      masterGain.connect(ctx.destination);
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function setMuted(m: boolean) {
  muted = m;
  if (masterGain) masterGain.gain.value = m ? 0 : 0.4;
}
export function isMuted() {
  return muted;
}

interface NoteOpts {
  freq: number;
  durationMs: number;
  type?: OscillatorType;
  attackMs?: number;
  releaseMs?: number;
  startAt?: number;     // seconds offset from now()
  gain?: number;
}

function playNote({
  freq, durationMs, type = 'sine', attackMs = 8, releaseMs = 100, startAt = 0, gain = 0.5,
}: NoteOpts) {
  const c = ensureCtx();
  if (!c || !masterGain) return;
  const t0 = c.currentTime + startAt;
  const t1 = t0 + durationMs / 1000;
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  const g = c.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + attackMs / 1000);
  g.gain.setValueAtTime(gain, t1);
  g.gain.linearRampToValueAtTime(0, t1 + releaseMs / 1000);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(t0);
  osc.stop(t1 + releaseMs / 1000 + 0.02);
}

/** Cash register cha-ching — high bell + drawer slide. */
export function playSale() {
  if (muted) return;
  // Bell-like: two harmonics
  playNote({ freq: 1568, durationMs: 60, type: 'triangle', attackMs: 4, releaseMs: 180, gain: 0.35 });
  playNote({ freq: 2349, durationMs: 60, type: 'sine',     attackMs: 4, releaseMs: 220, gain: 0.22, startAt: 0.04 });
  // Cash drawer slide
  playNote({ freq: 220,  durationMs: 80, type: 'sawtooth', attackMs: 2, releaseMs: 50,  gain: 0.18, startAt: 0.10 });
}

/** Oven done — single warm bell ding. */
export function playOvenDing() {
  if (muted) return;
  playNote({ freq: 1175, durationMs: 80, type: 'sine', attackMs: 4, releaseMs: 380, gain: 0.30 });
  playNote({ freq: 1760, durationMs: 80, type: 'sine', attackMs: 4, releaseMs: 300, gain: 0.16, startAt: 0.02 });
}

/** Customer leaves angry — low buzz. */
export function playAngry() {
  if (muted) return;
  playNote({ freq: 130, durationMs: 220, type: 'sawtooth', attackMs: 10, releaseMs: 80, gain: 0.18 });
  playNote({ freq: 98,  durationMs: 180, type: 'square',   attackMs: 10, releaseMs: 80, gain: 0.10, startAt: 0.08 });
}

/** Achievement / unlock — rising 3-note arpeggio. */
export function playUnlock() {
  if (muted) return;
  playNote({ freq: 523, durationMs: 110, type: 'triangle', attackMs: 6, releaseMs: 80, gain: 0.30 });
  playNote({ freq: 659, durationMs: 110, type: 'triangle', attackMs: 6, releaseMs: 80, gain: 0.30, startAt: 0.10 });
  playNote({ freq: 784, durationMs: 200, type: 'triangle', attackMs: 6, releaseMs: 250, gain: 0.32, startAt: 0.22 });
}

/** Upgrade purchase — short coin clink. */
export function playPurchase() {
  if (muted) return;
  playNote({ freq: 880,  durationMs: 50, type: 'square',   attackMs: 2, releaseMs: 60, gain: 0.25 });
  playNote({ freq: 1320, durationMs: 60, type: 'triangle', attackMs: 2, releaseMs: 80, gain: 0.20, startAt: 0.04 });
}

/** Negative — can't afford / button blocked. */
export function playBlocked() {
  if (muted) return;
  playNote({ freq: 196, durationMs: 70, type: 'square', attackMs: 2, releaseMs: 30, gain: 0.16 });
  playNote({ freq: 165, durationMs: 80, type: 'square', attackMs: 2, releaseMs: 30, gain: 0.16, startAt: 0.05 });
}
