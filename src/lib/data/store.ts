import "server-only";
import { randomBytes } from "node:crypto";
import type { ContentEntry, ContentRevision, EntityType } from "@/lib/content/types";
import type { Enquiry, EnquiryFileInput, EnquiryInput, EnquiryStatus } from "@/lib/enquiry/schema";

export interface Actor {
  id: string;
  email: string;
}

export interface EnquiryFilter {
  status?: EnquiryStatus | "";
  service?: string;
  q?: string;
}

export interface MediaAsset {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  altText: string;
  createdAt: string;
  url: string;
}

export interface AuditLog {
  id: string;
  actor: string | null;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

export type StoredFile = { kind: "buffer"; data: Buffer; contentType: string; fileName: string } | { kind: "url"; url: string };

/**
 * Persistence boundary. Two implementations:
 *  - LocalStore (JSON file + private folder) for development without Supabase
 *  - SupabaseStore (Postgres + Storage) for preview/production
 */
export interface DataStore {
  readonly mode: "local" | "supabase";

  /** Public read path — published content only, never needs a session. */
  listPublished(type: EntityType): Promise<ContentEntry[]>;
  /** Admin read path — drafts included. */
  listEntries(type: EntityType): Promise<ContentEntry[]>;
  getEntry(type: EntityType, key: string): Promise<ContentEntry | null>;
  saveDraft(type: EntityType, key: string, data: unknown, actor: Actor, action?: "draft" | "restore"): Promise<void>;
  publish(type: EntityType, key: string, actor: Actor): Promise<void>;
  setSortOrder(type: EntityType, key: string, sortOrder: number): Promise<void>;
  listRevisions(type?: EntityType, key?: string, limit?: number): Promise<ContentRevision[]>;
  getRevision(id: string): Promise<ContentRevision | null>;

  createEnquiry(input: EnquiryInput, files: EnquiryFileInput[]): Promise<{ id: string; reference: string }>;
  listEnquiries(filter: EnquiryFilter): Promise<Enquiry[]>;
  getEnquiry(id: string): Promise<Enquiry | null>;
  updateEnquiryStatus(id: string, status: EnquiryStatus): Promise<void>;
  addEnquiryNote(id: string, text: string, actor: Actor): Promise<void>;
  getEnquiryFile(fileId: string): Promise<StoredFile | null>;

  listMedia(): Promise<MediaAsset[]>;
  uploadMedia(file: EnquiryFileInput, altText: string): Promise<MediaAsset>;
  replaceMedia(id: string, file: EnquiryFileInput): Promise<void>;
  updateMediaAlt(id: string, altText: string): Promise<void>;
  deleteMedia(id: string): Promise<void>;
  getMediaFile(id: string): Promise<StoredFile | null>;

  audit(actor: Actor | null, action: string, entityType: string, entityId: string): Promise<void>;
  listAudit(limit?: number): Promise<AuditLog[]>;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

let store: DataStore | null = null;

export async function getStore(): Promise<DataStore> {
  if (store) return store;
  if (isSupabaseConfigured()) {
    const { SupabaseStore } = await import("./supabase-store");
    store = new SupabaseStore();
  } else {
    const { LocalStore } = await import("./local-store");
    store = new LocalStore(process.env.LOCAL_DATA_DIR || ".data");
  }
  return store;
}

/** Test hook. */
export function setStoreForTests(s: DataStore | null) {
  store = s;
}

export function makeReference(date = new Date()): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = randomBytes(6);
  for (const b of bytes) code += alphabet[b % alphabet.length];
  return `UR-${date.getFullYear()}-${code}`;
}
