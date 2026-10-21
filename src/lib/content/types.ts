import { z } from "zod";

/* ------------------------------------------------------------------------ */
/* CMS content schemas. Every editable entity is validated server-side with  */
/* these schemas before it is stored as a draft or published.                */
/* ------------------------------------------------------------------------ */

export const seoSchema = z.object({
  title: z.string().max(70).default(""),
  description: z.string().max(170).default(""),
  ogImage: z.string().max(500).default(""),
});
export type Seo = z.infer<typeof seoSchema>;

const titled = z.object({ title: z.string().min(1).max(120), text: z.string().max(600).default("") });

export const serviceSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  number: z.string().max(4),
  title: z.string().min(1).max(80),
  shortTitle: z.string().min(1).max(40),
  summary: z.string().min(1).max(300),
  description: z.string().min(1).max(2000),
  scope: z.array(z.string().min(1).max(300)).max(20),
  deliverables: z.array(z.string().min(1).max(300)).max(20),
  steps: z.array(titled).min(1).max(12),
  specialisms: z.array(titled).max(8).default([]),
  faqs: z.array(z.object({ q: z.string().min(1).max(200), a: z.string().min(1).max(1000) })).max(12).default([]),
  related: z.array(z.string()).max(3),
  ctaLabel: z.string().min(1).max(40),
  sceneKey: z.string().min(1),
  sceneCaption: z.string().max(200).default(""),
  seo: seoSchema,
});
export type Service = z.infer<typeof serviceSchema>;

export const regionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(60),
  island: z.enum(["north", "south"]),
  latitude: z.number().min(-48).max(-34),
  longitude: z.number().min(166).max(179),
  description: z.string().max(600).default(""),
  status: z.enum(["experience", "available", "hidden"]),
});
export type Region = z.infer<typeof regionSchema>;

export const sectionTypes = ["hero", "text", "features", "stats", "cta"] as const;
export const pageSectionSchema = z.object({
  id: z.string().min(1).max(40),
  type: z.enum(sectionTypes),
  eyebrow: z.string().max(80).default(""),
  heading: z.string().max(160).default(""),
  body: z.string().max(3000).default(""),
  items: z.array(titled).max(12).default([]),
  ctaLabel: z.string().max(40).default(""),
  ctaHref: z.string().max(200).default(""),
});
export type PageSection = z.infer<typeof pageSectionSchema>;

export const pageSchema = z.object({
  slug: z.string(),
  title: z.string().min(1).max(100),
  seo: seoSchema,
  sections: z.array(pageSectionSchema).max(20),
});
export type Page = z.infer<typeof pageSchema>;

export const cameraPresetSchema = z.enum(["close", "standard", "wide", "top"]);
export type CameraPreset = z.infer<typeof cameraPresetSchema>;

export const sceneSchema = z.object({
  key: z.string(),
  enabled: z.boolean(),
  modelUrl: z.string().max(500).default(""),
  defaultQuality: z.enum(["auto", "low", "medium", "high"]),
  introAnimation: z.boolean(),
  hotspots: z
    .array(
      z.object({
        id: z.string(),
        label: z.string().min(1).max(40),
        destination: z.string().min(1).max(80),
        cameraPreset: cameraPresetSchema,
        enabled: z.boolean(),
      }),
    )
    .max(12),
});
export type SceneConfig = z.infer<typeof sceneSchema>;

export const settingsSchema = z.object({
  companyName: z.string().min(1).max(80),
  tagline: z.string().max(160),
  email: z.string().max(120),
  phone: z.string().max(40),
  serviceArea: z.string().max(160),
  placeholderNotice: z.boolean(),
});
export type SiteSettings = z.infer<typeof settingsSchema>;

export const entitySchemas = {
  service: serviceSchema,
  region: regionSchema,
  page: pageSchema,
  scene: sceneSchema,
  settings: settingsSchema,
} as const;

export type EntityType = keyof typeof entitySchemas;
export const entityTypes = Object.keys(entitySchemas) as EntityType[];

export type EntityData = {
  service: Service;
  region: Region;
  page: Page;
  scene: SceneConfig;
  settings: SiteSettings;
};

export type ContentStatus = "draft" | "published" | "changed";

export interface ContentEntry<T = unknown> {
  type: EntityType;
  key: string;
  draft: T;
  published: T | null;
  status: ContentStatus;
  sortOrder: number;
  updatedAt: string;
  updatedBy: string | null;
}

export interface ContentRevision {
  id: string;
  type: EntityType;
  key: string;
  data: unknown;
  action: "draft" | "publish" | "restore";
  createdBy: string | null;
  createdAt: string;
}
