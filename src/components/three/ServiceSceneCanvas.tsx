"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Lights } from "./ExperienceCanvas";
import { ZoneStandalone } from "./SceneManager";
import { COLORS, QUALITY_PRESETS, SceneSettingsContext, type Quality } from "./settings";
import type { SceneKey } from "./layout";
import type { QsLayer } from "./zones/ZonesB";

function Turntable({ children, motion }: { children: React.ReactNode; motion: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current && motion) ref.current.rotation.y += delta * 0.12;
  });
  return (
    <group ref={ref} rotation={[0, -0.5, 0]}>
      {children}
    </group>
  );
}

/** Single service scene shown on a service page. */
export default function ServiceSceneCanvas({
  sceneKey,
  quality,
  motion,
  qsLayer,
  active = true,
}: {
  sceneKey: SceneKey;
  quality: Quality;
  motion: boolean;
  qsLayer: QsLayer | null;
  active?: boolean;
}) {
  const preset = QUALITY_PRESETS[quality];
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      shadows={preset.shadows}
      dpr={preset.dpr}
      gl={{ antialias: quality !== "low" }}
      camera={{ fov: 30, near: 1, far: 300, position: [23, 20, 26] }}
      onCreated={({ camera }) => camera.lookAt(0, 1.5, 0)}
    >
      <SceneSettingsContext.Provider value={{ quality, motion }}>
        <color attach="background" args={[COLORS.paper]} />
        <Lights quality={quality} extent={22} />
        <Turntable motion={motion}>
          <ZoneStandalone sceneKey={sceneKey} qsLayer={qsLayer} />
        </Turntable>
      </SceneSettingsContext.Provider>
    </Canvas>
  );
}
