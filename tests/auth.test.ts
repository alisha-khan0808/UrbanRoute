import { describe, expect, it } from "vitest";
import { can } from "@/lib/auth/permissions";
import { signSession, verifySession } from "@/lib/auth/token";

const SECRET = "x".repeat(40);

describe("role permissions", () => {
  it("super admin can do everything", () => {
    for (const p of ["content.publish", "enquiry.export", "media.delete", "audit.read"] as const) expect(can("super_admin", p)).toBe(true);
  });

  it("editor can edit and publish but not export, delete media or read the audit log", () => {
    expect(can("editor", "content.edit")).toBe(true);
    expect(can("editor", "content.publish")).toBe(true);
    expect(can("editor", "enquiry.update")).toBe(true);
    expect(can("editor", "enquiry.export")).toBe(false);
    expect(can("editor", "media.delete")).toBe(false);
    expect(can("editor", "audit.read")).toBe(false);
  });

  it("reviewer is read-only", () => {
    expect(can("reviewer", "content.read")).toBe(true);
    expect(can("reviewer", "enquiry.read")).toBe(true);
    expect(can("reviewer", "content.edit")).toBe(false);
    expect(can("reviewer", "enquiry.update")).toBe(false);
  });

  it("anonymous users have no permissions", () => {
    expect(can(null, "content.read")).toBe(false);
  });
});

describe("local session tokens", () => {
  const user = { id: "1", email: "a@b.test", role: "editor" as const };

  it("round-trips a valid token", () => {
    expect(verifySession(signSession(user, SECRET), SECRET)).toEqual(user);
  });

  it("rejects tampered tokens", () => {
    const token = signSession(user, SECRET);
    const [payload, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ ...user, role: "super_admin", exp: 9e9 })).toString("base64url");
    expect(verifySession(`${forged}.${sig}`, SECRET)).toBeNull();
    expect(verifySession(`${payload}.AAAA`, SECRET)).toBeNull();
    expect(verifySession(token, "y".repeat(40))).toBeNull();
  });

  it("rejects expired tokens", () => {
    expect(verifySession(signSession(user, SECRET, -10), SECRET)).toBeNull();
  });
});
