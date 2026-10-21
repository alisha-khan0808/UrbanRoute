import { z } from "zod";

export const ENQUIRY_STATUSES = ["new", "contacted", "quoting", "won", "lost", "closed"] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const QS_TYPES = ["drainage", "roofing", "tanking"] as const;
export const QS_TYPE_LABELS: Record<(typeof QS_TYPES)[number], string> = {
  drainage: "Drainage",
  roofing: "Roofing",
  tanking: "Tanking & Waterproofing",
};

export const TMP_SERVICES = ["traffic-management-plans", "site-specific-tmps"];
export const QS_SERVICES = ["quantity-surveying"];
export const EVENT_SERVICES = ["event-traffic-management"];
export const GENERAL_SERVICE = "general";

export type EnquiryKind = "tmp" | "qs" | "event" | "standard";
export function enquiryKind(service: string): EnquiryKind {
  if (TMP_SERVICES.includes(service)) return "tmp";
  if (QS_SERVICES.includes(service)) return "qs";
  if (EVENT_SERVICES.includes(service)) return "event";
  return "standard";
}

/* File rules — enforced on the server; mirrored in the form for early feedback. */
export const MAX_FILES = 5;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};
export const ALLOWED_EXTENSIONS = Object.values(ALLOWED_FILE_TYPES).flat();

const trimmed = (max: number) => z.string().trim().max(max);
const optional = (max: number) => trimmed(max).optional().default("");
const isoDate = z
  .string()
  .trim()
  .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Use a valid date")
  .optional()
  .default("");

export const tmpDetailsSchema = z.object({
  rca: optional(120),
  workType: optional(120),
  proposedDates: optional(120),
  roadLocation: optional(200),
});

export const qsDetailsSchema = z.object({
  qsTypes: z.array(z.enum(QS_TYPES)).min(1, "Select at least one QS type"),
});

export const eventDetailsSchema = z.object({
  eventDate: isoDate,
  venue: optional(160),
  attendance: optional(40),
  closures: optional(600),
});

export const enquiryBaseSchema = z.object({
  name: trimmed(120).min(2, "Please enter your name"),
  company: optional(160),
  email: trimmed(200).email("Please enter a valid email address"),
  phone: trimmed(40)
    .min(6, "Please enter a phone number")
    .regex(/^[+()\d\s-]+$/, "Use digits, spaces, +, - or brackets only"),
  service: trimmed(80).min(1, "Please select a service"),
  location: trimmed(200).min(2, "Please enter the project location"),
  description: trimmed(5000).min(10, "Please describe the project (at least 10 characters)"),
  startDate: isoDate,
  consent: z.literal(true, { errorMap: () => ({ message: "Please accept the privacy notice" }) }),
});

export const enquirySchema = enquiryBaseSchema
  .extend({
    details: z.record(z.unknown()).optional().default({}),
  })
  .superRefine((value, ctx) => {
    const kind = enquiryKind(value.service);
    const schema =
      kind === "tmp" ? tmpDetailsSchema : kind === "qs" ? qsDetailsSchema : kind === "event" ? eventDetailsSchema : null;
    if (!schema) return;
    const parsed = schema.safeParse(value.details);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        ctx.addIssue({ ...issue, path: ["details", ...issue.path] });
      }
    }
  })
  .transform((value) => {
    const kind = enquiryKind(value.service);
    const schema =
      kind === "tmp" ? tmpDetailsSchema : kind === "qs" ? qsDetailsSchema : kind === "event" ? eventDetailsSchema : null;
    const details = schema ? schema.parse(value.details) : {};
    return { ...value, details: details as Record<string, unknown> };
  });

export type EnquiryInput = z.infer<typeof enquirySchema>;

export interface EnquiryFileInput {
  name: string;
  type: string;
  size: number;
  data: Buffer;
}

export function validateFile(file: { name: string; type: string; size: number }): string | null {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  const allowedExts = ALLOWED_FILE_TYPES[file.type];
  if (!allowedExts || !allowedExts.includes(ext)) return `${file.name}: only PDF, JPG, PNG or WEBP files are accepted`;
  if (file.size > MAX_FILE_BYTES) return `${file.name}: files must be 10 MB or smaller`;
  if (file.size === 0) return `${file.name}: file is empty`;
  return null;
}

/** Check magic bytes so a renamed executable cannot pass as a PDF/image. */
export function sniffMatches(type: string, data: Buffer): boolean {
  const startsWith = (...bytes: number[]) => bytes.every((b, i) => data[i] === b);
  switch (type) {
    case "application/pdf":
      return startsWith(0x25, 0x50, 0x44, 0x46); // %PDF
    case "image/png":
      return startsWith(0x89, 0x50, 0x4e, 0x47);
    case "image/jpeg":
      return startsWith(0xff, 0xd8, 0xff);
    case "image/webp":
      return data.subarray(0, 4).toString() === "RIFF" && data.subarray(8, 12).toString() === "WEBP";
    default:
      return false;
  }
}

/** Strip path components and unsafe characters from an uploaded file name. */
export function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  return base.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-120) || "file";
}

export interface Enquiry {
  id: string;
  reference: string;
  service: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  location: string;
  description: string;
  startDate: string;
  details: Record<string, unknown>;
  status: EnquiryStatus;
  createdAt: string;
  updatedAt: string;
  files: { id: string; fileName: string; size: number; contentType: string }[];
  notes: { id: string; text: string; author: string; createdAt: string }[];
}
