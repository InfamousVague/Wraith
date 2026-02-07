/**
 * @file useAudioFeedback.ts
 * @description Audio feedback hook for Tap Trading.
 *
 * Provides playWin(), playLoss(), playPlace() methods using the Web Audio API.
 * Synthesizes sounds dynamically — no external audio files needed.
 * Mute state persisted in localStorage.
 */

import { useState, useCallback, useRef, useEffect } from "react";

// =============================================================================
// Types
// =============================================================================

export interface UseAudioFeedbackResult {
  playWin: () => void;
  playLoss: () => void;
  playPlace: () => void;
  isMuted: boolean;
  toggleMute: () => void;
}

// =============================================================================
// Constants
// =============================================================================

const MUTE_STORAGE_KEY = "tapTrade.audioMuted";

// =============================================================================
// Sound synthesizers
// =============================================================================

function createAudioContext(): AudioContext | null {
  try {
    return new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
  } catch {
    return null;
  }
}

/** Synthesize a "cha-ching" win sound (~500ms). */
function synthWin(ctx: AudioContext) {
  const now = ctx.currentTime;

  // High bell tone
  const osc1 = ctx.createOscillator();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(880, now);
  osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.1);

  const gain1 = ctx.createGain();
  gain1.gain.setValueAtTime(0.15, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.4);

  // Second bell (delayed)
  const osc2 = ctx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(1320, now + 0.15);
  osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.25);

  const gain2 = ctx.createGain();
  gain2.gain.setValueAtTime(0.12, now + 0.15);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.15);
  osc2.stop(now + 0.5);
}

/** Synthesize a subtle "whoosh" loss sound (~300ms). */
function synthLoss(ctx: AudioContext) {
  const now = ctx.currentTime;

  // Noise-based swoosh
  const bufferSize = ctx.sampleRate * 0.3;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.3;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  // Band-pass filter for "whoosh" character
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(2000, now);
  filter.frequency.exponentialRampToValueAtTime(200, now + 0.3);
  filter.Q.value = 1;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(now);
  source.stop(now + 0.3);
}

/** Synthesize a short "click" placement sound (~100ms). */
function synthPlace(ctx: AudioContext) {
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.1);
}

// =============================================================================
// Hook
// =============================================================================

export function useAudioFeedback(): UseAudioFeedbackResult {
  const ctxRef = useRef<AudioContext | null>(null);

  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem(MUTE_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  // Lazily create AudioContext on first user interaction
  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = createAudioContext();
    }
    // Resume if suspended (browser autoplay policy)
    if (ctxRef.current?.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const playWin = useCallback(() => {
    if (isMuted) return;
    const ctx = getCtx();
    if (ctx) synthWin(ctx);
  }, [isMuted, getCtx]);

  const playLoss = useCallback(() => {
    if (isMuted) return;
    const ctx = getCtx();
    if (ctx) synthLoss(ctx);
  }, [isMuted, getCtx]);

  const playPlace = useCallback(() => {
    if (isMuted) return;
    const ctx = getCtx();
    if (ctx) synthPlace(ctx);
  }, [isMuted, getCtx]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(MUTE_STORAGE_KEY, String(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return { playWin, playLoss, playPlace, isMuted, toggleMute };
}
