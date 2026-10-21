import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, FileText } from "lucide-react";
import { ActionForm, EnquiryStatusSelect } from "@/components/admin/controls";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { getServices } from "@/lib/cms";
import { getStore } from "@/lib/data/store";
import { QS_TYPE_LABELS } from "@/lib/enquiry/schema";
import { addEnquiryNoteAction, updateEnquiryStatusAction } from "../../../actions";

const DETAIL_LABELS: Record<string, string> = {
  rca: "Road controlling authority",
  workType: "Work type",
  proposedDates: "Proposed dates",
  roadLocation: "Road location",
  qsTypes: "QS type",
  eventDate: "Event date",
  venue: "Venue",
  attendance: "Approximate attendance",
  closures: "Closure requirements",
};

function formatDetail(key: string, value: unknown) {
  if (key === "qsTypes" && Array.isArray(value)) return value.map((v) => QS_TYPE_LABELS[v as keyof typeof QS_TYPE_LABELS] ?? v).join(", ");
  return String(value ?? "");
}

export default async function EnquiryPage({ params }: { params: { id: string } }) {
  const user = await requireUser("enquiry.read");
  const [store, services] = await Promise.all([getStore(), getServices()]);
  const e = await store.getEnquiry(params.id);
  if (!e) notFound();
  const canUpdate = can(user.role, "enquiry.update");
  const service = services.find((s) => s.slug === e.service)?.title ?? "General enquiry";
  const rows: [string, React.ReactNode][] = [
    ["Name", e.name],
    ["Company", e.company || "—"],
    [
      "Email",
      <a key="e" href={`mailto:${e.email}`} className="text-teal-dark underline">
        {e.email}
      </a>,
    ],
    [
      "Phone",
      <a key="p" href={`tel:${e.phone}`} className="text-teal-dark underline">
        {e.phone}
      </a>,
    ],
    ["Service", service],
    ["Location", e.location],
    ["Anticipated start", e.startDate || "—"],
    ["Received", new Date(e.createdAt).toLocaleString("en-NZ")],
  ];
  const details = Object.entries(e.details).filter(([, v]) => (Array.isArray(v) ? v.length : v));

  return (
    <>
      <Link href="/admin/enquiries" className="inline-flex items-center gap-1 text-sm font-semibold text-ink-muted hover:text-ink">
        <ChevronLeft className="h-4 w-4" /> Enquiries
      </Link>
      <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="font-mono text-sm text-ink-muted">{e.reference}</p>
          <h1 className="text-2xl font-extrabold md:text-3xl">{e.name}</h1>
        </div>
        <EnquiryStatusSelect value={e.status} action={updateEnquiryStatusAction.bind(null, e.id)} disabled={!canUpdate} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="grid gap-6 xl:col-span-2">
          <section className="card p-5">
            <h2 className="text-lg font-extrabold">Details</h2>
            <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {rows.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-bold uppercase tracking-wider text-ink-muted">{k}</dt>
                  <dd className="mt-0.5 break-words">{v}</dd>
                </div>
              ))}
              {details.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-bold uppercase tracking-wider text-ink-muted">{DETAIL_LABELS[k] ?? k}</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap break-words">{formatDetail(k, v)}</dd>
                </div>
              ))}
            </dl>
            <h3 className="mt-6 text-xs font-bold uppercase tracking-wider text-ink-muted">Project description</h3>
            <p className="mt-1 whitespace-pre-wrap break-words">{e.description}</p>
          </section>

          <section className="card p-5">
            <h2 className="text-lg font-extrabold">Attachments</h2>
            {e.files.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">No files attached.</p>
            ) : (
              <ul className="mt-3 grid gap-2">
                {e.files.map((f) => (
                  <li key={f.id}>
                    <a href={`/api/admin/files/${f.id}`} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2 hover:border-teal">
                      <FileText className="h-5 w-5 text-teal" />
                      <span className="min-w-0 flex-1 truncate font-semibold">{f.fileName}</span>
                      <span className="text-sm text-ink-muted">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-ink-muted">Files are stored privately and only downloadable by signed-in staff.</p>
          </section>
        </div>

        <section className="card h-fit p-5">
          <h2 className="text-lg font-extrabold">Notes</h2>
          {e.notes.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">No notes yet.</p>
          ) : (
            <ol className="mt-3 space-y-3">
              {e.notes.map((n) => (
                <li key={n.id} className="rounded-xl bg-paper p-3">
                  <p className="whitespace-pre-wrap text-sm">{n.text}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {n.author} · {new Date(n.createdAt).toLocaleString("en-NZ")}
                  </p>
                </li>
              ))}
            </ol>
          )}
          {canUpdate && (
            <ActionForm action={addEnquiryNoteAction.bind(null, e.id)} submitLabel="Add note" className="mt-4" resetOnSuccess>
              <label htmlFor="note" className="sr-only">
                New note
              </label>
              <textarea id="note" name="note" rows={3} className="field" placeholder="Add an internal note…" required maxLength={2000} />
            </ActionForm>
          )}
        </section>
      </div>
    </>
  );
}
