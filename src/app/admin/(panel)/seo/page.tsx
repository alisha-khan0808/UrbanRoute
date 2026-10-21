import { EntityEditor } from "@/components/admin/EntityEditor";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { listEditable } from "@/lib/admin/data";
import { publicPathFor, SEO_GROUP } from "@/lib/admin/fields";

export default async function SeoAdminPage() {
  const user = await requireUser("content.read");
  const [pages, services] = await Promise.all([listEditable("page"), listEditable("service")]);
  const items = [
    ...pages.map((p) => ({ type: "page" as const, key: p.key, label: p.data.title, seo: p.data.seo, data: p.data, status: p.status, updatedAt: p.updatedAt })),
    ...services.map((s) => ({ type: "service" as const, key: s.key, label: s.data.title, seo: s.data.seo, data: s.data, status: s.status, updatedAt: s.updatedAt })),
  ];
  return (
    <>
      <PageHeader title="SEO" description="Search titles, meta descriptions and social preview images for every page and service." />
      <ul className="grid gap-3">
        {items.map((i) => (
          <li key={`${i.type}-${i.key}`}>
            <details className="card group">
              <summary className="flex cursor-pointer list-none flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="min-w-0">
                  <span className="text-xs font-bold uppercase text-ink-muted">{i.type}</span>
                  <span className="ml-2 font-bold">{i.label}</span>
                  <span className="mt-1 block truncate text-sm text-ink-muted">{i.seo.title || "— no SEO title —"}</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className={`text-xs font-semibold ${i.seo.description.length > 160 ? "text-flare-dark" : "text-ink-muted"}`}>
                    {i.seo.description.length}/170
                  </span>
                  <StatusBadge status={i.status} />
                </span>
              </summary>
              <div className="border-t border-line px-4 pb-4">
                <EntityEditor
                  key={i.updatedAt ?? "default"}
                  type={i.type}
                  entityKey={i.key}
                  initial={i.data as unknown as Record<string, unknown>}
                  status={i.status}
                  fields={[SEO_GROUP]}
                  previewPath={publicPathFor(i.type, i.key)}
                  canEdit={can(user.role, "content.edit")}
                  canPublish={can(user.role, "content.publish")}
                />
              </div>
            </details>
          </li>
        ))}
      </ul>
    </>
  );
}
