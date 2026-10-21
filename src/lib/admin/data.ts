import "server-only";
import { defaultsFor } from "@/lib/cms";
import type { ContentStatus, EntityData, EntityType } from "@/lib/content/types";
import { getStore } from "@/lib/data/store";

export interface EditableItem<T extends EntityType> {
  key: string;
  data: EntityData[T];
  status: ContentStatus | "default";
  updatedAt: string | null;
  updatedBy: string | null;
}

/** All items of a type for the admin: stored drafts merged over built-in defaults. */
export async function listEditable<T extends EntityType>(type: T): Promise<EditableItem<T>[]> {
  const store = await getStore();
  const stored = await store.listEntries(type);
  const items: (EditableItem<T> & { order: number })[] = defaultsFor(type).map((d, i) => {
    const e = stored.find((s) => s.key === d.key);
    return e
      ? { key: d.key, data: e.draft as EntityData[T], status: e.status, updatedAt: e.updatedAt, updatedBy: e.updatedBy, order: e.sortOrder }
      : { key: d.key, data: d.data as EntityData[T], status: "default" as const, updatedAt: null, updatedBy: null, order: i };
  });
  for (const e of stored) {
    if (!items.some((i) => i.key === e.key)) {
      items.push({ key: e.key, data: e.draft as EntityData[T], status: e.status, updatedAt: e.updatedAt, updatedBy: e.updatedBy, order: e.sortOrder });
    }
  }
  return items.sort((a, b) => a.order - b.order);
}

export async function getEditable<T extends EntityType>(type: T, key: string): Promise<EditableItem<T> | null> {
  return (await listEditable(type)).find((i) => i.key === key) ?? null;
}
