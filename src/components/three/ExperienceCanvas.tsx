"use client";

import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { CameraController } from "./CameraController";
import { HotspotManager, type Hotspot } from "./HotspotManager";
import { SceneManager } from "./SceneManager";
import { COLORS, QUALITY_PRESETS, SceneSettingsContext, type Quality } from "./settings";
import type { CameraView } from "./layout";
import type { QsLayer } from "./zones/ZonesB";

/** Lighting rig: warm key light with soft fill for a miniature, architectural look. */
export function Lights({ quality, extent = 60 }: { quality: Quality; extent?: number }) {
  const preset = QUALITY_PRESETS[quality];
  return (
    <>
      <hemisphereLight args={["#FFF8EE", "#B9C4BD", 1.15]} />
      <directionalLight
        position={[38, 60, 26]}
        intensity={2.1}
        color="#FFF1DE"
        castShadow={preset.shadows}
        shadow-mapSize={[preset.shadowMap, preset.shadowMap]}
        shadow-camera-left={-extent}
        shadow-camera-right={extent}
        shadow-camera-top={extent}
        shadow-camera-bottom={-extent}
        shadow-camera-near={1}
        shadow-camera-far={200}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />
      <directionalLight position={[-30, 20, -40]} intensity={0.45} color="#CFE9F2" />
    </>
  );
}

/** Lower the quality one step when the frame rate drops (PerformanceManager). */
export function PerformanceManager({ quality, onChange }: { quality: Quality; onChange: (q: Quality) => void }) {
  return (
    <PerformanceMonitor
      bounds={(refresh) => (refresh > 90 ? [50, 90] : [28, 58])}
      flipflops={2}
      onDecline={() => {
        if (quality === "high") onChange("medium");
        else if (quality === "medium") onChange("low");
      }}
    />
  );
}

export interface ExperienceCanvasProps {
  quality: Quality;
  motion: boolean;
  view: CameraView;
  intro: boolean;
  skipToken: number;
  hotspots: Hotspot[];
  compactHotspots: boolean;
  selected: string | null;
  showHotspots: boolean;
  qsLayer: QsLayer | null;
  modelUrl?: string;
  shift: [number, number];
  onSelect: (slug: string) => void;
  onArrive: () => void;
  onQualityChange: (q: Quality) => void;
  /** Called if the GPU drops the WebGL context, so the page can fall back to static. */
  onContextLost?: () => void;
}

export default function ExperienceCanvas(props: ExperienceCanvasProps) {
  const preset = QUALITY_PRESETS[props.quality];
  return (
    <Canvas
      shadows={preset.shadows ? "soft" : false}
      dpr={preset.dpr}
      gl={{ antialias: props.quality !== "low", powerPreference: "high-performance" }}
      camera={{ fov: 32, near: 1, far: 600, position: [62, 64, 70] }}
      style={{ touchAction: "pan-y" }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          props.onContextLost?.();
        });
      }}
    >
      <SceneSettingsContext.Provider value={{ quality: props.quality, motion: props.motion }}>
        <color attach="background" args={[COLORS.paper]} />
        <fog attach="fog" args={[COLORS.paper, 130, 260]} />
        <Lights quality={props.quality} />
        <PerformanceManager quality={props.quality} onChange={props.onQualityChange} />
        <SceneManager qsLayer={props.qsLayer} modelUrl={props.modelUrl} />
        <HotspotManager compact={props.compactHotspots} hotspots={props.hotspots} selected={props.selected} onSelect={props.onSelect} visible={props.showHotspots} />
        <CameraController
          view={props.view}
          intro={props.intro}
          instant={!props.motion}
          skipToken={props.skipToken}
          onArrive={props.onArrive}
          shift={props.shift}
        />
      </SceneSettingsContext.Provider>
    </Canvas>
  );
}
