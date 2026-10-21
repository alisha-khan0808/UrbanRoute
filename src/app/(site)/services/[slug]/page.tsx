import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ServiceScene } from "@/components/services/ServiceScene";
import { TrackView } from "@/components/services/TrackView";
import { defaultServices } from "@/lib/content/defaults";
import { getService, getServices, getSettings } from "@/lib/cms";
import { siteUrl } from "@/lib/utils";

export const revalidate = 60;

export function generateStaticParams() {
  return defaultServices.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const s = await getService(params.slug);
  if (!s) return {};
  const title = s.seo.title || `${s.title} | Urban Route NZ`;
  const description = s.seo.description || s.summary;
  return {
    title,
    description,
    alternates: { canonical: `/services/${s.slug}` },
    openGraph: { title, description, url: `/services/${s.slug}`, images: s.seo.ogImage ? [s.seo.ogImage] : undefined },
  };
}

export default async function ServicePage({ params }: { params: { slug: string } }) {
  const [service, services, settings] = await Promise.all([getService(params.slug), getServices(), getSettings()]);
  if (!service) notFound();
  const related = service.related.map((slug) => services.find((s) => s.slug === slug)).filter((s): s is NonNullable<typeof s> => Boolean(s));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.description,
    serviceType: service.title,
    areaServed: { "@type": "Country", name: "New Zealand" },
    provider: { "@type": "Organization", name: settings.companyName, url: siteUrl() },
    url: `${siteUrl()}/services/${service.slug}`,
  };

  return (
    <>
      <TrackView slug={service.slug} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* Hero */}
      <section className="border-b border-line bg-[radial-gradient(ellipse_at_top_left,rgba(255,101,66,.08),transparent_50%)]">
        <div className="container-x grid gap-10 py-10 md:py-16 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-ink-muted">
              <Link href="/services" className="hover:text-ink">
                Services
              </Link>
              <ChevronRight className="h-4 w-4" aria-hidden />
              <span aria-current="page" className="truncate">{service.shortTitle}</span>
            </nav>
            <p className="mt-6 text-sm font-extrabold text-flare">Service {service.number}</p>
            <h1 className="mt-2 text-4xl font-extrabold leading-[1.08] md:text-5xl">{service.title}</h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">{service.description}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href={`/contact?service=${service.slug}`} className={buttonClass("primary", "lg")}>
                {service.ctaLabel}
              </Link>
              <Link href={`/?explore=${service.slug}`} className={buttonClass("secondary", "lg")}>
                Explore in 3D
              </Link>
            </div>
          </div>
          <div className="lg:col-span-7">
            <ServiceScene sceneKey={service.sceneKey} caption={service.sceneCaption} title={service.title} />
          </div>
        </div>
      </section>

      {/* Scope & deliverables */}
      <section className="container-x grid gap-10 py-14 md:grid-cols-2 md:py-20">
        <div>
          <p className="eyebrow">Scope</p>
          <h2 className="mt-2 text-2xl font-extrabold md:text-3xl">What we cover</h2>
          <ul className="mt-6 grid gap-3">
            {service.scope.map((item) => (
              <li key={item} className="flex gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden />
                <span className="text-[16px]">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow">Deliverables</p>
          <h2 className="mt-2 text-2xl font-extrabold md:text-3xl">What you receive</h2>
          <ul className="mt-6 grid gap-3">
            {service.deliverables.map((item) => (
              <li key={item} className="card flex items-center gap-3 px-4 py-3">
                <span className="h-2 w-2 shrink-0 rounded-full bg-flare" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {service.specialisms.length > 0 && (
        <section className="bg-white py-14 md:py-20">
          <div className="container-x">
            <p className="eyebrow">Specialisms</p>
            <h2 className="mt-2 text-2xl font-extrabold md:text-3xl">Specialist take-offs</h2>
            <ul className="mt-8 grid gap-4 md:grid-cols-3">
              {service.specialisms.map((s) => (
                <li key={s.title} className="rounded-2xl border border-line bg-paper p-6">
                  <h3 className="text-lg font-bold">{s.title}</h3>
                  <p className="mt-2 text-ink-muted">{s.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Process */}
      <section className="bg-ink py-14 text-white md:py-20">
        <div className="container-x">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">Process</p>
          <h2 className="mt-2 text-2xl font-extrabold md:text-4xl">How it works, step by step</h2>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {service.steps.map((step, i) => (
              <li key={step.title} className="relative rounded-2xl border border-white/10 bg-white/[.04] p-6">
                <span className="text-4xl font-extrabold text-flare/90">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 text-lg font-bold">{step.title}</h3>
                {step.text && <p className="mt-1.5 text-white/70">{step.text}</p>}
              </li>
            ))}
          </ol>
          <p className="mt-8 text-sm text-white/50">
            Process wording is indicative. Approval responsibilities sit with the relevant road controlling authority.
          </p>
        </div>
      </section>

      {service.faqs.length > 0 && (
        <section className="container-x py-14 md:py-20">
          <p className="eyebrow">FAQ</p>
          <h2 className="mt-2 text-2xl font-extrabold md:text-3xl">Common questions</h2>
          <div className="mt-6 divide-y divide-line rounded-2xl border border-line bg-white">
            {service.faqs.map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold">
                  {f.q}
                  <ChevronRight className="h-5 w-5 shrink-0 transition group-open:rotate-90" aria-hidden />
                </summary>
                <p className="mt-3 text-ink-soft">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="container-x pb-6 pt-14 md:pt-20">
          <p className="eyebrow">Related services</p>
          <h2 className="mt-2 text-2xl font-extrabold md:text-3xl">Often paired with</h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {related.map((r) => (
              <li key={r.slug}>
                <ServiceCard service={r} compact />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="container-x py-14">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-flare px-6 py-10 text-white md:flex-row md:items-center md:px-12">
          <div>
            <h2 className="text-2xl font-extrabold md:text-3xl">Ready to get started?</h2>
            <p className="mt-1 text-white/90">Tell us about the works, location and timeframe.</p>
          </div>
          <Link href={`/contact?service=${service.slug}`} className={buttonClass("dark", "lg")}>
            {service.ctaLabel}
          </Link>
        </div>
      </section>
    </>
  );
}
