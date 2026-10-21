export const ROLES = ["super_admin", "editor", "reviewer"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  editor: "Editor",
  reviewer: "Reviewer (read-only)",
};

export type Permission =
  | "content.read"
  | "content.edit"
  | "content.publish"
  | "content.restore"
  | "scene.edit"
  | "enquiry.read"
  | "enquiry.update"
  | "enquiry.export"
  | "media.edit"
  | "media.delete"
  | "audit.read";

const matrix: Record<Role, Permission[]> = {
  super_admin: [
    "content.read",
    "content.edit",
    "content.publish",
    "content.restore",
    "scene.edit",
    "enquiry.read",
    "enquiry.update",
    "enquiry.export",
    "media.edit",
    "media.delete",
    "audit.read",
  ],
  editor: ["content.read", "content.edit", "content.publish", "content.restore", "scene.edit", "enquiry.read", "enquiry.update", "media.edit"],
  reviewer: ["content.read", "enquiry.read"],
};

export function can(role: Role | null | undefined, permission: Permission): boolean {
  return !!role && matrix[role].includes(permission);
}

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
}
