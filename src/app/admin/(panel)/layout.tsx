import { AdminNav } from "@/components/admin/AdminNav";
import { requireUser } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("content.read");
  return (
    <div className="lg:flex">
      <AdminNav>
        <div className="border-t border-white/10 px-4 py-4 text-sm">
          <p className="truncate font-semibold text-white">{user.email}</p>
          <p className="text-white/60">{ROLE_LABELS[user.role]}</p>
          <form action={logoutAction} className="mt-3">
            <button type="submit" className="text-sm font-semibold text-flare hover:underline">
              Sign out
            </button>
          </form>
        </div>
      </AdminNav>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
