"use client";

import Link from "next/link";
import { useState } from "react";
import { Box } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { ServiceIllustration } from "@/components/services/ServiceIllustration";
import { ContentOverlay, type OverlayService } from "./ContentOverlay";
import type { HomeHero } from "./HomeExperience";
import type { QsLayer } from "@/components/three/zones/ZonesB";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/** Static, fully accessible alternative to the 3D explorer. */
export function StaticExplorer({
  hero,
  services,
  canUse3D,
  onUse3D,
}: {
  hero: HomeHero;
  services: OverlayService[];
  canUse3D: boolean;
  onUse3D: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [qsLayer, setQsLayer] = useState<QsLayer | null>(null);
  const current = services[index];
  const go = (i: number) => {
    const n = (i + services.length) % services.length;
    setIndex(n);
    setQsLayer(null);
    track("hotspot_click", { service: services[n].slug, mode: "static" });
  };

  return (
    <section aria-label="Service explorer (static view)" className="bg-paper pb-14 pt-24 md:pt-32">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow">{hero.eyebrow}</p>
            <h1 className="mt-3 text-[34px] font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">{hero.heading}</h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft md:text-lg">{hero.body}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={hero.ctaHref || "/contact"} className={buttonClass("primary", "md")}>
                {hero.ctaLabel || "Start an enquiry"}
              </Link>
            </div>
          </div>
          {canUse3D && (
            <button type="button" onClick={onUse3D} className={buttonClass("secondary", "sm", "self-start md:self-auto")}>
              <Box className="h-4 w-4" aria-hidden /> Switch to 3D view
            </button>
          )}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1" aria-label="Services">
            {services.map((s, i) => (
              <li key={s.slug}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-pressed={i === index}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition",
                    i === index ? "border-flare bg-white shadow-card" : "border-line bg-white/60 hover:bg-white",
                  )}
                >
                  <span className={cn("text-sm font-bold", i === index ? "text-flare" : "text-ink-muted")}>{s.number}</span>
                  <span className="font-bold">{s.title}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="grid gap-4 lg:col-span-8 lg:grid-cols-2">
            <div className="card flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-b from-white to-paper p-4 lg:aspect-auto">
              <ServiceIllustration sceneKey={current.sceneKey} title={`Illustration: ${current.title}`} />
            </div>
            <ContentOverlay
              service={current}
              index={index}
              total={services.length}
              onClose={() => go(0)}
              onPrev={() => go(index - 1)}
              onNext={() => go(index + 1)}
              prevTitle={services[(index - 1 + services.length) % services.length].title}
              nextTitle={services[(index + 1) % services.length].title}
              qsLayer={qsLayer}
              onQsLayer={setQsLayer}
              autoFocus={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
