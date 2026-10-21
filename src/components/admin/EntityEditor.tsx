"use client";

import { useState, useTransition } from "react";
import { Eye, Loader2, Save, Send } from "lucide-react";
import { FormBuilder } from "./FormBuilder";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { publishAction, saveDraftAction, type ActionResult } from "@/app/admin/actions";
import type { FieldDesc } from "@/lib/admin/fields";
import type { ContentStatus, EntityType } from "@/lib/content/types";

/** Edit → save draft → preview → publish workflow for any CMS entity. */
export function EntityEditor({
  type,
  entityKey,
  initial,
  status,
  fields,
  previewPath,
  canEdit,
  canPublish,
}: {
  type: EntityType;
  entityKey: string;
  initial: Record<string, unknown>;
  status: ContentStatus | "default";
  fields: FieldDesc[];
  previewPath: string | null;
  canEdit: boolean;
  canPublish: boolean;
}) {
  const [value, setValue] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [state, setState] = useState(status);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<ActionResult>, after?: (r: ActionResult) => void) =>
    start(async () => {
      try {
        const r = await fn();
        setResult(r);
        after?.(r);
      } catch (e) {
        setResult({ ok: false, error: e instanceof Error && e.message.startsWith("Forbidden") ? "Your role does not allow this action" : "Something went wrong" });
      }
    });

  const save = () =>
    run(
      () => saveDraftAction(type, entityKey, value),
      (r) => {
        if (r.ok) {
          setDirty(false);
          setState(state === "published" || state === "changed" || state === "default" ? "changed" : "draft");
        }
      },
    );

  const publish = () =>
    run(
      async () => {
        if (dirty || state === "default") {
          const r = await saveDraftAction(type, entityKey, value);
          if (!r.ok) return r;
        }
        return publishAction(type, entityKey);
      },
      (r) => {
        if (r.ok) {
          setDirty(false);
          setState("published");
        }
      },
    );

  const issues = result && !result.ok ? result.issues ?? {} : {};

  return (
    <div className="grid gap-6">
      <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-3">
          <StatusBadge status={state} />
          {dirty && <span className="text-sm font-semibold text-flare-dark">Unsaved changes</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Button variant="secondary" size="sm" onClick={save} disabled={pending || !dirty}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save draft
            </Button>
          )}
          {previewPath && (
            <a
              href={`/api/admin/preview?path=${encodeURIComponent(previewPath)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-white px-3.5 text-sm font-semibold"
              title={dirty ? "Save the draft first to preview your latest changes" : "Preview the saved draft"}
            >
              <Eye className="h-4 w-4" /> Preview draft
            </a>
          )}
          {canPublish && (
            <Button size="sm" onClick={publish} disabled={pending || (state === "published" && !dirty)}>
              <Send className="h-4 w-4" /> Publish
            </Button>
          )}
        </div>
      </div>

      {result && (
        <div
          role={result.ok ? "status" : "alert"}
          className={result.ok ? "rounded-xl bg-teal-light px-4 py-3 text-sm font-semibold text-teal-dark" : "rounded-xl bg-flare-light px-4 py-3 text-sm font-semibold text-flare-dark"}
        >
          {result.ok ? result.message : result.error}
          {!result.ok && result.issues && (
            <ul className="mt-1 list-disc pl-5 font-normal">
              {Object.entries(result.issues)
                .slice(0, 6)
                .map(([k, v]) => (
                  <li key={k}>
                    {k}: {v}
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}

      <div className="card p-5 sm:p-6">
        <FormBuilder
          fields={fields}
          value={value}
          issues={issues}
          readOnly={!canEdit}
          onChange={(v) => {
            setValue(v);
            setDirty(true);
          }}
        />
      </div>
    </div>
  );
}
