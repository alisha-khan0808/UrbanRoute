"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser, signIn, signOut } from "@/lib/auth/session";
import { defaultsFor } from "@/lib/cms";
import { entitySchemas, entityTypes, type EntityType } from "@/lib/content/types";
import { getStore } from "@/lib/data/store";
import { ENQUIRY_STATUSES, sniffMatches, validateFile } from "@/lib/enquiry/schema";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";
import { headers } from "next/headers";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string; issues?: Record<string, string> };

const loginLimiter = createRateLimiter({ limit: 8, windowMs: 15 * 60 * 1000 });

/* ------------------------------------------------------------------ auth */

export async function loginAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const { ok } = loginLimiter.check(clientIp(headers()));
  if (!ok) return { ok: false, error: "Too many attempts. Try again in a few minutes." };
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { ok: false, error: "Enter your email and password" };
  const result = await signIn(email, password);
  if (!result.ok) return result;
  const store = await getStore();
  await store.audit({ id: email, email }, "auth.login", "user", email).catch(() => undefined);
  redirect("/admin");
}

export async function logoutAction() {
  await signOut();
  redirect("/admin/login");
}

/* --------------------------------------------------------------- content */

function assertType(type: string): asserts type is EntityType {
  if (!entityTypes.includes(type as EntityType)) throw new Error("Unknown content type");
}

const keyField: Record<EntityType, string | null> = { service: "slug", region: "id", page: "slug", scene: "key", settings: null };

function zodIssues(error: z.ZodError) {
  const issues: Record<string, string> = {};
  for (const i of error.issues) issues[i.path.join(".")] ??= i.message;
  return issues;
}

export async function saveDraftAction(type: string, key: string, data: unknown): Promise<ActionResult> {
  assertType(type);
  const user = await requireUser(type === "scene" ? "scene.edit" : "content.edit");
  const parsed = entitySchemas[type].safeParse(data);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields", issues: zodIssues(parsed.error) };
  const kf = keyField[type];
  if (kf && (parsed.data as Record<string, unknown>)[kf] !== key) return { ok: false, error: "The identifier cannot be changed" };
  if (type === "page") {
    const ids = (parsed.data as { sections: { id: string }[] }).sections.map((s) => s.id);
    if (new Set(ids).size !== ids.length) return { ok: false, error: "Section IDs must be unique" };
  }
  const store = await getStore();
  await store.saveDraft(type, key, parsed.data, user);
  await store.audit(user, "content.save_draft", type, key);
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Draft saved" };
}

export async function publishAction(type: string, key: string): Promise<ActionResult> {
  assertType(type);
  const user = await requireUser("content.publish");
  const store = await getStore();
  const entry = await store.getEntry(type, key);
  if (!entry) return { ok: false, error: "Save a draft before publishing" };
  const parsed = entitySchemas[type].safeParse(entry.draft);
  if (!parsed.success) return { ok: false, error: "The draft is invalid — please re-save it" };
  await store.publish(type, key, user);
  await store.audit(user, "content.publish", type, key);
  revalidatePath("/", "layout");
  return { ok: true, message: "Published" };
}

export async function restoreRevisionAction(id: string): Promise<ActionResult> {
  const user = await requireUser("content.restore");
  const store = await getStore();
  const rev = await store.getRevision(id);
  if (!rev) return { ok: false, error: "Revision not found" };
  const parsed = entitySchemas[rev.type].safeParse(rev.data);
  if (!parsed.success) return { ok: false, error: "This revision no longer matches the content schema" };
  await store.saveDraft(rev.type, rev.key, parsed.data, user, "restore");
  await store.audit(user, "content.restore", rev.type, rev.key);
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Restored as a draft — review and publish to make it live" };
}

export async function moveEntryAction(type: string, key: string, direction: -1 | 1): Promise<ActionResult> {
  assertType(type);
  const user = await requireUser("content.edit");
  const store = await getStore();
  const stored = await store.listEntries(type);
  const keys = defaultsFor(type).map((d) => d.key);
  for (const e of stored) if (!keys.includes(e.key)) keys.push(e.key);
  const order = keys.sort((a, b) => {
    const ea = stored.find((e) => e.key === a)?.sortOrder ?? keys.indexOf(a);
    const eb = stored.find((e) => e.key === b)?.sortOrder ?? keys.indexOf(b);
    return ea - eb;
  });
  const i = order.indexOf(key);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= order.length) return { ok: true };
  [order[i], order[j]] = [order[j], order[i]];
  // Make sure every entry exists before re-numbering.
  for (const k of order) {
    if (!stored.some((e) => e.key === k)) {
      const d = defaultsFor(type).find((x) => x.key === k);
      if (d) {
        await store.saveDraft(type, k, d.data, user);
        await store.publish(type, k, user);
      }
    }
  }
  for (const [idx, k] of order.entries()) await store.setSortOrder(type, k, idx);
  await store.audit(user, "content.reorder", type, key);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function createRegionAction(): Promise<void> {
  const user = await requireUser("content.edit");
  const store = await getStore();
  const id = `region-${Date.now().toString(36)}`;
  await store.saveDraft(
    "region",
    id,
    { id, name: "New region", island: "north", latitude: -38, longitude: 175.5, description: "", status: "hidden" },
    user,
  );
  await store.audit(user, "content.create", "region", id);
  redirect(`/admin/coverage/${id}`);
}

/** Copy built-in seed content into the store (published). Idempotent. */
export async function seedDefaultsAction(): Promise<ActionResult> {
  const user = await requireUser("audit.read"); // super admin only
  const store = await getStore();
  let created = 0;
  for (const type of entityTypes) {
    const stored = await store.listEntries(type);
    for (const d of defaultsFor(type)) {
      if (stored.some((e) => e.key === d.key)) continue;
      await store.saveDraft(type, d.key, d.data, user);
      await store.publish(type, d.key, user);
      created += 1;
    }
  }
  await store.audit(user, "content.seed", "all", String(created));
  revalidatePath("/", "layout");
  return { ok: true, message: created ? `Seeded ${created} items` : "Everything is already in the database" };
}

/* ------------------------------------------------------------- enquiries */

export async function updateEnquiryStatusAction(id: string, status: string): Promise<ActionResult> {
  const user = await requireUser("enquiry.update");
  const parsed = z.enum(ENQUIRY_STATUSES).safeParse(status);
  if (!parsed.success) return { ok: false, error: "Invalid status" };
  const store = await getStore();
  await store.updateEnquiryStatus(id, parsed.data);
  await store.audit(user, `enquiry.status.${parsed.data}`, "enquiry", id);
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Status updated" };
}

export async function addEnquiryNoteAction(id: string, _prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const user = await requireUser("enquiry.update");
  const text = String(form.get("note") ?? "").trim();
  if (!text) return { ok: false, error: "Write a note first" };
  if (text.length > 2000) return { ok: false, error: "Notes are limited to 2000 characters" };
  const store = await getStore();
  await store.addEnquiryNote(id, text, user);
  await store.audit(user, "enquiry.note", "enquiry", id);
  revalidatePath(`/admin/enquiries/${id}`);
  return { ok: true, message: "Note added" };
}

/* ----------------------------------------------------------------- media */

const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

async function readUpload(form: FormData) {
  const entry = form.get("file");
  // Duck-type rather than `instanceof File`: Node 18 has no global File.
  if (!entry || typeof entry === "string" || entry.size === 0) return { error: "Choose a file" } as const;
  const file = entry as Blob & { name: string };
  if (!MEDIA_TYPES.includes(file.type)) return { error: "Only JPG, PNG, WEBP or PDF files" } as const;
  const err = validateFile(file);
  if (err) return { error: err } as const;
  const data = Buffer.from(await file.arrayBuffer());
  if (!sniffMatches(file.type, data)) return { error: "File contents do not match its type" } as const;
  return { file: { name: file.name, type: file.type, size: file.size, data } } as const;
}

export async function uploadMediaAction(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const user = await requireUser("media.edit");
  const upload = await readUpload(form);
  if ("error" in upload) return { ok: false, error: upload.error ?? "Upload failed" };
  const alt = String(form.get("alt") ?? "").slice(0, 300);
  const store = await getStore();
  const asset = await store.uploadMedia(upload.file, alt);
  await store.audit(user, "media.upload", "media", asset.id);
  revalidatePath("/admin/media");
  return { ok: true, message: "Uploaded" };
}

export async function replaceMediaAction(id: string, _prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const user = await requireUser("media.edit");
  const upload = await readUpload(form);
  if ("error" in upload) return { ok: false, error: upload.error ?? "Upload failed" };
  const store = await getStore();
  await store.replaceMedia(id, upload.file);
  await store.audit(user, "media.replace", "media", id);
  revalidatePath("/admin/media");
  return { ok: true, message: "Replaced" };
}

export async function updateMediaAltAction(id: string, _prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const user = await requireUser("media.edit");
  const store = await getStore();
  await store.updateMediaAlt(id, String(form.get("alt") ?? "").slice(0, 300));
  await store.audit(user, "media.alt", "media", id);
  revalidatePath("/admin/media");
  return { ok: true, message: "Alt text saved" };
}

export async function deleteMediaAction(id: string): Promise<ActionResult> {
  const user = await requireUser("media.delete");
  const store = await getStore();
  await store.deleteMedia(id);
  await store.audit(user, "media.delete", "media", id);
  revalidatePath("/admin/media");
  return { ok: true, message: "Deleted" };
}
