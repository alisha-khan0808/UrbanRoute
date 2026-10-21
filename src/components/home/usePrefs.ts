"use client";

import { useCallback, useEffect, useState } from "react";
import { detectQuality, hasWebGL, type Quality } from "@/components/three/settings";

const KEY = "ur-experience-prefs";

interface StoredPrefs {
  reducedMotion?: boolean;
  staticView?: boolean;
}

function readStored(): StoredPrefs {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as StoredPrefs;
  } catch {
    return {};
  }
}

/**
 * Visitor preferences for the 3D experience: reduced motion (system setting
 * or explicit toggle), static view, and an auto-detected quality preset.
 */
export function useExperiencePrefs(defaultQuality: "auto" | Quality = "auto") {
  const [ready, setReady] = useState(false);
  const [systemReduced, setSystemReduced] = useState(false);
  const [reducedMotion, setReducedMotion] = useState<boolean | undefined>(undefined);
  const [staticView, setStaticView] = useState(false);
  const [webgl, setWebgl] = useState(true);
  const [quality, setQuality] = useState<Quality>("medium");

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stored = readStored();
    setSystemReduced(mq.matches);
    setReducedMotion(stored.reducedMotion);
    const gl = hasWebGL();
    setWebgl(gl);
    setStaticView(!gl || Boolean(stored.staticView));
    setQuality(defaultQuality === "auto" ? detectQuality() : defaultQuality);
    setReady(true);
    const onChange = (e: MediaQueryListEvent) => setSystemReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [defaultQuality]);

  const persist = (patch: StoredPrefs) => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...readStored(), ...patch }));
    } catch {
      /* storage unavailable */
    }
  };

  const motion = !(reducedMotion ?? systemReduced);

  const toggleMotion = useCallback(() => {
    setReducedMotion(motion);
    persist({ reducedMotion: motion });
  }, [motion]);

  const toggleStatic = useCallback(() => {
    setStaticView((v) => {
      persist({ staticView: !v });
      return !v;
    });
  }, []);

  /** Session-only static mode (e.g. after a lost WebGL context) — not persisted. */
  const forceStatic = useCallback(() => setStaticView(true), []);

  return { ready, motion, staticView: staticView || !webgl, webgl, quality, setQuality, toggleMotion, toggleStatic, forceStatic };
}
