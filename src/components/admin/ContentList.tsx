import Link from "next/link";
import { ArrowDown, ArrowUp, Pencil } from "lucide-react";
import { ActionButton } from "./controls";
import { StatusBadge } from "./StatusBadge";
import { moveEntryAction } from "@/app/admin/actions";
import type { EntityType } from "@/lib/content/types";

export interface ContentRow {
  key: string;
  title: string;
  subtitle?: string;
  status: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

/** List of CMS entries with status, edit link and optional ordering controls. */
export function ContentList({ rows, basePath, type, sortable = false }: { rows: ContentRow[]; basePath: string; type: EntityType; sortable?: boolean }) {
  return (
    <ul className="card divide-y divide-line">
      {rows.map((r, i) => (
        <li key={r.key} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Link href={`${basePath}/${r.key}`} className="font-bold hover:text-flare-dark">
              {r.title}
            </Link>
            <p className="text-sm text-ink-muted">
              {r.subtitle ?? r.key}
              {r.updatedAt && ` · updated ${new Date(r.updatedAt).toLocaleDateString("en-NZ")}${r.updatedBy ? ` by ${r.updatedBy}` : ""}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={r.status} />
            {sortable && (
              <>
                <ActionButton action={moveEntryAction.bind(null, type, r.key, -1)} variant="ghost" disabled={i === 0}>
                  <ArrowUp className="h-4 w-4" aria-hidden />
                  <span className="sr-only">Move {r.title} up</span>
                </ActionButton>
                <ActionButton action={moveEntryAction.bind(null, type, r.key, 1)} variant="ghost" disabled={i === rows.length - 1}>
                  <ArrowDown className="h-4 w-4" aria-hidden />
                  <span className="sr-only">Move {r.title} down</span>
                </ActionButton>
              </>
            )}
            <Link href={`${basePath}/${r.key}`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-sm font-semibold">
              <Pencil className="h-4 w-4" aria-hidden /> Edit
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
