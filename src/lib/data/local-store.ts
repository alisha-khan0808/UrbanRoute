import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { ContentEntry, ContentRevision, EntityType } from "@/lib/content/types";
import type { Enquiry, EnquiryFileInput, EnquiryInput, EnquiryStatus } from "@/lib/enquiry/schema";
import { safeFileName } from "@/lib/enquiry/schema";
import {
  makeReference,
  type Actor,
  type AuditLog,
  type DataStore,
  type EnquiryFilter,
  type MediaAsset,
  type StoredFile,
} from "./store";

interface StoredEnquiryFile {
  id: string;
  enquiryId: string;
  storagePath: string;
  fileName: string;
  size: number;
  contentType: string;
}

interface StoredMedia extends Omit<MediaAsset, "url"> {
  storagePath: string;
}

interface Db {
  entries: ContentEntry[];
  revisions: ContentRevision[];
  enquiries: Omit<Enquiry, "files">[];
  enquiryFiles: StoredEnquiryFile[];
  media: StoredMedia[];
  audit: AuditLog[];
}

const emptyDb = (): Db => ({ entries: [], revisions: [], enquiries: [], enquiryFiles: [], media: [], audit: [] });
const now = () => new Date().toISOString();

/**
 * File-backed store for local development and tests. Uploads are written to
 * `<dataDir>/private`, which is outside `public/` and only served through
 * authenticated route handlers.
 */
export class LocalStore implements DataStore {
  readonly mode = "local" as const;
  private dbPath: string;
  private privateDir: string;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private dataDir: string) {
    this.dbPath = path.join(dataDir, "db.json");
    this.privateDir = path.join(dataDir, "private");
  }

  /**
   * Always re-read the file: Next.js may load this module in several bundles
   * (pages, route handlers, server actions), so an in-memory cache would go stale.
   */
  private async read(): Promise<Db> {
    try {
      return { ...emptyDb(), ...JSON.parse(await fs.readFile(this.dbPath, "utf8")) } as Db;
    } catch {
      return emptyDb();
    }
  }

  /** Serialise all writes so concurrent requests cannot clobber the file. */
  private mutate<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const db = await this.read();
      const result = await fn(db);
      await fs.mkdir(this.dataDir, { recursive: true });
      const tmp = `${this.dbPath}.${process.pid}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(db, null, 2));
      await fs.rename(tmp, this.dbPath);
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async writePrivate(folder: string, file: EnquiryFileInput): Promise<string> {
    const rel = path.join(folder, `${randomUUID()}-${safeFileName(file.name)}`);
    const abs = path.join(this.privateDir, rel);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, file.data);
    return rel;
  }

  private async readPrivate(rel: string): Promise<Buffer | null> {
    const abs = path.resolve(this.privateDir, rel);
    if (!abs.startsWith(path.resolve(this.privateDir))) return null;
    try {
      return await fs.readFile(abs);
    } catch {
      return null;
    }
  }

  /* ----------------------------- content ----------------------------- */

  async listPublished(type: EntityType) {
    return (await this.listEntries(type)).filter((e) => e.published !== null);
  }

  async listEntries(type: EntityType) {
    const db = await this.read();
    return db.entries.filter((e) => e.type === type).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getEntry(type: EntityType, key: string) {
    const db = await this.read();
    return db.entries.find((e) => e.type === type && e.key === key) ?? null;
  }

  saveDraft(type: EntityType, key: string, data: unknown, actor: Actor, action: "draft" | "restore" = "draft") {
    return this.mutate((db) => {
      let entry = db.entries.find((e) => e.type === type && e.key === key);
      if (!entry) {
        entry = {
          type,
          key,
          draft: data,
          published: null,
          status: "draft",
          sortOrder: db.entries.filter((e) => e.type === type).length,
          updatedAt: now(),
          updatedBy: actor.email,
        };
        db.entries.push(entry);
      }
      entry.draft = data;
      entry.status = entry.published ? "changed" : "draft";
      entry.updatedAt = now();
      entry.updatedBy = actor.email;
      db.revisions.unshift({ id: randomUUID(), type, key, data, action, createdBy: actor.email, createdAt: now() });
    });
  }

  publish(type: EntityType, key: string, actor: Actor) {
    return this.mutate((db) => {
      const entry = db.entries.find((e) => e.type === type && e.key === key);
      if (!entry) throw new Error("Entry not found");
      entry.published = entry.draft;
      entry.status = "published";
      entry.updatedAt = now();
      entry.updatedBy = actor.email;
      db.revisions.unshift({
        id: randomUUID(),
        type,
        key,
        data: entry.draft,
        action: "publish",
        createdBy: actor.email,
        createdAt: now(),
      });
    });
  }

  setSortOrder(type: EntityType, key: string, sortOrder: number) {
    return this.mutate((db) => {
      const entry = db.entries.find((e) => e.type === type && e.key === key);
      if (entry) entry.sortOrder = sortOrder;
    });
  }

  async listRevisions(type?: EntityType, key?: string, limit = 100) {
    const db = await this.read();
    return db.revisions.filter((r) => (!type || r.type === type) && (!key || r.key === key)).slice(0, limit);
  }

  async getRevision(id: string) {
    const db = await this.read();
    return db.revisions.find((r) => r.id === id) ?? null;
  }

  /* ----------------------------- enquiries ----------------------------- */

  async createEnquiry(input: EnquiryInput, files: EnquiryFileInput[]) {
    const id = randomUUID();
    const reference = makeReference();
    const stored: StoredEnquiryFile[] = [];
    for (const file of files) {
      const storagePath = await this.writePrivate(path.join("enquiries", id), file);
      stored.push({ id: randomUUID(), enquiryId: id, storagePath, fileName: safeFileName(file.name), size: file.size, contentType: file.type });
    }
    await this.mutate((db) => {
      db.enquiries.unshift({
        id,
        reference,
        service: input.service,
        name: input.name,
        company: input.company,
        email: input.email,
        phone: input.phone,
        location: input.location,
        description: input.description,
        startDate: input.startDate,
        details: input.details,
        status: "new",
        createdAt: now(),
        updatedAt: now(),
        notes: [],
      });
      db.enquiryFiles.push(...stored);
    });
    return { id, reference };
  }

  private hydrate(db: Db, e: Omit<Enquiry, "files">): Enquiry {
    return {
      ...e,
      files: db.enquiryFiles
        .filter((f) => f.enquiryId === e.id)
        .map(({ id, fileName, size, contentType }) => ({ id, fileName, size, contentType })),
    };
  }

  async listEnquiries(filter: EnquiryFilter) {
    const db = await this.read();
    const q = filter.q?.trim().toLowerCase();
    return db.enquiries
      .filter((e) => !filter.status || e.status === filter.status)
      .filter((e) => !filter.service || e.service === filter.service)
      .filter(
        (e) =>
          !q ||
          [e.reference, e.name, e.company, e.email, e.location, e.description].some((v) => v.toLowerCase().includes(q)),
      )
      .map((e) => this.hydrate(db, e));
  }

  async getEnquiry(id: string) {
    const db = await this.read();
    const e = db.enquiries.find((x) => x.id === id);
    return e ? this.hydrate(db, e) : null;
  }

  updateEnquiryStatus(id: string, status: EnquiryStatus) {
    return this.mutate((db) => {
      const e = db.enquiries.find((x) => x.id === id);
      if (!e) throw new Error("Enquiry not found");
      e.status = status;
      e.updatedAt = now();
    });
  }

  addEnquiryNote(id: string, text: string, actor: Actor) {
    return this.mutate((db) => {
      const e = db.enquiries.find((x) => x.id === id);
      if (!e) throw new Error("Enquiry not found");
      e.notes.push({ id: randomUUID(), text, author: actor.email, createdAt: now() });
      e.updatedAt = now();
    });
  }

  async getEnquiryFile(fileId: string): Promise<StoredFile | null> {
    const db = await this.read();
    const f = db.enquiryFiles.find((x) => x.id === fileId);
    if (!f) return null;
    const data = await this.readPrivate(f.storagePath);
    return data ? { kind: "buffer", data, contentType: f.contentType, fileName: f.fileName } : null;
  }

  /* ------------------------------- media ------------------------------- */

  private toAsset(m: StoredMedia): MediaAsset {
    const { storagePath: _ignored, ...rest } = m;
    void _ignored;
    return { ...rest, url: `/api/media/${m.id}` };
  }

  async listMedia() {
    const db = await this.read();
    return db.media.map((m) => this.toAsset(m));
  }

  async uploadMedia(file: EnquiryFileInput, altText: string) {
    const storagePath = await this.writePrivate("media", file);
    const media: StoredMedia = {
      id: randomUUID(),
      fileName: safeFileName(file.name),
      contentType: file.type,
      size: file.size,
      altText,
      createdAt: now(),
      storagePath,
    };
    await this.mutate((db) => {
      db.media.unshift(media);
    });
    return this.toAsset(media);
  }

  async replaceMedia(id: string, file: EnquiryFileInput) {
    const storagePath = await this.writePrivate("media", file);
    await this.mutate((db) => {
      const m = db.media.find((x) => x.id === id);
      if (!m) throw new Error("Media not found");
      Object.assign(m, { storagePath, fileName: safeFileName(file.name), contentType: file.type, size: file.size });
    });
  }

  updateMediaAlt(id: string, altText: string) {
    return this.mutate((db) => {
      const m = db.media.find((x) => x.id === id);
      if (m) m.altText = altText;
    });
  }

  async deleteMedia(id: string) {
    const removed = await this.mutate((db) => {
      const i = db.media.findIndex((x) => x.id === id);
      return i >= 0 ? db.media.splice(i, 1)[0] : null;
    });
    if (removed) await fs.rm(path.join(this.privateDir, removed.storagePath), { force: true });
  }

  async getMediaFile(id: string): Promise<StoredFile | null> {
    const db = await this.read();
    const m = db.media.find((x) => x.id === id);
    if (!m) return null;
    const data = await this.readPrivate(m.storagePath);
    return data ? { kind: "buffer", data, contentType: m.contentType, fileName: m.fileName } : null;
  }

  /* ------------------------------- audit ------------------------------- */

  audit(actor: Actor | null, action: string, entityType: string, entityId: string) {
    return this.mutate((db) => {
      db.audit.unshift({ id: randomUUID(), actor: actor?.email ?? null, action, entityType, entityId, createdAt: now() });
      db.audit = db.audit.slice(0, 2000);
    });
  }

  async listAudit(limit = 200) {
    const db = await this.read();
    return db.audit.slice(0, limit);
  }
}
