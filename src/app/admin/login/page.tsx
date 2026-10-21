import { LoginForm } from "@/components/admin/LoginForm";
import { Logo } from "@/components/layout/Logo";
import { isSupabaseConfigured } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const local = !isSupabaseConfigured();
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Logo />
        <div className="card mt-6 p-6">
          <h1 className="text-xl font-extrabold">Admin sign in</h1>
          <p className="mt-1 text-sm text-ink-muted">Content, enquiries and settings.</p>
          <LoginForm />
          {local && (
            <p className="mt-4 rounded-lg bg-paper px-3 py-2 text-xs text-ink-muted">
              Local development mode: credentials come from <code>LOCAL_ADMIN_*</code> in <code>.env.local</code>. Configure
              Supabase for production.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
