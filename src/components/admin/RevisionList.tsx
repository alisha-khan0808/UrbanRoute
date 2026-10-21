import { ActionButton } from "./controls";
import { restoreRevisionAction } from "@/app/admin/actions";
import type { ContentRevision } from "@/lib/content/types";

const ACTION_LABEL: Record<ContentRevision["action"], string> = {
  draft: "Draft saved",
  publish: "Published",
  restore: "Restored",
};

export function RevisionList({ revisions, canRestore, showEntity = false }: { revisions: ContentRevision[]; canRestore: boolean; showEntity?: boolean }) {
  if (revisions.length === 0) return <p className="card p-4 text-sm text-ink-muted">No revisions yet. Built-in content is shown until the first save.</p>;
  return (
    <ol className="card divide-y divide-line">
      {revisions.map((r) => (
        <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
          <div>
            <p className="font-semibold">
              {ACTION_LABEL[r.action]}
              {showEntity && (
                <span className="ml-1 font-normal text-ink-muted">
                  · {r.type}/{r.key}
                </span>
              )}
            </p>
            <p className="text-xs text-ink-muted">
              {new Date(r.createdAt).toLocaleString("en-NZ")}
              {r.createdBy ? ` · ${r.createdBy}` : ""}
            </p>
          </div>
          {canRestore && (
            <ActionButton action={restoreRevisionAction.bind(null, r.id)} confirm="Restore this version as a new draft?" variant="ghost">
              Restore
            </ActionButton>
          )}
        </li>
      ))}
    </ol>
  );
}
