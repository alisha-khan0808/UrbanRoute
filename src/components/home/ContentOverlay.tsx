"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { QsLayer } from "@/components/three/zones/ZonesB";

export interface OverlayService {
  slug: string;
  number: string;
  title: string;
  summary: string;
  steps: string[];
  ctaLabel: string;
  sceneKey: string;
  specialisms: string[];
}

const QS_LAYERS: { id: QsLayer; label: string }[] = [
  { id: "drainage", label: "Drainage" },
  { id: "roofing", label: "Roofing" },
  { id: "tanking", label: "Tanking & Waterproofing" },
];

export function QsLayerPicker({ value, onChange, className }: { value: QsLayer | null; onChange: (l: QsLayer | null) => void; className?: string }) {
  return (
    <fieldset className={className}>
      <legend className="mb-2 text-xs font-bold uppercase tracking-widest text-ink-muted">Explore QS layers</legend>
      <div className="flex flex-wrap gap-2">
        {QS_LAYERS.map((l) => (
          <button
            key={l.id}
            type="button"
            aria-pressed={value === l.id}
            onClick={() => onChange(value === l.id ? null : l.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-semibold transition",
              value === l.id ? "border-flare bg-flare text-white" : "border-line bg-white hover:border-ink/30",
            )}
          >
            {l.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function ContentOverlay({
  service,
  index,
  total,
  onClose,
  onPrev,
  onNext,
  prevTitle,
  nextTitle,
  qsLayer,
  onQsLayer,
  className,
  autoFocus = true,
}: {
  service: OverlayService;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  prevTitle: string;
  nextTitle: string;
  qsLayer: QsLayer | null;
  onQsLayer: (l: QsLayer | null) => void;
  className?: string;
  autoFocus?: boolean;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (autoFocus) heading.current?.focus({ preventScroll: true });
  }, [service.slug, autoFocus]);

  return (
    <section
      aria-labelledby="overlay-title"
      className={cn("flex flex-col overflow-hidden rounded-3xl border border-line bg-white/95 shadow-lift backdrop-blur", className)}
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">
          Service <span className="text-flare">{service.number}</span> / {String(total).padStart(2, "0")}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-semibold text-ink-muted hover:bg-ink/5 hover:text-ink"
        >
          <X className="h-4 w-4" aria-hidden /> Overview
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-4">
        <h2 id="overlay-title" ref={heading} tabIndex={-1} className="text-2xl font-extrabold leading-tight focus:outline-none md:text-[28px]">
          {service.title}
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{service.summary}</p>

        {service.sceneKey === "qs" && <QsLayerPicker value={qsLayer} onChange={onQsLayer} className="mt-4" />}

        <h3 className="mt-5 text-xs font-bold uppercase tracking-widest text-ink-muted">How it works</h3>
        <ol className="mt-2 space-y-1.5">
          {service.steps.map((s, i) => (
            <li key={s} className="flex items-center gap-3 text-[15px]">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-light text-xs font-bold text-teal-dark">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>

        <div className="mt-5 flex flex-col gap-2">
          <Link
            href={`/contact?service=${service.slug}`}
            onClick={() => track("cta_click", { service: service.slug, location: "overlay" })}
            className={buttonClass("primary", "md", "w-full text-center")}
          >
            {service.ctaLabel}
          </Link>
          <Link href={`/services/${service.slug}`} className={buttonClass("secondary", "md", "w-full")}>
            Full service <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 border-t border-line text-sm">
        <button
          type="button"
          onClick={onPrev}
          className="flex min-w-0 items-center gap-2 px-4 py-3 text-left font-semibold hover:bg-paper"
          aria-label={`Previous service: ${prevTitle}`}
        >
          <ChevronLeft className="h-4 w-4 shrink-0 text-flare" aria-hidden />
          <span className="truncate">{prevTitle}</span>
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex min-w-0 items-center justify-end gap-2 border-l border-line px-4 py-3 text-right font-semibold hover:bg-paper"
          aria-label={`Next service: ${nextTitle}`}
        >
          <span className="truncate">{nextTitle}</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-flare" aria-hidden />
        </button>
      </div>
      <p className="sr-only">
        Service {index + 1} of {total}. Use the left and right arrow keys to move between services and Escape to return to the overview.
      </p>
    </section>
  );
}

