import type { CameraPreset } from "@/lib/content/types";

/**
 * World layout: where each service scene sits in the shared world, and the
 * approved camera presets used to frame it. Pure data so it can be shared by
 * the camera controller, hotspots and standalone service scenes.
 */

export type Vec3 = [number, number, number];
export type SceneKey = "roadworks" | "intersection" | "event" | "advisory" | "qs" | "coordination" | "tia";
export type ZoneContext = "straight" | "crossing" | "plot";

export interface ZoneDef {
  key: SceneKey;
  position: Vec3;
  /** Height of the hotspot marker above the zone origin. */
  hotspotY: number;
  /** Hotspot offset from the zone origin (e.g. to sit above the main subject). */
  hotspotOffset?: Vec3;
  context: ZoneContext;
  /** Viewing direction for this zone, as a unit-ish vector from target to camera (xz). */
  view: [number, number];
}

export const ZONES: Record<SceneKey, ZoneDef> = {
  roadworks: { key: "roadworks", position: [-34, 0, 0], hotspotY: 4.5, context: "straight", view: [0.45, -1] },
  intersection: { key: "intersection", position: [12, 0, 0], hotspotY: 5, context: "crossing", view: [1, 1] },
  event: { key: "event", position: [-18, 0, -12], hotspotY: 6, context: "plot", view: [0.7, 1] },
  advisory: { key: "advisory", position: [-4, 0, 14], hotspotY: 5.5, context: "plot", view: [1, 0.9] },
  qs: { key: "qs", position: [31, 0, 15], hotspotY: 11, context: "plot", view: [1, 1] },
  coordination: { key: "coordination", position: [-35, 0, 16], hotspotY: 9, context: "plot", view: [0.8, 1] },
  tia: { key: "tia", position: [12, 0, -24], hotspotY: 6, hotspotOffset: [8, 0, -8], context: "crossing", view: [1, 0.8] },
};

export const SCENE_KEYS = Object.keys(ZONES) as SceneKey[];

export function isSceneKey(v: string): v is SceneKey {
  return v in ZONES;
}

const PRESET_DISTANCE: Record<CameraPreset, { dist: number; height: number }> = {
  close: { dist: 30, height: 22 },
  standard: { dist: 40, height: 32 },
  wide: { dist: 54, height: 44 },
  top: { dist: 6, height: 62 },
};

export interface CameraView {
  position: Vec3;
  target: Vec3;
}

export const OVERVIEW: CameraView = { position: [74, 80, 86], target: [0, 0, 2] };
/** Portrait phones: look along the world's long (x) axis so every hotspot fits the narrow width. */
export const OVERVIEW_PORTRAIT: CameraView = { position: [64, 86, -10], target: [-4, 0, -10] };
export const INTRO_START: CameraView = { position: [6, 190, 18], target: [0, 0, 0] };

export function zoneView(key: SceneKey, preset: CameraPreset = "standard"): CameraView {
  const z = ZONES[key];
  const { dist, height } = PRESET_DISTANCE[preset];
  const [vx, vz] = z.view;
  const len = Math.hypot(vx, vz) || 1;
  const [ox, , oz] = z.hotspotOffset ?? [0, 0, 0];
  const target: Vec3 = [z.position[0] + ox * 0.5, 0, z.position[2] + oz * 0.5];
  return {
    target,
    position: [target[0] + (vx / len) * dist, height, target[2] + (vz / len) * dist],
  };
}

/** Pull the camera back on narrow (portrait) viewports so scenes still fit. */
export function aspectDistanceScale(aspect: number): number {
  if (aspect >= 1.3) return 1;
  return Math.min(2.1, 1.3 / Math.max(aspect, 0.4)) ** 0.85;
}

/** Wider field of view on portrait screens. */
export function fovForAspect(aspect: number): number {
  return aspect < 0.8 ? 44 : 32;
}
