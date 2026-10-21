import "server-only";
import { cache } from "react";
import { draftMode } from "next/headers";
import { defaultPages, defaultRegions, defaultScene, defaultServices, defaultSettings } from "@/lib/content/defaults";
import type { ContentEntry, EntityData, EntityType } from "@/lib/content/types";
import { getStore } from "@/lib/data/store";

const defaults: { [K in EntityType]: { key: string; data: EntityData[K] }[] } = {
  service: defaultServices.map((d) => ({ key: d.slug, data: d })),
  region: defaultRegions.map((d) => ({ key: d.id, data: d })),
  page: defaultPages.map((d) => ({ key: d.slug, data: d })),
  scene: [{ key: defaultScene.key, data: defaultScene }],
  settings: [{ key: "site", data: defaultSettings }],
};

export function defaultsFor<T extends EntityType>(type: T) {
  return defaults[type];
}

function isPreview(): boolean {
  try {
    return draftMode().isEnabled;
  } catch {
    return false; // outside a request (build-time static params)
  }
}

/**
 * Merge stored entries over seed defaults. Published content is used
 * normally; in draft mode (admin preview) the latest draft is shown instead.
 * Anything not yet stored falls back to the seed so the site always renders.
 */
async function load<T extends EntityType>(type: T, preview: boolean): Promise<EntityData[T][]> {
  const store = await getStore();
  let entries: ContentEntry[] = [];
  try {
    entries = preview ? await store.listEntries(type) : await store.listPublished(type);
  } catch (err) {
    console.error(`[cms] failed to load ${type}; using defaults`, err);
  }
  const byKey = new Map(entries.map((e) => [e.key, e]));
  const rows: { order: number; data: EntityData[T] }[] = [];
  defaults[type].forEach((d, i) => {
    const e = byKey.get(d.key);
    const data = (e ? (preview ? e.draft : e.published ?? d.data) : d.data) as EntityData[T];
    rows.push({ order: e ? e.sortOrder : i, data });
    byKey.delete(d.key);
  });
  for (const e of byKey.values()) {
    const data = (preview ? e.draft : e.published) as EntityData[T] | null;
    if (data) rows.push({ order: e.sortOrder, data });
  }
  return rows.sort((a, b) => a.order - b.order).map((r) => r.data);
}

const loadCached = cache((type: EntityType, preview: boolean) => load(type, preview));

export async function getServices() {
  return (await loadCached("service", isPreview())) as EntityData["service"][];
}

export async function getService(slug: string) {
  return (await getServices()).find((s) => s.slug === slug) ?? null;
}

export async function getRegions() {
  const all = (await loadCached("region", isPreview())) as EntityData["region"][];
  return all.filter((r) => r.status !== "hidden");
}

export async function getPage(slug: string) {
  const pages = (await loadCached("page", isPreview())) as EntityData["page"][];
  return pages.find((p) => p.slug === slug) ?? defaultPages.find((p) => p.slug === slug)!;
}

export async function getSceneConfig() {
  const scenes = (await loadCached("scene", isPreview())) as EntityData["scene"][];
  return scenes[0] ?? defaultScene;
}

export async function getSettings() {
  const s = (await loadCached("settings", isPreview())) as EntityData["settings"][];
  return s[0] ?? defaultSettings;
}

export { isPreview };
