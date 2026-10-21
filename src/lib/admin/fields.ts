import type { EntityType } from "@/lib/content/types";
import { sectionTypes } from "@/lib/content/types";
import { SCENE_KEYS } from "@/components/three/layout";

/** Declarative form descriptions used by the admin FormBuilder. */
export type FieldDesc =
  | { name: string; label: string; kind: "text" | "textarea" | "url"; help?: string; readOnly?: boolean; rows?: number }
  | { name: string; label: string; kind: "number"; help?: string; step?: number }
  | { name: string; label: string; kind: "checkbox"; help?: string }
  | { name: string; label: string; kind: "select"; options: { value: string; label: string }[]; help?: string }
  | { name: string; label: string; kind: "stringList"; help?: string; itemLabel?: string }
  | { name: string; label: string; kind: "multiSelect"; options: { value: string; label: string }[]; help?: string; max?: number }
  | { name: string; label: string; kind: "objectList"; fields: FieldDesc[]; help?: string; itemLabel?: string; newItem: Record<string, unknown>; fixed?: boolean }
  | { name: string; label: string; kind: "group"; fields: FieldDesc[]; help?: string };

const seoGroup: FieldDesc = {
  name: "seo",
  label: "SEO",
  kind: "group",
  help: "Search result title (≤70 chars), description (≤170 chars) and social preview image URL.",
  fields: [
    { name: "title", label: "SEO title", kind: "text" },
    { name: "description", label: "Meta description", kind: "textarea", rows: 3 },
    { name: "ogImage", label: "Social preview image URL", kind: "url", help: "Use a URL from the media library." },
  ],
};

export const SEO_GROUP = seoGroup;

const titledItem = (titleLabel = "Title", textLabel = "Text"): FieldDesc[] => [
  { name: "title", label: titleLabel, kind: "text" },
  { name: "text", label: textLabel, kind: "textarea", rows: 2 },
];

export function fieldsFor(type: EntityType, ctx: { serviceOptions?: { value: string; label: string }[] } = {}): FieldDesc[] {
  const serviceOptions = ctx.serviceOptions ?? [];
  switch (type) {
    case "service":
      return [
        { name: "slug", label: "URL slug", kind: "text", readOnly: true, help: "Fixed — changing URLs would break links." },
        { name: "number", label: "Number", kind: "text" },
        { name: "title", label: "Title", kind: "text" },
        { name: "shortTitle", label: "Short title (hotspot label)", kind: "text" },
        { name: "summary", label: "Summary", kind: "textarea", rows: 2 },
        { name: "description", label: "Description", kind: "textarea", rows: 4 },
        { name: "scope", label: "Scope", kind: "stringList", itemLabel: "Scope item" },
        { name: "deliverables", label: "Deliverables", kind: "stringList", itemLabel: "Deliverable" },
        { name: "steps", label: "Process steps", kind: "objectList", fields: titledItem("Step", "Description"), itemLabel: "Step", newItem: { title: "", text: "" } },
        { name: "specialisms", label: "Specialisms", kind: "objectList", fields: titledItem(), itemLabel: "Specialism", newItem: { title: "", text: "" } },
        {
          name: "faqs",
          label: "FAQs",
          kind: "objectList",
          fields: [
            { name: "q", label: "Question", kind: "text" },
            { name: "a", label: "Answer", kind: "textarea", rows: 3 },
          ],
          itemLabel: "FAQ",
          newItem: { q: "", a: "" },
        },
        { name: "related", label: "Related services", kind: "multiSelect", options: serviceOptions, max: 3, help: "Choose 2–3." },
        { name: "ctaLabel", label: "CTA label", kind: "text" },
        { name: "sceneKey", label: "3D scene", kind: "select", options: SCENE_KEYS.map((k) => ({ value: k, label: k })) },
        { name: "sceneCaption", label: "Scene caption / fallback alt text", kind: "text" },
        seoGroup,
      ];
    case "region":
      return [
        { name: "id", label: "ID", kind: "text", readOnly: true },
        { name: "name", label: "Name", kind: "text" },
        {
          name: "island",
          label: "Island",
          kind: "select",
          options: [
            { value: "north", label: "North Island" },
            { value: "south", label: "South Island" },
          ],
        },
        { name: "latitude", label: "Marker latitude", kind: "number", step: 0.01, help: "Representative position, e.g. -36.85" },
        { name: "longitude", label: "Marker longitude", kind: "number", step: 0.01, help: "e.g. 174.76" },
        { name: "description", label: "Description", kind: "textarea", rows: 4 },
        {
          name: "status",
          label: "Status",
          kind: "select",
          options: [
            { value: "experience", label: "Documented prior experience" },
            { value: "available", label: "Service available" },
            { value: "hidden", label: "Hidden" },
          ],
        },
      ];
    case "page":
      return [
        { name: "slug", label: "Page", kind: "text", readOnly: true },
        { name: "title", label: "Internal title", kind: "text" },
        seoGroup,
        {
          name: "sections",
          label: "Sections (in display order)",
          kind: "objectList",
          itemLabel: "Section",
          newItem: { id: "", type: "text", eyebrow: "", heading: "", body: "", items: [], ctaLabel: "", ctaHref: "" },
          fields: [
            { name: "id", label: "Section ID", kind: "text", help: "Unique within the page, e.g. intro" },
            { name: "type", label: "Layout", kind: "select", options: sectionTypes.map((t) => ({ value: t, label: t })) },
            { name: "eyebrow", label: "Eyebrow", kind: "text" },
            { name: "heading", label: "Heading", kind: "text" },
            { name: "body", label: "Body (blank line = new paragraph)", kind: "textarea", rows: 4 },
            { name: "items", label: "Items (features / stats)", kind: "objectList", fields: titledItem(), itemLabel: "Item", newItem: { title: "", text: "" } },
            { name: "ctaLabel", label: "Button label", kind: "text" },
            { name: "ctaHref", label: "Button link", kind: "text" },
          ],
        },
      ];
    case "scene":
      return [
        { name: "enabled", label: "3D homepage enabled", kind: "checkbox", help: "When off, visitors see the static explorer." },
        { name: "introAnimation", label: "Aerial intro animation", kind: "checkbox" },
        {
          name: "defaultQuality",
          label: "Default quality",
          kind: "select",
          options: ["auto", "low", "medium", "high"].map((v) => ({ value: v, label: v })),
        },
        { name: "modelUrl", label: "Prebuilt GLB model URL (optional)", kind: "url", help: "An approved, optimised glTF/GLB asset added to the world." },
        {
          name: "hotspots",
          label: "Hotspots",
          kind: "objectList",
          fixed: true,
          itemLabel: "Hotspot",
          newItem: {},
          fields: [
            { name: "id", label: "Scene", kind: "text", readOnly: true },
            { name: "label", label: "Label", kind: "text" },
            { name: "destination", label: "Destination service", kind: "select", options: serviceOptions },
            {
              name: "cameraPreset",
              label: "Camera preset",
              kind: "select",
              options: [
                { value: "close", label: "Close" },
                { value: "standard", label: "Standard" },
                { value: "wide", label: "Wide" },
                { value: "top", label: "Top-down" },
              ],
            },
            { name: "enabled", label: "Enabled", kind: "checkbox" },
          ],
        },
      ];
    case "settings":
      return [
        { name: "companyName", label: "Company name", kind: "text" },
        { name: "tagline", label: "Tagline", kind: "text" },
        { name: "email", label: "Contact email", kind: "text" },
        { name: "phone", label: "Contact phone", kind: "text" },
        { name: "serviceArea", label: "Service area", kind: "text" },
        { name: "placeholderNotice", label: "Show 'placeholder details' notice", kind: "checkbox" },
      ];
  }
}

/** Public URL of an entity, used for "Preview draft" links. */
export function publicPathFor(type: EntityType, key: string): string {
  switch (type) {
    case "service":
      return `/services/${key}`;
    case "page":
      return key === "home" ? "/" : `/${key}`;
    case "region":
      return "/coverage";
    default:
      return "/";
  }
}
