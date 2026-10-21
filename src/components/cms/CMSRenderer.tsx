import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import type { PageSection } from "@/lib/content/types";
import { cn } from "@/lib/utils";

function Paragraphs({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("prose-body", className)}>
      {text
        .split(/\n{2,}/)
        .filter(Boolean)
        .map((p, i) => (
          <p key={i}>{p}</p>
        ))}
    </div>
  );
}

/** Renders CMS-managed page sections in their configured order. */
export function CMSRenderer({ sections, skip = [] }: { sections: PageSection[]; skip?: PageSection["type"][] }) {
  return (
    <>
      {sections
        .filter((s) => !skip.includes(s.type))
        .map((s) => (
          <Section key={s.id} section={s} />
        ))}
    </>
  );
}

export function Section({ section: s }: { section: PageSection }) {
  switch (s.type) {
    case "hero":
      return (
        <section className="border-b border-line bg-[radial-gradient(ellipse_at_top_right,rgba(33,183,170,.12),transparent_55%)]">
          <div className="container-x py-14 md:py-20">
            {s.eyebrow && <p className="eyebrow">{s.eyebrow}</p>}
            <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-[1.08] md:text-6xl">{s.heading}</h1>
            {s.body && <Paragraphs text={s.body} className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft" />}
            {s.ctaLabel && s.ctaHref && (
              <Link href={s.ctaHref} className={buttonClass("primary", "lg", "mt-8")}>
                {s.ctaLabel}
              </Link>
            )}
          </div>
        </section>
      );
    case "text":
      return (
        <section className="container-x py-12 md:py-16">
          <div className="grid gap-6 md:grid-cols-12">
            <div className="md:col-span-4">
              {s.eyebrow && <p className="eyebrow">{s.eyebrow}</p>}
              <h2 className="mt-2 text-2xl font-extrabold md:text-3xl">{s.heading}</h2>
            </div>
            <div className="md:col-span-8">
              <Paragraphs text={s.body} className="text-[17px] leading-relaxed text-ink-soft" />
              {s.ctaLabel && s.ctaHref && (
                <Link href={s.ctaHref} className="mt-5 inline-flex items-center gap-1.5 font-bold text-flare-dark hover:underline">
                  {s.ctaLabel} <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              )}
            </div>
          </div>
        </section>
      );
    case "features":
      return (
        <section className="container-x py-12 md:py-16">
          {s.eyebrow && <p className="eyebrow">{s.eyebrow}</p>}
          <h2 className="mt-2 max-w-2xl text-2xl font-extrabold md:text-4xl">{s.heading}</h2>
          {s.body && <Paragraphs text={s.body} className="mt-3 max-w-2xl text-ink-soft" />}
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {s.items.map((item, i) => (
              <li key={i} className="card p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-light text-sm font-extrabold text-teal-dark">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-ink-muted">{item.text}</p>
              </li>
            ))}
          </ul>
        </section>
      );
    case "stats":
      return (
        <section className="bg-ink text-white">
          <div className="container-x grid gap-8 py-12 md:grid-cols-4 md:items-center md:py-14">
            <h2 className="text-2xl font-extrabold md:text-3xl">{s.heading}</h2>
            {s.items.map((item, i) => (
              <div key={i} className="border-l-2 border-flare pl-5">
                <p className="text-4xl font-extrabold md:text-5xl">{item.title}</p>
                <p className="mt-1 text-sm text-white/70">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      );
    case "cta":
      return (
        <section className="container-x py-12 md:py-16">
          <div className="relative overflow-hidden rounded-3xl bg-flare px-6 py-10 text-white md:px-12 md:py-14">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" aria-hidden />
            <div className="absolute -bottom-24 right-24 h-64 w-64 rounded-full bg-ink/10" aria-hidden />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <h2 className="text-2xl font-extrabold md:text-4xl">{s.heading}</h2>
                {s.body && <p className="mt-2 text-white/90">{s.body}</p>}
              </div>
              {s.ctaLabel && s.ctaHref && (
                <Link href={s.ctaHref} className={buttonClass("dark", "lg", "shrink-0")}>
                  {s.ctaLabel} <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              )}
            </div>
          </div>
        </section>
      );
  }
}
