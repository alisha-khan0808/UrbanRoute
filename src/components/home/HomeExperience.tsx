"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInView } from "@/components/three/useInView";
import { FastForward, Image as ImageIcon, Loader2, Pause, Play } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { ContentOverlay, type OverlayService } from "./ContentOverlay";
import { StaticExplorer } from "./StaticExplorer";
import { useExperiencePrefs } from "./usePrefs";
import { OVERVIEW, OVERVIEW_PORTRAIT, zoneView, type SceneKey } from "@/components/three/layout";
import type { Hotspot } from "@/components/three/HotspotManager";
import type { QsLayer } from "@/components/three/zones/ZonesB";
import type { CameraPreset } from "@/lib/content/types";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const ExperienceCanvas = dynamic(() => import("@/components/three/ExperienceCanvas"), { ssr: false });

export interface HomeHotspot extends Hotspot {
  cameraPreset: CameraPreset;
}

export interface HomeHero {
  eyebrow: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}

function useMedia(query: string) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatch(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return match;
}

export function HomeExperience({
  hero,
  hotspots,
  services,
  sceneEnabled,
  introAnimation,
  defaultQuality,
  modelUrl,
}: {
  hero: HomeHero;
  hotspots: HomeHotspot[];
  services: OverlayService[];
  sceneEnabled: boolean;
  introAnimation: boolean;
  defaultQuality: "auto" | "low" | "medium" | "high";
  modelUrl: string;
}) {
  const prefs = useExperiencePrefs(defaultQuality);
  const isMobile = useMedia("(max-width: 1023px)");
  const isPortrait = useMedia("(max-aspect-ratio: 4/5)");
  const [selected, setSelected] = useState<string | null>(null);
  const [qsLayer, setQsLayer] = useState<QsLayer | null>(null);
  const [arrived, setArrived] = useState(false);
  const [loadCanvas, setLoadCanvas] = useState(false);
  const [skipToken, setSkipToken] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const onScreen = useInView(sectionRef);

  const use3D = sceneEnabled && prefs.ready && !prefs.staticView;

  // Progressive loading: let the HTML hero paint first, then fetch the 3D world when idle.
  useEffect(() => {
    if (!use3D) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(() => setLoadCanvas(true), { timeout: 1200 });
    else setTimeout(() => setLoadCanvas(true), 300);
  }, [use3D]);

  useEffect(() => {
    if (prefs.ready && !use3D && sceneEnabled) track("fallback_3d", { reason: prefs.webgl ? "user" : "no-webgl" });
  }, [prefs.ready, use3D, sceneEnabled, prefs.webgl]);

  const ordered = useMemo(() => hotspots.filter((h) => services.some((s) => s.slug === h.slug)), [hotspots, services]);
  const index = ordered.findIndex((h) => h.slug === selected);
  const current = services.find((s) => s.slug === selected) ?? null;
  const hotspot = ordered[index];

  const view = useMemo(
    () => (hotspot ? zoneView(hotspot.sceneKey as SceneKey, hotspot.cameraPreset) : isPortrait ? OVERVIEW_PORTRAIT : OVERVIEW),
    [hotspot, isPortrait],
  );

  const select = useCallback(
    (slug: string | null) => {
      setSelected(slug);
      setQsLayer(null);
      if (slug) {
        track("hotspot_click", { service: slug });
        setArrived(false);
      }
    },
    [],
  );

  const step = useCallback(
    (dir: 1 | -1) => {
      if (ordered.length === 0) return;
      const i = index < 0 ? 0 : (index + dir + ordered.length) % ordered.length;
      select(ordered[i].slug);
    },
    [index, ordered, select],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (e.key === "Escape" && selected) select(null);
      if (selected && e.key === "ArrowRight") step(1);
      if (selected && e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, select, step]);

  // Deep link from service pages: /?explore=<slug>
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("explore");
    if (slug && services.some((s) => s.slug === slug)) select(slug);
  }, [services, select]);

  const shift: [number, number] = selected ? (isMobile ? [0, 0.2] : [0.17, 0]) : isMobile ? [0, -0.1] : [-0.12, 0];
  const intro = introAnimation && prefs.motion;
  const [introDone, setIntroDone] = useState(false);
  const onArrive = useCallback(() => {
    setArrived(true);
    setIntroDone(true);
  }, []);
  const showHotspots = introDone || !intro;

  // Safety net: never leave hotspots hidden if the intro stalls (slow device, hidden tab).
  useEffect(() => {
    if (!loadCanvas || introDone) return;
    const t = setTimeout(() => setIntroDone(true), 8000);
    return () => clearTimeout(t);
  }, [loadCanvas, introDone]);

  const prev = ordered[(index - 1 + ordered.length) % ordered.length];
  const next = ordered[(index + 1) % ordered.length];

  if (prefs.ready && !use3D) {
    return (
      <StaticExplorer
        hero={hero}
        services={services}
        canUse3D={prefs.webgl && sceneEnabled}
        onUse3D={prefs.toggleStatic}
      />
    );
  }

  return (
    <section ref={sectionRef} aria-label="Interactive service explorer" className="relative h-[100svh] min-h-[620px] w-full overflow-hidden bg-paper">
      <div className="absolute inset-0">
        {loadCanvas && (
          <ExperienceCanvas
            active={onScreen}
            quality={prefs.quality}
            motion={prefs.motion}
            view={view}
            intro={intro}
            skipToken={skipToken}
            hotspots={ordered}
            compactHotspots={isMobile}
            selected={selected}
            showHotspots={showHotspots}
            qsLayer={qsLayer}
            modelUrl={modelUrl || undefined}
            shift={shift}
            onSelect={select}
            onArrive={onArrive}
            onQualityChange={prefs.setQuality}
            onContextLost={() => {
              track("fallback_3d", { reason: "context-lost" });
              prefs.forceStatic();
            }}
          />
        )}
      </div>

      {/* Soft gradients keep HTML text legible over the scene */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-paper via-paper/70 to-transparent" />
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 hidden w-[52%] bg-gradient-to-r from-paper via-paper/75 to-transparent transition-opacity duration-500 lg:block",
          selected && "opacity-0",
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-[40%] bg-gradient-to-b from-paper via-paper/70 to-transparent transition-opacity duration-500 lg:hidden",
          selected && "opacity-0",
        )}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-paper via-paper/60 to-transparent" />

      {/* Hero (HTML — renders immediately, before the 3D world) */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-20 transition-all duration-500 md:top-28",
          selected ? "-translate-y-4 opacity-0" : "opacity-100",
        )}
        aria-hidden={selected ? true : undefined}
      >
        <div className="container-x">
          <div className="max-w-xl">
            <p className="eyebrow animate-fade-up">{hero.eyebrow}</p>
            <h1 className="mt-3 text-[34px] font-extrabold leading-[1.05] text-ink animate-fade-up sm:text-5xl lg:text-6xl">
              {hero.heading}
            </h1>
            <p className="mt-4 hidden max-w-md text-base leading-relaxed text-ink-soft sm:block md:text-lg">{hero.body}</p>
            <div className="pointer-events-auto mt-6 flex flex-wrap gap-3">
              <Link href={hero.ctaHref || "/contact"} className={buttonClass("primary", "md")} tabIndex={selected ? -1 : 0}>
                {hero.ctaLabel || "Start an enquiry"}
              </Link>
              <Link href="/services" className={buttonClass("secondary", "md", "hidden sm:inline-flex")} tabIndex={selected ? -1 : 0}>
                All services
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {!showHotspots && (
        <div className="absolute inset-x-0 bottom-36 flex justify-center md:bottom-40 lg:bottom-32" role="status">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-ink-soft shadow-card">
            <Loader2 className="h-4 w-4 animate-spin text-teal" aria-hidden />
            {loadCanvas ? "Descending into the network…" : "Loading 3D world…"}
          </span>
        </div>
      )}

      {/* Overlay panel: right side on desktop, bottom sheet on mobile */}
      {current && (
        <div
          className={cn(
            "absolute z-30 animate-fade-up",
            "inset-x-2 bottom-2 max-h-[58svh] lg:inset-x-auto lg:bottom-6 lg:right-6 lg:top-24 lg:max-h-none lg:w-[410px]",
          )}
        >
          <ContentOverlay
            service={current}
            index={index}
            total={ordered.length}
            onClose={() => select(null)}
            onPrev={() => step(-1)}
            onNext={() => step(1)}
            prevTitle={services.find((s) => s.slug === prev?.slug)?.title ?? ""}
            nextTitle={services.find((s) => s.slug === next?.slug)?.title ?? ""}
            qsLayer={qsLayer}
            onQsLayer={setQsLayer}
            className="h-full max-h-[58svh] lg:max-h-full"
            autoFocus={arrived || !prefs.motion}
          />
        </div>
      )}

      {/* Service rail: keyboard/screen-reader alternative to the 3D hotspots */}
      <nav
        aria-label="Services in the explorer"
        className={cn(
          "absolute inset-x-0 bottom-4 z-20 transition-opacity md:bottom-6",
          current ? "pointer-events-none opacity-0 lg:pointer-events-auto lg:opacity-100" : "opacity-100",
        )}
      >
        <div className="container-x">
          <div className="flex items-end justify-between gap-3">
            <ul className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:max-w-[calc(100%-430px)] lg:flex-wrap lg:px-0">
              {ordered.map((h) => (
                <li key={h.slug} className="snap-start">
                  <button
                    type="button"
                    onClick={() => select(h.slug)}
                    aria-pressed={selected === h.slug}
                    className={cn(
                      "flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-2 text-sm font-semibold shadow-card transition",
                      selected === h.slug ? "border-flare bg-flare text-white" : "border-line bg-white/95 hover:border-ink/30",
                    )}
                  >
                    <span className={cn("text-xs font-bold", selected === h.slug ? "text-white" : "text-flare")}>{h.number}</span>
                    {h.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>

      {/* Experience controls */}
      <div
        className={cn(
          "absolute bottom-[74px] right-3 z-20 flex flex-row-reverse items-center gap-2 md:bottom-[84px] lg:bottom-auto lg:right-6 lg:top-24 lg:flex-col lg:items-end",
          current && "hidden lg:flex lg:right-[440px]",
        )}
      >
        {!showHotspots && loadCanvas && (
          <button type="button" onClick={() => setSkipToken((t) => t + 1)} className={buttonClass("dark", "sm")}>
            <FastForward className="h-4 w-4" aria-hidden /> Skip intro
          </button>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={prefs.toggleMotion}
            aria-pressed={!prefs.motion}
            className={buttonClass("secondary", "sm", "h-9 w-9 px-0 sm:w-auto sm:px-3")}
            title={prefs.motion ? "Reduce motion" : "Allow motion"}
          >
            {prefs.motion ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
            <span className="sr-only sm:not-sr-only">{prefs.motion ? "Reduce motion" : "Motion off"}</span>
          </button>
          <button
            type="button"
            onClick={prefs.toggleStatic}
            className={buttonClass("secondary", "sm", "h-9 w-9 px-0 sm:w-auto sm:px-3")}
            title="Switch to static view"
          >
            <ImageIcon className="h-4 w-4" aria-hidden />
            <span className="sr-only sm:not-sr-only">Static view</span>
          </button>
        </div>
      </div>
      <noscript>
        <p className="absolute inset-x-0 bottom-24 text-center text-sm">
          The interactive explorer needs JavaScript. <Link href="/services">Browse all services</Link>.
        </p>
      </noscript>
      <span className="sr-only" aria-live="polite">
        {current ? `${current.title} selected` : ""}
      </span>
    </section>
  );
}
