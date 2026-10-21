"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  Barriers,
  Beacon,
  Box,
  Cones,
  Cyl,
  Decal,
  Excavator,
  Fence,
  GEO,
  InstancedShape,
  lineOf,
  Movers,
  Sign,
  Vehicle,
  type MoverPath,
} from "../primitives";
import { COLORS, useSceneSettings } from "../settings";
import type { Vec3 } from "../layout";

export function People({ paths, color = COLORS.flare, colors }: { paths: MoverPath[]; color?: string; colors?: readonly string[] }) {
  return (
    <Movers
      paths={paths}
      colors={colors}
      baseColor={color}
      bob={0.04}
      geometries={[
        { geometry: GEO.person, useInstanceColor: Boolean(colors), color },
        { geometry: GEO.head, color: "#F1C9A5" },
      ]}
    />
  );
}

/* ------------------------------------------------------------------------ */
/* 01 — TMP: roadworks lane closure                                          */
/* ------------------------------------------------------------------------ */
export function RoadworksZone() {
  const cones = useMemo<Vec3[]>(
    () => [
      ...lineOf([-12.5, 0, 2.7], [-8, 0, 0.15], 0.9),
      ...lineOf([-7, 0, 0.15], [8, 0, 0.15], 1.5),
      ...lineOf([9, 0, 0.15], [11, 0, 2.7], 0.9),
    ],
    [],
  );
  const workers = useMemo<MoverPath[]>(
    () => [
      { points: [[-3, 0, 2.6], [3, 0, 2.6]], speed: 0.6, count: 2 },
      { points: [[4.5, 0, 0.8], [5.5, 0, 2.4]], speed: 0.4, count: 1 },
    ],
    [],
  );
  return (
    <group>
      {/* Trench and spoil */}
      <Decal position={[0, 0.03, 1.7]} size={[10, 1.3]} color="#5B4636" />
      <Box position={[0, 0.02, 1.7]} size={[10, 0.04, 0.12]} color={COLORS.soilDark} shadow={false} />
      {[-3.5, -1, 1.5].map((x) => (
        <mesh key={x} position={[x, 0.25, 2.65]} castShadow>
          <sphereGeometry args={[0.7, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={COLORS.soil} roughness={1} />
        </mesh>
      ))}
      {/* Pipe stack */}
      {[0, 1, 2].map((i) => (
        <Cyl key={i} radius={0.22} height={3} position={[6.5, 0.24 + (i === 2 ? 0.38 : 0), 2.3 + (i === 2 ? 0 : i * 0.46 - 0.23)]} rotation={[0, 0, Math.PI / 2]} color="#3A7FC1" />
      ))}
      <Cones positions={cones} />
      <Excavator position={[-6, 0, 1.7]} />
      <Vehicle kind="ute" position={[3.5, 0, 1.8]} color={COLORS.white} />
      {/* Arrow board trailer */}
      <group position={[-10.2, 0, 1.7]}>
        <Box size={[1.4, 0.3, 1]} position={[0, 0.35, 0]} color={COLORS.ink} />
        <Box size={[0.12, 1.6, 1.6]} position={[-0.3, 1.4, 0]} color={COLORS.ink} />
        {[-0.5, -0.17, 0.17, 0.5].map((z, i) => (
          <Beacon key={z} position={[-0.38, 1.4 + (i % 2 ? 0.25 : -0.1), z]} size={0.1} speed={6} />
        ))}
      </group>
      <People paths={workers} color={COLORS.flare} />
      {/* Advance signage + temporary speed limit + Stop/Go */}
      <Sign kind="warning" position={[-17, 0, 3.8]} rotationY={Math.PI / 2} />
      <Sign kind="speed" position={[-14.5, 0, 3.8]} rotationY={Math.PI / 2} />
      <Sign kind="stop" position={[-12.8, 0, -3.6]} rotationY={Math.PI / 2} />
      <Sign kind="warning" position={[14, 0, -3.8]} rotationY={-Math.PI / 2} />
      <Sign kind="stop" position={[11.6, 0, 3.6]} rotationY={-Math.PI / 2} />
      <Sign kind="detour" position={[16, 0, 3.8]} rotationY={-Math.PI / 2} />
      {/* Pedestrian route: temporary footpath decal */}
      <Decal position={[0, 0.16, 4.6]} size={[22, 0.9]} color={COLORS.teal} opacity={0.55} />
    </group>
  );
}

/* ------------------------------------------------------------------------ */
/* 02 — Site-specific TMP: intersection                                      */
/* ------------------------------------------------------------------------ */
function TrafficSignal({ position, phase }: { position: Vec3; phase: number }) {
  const red = useRef<THREE.MeshStandardMaterial>(null);
  const green = useRef<THREE.MeshStandardMaterial>(null);
  const { motion } = useSceneSettings();
  useFrame(({ clock }) => {
    const on = motion ? Math.floor(clock.elapsedTime / 4 + phase) % 2 === 0 : phase === 0;
    if (red.current) red.current.emissiveIntensity = on ? 0.1 : 2;
    if (green.current) green.current.emissiveIntensity = on ? 2 : 0.1;
  });
  return (
    <group position={position}>
      <Cyl radius={0.07} height={2.6} position={[0, 1.3, 0]} color={COLORS.ink} />
      <Box size={[0.32, 0.8, 0.32]} position={[0, 2.5, 0]} color={COLORS.ink} />
      <mesh position={[0.17, 2.72, 0]}>
        <sphereGeometry args={[0.09, 8, 6]} />
        <meshStandardMaterial ref={red} color="#FF3B30" emissive="#FF3B30" />
      </mesh>
      <mesh position={[0.17, 2.3, 0]}>
        <sphereGeometry args={[0.09, 8, 6]} />
        <meshStandardMaterial ref={green} color="#2BD67B" emissive="#2BD67B" />
      </mesh>
    </group>
  );
}

function Zebra({ position, rotationY }: { position: Vec3; rotationY: number }) {
  const items = useMemo(
    () => Array.from({ length: 7 }, (_, i) => ({ position: [0, 0.03, -2.4 + i * 0.8] as Vec3, scale: [1.8, 0.01, 0.4] as Vec3 })),
    [],
  );
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <InstancedShape items={items} geometry={GEO.box} color={COLORS.white} castShadow={false} />
    </group>
  );
}

export function IntersectionZone() {
  const peds = useMemo<MoverPath[]>(
    () => [
      { points: [[-4.3, 0, -3.4], [-4.3, 0, 3.4]], speed: 0.9, count: 2 },
      { points: [[4.3, 0, 3.4], [4.3, 0, -3.4]], speed: 0.8, count: 2 },
      { points: [[-3.4, 0, 4.3], [3.4, 0, 4.3]], speed: 0.85, count: 2 },
      { points: [[3.6, 0, -6], [3.6, 0, -14]], speed: 0.7, count: 2 },
    ],
    [],
  );
  const bikes = useMemo<MoverPath[]>(
    () => [
      { points: [[-14, 0.05, -2.6], [14, 0.05, -2.6]], speed: 2.4, count: 2, fadeEnds: true },
      { points: [[2.6, 0.05, -14], [2.6, 0.05, 14]], speed: 2.2, count: 1, fadeEnds: true },
    ],
    [],
  );
  const bikeGeo = useMemo(() => new THREE.BoxGeometry(0.9, 0.5, 0.12).translate(0, 0.45, 0), []);
  const riderGeo = useMemo(() => new THREE.CapsuleGeometry(0.13, 0.3, 3, 6).translate(0, 0.95, 0), []);
  // Construction truck entering the driveway of the corner site.
  const truck = useMemo<MoverPath[]>(() => [{ points: [[14, 0.1, 1.5], [6.5, 0.1, 1.5], [6.5, 0.1, 8.5]], speed: 1.6, count: 1 }], []);
  const truckGeo = useMemo(() => new THREE.BoxGeometry(3.2, 1.3, 1.3).translate(0, 0.85, 0), []);
  return (
    <group>
      <Zebra position={[-4.3, 0, 0]} rotationY={0} />
      <Zebra position={[4.3, 0, 0]} rotationY={0} />
      <Zebra position={[0, 0, 4.3]} rotationY={Math.PI / 2} />
      <Zebra position={[0, 0, -4.3]} rotationY={Math.PI / 2} />
      {/* Cycle lane */}
      <Decal position={[0, 0.025, -2.6]} size={[28, 0.7]} color="#3FAE6A" opacity={0.7} />
      <TrafficSignal position={[-3.6, 0, -3.6]} phase={0} />
      <TrafficSignal position={[3.6, 0, 3.6]} phase={0} />
      <TrafficSignal position={[3.6, 0, -3.6]} phase={1} />
      <TrafficSignal position={[-3.6, 0, 3.6]} phase={1} />
      {/* Corner construction site with driveway */}
      <Decal position={[6.5, 0.17, 6]} size={[2.4, 5]} color="#B9BDB6" />
      <Fence from={[8, 0.12, 4]} to={[14, 0.12, 4]} />
      <Fence from={[14, 0.12, 4]} to={[14, 0.12, 12]} />
      <Fence from={[5.2, 0.12, 12]} to={[14, 0.12, 12]} />
      <Box position={[10.5, 0.12, 9]} size={[4.5, 0.2, 4.5]} color={COLORS.concrete} />
      <Movers paths={truck} geometries={[{ geometry: truckGeo, color: COLORS.yellow }]} />
      <People paths={peds} colors={["#3D7BFF", "#21B7AA", "#FF6542", "#17232B", "#F6B73C"]} />
      <Movers
        paths={bikes}
        geometries={[
          { geometry: bikeGeo, color: COLORS.ink },
          { geometry: riderGeo, color: "#3FAE6A" },
        ]}
      />
      {/* Bus stop */}
      <group position={[-7, 0.12, 4.2]}>
        <Box size={[2.4, 0.08, 0.9]} position={[0, 2, 0]} color={COLORS.teal} />
        <Box size={[0.08, 2, 0.08]} position={[-1.1, 1, -0.35]} color={COLORS.steel} />
        <Box size={[0.08, 2, 0.08]} position={[1.1, 1, -0.35]} color={COLORS.steel} />
      </group>
      <Vehicle kind="van" position={[-9, 0.1, 1.5]} color="#F6B73C" />
    </group>
  );
}

/* ------------------------------------------------------------------------ */
/* 03 — Event traffic management: festival                                   */
/* ------------------------------------------------------------------------ */
export function EventZone() {
  const { quality } = useSceneSettings();
  const stalls = useMemo(() => {
    const out: { position: Vec3; color: string }[] = [];
    const palette = [COLORS.flare, COLORS.teal, COLORS.white, COLORS.yellow];
    for (let i = 0; i < 6; i += 1) {
      out.push({ position: [-9 + i * 2.6, 0.14, -3], color: palette[i % 4] });
      out.push({ position: [-9 + i * 2.6, 0.14, 1.4], color: palette[(i + 2) % 4] });
    }
    return out;
  }, []);
  const roofs = useMemo(() => stalls.map((s) => ({ position: s.position, color: s.color })), [stalls]);
  const bases = useMemo(() => stalls.map((s) => ({ position: s.position })), [stalls]);
  const crowdCount = quality === "low" ? 2 : quality === "medium" ? 3 : 5;
  const crowd = useMemo<MoverPath[]>(
    () => [
      { points: [[-10, 0.14, -0.8], [6, 0.14, -0.8]], speed: 0.7, count: crowdCount * 3 },
      { points: [[6, 0.14, -0.2], [-10, 0.14, -0.2]], speed: 0.6, count: crowdCount * 3 },
      { points: [[8, 0.14, -4], [10.5, 0.14, -2], [8, 0.14, 0], [10.5, 0.14, 2]], speed: 0.5, count: crowdCount * 2, loop: true },
      { points: [[-12, 0.14, 5], [-12, 0.14, -0.5], [-10, 0.14, -0.5]], speed: 0.8, count: crowdCount },
    ],
    [crowdCount],
  );
  const parked = useMemo(() => {
    const out: { position: Vec3; rotationY: number; color: string }[] = [];
    for (let i = 0; i < 8; i += 1) {
      if (i === 3) continue;
      out.push({ position: [3 + i * 1.3, 0.14, 5.8], rotationY: Math.PI / 2, color: COLORS.car[i % COLORS.car.length] });
    }
    return out;
  }, []);
  const parkedBodies = useMemo(() => parked.map((p) => ({ ...p })), [parked]);
  const parkedCabins = useMemo(() => parked.map((p) => ({ position: p.position, rotationY: p.rotationY })), [parked]);
  return (
    <group>
      <Decal position={[0, 0.16, -0.6]} size={[26, 8.6]} color="#BFD6A8" />
      {/* Stage */}
      <group position={[10, 0.14, -0.8]}>
        <Box size={[3, 0.6, 5]} position={[0.6, 0.3, 0]} color={COLORS.ink} />
        <Box size={[0.2, 3, 5]} position={[1.9, 2, 0]} color={COLORS.ink} />
        <Box size={[3, 0.15, 5.2]} position={[0.6, 3.5, 0]} color={COLORS.flare} />
        <Beacon position={[-0.6, 3.3, -1.8]} color={COLORS.teal} speed={3} />
        <Beacon position={[-0.6, 3.3, 1.8]} color={COLORS.flare} speed={3.5} />
      </group>
      <InstancedShape items={bases} geometry={GEO.stallBase} color={COLORS.white} />
      <InstancedShape items={roofs} geometry={GEO.stall} />
      {/* Barriers: perimeter with gaps for gates and the emergency route */}
      <Barriers from={[-13, 0.14, -5]} to={[12.5, 0.14, -5]} />
      <Barriers from={[-13, 0.14, 3.6]} to={[-3, 0.14, 3.6]} />
      <Barriers from={[1, 0.14, 3.6]} to={[12.5, 0.14, 3.6]} />
      <Barriers from={[-13, 0.14, -5]} to={[-13, 0.14, 1]} />
      {/* Emergency access route */}
      <Decal position={[-1, 0.17, 2.8]} size={[24, 0.9]} color="#D93A2B" opacity={0.5} />
      <Decal position={[-1, 0.18, 5.4]} size={[1.6, 5]} color="#D93A2B" opacity={0.5} />
      <Vehicle kind="ambulance" position={[-1, 0.14, 7]} rotationY={Math.PI / 2} />
      {/* Parking */}
      <Decal position={[7.5, 0.16, 5.8]} size={[11, 3]} color="#B9BDB6" />
      <InstancedShape items={parkedBodies} geometry={GEO.carBody} />
      <InstancedShape items={parkedCabins} geometry={GEO.carCabin} color="#DDE7EA" />
      <People
        paths={crowd}
        colors={["#FF6542", "#21B7AA", "#3D7BFF", "#F6B73C", "#17232B", "#E85D9A", "#FFFFFF"]}
      />
      <Sign kind="info" position={[-13.8, 0.14, 4.4]} />
      <Sign kind="detour" position={[-5, 0.14, 4.6]} />
    </group>
  );
}

/* ------------------------------------------------------------------------ */
/* 04 — On-call advisory: site with revised plan overlay                     */
/* ------------------------------------------------------------------------ */
function PlanOverlay() {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const { motion } = useSceneSettings();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (group.current && motion) group.current.position.y = 4.2 + Math.sin(t * 1.2) * 0.15;
    if (mat.current) mat.current.opacity = motion ? 0.16 + (Math.sin(t * 2) + 1) * 0.05 : 0.2;
  });
  const grid = useMemo(() => {
    const out: { position: Vec3; scale: Vec3 }[] = [];
    for (let i = -4; i <= 4; i += 1) {
      out.push({ position: [i * 1.2, 0, 0], scale: [0.03, 0.02, 9.6] });
      out.push({ position: [0, 0, i * 1.2], scale: [9.6, 0.02, 0.03] });
    }
    return out;
  }, []);
  return (
    <group ref={group} position={[0, 4.2, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial ref={mat} color={COLORS.teal} transparent opacity={0.2} depthWrite={false} side={THREE.DoubleSide} emissive={COLORS.teal} emissiveIntensity={0.4} />
      </mesh>
      <InstancedShape items={grid} geometry={GEO.box} color={COLORS.teal} emissive={COLORS.teal} emissiveIntensity={0.8} castShadow={false} />
      {/* Revised route drawn on the plan */}
      <Box position={[-1.2, 0.05, -2.4]} size={[6, 0.06, 0.18]} color={COLORS.flare} emissive={COLORS.flare} emissiveIntensity={0.8} shadow={false} />
      <Box position={[1.8, 0.05, 0]} size={[0.18, 0.06, 4.8]} color={COLORS.flare} emissive={COLORS.flare} emissiveIntensity={0.8} shadow={false} />
      <Box position={[3.2, 0.05, 2.4]} size={[2.8, 0.06, 0.18]} color={COLORS.flare} emissive={COLORS.flare} emissiveIntensity={0.8} shadow={false} />
    </group>
  );
}

export function AdvisoryZone() {
  const flow = useMemo<MoverPath[]>(
    () => [{ points: [[-8, 0.2, -6.5], [-1, 0.2, -6.5], [-1, 0.2, 5.5], [8, 0.2, 5.5]], speed: 1.6, count: 9, fadeEnds: true }],
    [],
  );
  return (
    <group>
      <Decal position={[0, 0.17, 0]} size={[16, 11]} color="#D8CBB7" />
      <Fence from={[-8, 0.14, -5.5]} to={[8, 0.14, -5.5]} />
      <Fence from={[8, 0.14, -5.5]} to={[8, 0.14, 4.5]} />
      <Fence from={[-8, 0.14, -5.5]} to={[-8, 0.14, 4.5]} />
      <Fence from={[-8, 0.14, 4.5]} to={[2, 0.14, 4.5]} />
      {/* Site office + container */}
      <Box position={[-5.5, 0.14 + 0.6, -3.5]} size={[3.4, 1.2, 1.8]} color={COLORS.white} />
      <Box position={[-5.5, 1.4, -3.5]} size={[3.5, 0.12, 1.9]} color={COLORS.teal} />
      <Box position={[-5.5, 0.14 + 0.6, 2.4]} size={[3, 1.2, 1.4]} color={COLORS.flare} />
      <Excavator position={[2.5, 0.14, -1]} rotationY={Math.PI} />
      <Vehicle kind="tipper" position={[4.5, 0.14, 2.2]} rotationY={Math.PI} color={COLORS.white} />
      {[[-1.5, 1.5], [0, 2.4], [-2.3, -1.2]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.14, z]} castShadow>
          <coneGeometry args={[0.9, 0.9, 8]} />
          <meshStandardMaterial color={i === 1 ? "#9BA3A8" : COLORS.soil} roughness={1} />
        </mesh>
      ))}
      <PlanOverlay />
      <Movers paths={flow} geometries={[{ geometry: GEO.chevron, color: COLORS.teal }]} emissive={COLORS.teal} />
      <Sign kind="info" position={[3, 0.14, 5]} />
    </group>
  );
}
