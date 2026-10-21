import type { Metadata } from "next";
import { Mail, Phone, MapPin } from "lucide-react";
import { CMSRenderer } from "@/components/cms/CMSRenderer";
import { EnquiryForm } from "@/components/enquiry/EnquiryForm";
import { getPage, getServices, getSettings } from "@/lib/cms";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("contact");
  return { title: page.seo.title, description: page.seo.description, alternates: { canonical: "/contact" } };
}

export default async function ContactPage() {
  const [page, services, settings] = await Promise.all([getPage("contact"), getServices(), getSettings()]);
  return (
    <>
      <CMSRenderer sections={page.sections} />
      <section className="container-x grid gap-8 py-10 md:py-14 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <EnquiryForm services={services.map((s) => ({ slug: s.slug, title: s.title }))} />
        </div>
        <aside className="space-y-4 lg:col-span-4">
          <div className="card p-6">
            <h2 className="text-lg font-extrabold">Contact details</h2>
            <ul className="mt-4 space-y-3 text-[15px]">
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-teal" aria-hidden />
                <a href={`mailto:${settings.email}`} className="hover:text-flare-dark">
                  {settings.email}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-teal" aria-hidden />
                <a href={`tel:${settings.phone.replace(/\s+/g, "")}`} className="hover:text-flare-dark">
                  {settings.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-teal" aria-hidden />
                {settings.serviceArea}
              </li>
            </ul>
            {settings.placeholderNotice && (
              <p className="mt-4 rounded-lg bg-paper px-3 py-2 text-xs text-ink-muted">Placeholder contact details — pending confirmation.</p>
            )}
          </div>
          <div className="card p-6">
            <h2 className="text-lg font-extrabold">What happens next</h2>
            <ol className="mt-4 space-y-3 text-[15px] text-ink-soft">
              {["We review your enquiry and any files.", "We contact you to confirm scope and timing.", "We send a proposal or quotation."].map((t, i) => (
                <li key={t} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-flare-light text-xs font-bold text-flare-dark">{i + 1}</span>
                  {t}
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </section>
    </>
  );
}
