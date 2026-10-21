"use client";

import { createContext, useContext } from "react";

export type Quality = "low" | "medium" | "high";

export interface SceneSettings {
  quality: Quality;
  /** False when the visitor prefers reduced motion: zones render a still frame. */
  motion: boolean;
}

export const SceneSettingsContext = createContext<SceneSettings>({ quality: "medium", motion: true });

export const useSceneSettings = () => useContext(SceneSettingsContext);

export const QUALITY_PRESETS: Record<Quality, { dpr: [number, number]; shadows: boolean; shadowMap: number; density: number }> = {
  low: { dpr: [1, 1.5], shadows: false, shadowMap: 512, density: 0.4 },
  medium: { dpr: [1, 1.5], shadows: true, shadowMap: 1024, density: 0.7 },
  high: { dpr: [1, 1.75], shadows: true, shadowMap: 2048, density: 1 },
};

/** Pick a starting preset from coarse device signals; PerformanceMonitor refines it at runtime. */
export function detectQuality(): Quality {
  if (typeof window === "undefined") return "medium";
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  // Phones and tablets: no shadows, fewer moving agents — keeps 30+ FPS and battery use down.
  if (coarse || small) return "low";
  if (cores <= 4 || memory <= 4) return "medium";
  return cores >= 8 && memory >= 8 ? "high" : "medium";
}

export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export const COLORS = {
  paper: "#F7F8F6",
  ground: "#E4E8E1",
  grass: "#C9DDB8",
  grassDark: "#A9C795",
  pavement: "#F1F2EE",
  road: "#2C3740",
  roadLine: "#F4F1E8",
  kerb: "#D6DAD4",
  ink: "#17232B",
  flare: "#FF6542",
  flareDark: "#E04A28",
  teal: "#21B7AA",
  tealDark: "#14857B",
  white: "#FFFFFF",
  concrete: "#C9CCC6",
  steel: "#8E9AA2",
  yellow: "#F6B73C",
  soil: "#B98B62",
  soilDark: "#8F6646",
  glass: "#9FD3D6",
  building: ["#F3EFE7", "#E6E1D6", "#DCE3E5", "#EDE6DA", "#D9DED6"],
  car: ["#FF6542", "#21B7AA", "#FFFFFF", "#2C3740", "#F6B73C", "#8EC5E8", "#C8CED2"],
} as const;
