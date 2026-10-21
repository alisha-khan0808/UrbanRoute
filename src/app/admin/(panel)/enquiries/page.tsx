import Link from "next/link";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { buttonClass } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { getServices } from "@/lib/cms";
import { getStore } from "@/lib/data/store";
import { ENQUIRY_STATUSES, type EnquiryStatus } from "@/lib/enquiry/schema";

export default async function EnquiriesPage({ searchParams }: { searchParams: { status?: string; service?: string; q?: string } }) {
  const user = await requireUser("enquiry.read");
  const status: EnquiryStatus | "" = ENQUIRY_STATUSES.includes(searchParams.status as EnquiryStatus) ? (searchParams.status as EnquiryStatus) : "";
  const filter = { status, service: searchParams.service ?? "", q: (searchParams.q ?? "").slice(0, 100) };
  const [store, services] = await Promise.all([getStore(), getServices()]);
  const enquiries = await store.listEnquiries(filter);
  const serviceTitle = (slug: string) => services.find((s) => s.slug === slug)?.shortTitle ?? "General";
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <>
      <PageHeader title="Enquiries" description="Search, filter and manage project enquiries.">
        {can(user.role, "enquiry.export") && (
          <a href={`/api/admin/enquiries/export${qs ? `?${qs}` : ""}`} className={buttonClass("secondary", "sm")}>
            <Download className="h-4 w-4" /> Export CSV
          </a>
        )}
      </PageHeader>

      <form className="card mb-5 grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto_auto]" role="search">
        <label className="sr-only" htmlFor="q">
          Search
        </label>
        <input id="q" name="q" defaultValue={filter.q} placeholder="Search name, company, email, reference…" className="field" />
        <label className="sr-only" htmlFor="status">
          Status
        </label>
        <select id="status" name="status" defaultValue={filter.status} className="field capitalize">
          <option value="">All statuses</option>
          {ENQUIRY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="service">
          Service
        </label>
        <select id="service" name="service" defaultValue={filter.service} className="field">
          <option value="">All services</option>
          {services.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.shortTitle}
            </option>
          ))}
          <option value="general">General</option>
        </select>
        <button type="submit" className={buttonClass("dark", "md")}>
          Filter
        </button>
      </form>

      {enquiries.length === 0 ? (
        <p className="card p-8 text-center text-ink-muted">No enquiries match these filters.</p>
      ) : (
        <>
          {/* Mobile: cards */}
          <ul className="grid gap-3 md:hidden">
            {enquiries.map((e) => (
              <li key={e.id}>
                <Link href={`/admin/enquiries/${e.id}`} className="card block p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-ink-muted">{e.reference}</span>
                    <StatusBadge status={e.status} />
                  </div>
                  <p className="mt-2 font-bold">{e.name}</p>
                  <p className="text-sm text-ink-muted">
                    {serviceTitle(e.service)} · {e.location}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          {/* Desktop: table */}
          <div className="card hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-paper text-xs uppercase tracking-wider text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Received</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Files</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {enquiries.map((e) => (
                  <tr key={e.id} className="hover:bg-paper/60">
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link href={`/admin/enquiries/${e.id}`} className="font-bold text-teal-dark hover:underline">
                        {e.reference}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{new Date(e.createdAt).toLocaleDateString("en-NZ")}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{e.name}</span>
                      {e.company && <span className="block text-xs text-ink-muted">{e.company}</span>}
                    </td>
                    <td className="px-4 py-3">{serviceTitle(e.service)}</td>
                    <td className="max-w-[16ch] truncate px-4 py-3">{e.location}</td>
                    <td className="px-4 py-3">{e.files.length || "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={e.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
