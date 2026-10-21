"use client";

import { Suspense, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import { AdvisoryZone, EventZone, IntersectionZone, RoadworksZone } from "./zones/ZonesA";
import { CoordinationZone, QsZone, TiaZone, type QsLayer } from "./zones/ZonesB";
import { ZONES, type SceneKey } from "./layout";
import { RoadSurface, World } from "./World";
import { Box } from "./primitives";
import { COLORS } from "./settings";

/** Scene-to-component mapping. Each zone is built around its own origin. */
export function Zone({ sceneKey, qsLayer }: { sceneKey: SceneKey; qsLayer?: QsLayer | null }) {
  switch (sceneKey) {
    case "roadworks":
      return <RoadworksZone />;
    case "intersection":
      return <IntersectionZone />;
    case "event":
      return <EventZone />;
    case "advisory":
      return <AdvisoryZone />;
    case "qs":
      return <QsZone layer={qsLayer ?? null} />;
    case "coordination":
      return <CoordinationZone />;
    case "tia":
      return <TiaZone />;
  }
}

/** Optional prebuilt glTF/GLB model configured in the CMS (scene.modelUrl). */
function GlbModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

/** All seven zones placed into the shared world. */
export function SceneManager({ qsLayer, modelUrl }: { qsLayer?: QsLayer | null; modelUrl?: string }) {
  return (
    <group>
      <World />
      {Object.values(ZONES).map((z) => (
        <group key={z.key} position={z.position}>
          <Zone sceneKey={z.key} qsLayer={qsLayer} />
        </group>
      ))}
      {modelUrl ? (
        <Suspense fallback={null}>
          <GlbModel url={modelUrl} />
        </Suspense>
      ) : null}
    </group>
  );
}

/** Ground context for a zone rendered on its own (service pages). */
export function ZoneStandalone({ sceneKey, qsLayer, children }: { sceneKey: SceneKey; qsLayer?: QsLayer | null; children?: ReactNode }) {
  const context = ZONES[sceneKey].context;
  const R = 17;
  return (
    <group>
      <mesh position={[0, -1, 0]} receiveShadow>
        <cylinderGeometry args={[R, R, 2, 64]} />
        <meshStandardMaterial color="#D9DDD5" />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[R, 64]} />
        <meshStandardMaterial color={COLORS.grass} />
      </mesh>
      {context === "straight" && <RoadSurface axis="x" at={0} from={-R + 1} to={R - 1} />}
      {context === "crossing" && (
        <>
          <RoadSurface axis="x" at={0} from={-R + 1} to={R - 1} />
          <RoadSurface axis="z" at={0} from={-R + 1} to={R - 1} />
        </>
      )}
      {context === "plot" && <Box position={[0, 0.06, R - 3]} size={[R * 1.6, 0.04, 4]} color={COLORS.road} shadow={false} />}
      <Zone sceneKey={sceneKey} qsLayer={qsLayer} />
      {children}
    </group>
  );
}
