import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ServiceIllustration } from "./ServiceIllustration";
import type { Service } from "@/lib/content/types";

export function ServiceCard({ service, compact = false }: { service: Pick<Service, "slug" | "number" | "title" | "summary" | "sceneKey">; compact?: boolean }) {
  return (
    <Link
      href={`/services/${service.slug}`}
      className="card group flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      {!compact && (
        <div className="aspect-[16/10] bg-gradient-to-b from-white to-paper p-3">
          <ServiceIllustration sceneKey={service.sceneKey} />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="text-sm font-extrabold text-flare">{service.number}</span>
          <ArrowUpRight className="h-5 w-5 text-ink-muted transition group-hover:text-flare" aria-hidden />
        </div>
        <h3 className="mt-2 text-lg font-bold leading-snug">{service.title}</h3>
        <p className="mt-1.5 text-[15px] leading-relaxed text-ink-muted">{service.summary}</p>
      </div>
    </Link>
  );
}
