"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Box, Decal, GEO, InstancedShape, Movers, Trees, type InstanceSpec, type MoverPath } from "./primitives";
import { COLORS, useSceneSettings, QUALITY_PRESETS } from "./settings";
import type { Vec3 } from "./layout";

export const WORLD_HALF = 48;
export const ROAD_WIDTH = 6;
export const LANE = 1.5;

/** Road centre-lines. Axis-aligned for crisp isometric reads. */
export const ROADS: { axis: "x" | "z"; at: number; from: number; to: number }[] = [
  { axis: "x", at: 0, from: -WORLD_HALF, to: WORLD_HALF },
  { axis: "z", at: 12, from: -WORLD_HALF, to: WORLD_HALF },
  { axis: "x", at: -24, from: -WORLD_HALF, to: WORLD_HALF },
  { axis: "z", at: -20, from: 0, to: WORLD_HALF },
];

const CROSSINGS: Vec3[] = [
  [12, 0, 0],
  [12, 0, -24],
  [-20, 0, 0],
];

function nearCrossing(x: number, z: number, pad = ROAD_WIDTH / 2 + 0.6) {
  return CROSSINGS.some((c) => Math.abs(c[0] - x) < pad && Math.abs(c[2] - z) < pad);
}

export function RoadSurface({ axis, at, from, to }: { axis: "x" | "z"; at: number; from: number; to: number }) {
  const len = to - from;
  const mid = (from + to) / 2;
  const pos: Vec3 = axis === "x" ? [mid, 0.02, at] : [at, 0.02, mid];
  const size: [number, number] = axis === "x" ? [len, ROAD_WIDTH] : [ROAD_WIDTH, len];
  return <Decal position={pos} size={size} color={COLORS.road} />;
}

function RoadMarkings({ density }: { density: number }) {
  const dashes = useMemo(() => {
    const out: InstanceSpec[] = [];
    for (const r of ROADS) {
      for (let d = r.from + 1.5; d < r.to - 1; d += 3.2) {
        const [x, z] = r.axis === "x" ? [d, r.at] : [r.at, d];
        if (nearCrossing(x, z)) continue;
        // Skip the closed section of the roadworks lane closure.
        if (r.axis === "x" && r.at === 0 && x > -46 && x < -24) continue;
        out.push({ position: [x, 0.02, z], rotationY: r.axis === "x" ? 0 : Math.PI / 2 });
      }
    }
    return out;
  }, []);
  void density;
  return <InstancedShape items={dashes} geometry={GEO.dash} color={COLORS.roadLine} castShadow={false} />;
}

/** Kerbs / footpaths: slightly raised pavement blocks between roads. */
function Blocks() {
  const blocks = useMemo(() => {
    const xs = [-WORLD_HALF, -20, 12, WORLD_HALF];
    const zs = [-WORLD_HALF, -24, 0, WORLD_HALF];
    const out: { pos: Vec3; size: Vec3 }[] = [];
    for (let i = 0; i < 3; i += 1) {
      for (let j = 0; j < 3; j += 1) {
        let x0 = xs[i];
        const x1 = xs[i + 1];
        const z0 = zs[j];
        const z1 = zs[j + 1];
        // Road x=-20 only runs south of z=0; merge the two northern-west blocks.
        if (j < 2 && i === 1) continue;
        if (j < 2 && i === 0) x0 = -WORLD_HALF;
        const right = j < 2 && i === 0 ? 12 : x1;
        const pad = (v: number, edge: number) => (Math.abs(v) === WORLD_HALF ? v : v + edge * (ROAD_WIDTH / 2));
        const ax = pad(x0, 1);
        const bx = pad(right, -1);
        const az = pad(z0, 1);
        const bz = pad(z1, -1);
        out.push({ pos: [(ax + bx) / 2, 0.06, (az + bz) / 2], size: [bx - ax, 0.12, bz - az] });
      }
    }
    return out;
  }, []);
  return (
    <group>
      {blocks.map((b, i) => (
        <group key={i}>
          <Box position={b.pos} size={b.size} color={COLORS.pavement} shadow={false} />
          <Box
            position={[b.pos[0], 0.13, b.pos[2]]}
            size={[Math.max(0.1, b.size[0] - 2.2), 0.04, Math.max(0.1, b.size[2] - 2.2)]}
            color={COLORS.grass}
            shadow={false}
          />
        </group>
      ))}
    </group>
  );
}

/** Background city fabric — instanced boxes so the whole skyline is a few draw calls. */
function Skyline({ density }: { density: number }) {
  const items = useMemo(() => {
    const spots: [number, number, number, number, number][] = [
      // x, z, w, d, h
      [24, -9, 5, 4, 6], [31, -9, 4, 4, 9], [38, -9, 5, 5, 5], [44, -10, 4, 6, 7],
      [24, -16, 4, 4, 4], [40, -17, 6, 4, 11], [44, -38, 5, 5, 8], [34, -40, 6, 5, 5],
      [-40, -36, 6, 6, 7], [-30, -38, 5, 6, 10], [-20, -40, 6, 5, 6], [-10, -36, 5, 5, 4],
      [-2, -40, 5, 6, 8], [3, -34, 4, 4, 5], [-44, 34, 5, 6, 5], [-28, 40, 6, 5, 7],
      [-8, 40, 7, 5, 6], [2, 36, 5, 5, 9], [22, 40, 5, 6, 6], [32, 38, 6, 6, 8],
      [42, 34, 5, 5, 5], [44, 26, 4, 4, 7], [-44, -14, 4, 5, 5], [-44, -4, 4, 4, 4],
      [5, -8, 4, 4, 4], [44, -30, 5, 4, 6], [-12, 30, 4, 4, 5], [8, 26, 4, 5, 6],
    ];
    const n = Math.max(10, Math.round(spots.length * density));
    return spots.slice(0, n).map(([x, z, w, d, h], i) => ({
      position: [x, 0.12, z] as Vec3,
      scale: [w, h, d] as Vec3,
      color: COLORS.building[i % COLORS.building.length],
    }));
  }, [density]);
  const roofs = useMemo(
    () =>
      items.map((b) => ({
        position: [b.position[0], b.scale[1] + 0.12, b.position[2]] as Vec3,
        scale: [b.scale[0] * 0.92, 0.18, b.scale[2] * 0.92] as Vec3,
      })),
    [items],
  );
  const windows = useMemo(
    () =>
      items.flatMap((b) => {
        const rows = Math.floor(b.scale[1] / 1.4);
        return Array.from({ length: rows }, (_, r) => ({
          position: [b.position[0], 0.9 + r * 1.4, b.position[2] + b.scale[2] / 2 + 0.01] as Vec3,
          scale: [b.scale[0] * 0.8, 0.45, 0.02] as Vec3,
        }));
      }),
    [items],
  );
  return (
    <group>
      <InstancedShape items={items} geometry={GEO.box} />
      <InstancedShape items={roofs} geometry={GEO.box} color="#CBD2CF" castShadow={false} />
      <InstancedShape items={windows} geometry={GEO.box} color={COLORS.glass} castShadow={false} />
    </group>
  );
}

function Greenery({ density }: { density: number }) {
  const trees = useMemo(() => {
    const out: { position: Vec3; scale?: number; round?: boolean }[] = [];
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const avoid: [number, number, number, number][] = [
      // x0, z0, x1, z1 — zones and buildings stay clear of trees
      [-34, -22, -2, -2], [-16, 4, 8, 26], [20, 4, 44, 28], [-46, 4, -24, 28], [14, -34, 30, -14],
      [-46, -4, -22, 4],
    ];
    for (let i = 0; i < 260; i += 1) {
      const x = (rand() * 2 - 1) * (WORLD_HALF - 2);
      const z = (rand() * 2 - 1) * (WORLD_HALF - 2);
      const onRoad = ROADS.some((r) =>
        r.axis === "x"
          ? Math.abs(z - r.at) < ROAD_WIDTH / 2 + 1.2 && x >= r.from && x <= r.to
          : Math.abs(x - r.at) < ROAD_WIDTH / 2 + 1.2 && z >= r.from && z <= r.to,
      );
      const inZone = avoid.some(([x0, z0, x1, z1]) => x > x0 && x < x1 && z > z0 && z < z1);
      if (onRoad || inZone) continue;
      out.push({ position: [x, 0.14, z], scale: 0.6 + rand() * 0.6, round: rand() > 0.55 });
    }
    return out.slice(0, Math.round(out.length * density));
  }, [density]);
  return <Trees items={trees} />;
}

/** Live traffic on the main roads. Lanes drive on the left (NZ). */
function Traffic({ density }: { density: number }) {
  const paths = useMemo<MoverPath[]>(() => {
    const n = (base: number) => Math.max(1, Math.round(base * density));
    const y = 0.1;
    // +x = east, +z = south. NZ drives on the left, so eastbound uses z = -LANE.
    const ps: MoverPath[] = [
      // Main road: the westbound lane is closed by the roadworks, so westbound
      // traffic follows a signed detour south down the x=-20 road.
      { points: [[-WORLD_HALF, y, -LANE], [WORLD_HALF, y, -LANE]], speed: 4.2, count: n(7), fadeEnds: true },
      { points: [[WORLD_HALF, y, LANE], [-20 + LANE, y, LANE], [-20 + LANE, y, WORLD_HALF]], speed: 5, count: n(7), fadeEnds: true },
      { points: [[-20 - LANE, y, WORLD_HALF], [-20 - LANE, y, -LANE], [WORLD_HALF, y, -LANE]], speed: 4.6, count: n(3), fadeEnds: true },
      { points: [[12 + LANE, y, -WORLD_HALF], [12 + LANE, y, WORLD_HALF]], speed: 5, count: n(6), fadeEnds: true },
      { points: [[12 - LANE, y, WORLD_HALF], [12 - LANE, y, -WORLD_HALF]], speed: 4.6, count: n(6), fadeEnds: true },
      { points: [[-WORLD_HALF, y, -24 - LANE], [WORLD_HALF, y, -24 - LANE]], speed: 4.2, count: n(5), fadeEnds: true },
      { points: [[WORLD_HALF, y, -24 + LANE], [-WORLD_HALF, y, -24 + LANE]], speed: 4.8, count: n(5), fadeEnds: true },
    ];
    return ps;
  }, [density]);
  return (
    <Movers
      paths={paths}
      colors={COLORS.car}
      geometries={[
        { geometry: GEO.carBody, useInstanceColor: true },
        { geometry: GEO.carCabin, color: "#DDE7EA" },
      ]}
    />
  );
}

function Streetlights() {
  const items = useMemo(() => {
    const out: InstanceSpec[] = [];
    for (let x = -44; x <= 44; x += 11) {
      if (!nearCrossing(x, 0, 6)) out.push({ position: [x, 0.12, 3.6] });
      if (!nearCrossing(x, -24, 6)) out.push({ position: [x, 0.12, -27.6] });
    }
    for (let z = -44; z <= 44; z += 11) if (!nearCrossing(12, z, 6)) out.push({ position: [15.6, 0.12, z] });
    return out;
  }, []);
  const poles = useMemo(() => items.map((i) => ({ ...i, scale: [0.08, 2.6, 0.08] as Vec3 })), [items]);
  const heads = useMemo(
    () => items.map((i) => ({ position: [i.position[0], 2.7, i.position[2]] as Vec3, scale: [0.5, 0.1, 0.22] as Vec3 })),
    [items],
  );
  return (
    <group>
      <InstancedShape items={poles} geometry={GEO.box} color={COLORS.steel} />
      <InstancedShape items={heads} geometry={GEO.box} color="#FFF4D6" emissive="#FFE7A8" emissiveIntensity={0.4} castShadow={false} />
    </group>
  );
}

/** The diorama slab the whole miniature world sits on. */
function Slab() {
  const edge = useMemo(() => new THREE.BoxGeometry(WORLD_HALF * 2 + 4, 3, WORLD_HALF * 2 + 4), []);
  return (
    <group>
      <mesh geometry={edge} position={[0, -1.5, 0]} receiveShadow>
        <meshStandardMaterial color="#D9DDD5" roughness={1} />
      </mesh>
      <mesh position={[0, -3.2, 0]}>
        <boxGeometry args={[WORLD_HALF * 2 + 4.4, 0.4, WORLD_HALF * 2 + 4.4]} />
        <meshStandardMaterial color={COLORS.ink} />
      </mesh>
      <Decal position={[0, 0.005, 0]} size={[WORLD_HALF * 2 + 4, WORLD_HALF * 2 + 4]} color={COLORS.ground} />
    </group>
  );
}

export function World() {
  const { quality } = useSceneSettings();
  const density = QUALITY_PRESETS[quality].density;
  return (
    <group>
      <Slab />
      <Blocks />
      {ROADS.map((r, i) => (
        <RoadSurface key={i} {...r} />
      ))}
      <RoadMarkings density={density} />
      <Skyline density={density} />
      <Greenery density={density} />
      <Streetlights />
      <Traffic density={density} />
    </group>
  );
}
