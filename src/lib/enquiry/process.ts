import {
  enquirySchema,
  GENERAL_SERVICE,
  MAX_FILES,
  sniffMatches,
  validateFile,
  type EnquiryFileInput,
  type EnquiryInput,
} from "./schema";

/** Minimum time a human takes to fill in the form. Faster = likely a bot. */
export const MIN_FILL_MS = 3000;

export type ProcessResult =
  | { kind: "ok"; input: EnquiryInput; files: EnquiryFileInput[] }
  | { kind: "invalid"; fieldErrors: Record<string, string> }
  | { kind: "spam" };

/**
 * Parse and validate a multipart enquiry submission. Pure apart from reading
 * File blobs, so it is unit-tested directly.
 */
export async function processEnquiry(form: FormData, serviceSlugs: string[]): Promise<ProcessResult> {
  // Spam protection: honeypot field + minimum fill time (measured client-side
  // as elapsed ms, so visitor/server clock differences do not matter).
  if (String(form.get("website") ?? "").trim() !== "") return { kind: "spam" };
  const fillMs = Number(form.get("fillMs") ?? 0);
  if (!Number.isFinite(fillMs) || fillMs < MIN_FILL_MS) return { kind: "spam" };

  let details: unknown = {};
  try {
    details = JSON.parse(String(form.get("details") ?? "{}"));
  } catch {
    details = {};
  }

  const raw = {
    name: form.get("name") ?? "",
    company: form.get("company") ?? "",
    email: form.get("email") ?? "",
    phone: form.get("phone") ?? "",
    service: form.get("service") ?? "",
    location: form.get("location") ?? "",
    description: form.get("description") ?? "",
    startDate: form.get("startDate") ?? "",
    consent: form.get("consent") === "true" || form.get("consent") === "on",
    details,
  };

  const fieldErrors: Record<string, string> = {};
  const parsed = enquirySchema.safeParse(raw);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      fieldErrors[key] ??= issue.message;
    }
  } else if (![...serviceSlugs, GENERAL_SERVICE].includes(parsed.data.service)) {
    fieldErrors.service = "Please select a service";
  }

  const uploads = form.getAll("files").filter((f): f is File => typeof f === "object" && f !== null && "arrayBuffer" in f && f.size > 0);
  const files: EnquiryFileInput[] = [];
  if (uploads.length > MAX_FILES) fieldErrors.files = `Attach up to ${MAX_FILES} files`;
  else {
    for (const file of uploads) {
      const error = validateFile(file);
      if (error) {
        fieldErrors.files = error;
        break;
      }
      const data = Buffer.from(await file.arrayBuffer());
      if (!sniffMatches(file.type, data)) {
        fieldErrors.files = `${file.name}: file contents do not match its type`;
        break;
      }
      files.push({ name: file.name, type: file.type, size: file.size, data });
    }
  }

  if (Object.keys(fieldErrors).length > 0 || !parsed.success) return { kind: "invalid", fieldErrors };
  return { kind: "ok", input: parsed.data, files };
}
