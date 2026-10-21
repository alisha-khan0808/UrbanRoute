import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { LocalStore } from "@/lib/data/local-store";
import { defaultPages, defaultRegions, defaultScene, defaultServices, defaultSettings } from "@/lib/content/defaults";
import { entitySchemas } from "@/lib/content/types";
import { csvCell } from "@/lib/csv";
import { SCENE_KEYS } from "@/components/three/layout";

const dir = mkdtempSync(path.join(process.env.TMP || tmpdir(), "ur-test-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));
const actor = { id: "t", email: "tester@urbanroute.test" };

describe("seed content", () => {
  it("has seven valid services with unique slugs, 2–3 related services and a scene each", () => {
    expect(defaultServices).toHaveLength(7);
    expect(new Set(defaultServices.map((s) => s.slug)).size).toBe(7);
    for (const s of defaultServices) {
      expect(entitySchemas.service.safeParse(s).success).toBe(true);
      expect(s.related.length).toBeGreaterThanOrEqual(2);
      expect(s.related.length).toBeLessThanOrEqual(3);
      for (const r of s.related) expect(defaultServices.some((x) => x.slug === r)).toBe(true);
      expect(SCENE_KEYS).toContain(s.sceneKey);
      expect(s.steps.length).toBeGreaterThan(0);
    }
  });

  it("includes all twelve named coverage areas", () => {
    expect(defaultRegions.map((r) => r.name)).toEqual([
      "Auckland",
      "Hamilton / Waikato",
      "Waipā",
      "Matamata-Piako",
      "Waitomo",
      "Taupō",
      "Ruapehu",
      "Christchurch",
      "Buller",
      "West Coast",
      "Westland",
      "Invercargill",
    ]);
    for (const r of defaultRegions) expect(entitySchemas.region.safeParse(r).success).toBe(true);
  });

  it("pages, scene and settings validate", () => {
    for (const p of defaultPages) expect(entitySchemas.page.safeParse(p).success).toBe(true);
    expect(entitySchemas.scene.safeParse(defaultScene).success).toBe(true);
    expect(entitySchemas.settings.safeParse(defaultSettings).success).toBe(true);
    expect(defaultScene.hotspots).toHaveLength(7);
  });
});

describe("draft → publish → restore workflow", () => {
  const store = new LocalStore(dir);
  const slug = "traffic-management-plans";
  const original = defaultServices[0];

  it("keeps drafts unpublished until publish", async () => {
    await store.saveDraft("service", slug, { ...original, summary: "Draft summary" }, actor);
    expect((await store.listPublished("service")).find((e) => e.key === slug)).toBeUndefined();
    const entry = await store.getEntry("service", slug);
    expect(entry?.status).toBe("draft");
  });

  it("publishes the draft", async () => {
    await store.publish("service", slug, actor);
    const published = (await store.listPublished("service")).find((e) => e.key === slug);
    expect((published?.published as typeof original).summary).toBe("Draft summary");
  });

  it("marks later edits as unpublished changes without touching the live version", async () => {
    await store.saveDraft("service", slug, { ...original, summary: "Second draft" }, actor);
    const entry = await store.getEntry("service", slug);
    expect(entry?.status).toBe("changed");
    expect((entry?.published as typeof original).summary).toBe("Draft summary");
  });

  it("records revisions that can be restored as a draft", async () => {
    const revisions = await store.listRevisions("service", slug);
    expect(revisions.map((r) => r.action)).toEqual(["draft", "publish", "draft"]);
    const first = revisions[revisions.length - 1];
    await store.saveDraft("service", slug, first.data, actor, "restore");
    const entry = await store.getEntry("service", slug);
    expect((entry?.draft as typeof original).summary).toBe("Draft summary");
    expect((await store.listRevisions("service", slug))[0].action).toBe("restore");
  });
});

describe("enquiry storage", () => {
  const store = new LocalStore(dir);

  it("stores enquiries with private files and supports status, notes and search", async () => {
    const { id, reference } = await store.createEnquiry(
      {
        name: "Jo Bloggs",
        company: "Civil Co",
        email: "jo@example.test",
        phone: "021000000",
        service: "quantity-surveying",
        location: "Invercargill",
        description: "Drainage take-off",
        startDate: "",
        consent: true,
        details: { qsTypes: ["drainage"] },
      },
      [{ name: "../evil name.pdf", type: "application/pdf", size: 9, data: Buffer.from("%PDF-1.4\n") }],
    );
    expect(reference).toMatch(/^UR-\d{4}-[A-Z0-9]{6}$/);
    const e = await store.getEnquiry(id);
    expect(e?.status).toBe("new");
    expect(e?.files[0].fileName).toBe("evil_name.pdf");
    const file = await store.getEnquiryFile(e!.files[0].id);
    expect(file?.kind === "buffer" && file.data.toString()).toBe("%PDF-1.4\n");

    await store.updateEnquiryStatus(id, "quoting");
    await store.addEnquiryNote(id, "Called back", actor);
    const updated = await store.getEnquiry(id);
    expect(updated?.status).toBe("quoting");
    expect(updated?.notes[0].text).toBe("Called back");

    expect(await store.listEnquiries({ q: "bloggs" })).toHaveLength(1);
    expect(await store.listEnquiries({ status: "won" })).toHaveLength(0);
  });
});

describe("CSV export", () => {
  it("escapes quotes/commas and neutralises formulas", () => {
    expect(csvCell('a "b", c')).toBe('"a ""b"", c"');
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("+64 21")).toBe("'+64 21");
  });
});
