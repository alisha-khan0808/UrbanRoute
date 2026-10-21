import { File as NodeFile } from "node:buffer";
import { describe, expect, it } from "vitest";

// Node 18 has no global File; node:buffer provides a compatible one.
const File = (globalThis.File ?? NodeFile) as typeof globalThis.File;
import { processEnquiry, MIN_FILL_MS } from "@/lib/enquiry/process";
import { enquirySchema, safeFileName, sniffMatches, validateFile } from "@/lib/enquiry/schema";

const SLUGS = ["traffic-management-plans", "quantity-surveying", "event-traffic-management"];

function form(overrides: Record<string, string> = {}, files: File[] = []) {
  const f = new FormData();
  const base: Record<string, string> = {
    name: "Test Person",
    company: "",
    email: "test@example.test",
    phone: "+64 21 000 000",
    service: "traffic-management-plans",
    location: "Hamilton",
    description: "Trenching along the road reserve for 200m.",
    startDate: "",
    consent: "true",
    details: "{}",
    fillMs: String(MIN_FILL_MS + 1000),
    website: "",
    ...overrides,
  };
  for (const [k, v] of Object.entries(base)) f.set(k, v);
  files.forEach((file) => f.append("files", file));
  return f;
}

const pdf = (name = "plan.pdf") => new File(["%PDF-1.4\n%%EOF"], name, { type: "application/pdf" });

describe("enquiry validation", () => {
  it("accepts a valid TMP enquiry", async () => {
    const r = await processEnquiry(form({ details: JSON.stringify({ rca: "Waikato DC" }) }), SLUGS);
    expect(r.kind).toBe("ok");
    if (r.kind === "ok") expect(r.input.details).toMatchObject({ rca: "Waikato DC" });
  });

  it("requires name, email, phone, location, description and consent", async () => {
    const r = await processEnquiry(form({ name: "", email: "nope", phone: "", location: "", description: "short", consent: "false" }), SLUGS);
    expect(r.kind).toBe("invalid");
    if (r.kind === "invalid") {
      expect(Object.keys(r.fieldErrors)).toEqual(expect.arrayContaining(["name", "email", "phone", "location", "description", "consent"]));
    }
  });

  it("rejects unknown services", async () => {
    const r = await processEnquiry(form({ service: "hacking" }), SLUGS);
    expect(r.kind).toBe("invalid");
  });

  it("allows the general enquiry option", async () => {
    expect((await processEnquiry(form({ service: "general" }), SLUGS)).kind).toBe("ok");
  });

  it("requires a QS type for quantity surveying", async () => {
    const bad = await processEnquiry(form({ service: "quantity-surveying" }), SLUGS);
    expect(bad.kind).toBe("invalid");
    if (bad.kind === "invalid") expect(bad.fieldErrors["details.qsTypes"]).toBeDefined();
    const good = await processEnquiry(form({ service: "quantity-surveying", details: JSON.stringify({ qsTypes: ["drainage"] }) }), SLUGS);
    expect(good.kind).toBe("ok");
  });

  it("strips unexpected detail keys", () => {
    const r = enquirySchema.parse({
      name: "Ab",
      email: "a@b.co",
      phone: "0210000000",
      service: "event-traffic-management",
      location: "Taupō",
      description: "A marathon event with road closures.",
      consent: true,
      details: { venue: "Lakefront", injected: "<script>" },
    });
    expect(r.details).not.toHaveProperty("injected");
    expect(r.details).toHaveProperty("venue", "Lakefront");
  });

  it("treats honeypot and too-fast submissions as spam", async () => {
    expect((await processEnquiry(form({ website: "http://spam" }), SLUGS)).kind).toBe("spam");
    expect((await processEnquiry(form({ fillMs: "200" }), SLUGS)).kind).toBe("spam");
  });

  it("accepts real PDFs and rejects disguised files", async () => {
    expect((await processEnquiry(form({}, [pdf()]), SLUGS)).kind).toBe("ok");
    const fake = new File(["MZ\x90\x00 executable"], "plan.pdf", { type: "application/pdf" });
    const r = await processEnquiry(form({}, [fake]), SLUGS);
    expect(r.kind).toBe("invalid");
  });

  it("limits file count, size and type", () => {
    expect(validateFile({ name: "a.exe", type: "application/x-msdownload", size: 10 })).toMatch(/only/);
    expect(validateFile({ name: "a.pdf", type: "application/pdf", size: 11 * 1024 * 1024 })).toMatch(/10 MB/);
    expect(validateFile({ name: "a.png", type: "application/pdf", size: 10 })).toMatch(/only/);
  });

  it("rejects more than five files", async () => {
    const r = await processEnquiry(form({}, Array.from({ length: 6 }, (_, i) => pdf(`p${i}.pdf`))), SLUGS);
    expect(r.kind).toBe("invalid");
  });

  it("sanitises file names and sniffs magic bytes", () => {
    expect(safeFileName("../../etc/pass wd.pdf")).toBe("pass_wd.pdf");
    expect(sniffMatches("image/png", Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0]))).toBe(true);
    expect(sniffMatches("image/png", Buffer.from("GIF89a"))).toBe(false);
  });
});
