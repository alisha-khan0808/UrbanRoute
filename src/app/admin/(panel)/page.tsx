import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ActionButton } from "@/components/admin/controls";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { listEditable } from "@/lib/admin/data";
import { entityTypes } from "@/lib/content/types";
import { getStore } from "@/lib/data/store";
import { ENQUIRY_STATUSES } from "@/lib/enquiry/schema";
import { seedDefaultsAction } from "../actions";

const TYPE_PATH: Record<string, string> = { service: "services", page: "pages", region: "coverage", scene: "scenes", settings: "settings" };

export default async function DashboardPage() {
  const user = await requireUser("content.read");
  const store = await getStore();
  const enquiries = await store.listEnquiries({});
  const counts = Object.fromEntries(ENQUIRY_STATUSES.map((s) => [s, enquiries.filter((e) => e.status === s).length]));
  const drafts = (await Promise.all(entityTypes.map(async (t) => (await listEditable(t)).map((i) => ({ ...i, type: t })))))
    .flat()
    .filter((i) => i.status === "draft" || i.status === "changed");

  return (
    <>
      <PageHeader title="Dashboard" description={`Signed in as ${user.email}. Data store: ${store.mode === "local" ? "local file store (development)" : "Supabase"}.`}>
        {can(user.role, "audit.read") && <ActionButton action={seedDefaultsAction}>Seed built-in content</ActionButton>}
      </PageHeader>

      <section aria-labelledby="counts" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <h2 id="counts" className="sr-only">Enquiry counts</h2>
        {ENQUIRY_STATUSES.map((s) => (
          <Link key={s} href={`/admin/enquiries?status=${s}`} className="card p-4 transition hover:shadow-lift">
            <p className="text-3xl font-extrabold">{counts[s]}</p>
            <p className="mt-1 text-sm font-semibold capitalize text-ink-muted">{s}</p>
          </Link>
        ))}
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Recent enquiries</h2>
            <Link href="/admin/enquiries" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-dark">
              Inbox <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {enquiries.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">No enquiries yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {enquiries.slice(0, 6).map((e) => (
                <li key={e.id}>
                  <Link href={`/admin/enquiries/${e.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-flare-dark">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{e.name}{e.company ? ` · ${e.company}` : ""}</span>
                      <span className="block text-xs text-ink-muted">{e.reference} · {new Date(e.createdAt).toLocaleString("en-NZ")}</span>
                    </span>
                    <StatusBadge status={e.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <h2 className="text-lg font-extrabold">Drafts awaiting publish</h2>
          {drafts.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">Nothing waiting — all saved content is published.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {drafts.map((d) => (
                <li key={`${d.type}-${d.key}`}>
                  <Link href={`/admin/${TYPE_PATH[d.type]}${d.type === "scene" || d.type === "settings" ? "" : `/${d.key}`}`} className="flex items-center justify-between gap-3 py-3 hover:text-flare-dark">
                    <span>
                      <span className="text-xs font-bold uppercase text-ink-muted">{d.type}</span>
                      <span className="ml-2 font-semibold">{d.key}</span>
                    </span>
                    <StatusBadge status={d.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
