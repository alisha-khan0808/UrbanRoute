"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { OUTLINES, project } from "./nz-geo";
import { COLORS, QUALITY_PRESETS, type Quality } from "@/components/three/settings";
import type { Region } from "@/lib/content/types";

const K = 4; // map units → world units
const DEPTH = 1.4;

function Islands() {
  const geometries = useMemo(
    () =>
      OUTLINES.map((poly) => {
        const shape = new THREE.Shape(poly.map(([x, y]) => new THREE.Vector2(x * K, -y * K)));
        const g = new THREE.ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: true, bevelSize: 0.25, bevelThickness: 0.25, bevelSegments: 2 });
        g.rotateX(-Math.PI / 2);
        return g;
      }),
    [],
  );
  return (
    <group>
      {geometries.map((g, i) => (
        <mesh key={i} geometry={g} castShadow receiveShadow>
          <meshStandardMaterial attach="material-0" color="#FDFDFB" roughness={0.9} />
          <meshStandardMaterial attach="material-1" color="#C9D4CC" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Marker({ region, active, onSelect }: { region: Region; active: boolean; onSelect: (id: string) => void }) {
  const ref = useRef<THREE.Group>(null);
  const [x, y] = project(region.longitude, region.latitude);
  useFrame((_, delta) => {
    if (!ref.current) return;
    const target = active ? 1.6 : 1;
    ref.current.scale.y = THREE.MathUtils.damp(ref.current.scale.y, target, 8, delta);
  });
  const color = active ? COLORS.flare : region.status === "experience" ? COLORS.teal : COLORS.steel;
  return (
    <group position={[x * K, DEPTH + 0.25, y * K]}>
      <group ref={ref}>
        <mesh position={[0, 1.2, 0]} castShadow onClick={() => onSelect(region.id)}>
          <cylinderGeometry args={[0.12, 0.12, 2.4, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, 2.5, 0]} castShadow onClick={() => onSelect(region.id)}>
          <sphereGeometry args={[0.45, 16, 12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 0.5 : 0.1} />
        </mesh>
      </group>
      {active && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[1.1, 1.5, 32]} />
          <meshBasicMaterial color={COLORS.flare} transparent opacity={0.7} />
        </mesh>
      )}
      {active && (
        <Html position={[0, 4.4, 0]} center zIndexRange={[20, 0]}>
          <span className="whitespace-nowrap rounded-full bg-ink px-3 py-1 text-xs font-bold text-white shadow-lift">{region.name}</span>
        </Html>
      )}
    </group>
  );
}

/** Pull the camera back on narrow containers so both islands always fit. */
function FitCamera() {
  const { camera, size } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const k = aspect < 1.05 ? Math.min(1.9, 1.05 / aspect) : 1;
  camera.position.set(6 * k, 62 * k, 44 * k);
  camera.lookAt(0, 0, 0);
  return null;
}

function Rig({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ pointer }, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, pointer.x * 0.12, 3, delta);
    ref.current.rotation.x = THREE.MathUtils.damp(ref.current.rotation.x, -pointer.y * 0.05, 3, delta);
  });
  return <group ref={ref}>{children}</group>;
}

export default function NZMap3D({
  regions,
  selected,
  onSelect,
  quality,
  active = true,
}: {
  regions: Region[];
  selected: string | null;
  onSelect: (id: string) => void;
  quality: Quality;
  active?: boolean;
}) {
  const preset = QUALITY_PRESETS[quality];
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      shadows={preset.shadows}
      dpr={preset.dpr}
      camera={{ fov: 30, position: [6, 62, 44], near: 1, far: 300 }}
      onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
    >
      <color attach="background" args={[COLORS.paper]} />
      <FitCamera />
      <hemisphereLight args={["#FFF8EE", "#B9C4BD", 1.2]} />
      <directionalLight position={[20, 40, 20]} intensity={1.8} castShadow={preset.shadows} shadow-mapSize={[1024, 1024]}>
        <orthographicCamera attach="shadow-camera" args={[-35, 35, 35, -35, 1, 120]} />
      </directionalLight>
      <Rig>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
          <circleGeometry args={[34, 64]} />
          <meshStandardMaterial color="#DCEFEC" />
        </mesh>
        <Islands />
        {regions.map((r) => (
          <Marker key={r.id} region={r} active={r.id === selected} onSelect={onSelect} />
        ))}
      </Rig>
    </Canvas>
  );
}
