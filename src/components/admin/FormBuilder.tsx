"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { FieldDesc } from "@/lib/admin/fields";
import { cn } from "@/lib/utils";

type Obj = Record<string, unknown>;

function IconBtn({ label, onClick, children, disabled }: { label: string; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-ink-muted hover:text-ink disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function move<T>(list: T[], i: number, d: number): T[] {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/**
 * Renders an editable form from field descriptors. Values are kept as plain
 * JSON and validated on the server with the same zod schemas used to store them.
 */
export function FormBuilder({
  fields,
  value,
  onChange,
  issues = {},
  path = "",
  readOnly = false,
}: {
  fields: FieldDesc[];
  value: Obj;
  onChange: (v: Obj) => void;
  issues?: Record<string, string>;
  path?: string;
  readOnly?: boolean;
}) {
  const set = (name: string, v: unknown) => onChange({ ...value, [name]: v });

  return (
    <div className="grid gap-5">
      {fields.map((f) => {
        const id = `f-${path}${f.name}`.replace(/[^a-zA-Z0-9_-]/g, "-");
        const p = `${path}${f.name}`;
        const issue = issues[p];
        const v = value[f.name];
        const disabled = readOnly || ("readOnly" in f && f.readOnly);
        const label = (
          <label htmlFor={id} className="field-label">
            {f.label}
          </label>
        );
        const help = f.help ? <p className="mt-1 text-xs text-ink-muted">{f.help}</p> : null;
        const err = issue ? (
          <p className="field-error" role="alert">
            {issue}
          </p>
        ) : null;

        switch (f.kind) {
          case "text":
          case "url":
            return (
              <div key={f.name}>
                {label}
                <input
                  id={id}
                  type={f.kind === "url" ? "url" : "text"}
                  className="field"
                  value={String(v ?? "")}
                  disabled={disabled}
                  aria-invalid={!!issue}
                  onChange={(e) => set(f.name, e.target.value)}
                />
                {help}
                {err}
              </div>
            );
          case "textarea":
            return (
              <div key={f.name}>
                {label}
                <textarea id={id} rows={f.rows ?? 3} className="field" value={String(v ?? "")} disabled={disabled} aria-invalid={!!issue} onChange={(e) => set(f.name, e.target.value)} />
                {help}
                {err}
              </div>
            );
          case "number":
            return (
              <div key={f.name}>
                {label}
                <input
                  id={id}
                  type="number"
                  step={f.step ?? 1}
                  className="field"
                  value={typeof v === "number" ? v : ""}
                  disabled={disabled}
                  aria-invalid={!!issue}
                  onChange={(e) => set(f.name, e.target.value === "" ? 0 : Number(e.target.value))}
                />
                {help}
                {err}
              </div>
            );
          case "checkbox":
            return (
              <div key={f.name}>
                <label className="flex items-center gap-3 font-semibold">
                  <input id={id} type="checkbox" className="h-5 w-5 accent-flare" checked={Boolean(v)} disabled={disabled} onChange={(e) => set(f.name, e.target.checked)} />
                  {f.label}
                </label>
                {help}
                {err}
              </div>
            );
          case "select":
            return (
              <div key={f.name}>
                {label}
                <select id={id} className="field" value={String(v ?? "")} disabled={disabled} aria-invalid={!!issue} onChange={(e) => set(f.name, e.target.value)}>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {help}
                {err}
              </div>
            );
          case "multiSelect": {
            const selected = Array.isArray(v) ? (v as string[]) : [];
            return (
              <fieldset key={f.name}>
                <legend className="field-label">{f.label}</legend>
                <div className="flex flex-wrap gap-2">
                  {f.options.map((o) => {
                    const on = selected.includes(o.value);
                    return (
                      <label key={o.value} className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm", on ? "border-flare bg-flare-light" : "border-line bg-white")}>
                        <input
                          type="checkbox"
                          className="accent-flare"
                          checked={on}
                          disabled={disabled || (!on && f.max !== undefined && selected.length >= f.max)}
                          onChange={(e) => set(f.name, e.target.checked ? [...selected, o.value] : selected.filter((x) => x !== o.value))}
                        />
                        {o.label}
                      </label>
                    );
                  })}
                </div>
                {help}
                {err}
              </fieldset>
            );
          }
          case "stringList": {
            const list = Array.isArray(v) ? (v as string[]) : [];
            return (
              <fieldset key={f.name}>
                <legend className="field-label">{f.label}</legend>
                <ul className="grid gap-2">
                  {list.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <input
                        aria-label={`${f.itemLabel ?? "Item"} ${i + 1}`}
                        className="field"
                        value={item}
                        disabled={disabled}
                        aria-invalid={!!issues[`${p}.${i}`]}
                        onChange={(e) => set(f.name, list.map((x, j) => (j === i ? e.target.value : x)))}
                      />
                      {!disabled && (
                        <>
                          <IconBtn label="Move up" onClick={() => set(f.name, move(list, i, -1))} disabled={i === 0}>
                            <ArrowUp className="h-4 w-4" />
                          </IconBtn>
                          <IconBtn label="Move down" onClick={() => set(f.name, move(list, i, 1))} disabled={i === list.length - 1}>
                            <ArrowDown className="h-4 w-4" />
                          </IconBtn>
                          <IconBtn label="Remove" onClick={() => set(f.name, list.filter((_, j) => j !== i))}>
                            <Trash2 className="h-4 w-4" />
                          </IconBtn>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
                {!disabled && (
                  <button type="button" onClick={() => set(f.name, [...list, ""])} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-dark">
                    <Plus className="h-4 w-4" /> Add {f.itemLabel?.toLowerCase() ?? "item"}
                  </button>
                )}
                {help}
                {err}
              </fieldset>
            );
          }
          case "objectList": {
            const list = Array.isArray(v) ? (v as Obj[]) : [];
            return (
              <fieldset key={f.name} className="rounded-2xl border border-line bg-paper/60 p-4">
                <legend className="px-1 text-sm font-bold">{f.label}</legend>
                {help}
                <ol className="mt-2 grid gap-3">
                  {list.map((item, i) => (
                    <li key={i} className="rounded-xl border border-line bg-white p-4">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-ink-muted">
                          {f.itemLabel ?? "Item"} {i + 1}
                          {typeof item.title === "string" && item.title ? ` — ${item.title}` : typeof item.heading === "string" && item.heading ? ` — ${item.heading}` : ""}
                        </span>
                        {!disabled && !f.fixed && (
                          <span className="flex gap-1.5">
                            <IconBtn label="Move up" onClick={() => set(f.name, move(list, i, -1))} disabled={i === 0}>
                              <ArrowUp className="h-4 w-4" />
                            </IconBtn>
                            <IconBtn label="Move down" onClick={() => set(f.name, move(list, i, 1))} disabled={i === list.length - 1}>
                              <ArrowDown className="h-4 w-4" />
                            </IconBtn>
                            <IconBtn label="Remove" onClick={() => set(f.name, list.filter((_, j) => j !== i))}>
                              <Trash2 className="h-4 w-4" />
                            </IconBtn>
                          </span>
                        )}
                      </div>
                      <FormBuilder
                        fields={f.fields}
                        value={item}
                        readOnly={readOnly}
                        issues={issues}
                        path={`${p}.${i}.`}
                        onChange={(nv) => set(f.name, list.map((x, j) => (j === i ? nv : x)))}
                      />
                    </li>
                  ))}
                </ol>
                {!disabled && !f.fixed && (
                  <button
                    type="button"
                    onClick={() => set(f.name, [...list, structuredClone(f.newItem)])}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-dark"
                  >
                    <Plus className="h-4 w-4" /> Add {f.itemLabel?.toLowerCase() ?? "item"}
                  </button>
                )}
                {err}
              </fieldset>
            );
          }
          case "group":
            return (
              <fieldset key={f.name} className="rounded-2xl border border-line bg-paper/60 p-4">
                <legend className="px-1 text-sm font-bold">{f.label}</legend>
                {help}
                <div className="mt-3">
                  <FormBuilder fields={f.fields} value={(v as Obj) ?? {}} readOnly={readOnly} issues={issues} path={`${p}.`} onChange={(nv) => set(f.name, nv)} />
                </div>
              </fieldset>
            );
        }
      })}
    </div>
  );
}
