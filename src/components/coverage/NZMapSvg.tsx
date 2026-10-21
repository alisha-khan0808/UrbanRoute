"use client";

import { OUTLINES, project } from "./nz-geo";
import type { Region } from "@/lib/content/types";
import { cn } from "@/lib/utils";

const S = 40; // map units → SVG px

/** Conventional 2D map: also the fallback when WebGL is unavailable. */
export function NZMapSvg({
  regions,
  selected,
  onSelect,
  className,
}: {
  regions: Region[];
  selected: string | null;
  onSelect: (id: string) => void;
  className?: string;
}) {
  return (
    <svg viewBox="-200 -290 380 560" className={cn("h-full w-full", className)} role="group" aria-label="Map of New Zealand showing coverage areas">
      <defs>
        <pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#17232B" opacity="0.08" />
        </pattern>
      </defs>
      <rect x="-200" y="-290" width="380" height="560" fill="url(#dots)" />
      {OUTLINES.map((poly, i) => (
        <polygon
          key={i}
          points={poly.map(([x, y]) => `${x * S},${y * S}`).join(" ")}
          fill="#FFFFFF"
          stroke="#17232B"
          strokeOpacity="0.25"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      ))}
      <text x={-150} y={-180} className="fill-ink-muted text-[13px] font-bold uppercase tracking-widest">
        North Island
      </text>
      <text x={-185} y={60} className="fill-ink-muted text-[13px] font-bold uppercase tracking-widest">
        South Island
      </text>
      {regions.map((r) => {
        const [x, y] = project(r.longitude, r.latitude);
        const active = r.id === selected;
        return (
          <g key={r.id} transform={`translate(${x * S},${y * S})`}>
            <circle r={active ? 16 : 0} fill="#FF6542" opacity="0.18" />
            <circle
              r={active ? 8 : 6}
              fill={active ? "#FF6542" : r.status === "experience" ? "#21B7AA" : "#FFFFFF"}
              stroke={r.status === "experience" ? "#FFFFFF" : "#21B7AA"}
              strokeWidth="2"
              className="cursor-pointer"
              onClick={() => onSelect(r.id)}
            >
              <title>{r.name}</title>
            </circle>
          </g>
        );
      })}
    </svg>
  );
}
