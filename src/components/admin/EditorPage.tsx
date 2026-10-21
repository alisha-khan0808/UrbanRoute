import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { EntityEditor } from "./EntityEditor";
import { PageHeader } from "./PageHeader";
import { RevisionList } from "./RevisionList";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { getEditable, listEditable } from "@/lib/admin/data";
import { fieldsFor, publicPathFor } from "@/lib/admin/fields";
import type { EntityType } from "@/lib/content/types";
import { getStore } from "@/lib/data/store";

/** Shared server wrapper: loads an entity, its revisions, and renders the editor. */
export async function EditorPage({
  type,
  entityKey,
  title,
  backHref,
  backLabel,
  description,
}: {
  type: EntityType;
  entityKey: string;
  title?: string;
  backHref?: string;
  backLabel?: string;
  description?: string;
}) {
  const user = await requireUser("content.read");
  const item = await getEditable(type, entityKey);
  if (!item) notFound();
  const services = await listEditable("service");
  const serviceOptions = services.map((s) => ({ value: s.key, label: s.data.title }));
  const store = await getStore();
  const revisions = await store.listRevisions(type, entityKey, 15);
  const editPermission = type === "scene" ? "scene.edit" : "content.edit";
  const data = item.data as unknown as Record<string, unknown>;
  const heading = title ?? String(data.title ?? data.name ?? entityKey);

  return (
    <>
      {backHref && (
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm font-semibold text-ink-muted hover:text-ink">
          <ChevronLeft className="h-4 w-4" /> {backLabel}
        </Link>
      )}
      <div className="mt-2">
        <PageHeader title={heading} description={description} />
      </div>
      <div className="grid gap-8 2xl:grid-cols-[1fr_340px]">
        <EntityEditor
          key={item.updatedAt ?? "default"}
          type={type}
          entityKey={entityKey}
          initial={data}
          status={item.status}
          fields={fieldsFor(type, { serviceOptions })}
          previewPath={type === "settings" || type === "scene" ? "/" : publicPathFor(type, entityKey)}
          canEdit={can(user.role, editPermission)}
          canPublish={can(user.role, "content.publish")}
        />
        <aside>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-ink-muted">Revision history</h2>
          <RevisionList revisions={revisions} canRestore={can(user.role, "content.restore")} />
        </aside>
      </div>
    </>
  );
}
