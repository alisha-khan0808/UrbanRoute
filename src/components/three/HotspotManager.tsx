"use client";

import { useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ZONES, type SceneKey } from "./layout";
import { COLORS, useSceneSettings } from "./settings";

export interface Hotspot {
  sceneKey: SceneKey;
  slug: string;
  number: string;
  label: string;
}

function SelectionRing({ sceneKey }: { sceneKey: SceneKey }) {
  const ref = useRef<THREE.Mesh>(null);
  const { motion } = useSceneSettings();
  const z = ZONES[sceneKey];
  const [ox, , oz] = z.hotspotOffset ?? [0, 0, 0];
  useFrame(({ clock }) => {
    if (ref.current && motion) ref.current.rotation.z = clock.elapsedTime * 0.4;
  });
  return (
    <mesh ref={ref} position={[z.position[0] + ox, 0.3, z.position[2] + oz]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[7.6, 8, 64, 1, 0, Math.PI * 1.7]} />
      <meshBasicMaterial color={COLORS.teal} transparent opacity={0.85} depthWrite={false} />
    </mesh>
  );
}

/**
 * Hotspots are real HTML <button>s anchored in 3D space, so they are
 * focusable, labelled and announced by screen readers.
 */
export function HotspotManager({
  hotspots,
  selected,
  onSelect,
  visible,
  compact = false,
}: {
  hotspots: Hotspot[];
  selected: string | null;
  onSelect: (slug: string) => void;
  visible: boolean;
  compact?: boolean;
}) {
  const active = hotspots.find((h) => h.slug === selected);
  return (
    <group>
      {active && <SelectionRing sceneKey={active.sceneKey} />}
      {hotspots.map((h) => {
        const z = ZONES[h.sceneKey];
        const [ox, , oz] = z.hotspotOffset ?? [0, 0, 0];
        const isActive = h.slug === selected;
        return (
          <Html
            key={h.slug}
            position={[z.position[0] + ox, z.hotspotY, z.position[2] + oz]}
            center
            zIndexRange={[30, 0]}
            style={{ pointerEvents: visible ? "auto" : "none" }}
          >
            <button
              type="button"
              onClick={() => onSelect(h.slug)}
              aria-pressed={isActive}
              aria-label={`${h.number} ${h.label} — explore this service`}
              tabIndex={visible ? 0 : -1}
              className={[
                "group relative isolate flex items-center gap-2 whitespace-nowrap rounded-full p-1 text-[13px] font-bold shadow-lift transition duration-300",
                visible ? "opacity-100" : "translate-y-2 opacity-0",
                isActive ? "bg-flare text-white" : "bg-white/95 text-ink hover:bg-ink hover:text-white",
                isActive || !compact ? "pr-3" : "",
              ].join(" ")}
            >
              {!isActive && <span className="absolute left-1 top-1 -z-10 h-7 w-7 rounded-full bg-flare/60 animate-pulse-ring" aria-hidden />}
              <span
                className={[
                  "relative flex h-7 w-7 items-center justify-center rounded-full text-[11px]",
                  isActive ? "bg-white text-flare" : "bg-ink text-white group-hover:bg-flare",
                ].join(" ")}
              >
                <span className="relative">{h.number}</span>
              </span>
              {(isActive || !compact) && <span>{h.label}</span>}
            </button>
          </Html>
        );
      })}
    </group>
  );
}
