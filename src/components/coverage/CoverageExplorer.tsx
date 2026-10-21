"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef, useState } from "react";
import { useInView } from "@/components/three/useInView";
import { Box, Map as MapIcon, MapPin } from "lucide-react";
import { NZMapSvg } from "./NZMapSvg";
import { buttonClass } from "@/components/ui/button";
import { useExperiencePrefs } from "@/components/home/usePrefs";
import type { Region } from "@/lib/content/types";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const NZMap3D = dynamic(() => import("./NZMap3D"), { ssr: false });

const STATUS_LABEL: Record<Region["status"], string> = {
  experience: "Documented prior experience",
  available: "Service available",
  hidden: "Hidden",
};

export function CoverageExplorer({ regions }: { regions: Region[] }) {
  const prefs = useExperiencePrefs();
  const [selected, setSelected] = useState<string | null>(regions[0]?.id ?? null);
  const [mode, setMode] = useState<"3d" | "2d">("3d");
  const mapRef = useRef<HTMLDivElement>(null);
  const onScreen = useInView(mapRef);
  const current = regions.find((r) => r.id === selected) ?? null;
  const show3D = prefs.ready && !prefs.staticView && mode === "3d";

  const select = (id: string) => {
    setSelected(id);
    track("coverage_select", { region: id });
  };

  const islands: { key: Region["island"]; label: string }[] = [
    { key: "north", label: "North Island" },
    { key: "south", label: "South Island" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <div ref={mapRef} className="card relative aspect-[4/5] overflow-hidden bg-paper sm:aspect-[4/3] lg:aspect-[5/6]">
          {show3D ? (
            <NZMap3D regions={regions} selected={selected} onSelect={select} quality={prefs.quality} active={onScreen} />
          ) : (
            <div className="h-full p-4">
              <NZMapSvg regions={regions} selected={selected} onSelect={select} />
            </div>
          )}
          {prefs.ready && prefs.webgl && (
            <div className="absolute right-3 top-3 flex rounded-full border border-line bg-white/90 p-1 shadow-card" role="group" aria-label="Map view">
              {(["3d", "2d"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold",
                    mode === m ? "bg-ink text-white" : "text-ink-muted",
                  )}
                >
                  {m === "3d" ? <Box className="h-4 w-4" aria-hidden /> : <MapIcon className="h-4 w-4" aria-hidden />}
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          )}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-3 rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold shadow-card">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-teal" aria-hidden /> Prior experience
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-teal bg-white" aria-hidden /> Service available
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-5">
        {current && (
          <section aria-live="polite" className="card p-6">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-dark">
              <MapPin className="h-4 w-4" aria-hidden /> {current.island === "north" ? "North Island" : "South Island"}
            </p>
            <h2 className="mt-2 text-2xl font-extrabold">{current.name}</h2>
            <p className="mt-1 text-sm font-semibold text-ink-muted">{STATUS_LABEL[current.status]}</p>
            <p className="mt-3 text-ink-soft">{current.description}</p>
            <Link
              href={`/contact?location=${encodeURIComponent(current.name)}`}
              onClick={() => track("cta_click", { location: "coverage", region: current.id })}
              className={buttonClass("primary", "md", "mt-5")}
            >
              Enquire about a project in {current.name}
            </Link>
          </section>
        )}

        {islands.map((island) => (
          <div key={island.key}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted">{island.label}</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {regions
                .filter((r) => r.island === island.key)
                .map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => select(r.id)}
                      aria-pressed={r.id === selected}
                      className={cn(
                        "rounded-full border px-3.5 py-2 text-sm font-semibold transition",
                        r.id === selected ? "border-flare bg-flare text-white" : "border-line bg-white hover:border-ink/30",
                      )}
                    >
                      {r.name}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
