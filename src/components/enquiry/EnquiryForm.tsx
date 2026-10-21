"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FileText, Loader2, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ALLOWED_EXTENSIONS,
  enquiryKind,
  GENERAL_SERVICE,
  MAX_FILES,
  QS_TYPE_LABELS,
  QS_TYPES,
  validateFile,
} from "@/lib/enquiry/schema";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type Errors = Record<string, string>;

function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
  className,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label} {required ? <span className="text-flare-dark" aria-hidden>*</span> : <span className="font-normal text-ink-muted">(optional)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const describedBy = (id: string, errors: Errors, hint = false) =>
  errors[id] ? `${id}-error` : hint ? `${id}-hint` : undefined;

export function EnquiryForm({
  services,
  initialService,
  initialLocation,
}: {
  services: { slug: string; title: string }[];
  initialService?: string;
  initialLocation?: string;
}) {
  const [service, setService] = useState(
    initialService && services.some((s) => s.slug === initialService) ? initialService : "",
  );
  const [qsTypes, setQsTypes] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");
  const mountedAt = useRef(0);
  const started = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const kind = enquiryKind(service);

  useEffect(() => {
    mountedAt.current = performance.now();
  }, []);

  const onFirstInput = () => {
    if (!started.current) {
      started.current = true;
      track("form_start", { service: service || "unselected" });
    }
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...files];
    let error = "";
    for (const f of Array.from(list)) {
      const err = validateFile(f);
      if (err) error = err;
      else if (next.length < MAX_FILES) next.push(f);
      else error = `Attach up to ${MAX_FILES} files`;
    }
    setFiles(next);
    setErrors((e) => ({ ...e, files: error }));
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const val = (k: string) => String(data.get(k) ?? "");

    const details: Record<string, unknown> =
      kind === "tmp"
        ? { rca: val("rca"), workType: val("workType"), proposedDates: val("proposedDates"), roadLocation: val("roadLocation") }
        : kind === "qs"
          ? { qsTypes }
          : kind === "event"
            ? { eventDate: val("eventDate"), venue: val("venue"), attendance: val("attendance"), closures: val("closures") }
            : {};

    const body = new FormData();
    for (const k of ["name", "company", "email", "phone", "service", "location", "description", "startDate", "website"]) body.set(k, val(k));
    body.set("consent", data.get("consent") ? "true" : "false");
    body.set("details", JSON.stringify(details));
    body.set("fillMs", String(Math.round(performance.now() - mountedAt.current)));
    files.forEach((f) => body.append("files", f));

    setStatus("submitting");
    setErrors({});
    try {
      const res = await fetch("/api/enquiries", { method: "POST", body });
      const json = (await res.json()) as { ok: boolean; reference?: string; error?: string; fieldErrors?: Errors };
      if (json.ok) {
        setReference(json.reference ?? "");
        setStatus("done");
        track("form_submit", { service: val("service") });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setErrors(json.fieldErrors ?? {});
      setMessage(json.error ?? "Something went wrong.");
      setStatus("error");
      const first = Object.keys(json.fieldErrors ?? {})[0];
      if (first) {
        const id = first.startsWith("details.") ? first.slice(8) : first;
        (form.querySelector(`#${CSS.escape(id)}`) as HTMLElement | null)?.focus();
      }
    } catch {
      setMessage("We couldn't reach the server. Please check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="card p-8 text-center" role="status">
        <CheckCircle2 className="mx-auto h-12 w-12 text-teal" aria-hidden />
        <h2 className="mt-4 text-2xl font-extrabold">Thanks — we&apos;ve received your enquiry</h2>
        <p className="mt-2 text-ink-soft">Your reference number is</p>
        <p className="mt-2 inline-block rounded-xl bg-paper px-4 py-2 font-mono text-xl font-bold tracking-wider">{reference}</p>
        <p className="mt-4 text-sm text-ink-muted">Keep this for your records. We&apos;ll be in touch soon.</p>
        <Link href="/" className="mt-6 inline-block font-bold text-flare-dark hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  const err = (k: string) => errors[k] ?? errors[`details.${k}`];

  return (
    <form ref={formRef} onSubmit={onSubmit} onInput={onFirstInput} noValidate className="card space-y-6 p-5 sm:p-8">
      {status === "error" && message && (
        <div role="alert" className="rounded-xl border border-flare/40 bg-flare-light px-4 py-3 text-sm font-semibold text-flare-dark">
          {message}
        </div>
      )}

      {/* Honeypot — hidden from people and assistive tech */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 text-lg font-extrabold">Your details</legend>
        <Field id="name" label="Name" required error={err("name")}>
          <input id="name" name="name" autoComplete="name" required className="field" aria-invalid={!!err("name")} aria-describedby={describedBy("name", errors)} />
        </Field>
        <Field id="company" label="Company" error={err("company")}>
          <input id="company" name="company" autoComplete="organization" className="field" />
        </Field>
        <Field id="email" label="Email" required error={err("email")}>
          <input id="email" name="email" type="email" autoComplete="email" inputMode="email" required className="field" aria-invalid={!!err("email")} aria-describedby={describedBy("email", errors)} />
        </Field>
        <Field id="phone" label="Phone" required error={err("phone")}>
          <input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" required className="field" aria-invalid={!!err("phone")} aria-describedby={describedBy("phone", errors)} />
        </Field>
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 text-lg font-extrabold">Your project</legend>
        <Field id="service" label="Service" required error={err("service")} className="sm:col-span-2">
          <select
            id="service"
            name="service"
            required
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="field"
            aria-invalid={!!err("service")}
            aria-describedby={describedBy("service", errors)}
          >
            <option value="" disabled>
              Select a service…
            </option>
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.title}
              </option>
            ))}
            <option value={GENERAL_SERVICE}>Not sure / general enquiry</option>
          </select>
        </Field>
        <Field id="location" label="Project location" required error={err("location")} hint="Suburb, town or address">
          <input
            id="location"
            name="location"
            defaultValue={initialLocation}
            required
            className="field"
            aria-invalid={!!err("location")}
            aria-describedby={describedBy("location", errors, true)}
          />
        </Field>
        <Field id="startDate" label="Anticipated start date" error={err("startDate")}>
          <input id="startDate" name="startDate" type="date" className="field" />
        </Field>
        <Field id="description" label="Project description" required error={err("description")} className="sm:col-span-2">
          <textarea
            id="description"
            name="description"
            rows={5}
            required
            className="field"
            placeholder="Describe the works, programme and any constraints"
            aria-invalid={!!err("description")}
            aria-describedby={describedBy("description", errors)}
          />
        </Field>
      </fieldset>

      {kind === "tmp" && (
        <fieldset className="grid gap-5 rounded-2xl bg-paper p-5 sm:grid-cols-2">
          <legend className="sr-only">Traffic management details</legend>
          <p className="text-sm font-bold uppercase tracking-widest text-teal-dark sm:col-span-2">Traffic management details</p>
          <Field id="rca" label="Road controlling authority (RCA)" error={err("rca")}>
            <input id="rca" name="rca" className="field" placeholder="e.g. Auckland Transport" />
          </Field>
          <Field id="workType" label="Work type" error={err("workType")}>
            <input id="workType" name="workType" className="field" placeholder="e.g. trenching, footpath, lane closure" />
          </Field>
          <Field id="proposedDates" label="Proposed dates" error={err("proposedDates")}>
            <input id="proposedDates" name="proposedDates" className="field" placeholder="e.g. 3–14 March, nights" />
          </Field>
          <Field id="roadLocation" label="Road location" error={err("roadLocation")}>
            <input id="roadLocation" name="roadLocation" className="field" placeholder="Road name and extent" />
          </Field>
        </fieldset>
      )}

      {kind === "qs" && (
        <fieldset className="rounded-2xl bg-paper p-5" aria-describedby={err("qsTypes") ? "qsTypes-error" : undefined}>
          <legend className="sr-only">Quantity surveying type</legend>
          <p className="text-sm font-bold uppercase tracking-widest text-teal-dark">QS type (select at least one)</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {QS_TYPES.map((t) => (
              <label key={t} className={cn("flex cursor-pointer items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-semibold", qsTypes.includes(t) ? "border-flare" : "border-line")}>
                <input
                  type="checkbox"
                  id={t === "drainage" ? "qsTypes" : undefined}
                  checked={qsTypes.includes(t)}
                  onChange={(e) => setQsTypes((v) => (e.target.checked ? [...v, t] : v.filter((x) => x !== t)))}
                  className="h-4 w-4 accent-flare"
                />
                {QS_TYPE_LABELS[t]}
              </label>
            ))}
          </div>
          {err("qsTypes") && (
            <p id="qsTypes-error" className="field-error" role="alert">
              {err("qsTypes")}
            </p>
          )}
          <p className="mt-3 text-sm text-ink-muted">Attach your drawings below.</p>
        </fieldset>
      )}

      {kind === "event" && (
        <fieldset className="grid gap-5 rounded-2xl bg-paper p-5 sm:grid-cols-2">
          <legend className="sr-only">Event details</legend>
          <p className="text-sm font-bold uppercase tracking-widest text-teal-dark sm:col-span-2">Event details</p>
          <Field id="eventDate" label="Event date" error={err("eventDate")}>
            <input id="eventDate" name="eventDate" type="date" className="field" />
          </Field>
          <Field id="venue" label="Venue" error={err("venue")}>
            <input id="venue" name="venue" className="field" />
          </Field>
          <Field id="attendance" label="Approximate attendance" error={err("attendance")}>
            <input id="attendance" name="attendance" inputMode="numeric" className="field" />
          </Field>
          <Field id="closures" label="Closure requirements" error={err("closures")} className="sm:col-span-2">
            <textarea id="closures" name="closures" rows={3} className="field" placeholder="Roads, times, detours" />
          </Field>
        </fieldset>
      )}

      <div>
        <p className="field-label">
          Attachments <span className="font-normal text-ink-muted">(optional)</span>
        </p>
        <label
          htmlFor="files"
          className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-line bg-paper px-4 py-6 text-center transition hover:border-teal"
        >
          <Paperclip className="h-6 w-6 text-teal" aria-hidden />
          <span className="font-semibold">Add drawings, plans or photos</span>
          <span className="text-sm text-ink-muted">PDF, JPG, PNG or WEBP · up to {MAX_FILES} files · 10 MB each</span>
        </label>
        <input
          id="files"
          type="file"
          multiple
          accept={ALLOWED_EXTENSIONS.join(",")}
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
          aria-describedby={err("files") ? "files-error" : undefined}
        />
        {files.length > 0 && (
          <ul className="mt-3 space-y-2">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-3 py-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                  <span className="truncate">{f.name}</span>
                  <span className="shrink-0 text-ink-muted">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                </span>
                <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`} className="rounded-full p-1 hover:bg-ink/5">
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {err("files") && (
          <p id="files-error" className="field-error" role="alert">
            {err("files")}
          </p>
        )}
      </div>

      <div>
        <label className="flex items-start gap-3 text-[15px]">
          <input id="consent" name="consent" type="checkbox" required className="mt-1 h-5 w-5 shrink-0 accent-flare" aria-invalid={!!err("consent")} aria-describedby={describedBy("consent", errors)} />
          <span>
            I agree to Urban Route NZ using these details to respond to my enquiry, as described in the{" "}
            <Link href="/privacy" className="font-semibold text-flare-dark underline" target="_blank">
              privacy notice
            </Link>
            . <span className="text-flare-dark" aria-hidden>*</span>
          </span>
        </label>
        {err("consent") && (
          <p id="consent-error" className="field-error" role="alert">
            {err("consent")}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={status === "submitting"}>
        {status === "submitting" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {status === "submitting" ? "Sending…" : "Send enquiry"}
      </Button>
    </form>
  );
}
