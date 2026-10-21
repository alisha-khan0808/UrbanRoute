import { PageHeader } from "@/components/admin/PageHeader";
import { RevisionList } from "@/components/admin/RevisionList";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { getStore } from "@/lib/data/store";

export default async function HistoryPage() {
  const user = await requireUser("content.read");
  const store = await getStore();
  const revisions = await store.listRevisions(undefined, undefined, 60);
  const canAudit = can(user.role, "audit.read");
  const audit = canAudit ? await store.listAudit(150) : [];

  return (
    <>
      <PageHeader title="History" description="Content revisions (restore any version as a new draft) and the audit log of admin actions." />
      <div className="grid gap-8 xl:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-ink-muted">Content revisions</h2>
          <RevisionList revisions={revisions} canRestore={can(user.role, "content.restore")} showEntity />
        </section>
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-ink-muted">Audit log</h2>
          {!canAudit ? (
            <p className="card p-4 text-sm text-ink-muted">The audit log is visible to Super Admins only.</p>
          ) : audit.length === 0 ? (
            <p className="card p-4 text-sm text-ink-muted">No activity recorded yet.</p>
          ) : (
            <ol className="card divide-y divide-line text-sm">
              {audit.map((a) => (
                <li key={a.id} className="flex flex-wrap justify-between gap-2 p-3">
                  <span>
                    <span className="font-semibold">{a.action}</span>
                    <span className="ml-1 text-ink-muted">
                      {a.entityType}/{a.entityId}
                    </span>
                  </span>
                  <span className="text-xs text-ink-muted">
                    {a.actor ?? "public"} · {new Date(a.createdAt).toLocaleString("en-NZ")}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}
