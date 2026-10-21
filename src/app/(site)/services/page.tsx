import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { ServiceIllustration } from "@/components/services/ServiceIllustration";
import { getServices } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Services — TMPs, Event Traffic Management, QS & TIA | Urban Route NZ",
  description:
    "Seven services: traffic management plans, site-specific TMPs, event traffic management, on-call advisory, quantity surveying, project coordination and traffic impact assessments.",
  alternates: { canonical: "/services" },
};

export default async function ServicesPage() {
  const services = await getServices();
  return (
    <>
      <section className="border-b border-line bg-[radial-gradient(ellipse_at_top_right,rgba(33,183,170,.12),transparent_55%)]">
        <div className="container-x py-14 md:py-20">
          <p className="eyebrow">Services</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-[1.08] md:text-6xl">
            Seven services. One coordinated approach.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
            From a single lane closure to a citywide event or a new development, we plan, measure and coordinate the work
            around New Zealand&apos;s road network.
          </p>
          <Link href="/" className={buttonClass("secondary", "md", "mt-8")}>
            Explore the services in 3D
          </Link>
        </div>
      </section>

      <section className="container-x py-12 md:py-16">
        <ol className="grid gap-5">
          {services.map((s) => (
            <li key={s.slug}>
              <article className="card grid min-w-0 overflow-hidden md:grid-cols-12">
                <div className="bg-gradient-to-b from-white to-paper p-4 md:col-span-4">
                  <ServiceIllustration sceneKey={s.sceneKey} className="mx-auto max-w-sm" />
                </div>
                <div className="flex flex-col p-6 md:col-span-8 md:p-8">
                  <p className="text-sm font-extrabold text-flare">{s.number}</p>
                  <h2 className="mt-1 text-2xl font-extrabold">
                    <Link href={`/services/${s.slug}`} className="hover:text-flare-dark">
                      {s.title}
                    </Link>
                  </h2>
                  <p className="mt-2 text-ink-soft">{s.summary}</p>
                  <p className="mt-4 text-sm text-ink-muted">
                    <span className="font-bold text-ink">Process:</span> {s.steps.map((st) => st.title).join(" → ")}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href={`/services/${s.slug}`} className={buttonClass("dark", "sm")}>
                      View service <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                    <Link href={`/contact?service=${s.slug}`} className={buttonClass("secondary", "sm")}>
                      {s.ctaLabel}
                    </Link>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
