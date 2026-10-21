import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/data/store";
import { createUserClient } from "@/lib/supabase/server";
import { can, ROLES, type Permission, type Role, type SessionUser } from "./permissions";
import { safeEqual, signSession, verifySession } from "./token";

export const LOCAL_SESSION_COOKIE = "ur_admin_session";

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET ?? "";
  if (secret.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
  return secret;
}

export function localAdminAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_LOCAL_ADMIN === "true";
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  if (isSupabaseConfigured()) {
    const supabase = createUserClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    const role = profile?.role as Role | undefined;
    if (!role || !ROLES.includes(role)) return null;
    return { id: data.user.id, email: data.user.email ?? "", role };
  }
  if (!localAdminAllowed()) return null;
  return verifySession(cookies().get(LOCAL_SESSION_COOKIE)?.value, sessionSecret());
}

/** Server-side guard for admin pages, actions and route handlers. */
export async function requireUser(permission: Permission = "content.read"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (!can(user.role, permission)) throw new Error("Forbidden: your role does not allow this action");
  return user;
}

/** Same as requireUser but returns null instead of redirecting (for route handlers). */
export async function authorize(permission: Permission): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  return user && can(user.role, permission) ? user : null;
}

export async function signIn(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isSupabaseConfigured()) {
    const { error } = await createUserClient().auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: "Invalid email or password" };
    const user = await getCurrentUser();
    if (!user) {
      await createUserClient().auth.signOut();
      return { ok: false, error: "This account does not have admin access" };
    }
    return { ok: true };
  }

  if (!localAdminAllowed()) return { ok: false, error: "Local admin login is disabled in production" };
  const accounts: { email?: string; password?: string; role: Role }[] = [
    { email: process.env.LOCAL_ADMIN_EMAIL, password: process.env.LOCAL_ADMIN_PASSWORD, role: "super_admin" },
    { email: process.env.LOCAL_EDITOR_EMAIL, password: process.env.LOCAL_EDITOR_PASSWORD, role: "editor" },
  ];
  const match = accounts.find(
    (a) =>
      a.email &&
      a.password &&
      safeEqual(a.email.toLowerCase(), email.trim().toLowerCase()) &&
      safeEqual(a.password, password),
  );
  if (!match) return { ok: false, error: "Invalid email or password" };
  const token = signSession({ id: `local-${match.role}`, email: match.email!, role: match.role }, sessionSecret());
  cookies().set(LOCAL_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return { ok: true };
}

export async function signOut() {
  if (isSupabaseConfigured()) await createUserClient().auth.signOut();
  cookies().delete(LOCAL_SESSION_COOKIE);
}
