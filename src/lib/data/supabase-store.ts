import "server-only";
import { randomUUID } from "node:crypto";
import type { ContentEntry, ContentRevision, EntityType } from "@/lib/content/types";
import type { Enquiry, EnquiryFileInput, EnquiryInput, EnquiryStatus } from "@/lib/enquiry/schema";
import { safeFileName } from "@/lib/enquiry/schema";
import { createAnonClient, createServiceClient, createUserClient } from "@/lib/supabase/server";
import {
  makeReference,
  type Actor,
  type AuditLog,
  type DataStore,
  type EnquiryFilter,
  type MediaAsset,
  type StoredFile,
} from "./store";

const privateBucket = () => process.env.SUPABASE_PRIVATE_BUCKET || "enquiry-files";
const mediaBucket = () => process.env.SUPABASE_MEDIA_BUCKET || "media";

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

type Row = Record<string, unknown>;

/**
 * Supabase implementation. Admin reads/writes use the signed-in user's
 * session so row-level security is enforced in the database as well as in
 * the application layer. Public reads use the published-only view.
 */
export class SupabaseStore implements DataStore {
  readonly mode = "supabase" as const;

  private user() {
    return createUserClient();
  }

  private toEntry(r: Row): ContentEntry {
    return {
      type: r.entity_type as EntityType,
      key: r.key as string,
      draft: r.draft_json,
      published: r.published_json ?? null,
      status: r.status as ContentEntry["status"],
      sortOrder: r.sort_order as number,
      updatedAt: r.updated_at as string,
      updatedBy: (r.updated_by as string) ?? null,
    };
  }

  /** Public read path: published-only view, no session or cookies involved. */
  async listPublished(type: EntityType) {
    const rows = check(
      await createAnonClient().from("published_content").select("*").eq("entity_type", type).order("sort_order"),
    ) as Row[];
    return rows.map((r) => this.toEntry({ ...r, draft_json: r.published_json, status: "published" }));
  }

  async listEntries(type: EntityType) {
    const rows = check(
      await this.user().from("content_entries").select("*").eq("entity_type", type).order("sort_order"),
    ) as Row[];
    return rows.map((r) => this.toEntry(r));
  }

  async getEntry(type: EntityType, key: string) {
    const list = await this.listEntries(type);
    return list.find((e) => e.key === key) ?? null;
  }

  async saveDraft(type: EntityType, key: string, data: unknown, actor: Actor, action: "draft" | "restore" = "draft") {
    const db = this.user();
    const existing = (check(
      await db.from("content_entries").select("published_json").eq("entity_type", type).eq("key", key).maybeSingle(),
    ) as Row | null);
    if (existing) {
      check(
        await db
          .from("content_entries")
          .update({
            draft_json: data,
            status: existing.published_json ? "changed" : "draft",
            updated_at: new Date().toISOString(),
            updated_by: actor.email,
          })
          .eq("entity_type", type)
          .eq("key", key),
      );
    } else {
      const { count } = await db.from("content_entries").select("*", { count: "exact", head: true }).eq("entity_type", type);
      check(
        await db.from("content_entries").insert({
          entity_type: type,
          key,
          draft_json: data,
          status: "draft",
          sort_order: count ?? 0,
          updated_by: actor.email,
        }),
      );
    }
    check(
      await db
        .from("content_revisions")
        .insert({ entity_type: type, entity_key: key, content_json: data, action, created_by: actor.email }),
    );
  }

  async publish(type: EntityType, key: string, actor: Actor) {
    const db = this.user();
    const row = check(
      await db.from("content_entries").select("draft_json").eq("entity_type", type).eq("key", key).single(),
    ) as Row;
    check(
      await db
        .from("content_entries")
        .update({
          published_json: row.draft_json,
          status: "published",
          updated_at: new Date().toISOString(),
          updated_by: actor.email,
        })
        .eq("entity_type", type)
        .eq("key", key),
    );
    check(
      await db.from("content_revisions").insert({
        entity_type: type,
        entity_key: key,
        content_json: row.draft_json,
        action: "publish",
        created_by: actor.email,
      }),
    );
  }

  async setSortOrder(type: EntityType, key: string, sortOrder: number) {
    check(await this.user().from("content_entries").update({ sort_order: sortOrder }).eq("entity_type", type).eq("key", key));
  }

  private toRevision(r: Row): ContentRevision {
    return {
      id: r.id as string,
      type: r.entity_type as EntityType,
      key: r.entity_key as string,
      data: r.content_json,
      action: r.action as ContentRevision["action"],
      createdBy: (r.created_by as string) ?? null,
      createdAt: r.created_at as string,
    };
  }

  async listRevisions(type?: EntityType, key?: string, limit = 100) {
    let q = this.user().from("content_revisions").select("*").order("created_at", { ascending: false }).limit(limit);
    if (type) q = q.eq("entity_type", type);
    if (key) q = q.eq("entity_key", key);
    return (check(await q) as Row[]).map((r) => this.toRevision(r));
  }

  async getRevision(id: string) {
    const r = check(await this.user().from("content_revisions").select("*").eq("id", id).maybeSingle()) as Row | null;
    return r ? this.toRevision(r) : null;
  }

  /* ----------------------------- enquiries ----------------------------- */

  async createEnquiry(input: EnquiryInput, files: EnquiryFileInput[]) {
    const service = createServiceClient();
    const id = randomUUID();
    const reference = makeReference();
    check(
      await service.from("enquiries").insert({
        id,
        reference,
        service_slug: input.service,
        name: input.name,
        email: input.email,
        phone: input.phone,
        company: input.company,
        location: input.location,
        description: input.description,
        start_date: input.startDate || null,
        details_json: input.details,
      }),
    );
    for (const file of files) {
      const storagePath = `${id}/${randomUUID()}-${safeFileName(file.name)}`;
      check(
        await service.storage.from(privateBucket()).upload(storagePath, file.data, { contentType: file.type, upsert: false }),
      );
      check(
        await service.from("enquiry_files").insert({
          enquiry_id: id,
          storage_path: storagePath,
          file_name: safeFileName(file.name),
          size_bytes: file.size,
          content_type: file.type,
        }),
      );
    }
    return { id, reference };
  }

  private toEnquiry(r: Row): Enquiry {
    const files = (r.enquiry_files as Row[] | undefined) ?? [];
    const notes = (r.enquiry_notes as Row[] | undefined) ?? [];
    return {
      id: r.id as string,
      reference: r.reference as string,
      service: r.service_slug as string,
      name: r.name as string,
      company: r.company as string,
      email: r.email as string,
      phone: r.phone as string,
      location: r.location as string,
      description: r.description as string,
      startDate: (r.start_date as string) ?? "",
      details: (r.details_json as Record<string, unknown>) ?? {},
      status: r.status as EnquiryStatus,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
      files: files.map((f) => ({
        id: f.id as string,
        fileName: f.file_name as string,
        size: f.size_bytes as number,
        contentType: f.content_type as string,
      })),
      notes: notes
        .map((n) => ({ id: n.id as string, text: n.body as string, author: n.author as string, createdAt: n.created_at as string }))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    };
  }

  async listEnquiries(filter: EnquiryFilter) {
    let q = this.user()
      .from("enquiries")
      .select("*, enquiry_files(id, file_name, size_bytes, content_type), enquiry_notes(*)")
      .order("created_at", { ascending: false })
      .limit(500);
    if (filter.status) q = q.eq("status", filter.status);
    if (filter.service) q = q.eq("service_slug", filter.service);
    const term = filter.q?.trim().replace(/[%,()]/g, " ");
    if (term) {
      const like = `%${term}%`;
      q = q.or(
        ["reference", "name", "company", "email", "location", "description"].map((c) => `${c}.ilike.${like}`).join(","),
      );
    }
    return (check(await q) as Row[]).map((r) => this.toEnquiry(r));
  }

  async getEnquiry(id: string) {
    const r = check(
      await this.user()
        .from("enquiries")
        .select("*, enquiry_files(id, file_name, size_bytes, content_type), enquiry_notes(*)")
        .eq("id", id)
        .maybeSingle(),
    ) as Row | null;
    return r ? this.toEnquiry(r) : null;
  }

  async updateEnquiryStatus(id: string, status: EnquiryStatus) {
    check(await this.user().from("enquiries").update({ status, updated_at: new Date().toISOString() }).eq("id", id));
  }

  async addEnquiryNote(id: string, text: string, actor: Actor) {
    check(await this.user().from("enquiry_notes").insert({ enquiry_id: id, body: text, author: actor.email }));
  }

  async getEnquiryFile(fileId: string): Promise<StoredFile | null> {
    // RLS-scoped lookup first: only staff can see the row.
    const row = check(
      await this.user().from("enquiry_files").select("storage_path").eq("id", fileId).maybeSingle(),
    ) as Row | null;
    if (!row) return null;
    const signed = check(
      await createServiceClient().storage.from(privateBucket()).createSignedUrl(row.storage_path as string, 60),
    ) as { signedUrl: string };
    return { kind: "url", url: signed.signedUrl };
  }

  /* ------------------------------- media ------------------------------- */

  private toMedia(r: Row): MediaAsset {
    const { data } = createAnonClient().storage.from(mediaBucket()).getPublicUrl(r.storage_path as string);
    return {
      id: r.id as string,
      fileName: r.file_name as string,
      contentType: r.file_type as string,
      size: r.size_bytes as number,
      altText: r.alt_text as string,
      createdAt: r.created_at as string,
      url: data.publicUrl,
    };
  }

  async listMedia() {
    return (check(await this.user().from("media_assets").select("*").order("created_at", { ascending: false })) as Row[]).map(
      (r) => this.toMedia(r),
    );
  }

  async uploadMedia(file: EnquiryFileInput, altText: string) {
    const db = this.user();
    const storagePath = `${randomUUID()}-${safeFileName(file.name)}`;
    check(await db.storage.from(mediaBucket()).upload(storagePath, file.data, { contentType: file.type }));
    const row = check(
      await db
        .from("media_assets")
        .insert({ storage_path: storagePath, file_name: safeFileName(file.name), file_type: file.type, size_bytes: file.size, alt_text: altText })
        .select()
        .single(),
    ) as Row;
    return this.toMedia(row);
  }

  async replaceMedia(id: string, file: EnquiryFileInput) {
    const db = this.user();
    const storagePath = `${randomUUID()}-${safeFileName(file.name)}`;
    check(await db.storage.from(mediaBucket()).upload(storagePath, file.data, { contentType: file.type }));
    check(
      await db
        .from("media_assets")
        .update({ storage_path: storagePath, file_name: safeFileName(file.name), file_type: file.type, size_bytes: file.size })
        .eq("id", id),
    );
  }

  async updateMediaAlt(id: string, altText: string) {
    check(await this.user().from("media_assets").update({ alt_text: altText }).eq("id", id));
  }

  async deleteMedia(id: string) {
    const db = this.user();
    const row = check(await db.from("media_assets").select("storage_path").eq("id", id).maybeSingle()) as Row | null;
    if (!row) return;
    check(await db.storage.from(mediaBucket()).remove([row.storage_path as string]));
    check(await db.from("media_assets").delete().eq("id", id));
  }

  async getMediaFile(id: string): Promise<StoredFile | null> {
    const row = check(await createServiceClient().from("media_assets").select("storage_path").eq("id", id).maybeSingle()) as Row | null;
    if (!row) return null;
    return { kind: "url", url: createAnonClient().storage.from(mediaBucket()).getPublicUrl(row.storage_path as string).data.publicUrl };
  }

  /* ------------------------------- audit ------------------------------- */

  async audit(actor: Actor | null, action: string, entityType: string, entityId: string) {
    const client = actor ? this.user() : createServiceClient();
    await client.from("audit_logs").insert({ actor_email: actor?.email ?? null, action, entity_type: entityType, entity_id: entityId });
  }

  async listAudit(limit = 200) {
    const rows = check(
      await this.user().from("audit_logs").select("*").order("created_at", { ascending: false }).limit(limit),
    ) as Row[];
    return rows.map(
      (r): AuditLog => ({
        id: r.id as string,
        actor: (r.actor_email as string) ?? null,
        action: r.action as string,
        entityType: r.entity_type as string,
        entityId: r.entity_id as string,
        createdAt: r.created_at as string,
      }),
    );
  }
}
