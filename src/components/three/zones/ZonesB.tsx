"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Beacon, Box, Cyl, Decal, Fence, GEO, InstancedShape, Movers, Sign, Vehicle, type MoverPath } from "../primitives";
import { COLORS, useSceneSettings } from "../settings";
import type { Vec3 } from "../layout";
import { People } from "./ZonesA";

/* ------------------------------------------------------------------------ */
/* 05 — Quantity surveying: building cutaway with selectable layers          */
/* ------------------------------------------------------------------------ */
export type QsLayer = "drainage" | "roofing" | "tanking";

function layerMat(active: boolean, dimmed: boolean, base: string) {
  return {
    color: active ? COLORS.flare : base,
    emissive: active ? COLORS.flare : undefined,
    emissiveIntensity: active ? 0.55 : 0,
    opacity: dimmed ? 0.35 : 1,
  };
}

export function QsZone({ layer = null }: { layer?: QsLayer | null }) {
  const H = 2.6; // ground level of the plinth
  const W = 3.2; // storey height
  const roofRise = 2;
  const theta = Math.atan2(roofRise, 3.5);
  const slope = Math.hypot(3.5, roofRise);
  const is = (l: QsLayer) => layer === l;
  const dim = (l: QsLayer) => layer !== null && layer !== l;
  const drainage = layerMat(is("drainage"), dim("drainage"), "#3A7FC1");
  const tanking = layerMat(is("tanking"), dim("tanking"), "#2B3F86");
  const roofing = layerMat(is("roofing"), dim("roofing"), "#3C4850");
  const structureDim = layer !== null ? 0.9 : 1;

  return (
    <group>
      {/* Soil plinth, cut open at the front to reveal the section */}
      <Box position={[0, H / 2, -5]} size={[12, H, 2]} color={COLORS.soil} />
      <Box position={[-5, H / 2, 1]} size={[2, H, 10]} color={COLORS.soil} />
      <Box position={[5, H / 2, -0.5]} size={[2, H, 7]} color={COLORS.soil} />
      <Box position={[0, H + 0.06, -5]} size={[12, 0.12, 2]} color={COLORS.grass} />
      <Box position={[-5, H + 0.06, 1]} size={[2, 0.12, 10]} color={COLORS.grass} />
      <Box position={[5, H + 0.06, -0.5]} size={[2, 0.12, 7]} color={COLORS.grass} />
      {/* Strata lines on the cut faces */}
      <Box position={[-5, H * 0.45, 6.01]} size={[2, 0.08, 0.02]} color={COLORS.soilDark} shadow={false} />
      <Box position={[5, H * 0.45, 3.01]} size={[2, 0.08, 0.02]} color={COLORS.soilDark} shadow={false} />

      {/* Basement: retaining walls + slab */}
      <group>
        <Box position={[0, 0.12, -0.5]} size={[8, 0.24, 7]} color={COLORS.concrete} opacity={structureDim} />
        <Box position={[0, H / 2, -3.85]} size={[8, H, 0.3]} color={COLORS.concrete} opacity={structureDim} />
        <Box position={[-3.85, H / 2, -0.5]} size={[0.3, H, 7]} color={COLORS.concrete} opacity={structureDim} />
        <Box position={[3.85, H / 2, -0.5]} size={[0.3, H, 7]} color={COLORS.concrete} opacity={structureDim} />
      </group>

      {/* Tanking & waterproofing: membranes outside walls and under slab */}
      <group>
        <Box position={[0, H / 2, -4.07]} size={[8.3, H - 0.1, 0.1]} {...tanking} />
        <Box position={[-4.07, H / 2, -0.5]} size={[0.1, H - 0.1, 7.2]} {...tanking} />
        <Box position={[4.07, H / 2, -0.5]} size={[0.1, H - 0.1, 7.2]} {...tanking} />
        <Box position={[0, 0.02, -0.5]} size={[8.3, 0.04, 7.3]} {...tanking} shadow={false} />
      </group>

      {/* Drainage: open trench at the front with pipe, bedding and manholes */}
      <Box position={[1, 0.15, 4.5]} size={[10, 0.3, 1]} color="#BDBAB2" opacity={layer && !is("drainage") ? 0.4 : 1} />
      <Cyl radius={0.22} height={10} position={[1, 0.45, 4.5]} rotation={[0, 0, Math.PI / 2]} {...drainage} />
      {[-3.4, 5].map((x) => (
        <group key={x} position={[x, 0, 4.5]}>
          <Cyl radius={0.55} height={H} position={[0, H / 2, 0]} {...drainage} color={is("drainage") ? COLORS.flare : "#7F8A90"} />
          <Cyl radius={0.6} height={0.1} position={[0, H + 0.05, 0]} color={COLORS.ink} />
        </group>
      ))}
      {/* Backfill marker + reinstatement */}
      <Box position={[1, H - 0.05, 5.6]} size={[10, 0.1, 0.8]} color={COLORS.road} opacity={0.9} shadow={false} />

      {/* Superstructure: cutaway walls */}
      <group position={[0, H, 0]}>
        <Box position={[0, 0.1, -0.5]} size={[8.2, 0.2, 7.2]} color="#EEEAE2" />
        <Box position={[0, W / 2, -3.9]} size={[8, W, 0.25]} color={COLORS.building[0]} opacity={structureDim} />
        <Box position={[-3.9, W / 2, -0.5]} size={[0.25, W, 7]} color={COLORS.building[1]} opacity={structureDim} />
        <Box position={[3.9, W / 4, -2]} size={[0.25, W / 2, 4]} color={COLORS.building[1]} opacity={structureDim} />
        {/* Windows */}
        {[-2, 0.5, 2.6].map((x) => (
          <Box key={x} position={[x, W * 0.55, -3.76]} size={[1.2, 1.2, 0.04]} color={COLORS.glass} shadow={false} />
        ))}
        {/* Interior props */}
        <Box position={[-1.5, 0.6, -2]} size={[2, 0.9, 1]} color={COLORS.teal} />
        <Box position={[1.8, 0.45, 0.5]} size={[1.2, 0.7, 1.2]} color={COLORS.white} />
      </group>

      {/* Roof structure + roofing layer */}
      <group position={[0, H + W, -0.5]}>
        {/* North pitch: finished cladding */}
        <group position={[0, roofRise / 2, -1.75]} rotation={[-theta, 0, 0]}>
          <Box size={[8.8, 0.18, slope + 0.3]} color="#56636B" opacity={layer && !is("roofing") ? 0.5 : 1} />
        </group>
        {/* South pitch: cut back to show membrane over rafters */}
        <group position={[0, roofRise / 2, 1.75]} rotation={[theta, 0, 0]}>
          {[-3.6, -1.8, 0, 1.8, 3.6].map((x) => (
            <Box key={x} position={[x, -0.12, 0]} size={[0.14, 0.18, slope]} color="#C49A6C" />
          ))}
          <Box position={[1.6, 0.02, 0]} size={[5.4, 0.06, slope]} {...roofing} />
        </group>
        {/* Ridge flashing */}
        <Box position={[0, roofRise + 0.05, 0]} size={[8.9, 0.14, 0.4]} {...roofing} />
        {/* Gutters */}
        <Box position={[0, 0, -3.75]} size={[8.9, 0.2, 0.28]} {...roofing} />
        <Box position={[0, 0, 3.75]} size={[8.9, 0.2, 0.28]} {...roofing} />
      </group>
      {/* Downpipes into the drainage */}
      {[
        [4.2, 3.2],
        [-4.2, -4.2],
      ].map(([x, z]) => (
        <Cyl key={`${x}${z}`} radius={0.08} height={W} position={[x, H + W / 2, z]} {...roofing} />
      ))}
      <Cyl radius={0.08} height={H} position={[4.2, H / 2 + 0.3, 3.2]} {...drainage} />
    </group>
  );
}

/* ------------------------------------------------------------------------ */
/* 06 — Project coordination: site progressing through stages                */
/* ------------------------------------------------------------------------ */
export const COORDINATION_STAGE_SECONDS = 2.4;

export function CoordinationZone() {
  const { motion } = useSceneSettings();
  const stages = useRef<(THREE.Group | null)[]>([]);
  const markers = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const jib = useRef<THREE.Group>(null);
  const hook = useRef<THREE.Group>(null);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const stage = motion ? Math.floor(t / COORDINATION_STAGE_SECONDS) % 6 : 5;
    stages.current.forEach((g, i) => {
      if (!g) return;
      const target = i <= stage ? 1 : 0;
      const s = motion ? THREE.MathUtils.damp(g.scale.y, target, 6, delta) : target;
      g.scale.y = Math.max(0.0001, s);
      g.visible = s > 0.01;
    });
    markers.current.forEach((m, i) => {
      if (m) m.emissiveIntensity = i <= stage ? 1 : 0;
    });
    if (jib.current && motion) jib.current.rotation.y = Math.sin(t * 0.35) * 1.1;
    if (hook.current && motion) hook.current.position.y = 7 + Math.sin(t * 0.8) * 1.5;
  });

  const columns = useMemo(() => {
    const out: { position: Vec3; scale: Vec3 }[] = [];
    for (const x of [-3, -1, 1, 3]) for (const z of [-2.5, 0, 2.5]) out.push({ position: [x, 0, z], scale: [0.25, 2.4, 0.25] });
    return out;
  }, []);

  const setStage = (i: number) => (g: THREE.Group | null) => {
    stages.current[i] = g;
  };

  return (
    <group>
      <Decal position={[0, 0.17, 0]} size={[16, 14]} color="#D8CBB7" />
      <Fence from={[-8, 0.14, -7]} to={[8, 0.14, -7]} />
      <Fence from={[-8, 0.14, 7]} to={[3, 0.14, 7]} />
      <Fence from={[-8, 0.14, -7]} to={[-8, 0.14, 7]} />
      <Fence from={[8, 0.14, -7]} to={[8, 0.14, 7]} />
      {/* Stage 0: scope & setout pegs */}
      <group ref={setStage(0)} position={[0, 0.14, 0]}>
        {[
          [-4, -3.5],
          [4, -3.5],
          [-4, 3.5],
          [4, 3.5],
        ].map(([x, z]) => (
          <Box key={`${x}${z}`} position={[x, 0.3, z]} size={[0.12, 0.6, 0.12]} color={COLORS.flare} />
        ))}
      </group>
      {/* Stage 1: foundations */}
      <group ref={setStage(1)} position={[0, 0.14, 0]}>
        <Box position={[0, 0.15, 0]} size={[8, 0.3, 7]} color={COLORS.concrete} />
      </group>
      {/* Stage 2: frame level 1 */}
      <group ref={setStage(2)} position={[0, 0.44, 0]}>
        <InstancedShape items={columns} geometry={GEO.box} color={COLORS.steel} />
        <Box position={[0, 2.5, 0]} size={[8, 0.2, 7]} color="#B8BCB6" />
      </group>
      {/* Stage 3: frame level 2 */}
      <group ref={setStage(3)} position={[0, 3.1, 0]}>
        <InstancedShape items={columns} geometry={GEO.box} color={COLORS.steel} />
        <Box position={[0, 2.5, 0]} size={[8, 0.2, 7]} color="#B8BCB6" />
      </group>
      {/* Stage 4: cladding / glazing */}
      <group ref={setStage(4)} position={[0, 0.44, 0]}>
        <Box position={[0, 2.7, 3.55]} size={[8, 5.2, 0.1]} color={COLORS.glass} opacity={0.75} />
        <Box position={[-4.05, 2.7, 0]} size={[0.1, 5.2, 7]} color={COLORS.building[2]} />
      </group>
      {/* Stage 5: handover */}
      <group ref={setStage(5)} position={[0, 5.9, 0]}>
        <Box position={[0, 0.1, 0]} size={[8.4, 0.25, 7.4]} color={COLORS.teal} />
      </group>
      {/* Tower crane */}
      <group position={[6, 0.14, -5]}>
        <Box position={[0, 5, 0]} size={[0.5, 10, 0.5]} color={COLORS.yellow} />
        <group ref={jib} position={[0, 10, 0]}>
          <Box position={[-2.5, 0, 0]} size={[12, 0.35, 0.35]} color={COLORS.yellow} />
          <Box position={[3.2, -0.4, 0]} size={[1.2, 0.8, 0.8]} color={COLORS.ink} />
          <group ref={hook} position={[-6.5, 7, 0]}>
            <Box position={[0, 1.5, 0]} size={[0.04, 3, 0.04]} color={COLORS.ink} shadow={false} />
            <Box position={[0, -0.1, 0]} size={[1.2, 0.3, 0.6]} color={COLORS.flare} />
          </group>
          <Beacon position={[-8.4, 0.3, 0]} color="#FF3B30" speed={2} />
        </group>
      </group>
      {/* Stage progress markers */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[-5 + i * 2, 0.22, 6.2]}>
          <boxGeometry args={[1.5, 0.12, 0.5]} />
          <meshStandardMaterial
            ref={(m) => {
              markers.current[i] = m;
            }}
            color={COLORS.teal}
            emissive={COLORS.teal}
            emissiveIntensity={0}
          />
        </mesh>
      ))}
      <Vehicle kind="ute" position={[-6, 0.14, -5]} color={COLORS.white} />
      <People paths={[{ points: [[-6, 0.14, 4], [-2, 0.14, 4.5]], speed: 0.5, count: 2 }]} color={COLORS.flare} />
    </group>
  );
}

/* ------------------------------------------------------------------------ */
/* 07 — TIA: development with vehicle-flow overlays                          */
/* ------------------------------------------------------------------------ */
function PulseRing({ position, color, radius = 4 }: { position: Vec3; color: string; radius?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const { motion } = useSceneSettings();
  useFrame(({ clock }) => {
    if (!ref.current || !mat.current) return;
    const p = motion ? (clock.elapsedTime * 0.5) % 1 : 0.4;
    ref.current.scale.setScalar(0.4 + p * 0.8);
    mat.current.opacity = 0.6 * (1 - p);
  });
  return (
    <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius * 0.92, radius, 48]} />
      <meshBasicMaterial ref={mat} color={color} transparent depthWrite={false} />
    </mesh>
  );
}

export function TiaZone() {
  const inbound = useMemo<MoverPath[]>(
    () => [
      { points: [[-16, 0.2, -1.5], [-1.5, 0.2, -1.5], [-1.5, 0.2, -9], [6, 0.2, -9]], speed: 2.4, count: 12, fadeEnds: true },
      { points: [[1.5, 0.2, 16], [1.5, 0.2, -1], [-1.5, 0.2, -1], [-1.5, 0.2, -9], [6, 0.2, -9]], speed: 2.4, count: 0, fadeEnds: true },
    ],
    [],
  );
  const outbound = useMemo<MoverPath[]>(
    () => [{ points: [[6, 0.2, -7.6], [1.5, 0.2, -7.6], [1.5, 0.2, 16]], speed: 2.2, count: 11, fadeEnds: true }],
    [],
  );
  const through = useMemo<MoverPath[]>(
    () => [{ points: [[16, 0.2, 1.5], [-16, 0.2, 1.5]], speed: 2.6, count: 8, fadeEnds: true }],
    [],
  );
  const parking = useMemo(() => {
    const out: { position: Vec3; rotationY: number; color: string }[] = [];
    for (let i = 0; i < 5; i += 1) {
      out.push({ position: [14 + i * 1.3, 0.14, -12], rotationY: Math.PI / 2, color: COLORS.car[(i + 2) % COLORS.car.length] });
      if (i % 2 === 0) out.push({ position: [14 + i * 1.3, 0.14, -6.8], rotationY: Math.PI / 2, color: COLORS.car[i % COLORS.car.length] });
    }
    return out;
  }, []);
  return (
    <group>
      {/* Proposed development */}
      <group position={[9, 0.14, -9]}>
        <Box position={[0, 0.15, 0]} size={[7.5, 0.3, 6.5]} color={COLORS.concrete} />
        <Box position={[0, 4.5, 0]} size={[6.5, 8.4, 5.5]} color={COLORS.glass} opacity={0.88} roughness={0.2} metalness={0.2} />
        {[1.6, 3.7, 5.8, 7.9].map((y) => (
          <Box key={y} position={[0, y, 0]} size={[6.7, 0.16, 5.7]} color={COLORS.white} />
        ))}
        <Box position={[0, 8.9, 0]} size={[6.9, 0.3, 5.9]} color={COLORS.teal} />
        <Box position={[-2.4, 9.4, -1.5]} size={[1.2, 0.8, 1.2]} color={COLORS.steel} />
      </group>
      {/* Access driveway + parking + loading bay */}
      <Decal position={[4.2, 0.16, -8.3]} size={[3, 3.2]} color="#B9BDB6" />
      <Decal position={[16.6, 0.16, -9.4]} size={[7.5, 7.2]} color="#B9BDB6" />
      <InstancedShape items={parking} geometry={GEO.carBody} />
      <InstancedShape items={parking.map((p) => ({ position: p.position, rotationY: p.rotationY }))} geometry={GEO.carCabin} color="#DDE7EA" />
      <Decal position={[9, 0.17, -13.3]} size={[4, 1.6]} color={COLORS.yellow} opacity={0.7} />
      <Vehicle kind="truck" position={[9, 0.14, -13.3]} color={COLORS.flare} />
      {/* Flow overlays */}
      <Movers paths={inbound} geometries={[{ geometry: GEO.chevron, color: COLORS.teal }]} emissive={COLORS.teal} />
      <Movers paths={outbound} geometries={[{ geometry: GEO.chevron, color: COLORS.flare }]} emissive={COLORS.flare} />
      <Movers paths={through} geometries={[{ geometry: GEO.chevron, color: "#9AA6AD" }]} />
      <PulseRing position={[0, 0.2, 0]} color={COLORS.teal} radius={4.2} />
      <PulseRing position={[3.2, 0.2, -8.3]} color={COLORS.flare} radius={2} />
      {/* Count stations */}
      {[
        [-6, 3.6],
        [3.6, 6],
      ].map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0.14, z]}>
          <Box position={[0, 0.6, 0]} size={[0.15, 1.2, 0.15]} color={COLORS.steel} />
          <Box position={[0, 1.35, 0]} size={[0.7, 0.45, 0.12]} color={COLORS.ink} emissive={COLORS.teal} emissiveIntensity={0.3} />
        </group>
      ))}
      <People paths={[{ points: [[3.6, 0.14, -4], [3.6, 0.14, -14]], speed: 0.7, count: 2 }]} colors={["#3D7BFF", "#F6B73C"]} />
      <Sign kind="info" position={[3.6, 0.14, -10.6]} />
    </group>
  );
}
