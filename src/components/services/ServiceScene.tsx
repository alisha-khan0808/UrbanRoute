"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Box, Image as ImageIcon, Pause, Play } from "lucide-react";
import { ServiceIllustration } from "./ServiceIllustration";
import { QsLayerPicker } from "@/components/home/ContentOverlay";
import { useExperiencePrefs } from "@/components/home/usePrefs";
import { isSceneKey } from "@/components/three/layout";
import type { QsLayer } from "@/components/three/zones/ZonesB";
import { cn } from "@/lib/utils";

const ServiceSceneCanvas = dynamic(() => import("@/components/three/ServiceSceneCanvas"), { ssr: false });

/** Lazy-loaded 3D scene for a service page, with a static illustration fallback. */
export function ServiceScene({ sceneKey, caption, title }: { sceneKey: string; caption: string; title: string }) {
  const prefs = useExperiencePrefs();
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [qsLayer, setQsLayer] = useState<QsLayer | null>(null);
  const can3D = prefs.ready && !prefs.staticView && isSceneKey(sceneKey);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <figure className="w-full">
      <div ref={ref} className="card relative aspect-[4/3] overflow-hidden bg-paper sm:aspect-[16/11]">
        {can3D && inView && isSceneKey(sceneKey) ? (
          <ServiceSceneCanvas sceneKey={sceneKey} quality={prefs.quality} motion={prefs.motion} qsLayer={qsLayer} />
        ) : (
          <div className="flex h-full items-center justify-center p-6">
            <ServiceIllustration sceneKey={sceneKey} title={`Illustration: ${title}`} />
          </div>
        )}
        <div className="absolute right-3 top-3 flex gap-2">
          {can3D && (
            <button
              type="button"
              onClick={prefs.toggleMotion}
              aria-pressed={!prefs.motion}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/90 shadow-card"
              aria-label={prefs.motion ? "Pause animation" : "Play animation"}
            >
              {prefs.motion ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
          )}
          {prefs.ready && prefs.webgl && (
            <button
              type="button"
              onClick={prefs.toggleStatic}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-white/90 px-3 text-sm font-semibold shadow-card"
            >
              {prefs.staticView ? <Box className="h-4 w-4" aria-hidden /> : <ImageIcon className="h-4 w-4" aria-hidden />}
              {prefs.staticView ? "3D view" : "Static"}
            </button>
          )}
        </div>
      </div>
      {sceneKey === "qs" && <QsLayerPicker value={qsLayer} onChange={setQsLayer} className={cn("mt-4", !can3D && "hidden")} />}
      <figcaption className="mt-3 text-sm text-ink-muted">{caption}</figcaption>
    </figure>
  );
}
