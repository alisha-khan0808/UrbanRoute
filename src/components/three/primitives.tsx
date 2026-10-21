"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { COLORS, useSceneSettings } from "./settings";
import type { Vec3 } from "./layout";

/* ------------------------------------------------------------------------ */
/* Basic shapes                                                              */
/* ------------------------------------------------------------------------ */

type MeshProps = {
  position?: Vec3;
  rotation?: Vec3;
  color?: string;
  emissive?: string;
  emissiveIntensity?: number;
  opacity?: number;
  roughness?: number;
  metalness?: number;
  shadow?: boolean;
};

function Mat({ color = COLORS.white, emissive, emissiveIntensity = 0, opacity = 1, roughness = 0.8, metalness = 0 }: MeshProps) {
  return (
    <meshStandardMaterial
      color={color}
      emissive={emissive ?? "#000000"}
      emissiveIntensity={emissiveIntensity}
      transparent={opacity < 1}
      opacity={opacity}
      depthWrite={opacity >= 1}
      roughness={roughness}
      metalness={metalness}
    />
  );
}

export function Box({ size = [1, 1, 1], shadow = true, ...p }: MeshProps & { size?: Vec3 }) {
  return (
    <mesh position={p.position} rotation={p.rotation} castShadow={shadow} receiveShadow>
      <boxGeometry args={size} />
      <Mat {...p} />
    </mesh>
  );
}

export function Cyl({
  radius = 0.5,
  radiusTop,
  height = 1,
  segments = 16,
  shadow = true,
  ...p
}: MeshProps & { radius?: number; radiusTop?: number; height?: number; segments?: number }) {
  return (
    <mesh position={p.position} rotation={p.rotation} castShadow={shadow} receiveShadow>
      <cylinderGeometry args={[radiusTop ?? radius, radius, height, segments]} />
      <Mat {...p} />
    </mesh>
  );
}

/** Flat decal on the ground (road markings, overlays). */
export function Decal({ size, position, color, opacity = 1, rotationY = 0 }: { size: [number, number]; position: Vec3; color: string; opacity?: number; rotationY?: number }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, rotationY]} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
    </mesh>
  );
}

/* ------------------------------------------------------------------------ */
/* Instanced helpers                                                         */
/* ------------------------------------------------------------------------ */

export interface InstanceSpec {
  position: Vec3;
  rotationY?: number;
  scale?: Vec3;
  color?: string;
}

const tmpObj = new THREE.Object3D();
const tmpColor = new THREE.Color();

/** Static instanced mesh: one draw call for any number of identical shapes. */
export function InstancedShape({
  items,
  geometry,
  color = COLORS.white,
  emissive,
  emissiveIntensity = 0,
  castShadow = true,
}: {
  items: InstanceSpec[];
  geometry: THREE.BufferGeometry;
  color?: string;
  emissive?: string;
  emissiveIntensity?: number;
  castShadow?: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    items.forEach((it, i) => {
      tmpObj.position.set(...it.position);
      tmpObj.rotation.set(0, it.rotationY ?? 0, 0);
      tmpObj.scale.set(...(it.scale ?? [1, 1, 1]));
      tmpObj.updateMatrix();
      mesh.setMatrixAt(i, tmpObj.matrix);
      if (it.color) mesh.setColorAt(i, tmpColor.set(it.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);
  if (items.length === 0) return null;
  return (
    <instancedMesh
      key={items.length}
      ref={ref}
      args={[geometry, undefined, items.length]}
      castShadow={castShadow}
      receiveShadow
    >
      <meshStandardMaterial color={items[0]?.color ? COLORS.white : color} emissive={emissive ?? "#000"} emissiveIntensity={emissiveIntensity} roughness={0.75} />
    </instancedMesh>
  );
}

/* Shared geometries (created once, reused by every instance) */
export const GEO = {
  coneBody: new THREE.ConeGeometry(0.22, 0.7, 10).translate(0, 0.42, 0),
  coneBase: new THREE.BoxGeometry(0.5, 0.08, 0.5).translate(0, 0.04, 0),
  box: new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
  barrier: new THREE.BoxGeometry(1.6, 0.5, 0.18).translate(0, 0.25, 0),
  fence: new THREE.BoxGeometry(2, 0.9, 0.05).translate(0, 0.45, 0),
  person: new THREE.CapsuleGeometry(0.16, 0.42, 3, 8).translate(0, 0.38, 0),
  head: new THREE.SphereGeometry(0.13, 8, 6).translate(0, 0.86, 0),
  treeTop: new THREE.ConeGeometry(0.9, 2.2, 7).translate(0, 2.2, 0),
  treeRound: new THREE.IcosahedronGeometry(1, 0).translate(0, 2.1, 0),
  trunk: new THREE.CylinderGeometry(0.12, 0.16, 1.2, 6).translate(0, 0.6, 0),
  dash: new THREE.PlaneGeometry(1.4, 0.14).rotateX(-Math.PI / 2).translate(0, 0.012, 0),
  chevron: new THREE.ConeGeometry(0.45, 0.9, 3).rotateX(Math.PI / 2).scale(1, 0.25, 1).translate(0, 0.08, 0),
  carBody: new THREE.BoxGeometry(1.9, 0.55, 0.95).translate(0, 0.42, 0),
  carCabin: new THREE.BoxGeometry(1.05, 0.42, 0.85).translate(-0.1, 0.9, 0),
  stall: new THREE.ConeGeometry(1.25, 0.9, 4).rotateY(Math.PI / 4).translate(0, 1.85, 0),
  stallBase: new THREE.BoxGeometry(1.6, 1.4, 1.6).translate(0, 0.7, 0),
};

export function Cones({ positions }: { positions: Vec3[] }) {
  const items = useMemo(() => positions.map((p) => ({ position: p })), [positions]);
  return (
    <group>
      <InstancedShape items={items} geometry={GEO.coneBody} color={COLORS.flare} />
      <InstancedShape items={items} geometry={GEO.coneBase} color={COLORS.ink} castShadow={false} />
    </group>
  );
}

/** Evenly spaced points from a to b (inclusive). */
export function lineOf(a: Vec3, b: Vec3, spacing: number): Vec3[] {
  const d = Math.hypot(b[0] - a[0], b[2] - a[2]);
  const n = Math.max(1, Math.round(d / spacing));
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t] as Vec3;
  });
}

export function Barriers({ from, to, color = COLORS.white, spacing = 1.7 }: { from: Vec3; to: Vec3; color?: string; spacing?: number }) {
  const items = useMemo(() => {
    const rot = -Math.atan2(to[2] - from[2], to[0] - from[0]);
    return lineOf(from, to, spacing).map((p) => ({ position: p, rotationY: rot }));
  }, [from, to, spacing]);
  return <InstancedShape items={items} geometry={GEO.barrier} color={color} />;
}

export function Fence({ from, to, color = COLORS.steel }: { from: Vec3; to: Vec3; color?: string }) {
  const items = useMemo(() => {
    const rot = -Math.atan2(to[2] - from[2], to[0] - from[0]);
    const pts = lineOf(from, to, 2);
    return pts.slice(0, -1).map((p, i) => {
      const q = pts[i + 1];
      return { position: [(p[0] + q[0]) / 2, 0, (p[2] + q[2]) / 2] as Vec3, rotationY: rot };
    });
  }, [from, to]);
  return <InstancedShape items={items} geometry={GEO.fence} color={color} />;
}

export function Trees({ items }: { items: { position: Vec3; scale?: number; round?: boolean }[] }) {
  const conical = useMemo(
    () => items.filter((t) => !t.round).map((t) => ({ position: t.position, scale: [t.scale ?? 1, t.scale ?? 1, t.scale ?? 1] as Vec3 })),
    [items],
  );
  const round = useMemo(
    () => items.filter((t) => t.round).map((t) => ({ position: t.position, scale: [t.scale ?? 1, t.scale ?? 1, t.scale ?? 1] as Vec3 })),
    [items],
  );
  const trunks = useMemo(() => [...conical, ...round], [conical, round]);
  return (
    <group>
      <InstancedShape items={trunks} geometry={GEO.trunk} color="#8A6A4F" />
      <InstancedShape items={conical} geometry={GEO.treeTop} color={COLORS.grassDark} />
      <InstancedShape items={round} geometry={GEO.treeRound} color="#9CC08A" />
    </group>
  );
}

/* ------------------------------------------------------------------------ */
/* Props                                                                     */
/* ------------------------------------------------------------------------ */

export function Sign({
  position,
  rotationY = 0,
  kind = "warning",
}: {
  position: Vec3;
  rotationY?: number;
  kind?: "warning" | "speed" | "stop" | "detour" | "info";
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Cyl radius={0.05} height={1.6} position={[0, 0.8, 0]} color={COLORS.steel} />
      {kind === "warning" && (
        <group position={[0, 1.65, 0]} rotation={[0, 0, Math.PI / 4]}>
          <Box size={[0.6, 0.6, 0.05]} color={COLORS.flare} />
          <Box size={[0.3, 0.3, 0.06]} color={COLORS.ink} />
        </group>
      )}
      {kind === "speed" && (
        <group position={[0, 1.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <Cyl radius={0.36} height={0.05} color="#D93A2B" segments={20} />
          <Cyl radius={0.27} height={0.07} color={COLORS.white} segments={20} />
        </group>
      )}
      {kind === "stop" && (
        <group position={[0, 1.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <Cyl radius={0.32} height={0.06} color="#D93A2B" segments={8} />
        </group>
      )}
      {kind === "detour" && <Box size={[0.9, 0.4, 0.05]} position={[0, 1.6, 0]} color={COLORS.yellow} />}
      {kind === "info" && <Box size={[0.9, 0.55, 0.05]} position={[0, 1.6, 0]} color={COLORS.teal} />}
    </group>
  );
}

export function Vehicle({
  position,
  rotationY = 0,
  kind = "car",
  color = COLORS.white,
}: {
  position: Vec3;
  rotationY?: number;
  kind?: "car" | "ute" | "truck" | "tipper" | "ambulance" | "van";
  color?: string;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {kind === "car" && (
        <>
          <Box size={[1.9, 0.55, 0.95]} position={[0, 0.42, 0]} color={color} />
          <Box size={[1.05, 0.42, 0.85]} position={[-0.1, 0.9, 0]} color="#DDE7EA" />
        </>
      )}
      {kind === "ute" && (
        <>
          <Box size={[2.3, 0.55, 1]} position={[0, 0.45, 0]} color={color} />
          <Box size={[0.9, 0.5, 0.9]} position={[0.45, 0.98, 0]} color="#DDE7EA" />
          <Box size={[0.15, 0.12, 0.9]} position={[0.95, 1.29, 0]} color={COLORS.yellow} emissive={COLORS.yellow} emissiveIntensity={0.8} />
        </>
      )}
      {kind === "van" && (
        <>
          <Box size={[2.3, 1.1, 1.05]} position={[0, 0.75, 0]} color={color} />
          <Box size={[0.5, 0.45, 0.95]} position={[1.0, 1.0, 0]} color="#DDE7EA" />
        </>
      )}
      {kind === "ambulance" && (
        <>
          <Box size={[2.5, 1.2, 1.1]} position={[0, 0.8, 0]} color={COLORS.white} />
          <Box size={[2.5, 0.18, 1.12]} position={[0, 0.6, 0]} color="#D93A2B" />
          <Box size={[0.3, 0.14, 0.6]} position={[0.6, 1.47, 0]} color="#3D7BFF" emissive="#3D7BFF" emissiveIntensity={1} />
        </>
      )}
      {(kind === "truck" || kind === "tipper") && (
        <>
          <Box size={[1.1, 1.3, 1.3]} position={[1.4, 0.95, 0]} color={color} />
          <Box size={[1.12, 0.45, 1.25]} position={[1.42, 1.25, 0]} color="#DDE7EA" />
          <Box size={[3.6, 0.3, 1.25]} position={[-0.3, 0.45, 0]} color={COLORS.ink} />
          {kind === "tipper" ? (
            <Box size={[2.6, 0.9, 1.3]} position={[-0.6, 1.05, 0]} color={COLORS.yellow} />
          ) : (
            <Box size={[2.6, 1.4, 1.3]} position={[-0.6, 1.3, 0]} color={COLORS.white} />
          )}
          <Box size={[0.4, 0.12, 0.8]} position={[1.4, 1.66, 0]} color={COLORS.flare} emissive={COLORS.flare} emissiveIntensity={0.9} />
        </>
      )}
      {[-0.65, 0.65].map((x) =>
        [-0.5, 0.5].map((z) => (
          <Cyl
            key={`${x}${z}`}
            radius={0.2}
            height={0.16}
            position={[kind === "truck" || kind === "tipper" ? x * 1.7 : x, 0.2, z * (kind === "car" ? 0.95 : 1.15)]}
            rotation={[Math.PI / 2, 0, 0]}
            color="#1B1F22"
            shadow={false}
          />
        )),
      )}
    </group>
  );
}

export function Excavator({ position, rotationY = 0, animate = true }: { position: Vec3; rotationY?: number; animate?: boolean }) {
  const arm = useRef<THREE.Group>(null);
  const { motion } = useSceneSettings();
  useFrame(({ clock }) => {
    if (!arm.current || !motion || !animate) return;
    arm.current.rotation.z = -0.35 + Math.sin(clock.elapsedTime * 0.9) * 0.25;
  });
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Box size={[1.9, 0.35, 1.3]} position={[0, 0.2, 0]} color={COLORS.ink} />
      <Box size={[1.4, 0.8, 1.15]} position={[-0.15, 0.8, 0]} color={COLORS.yellow} />
      <Box size={[0.55, 0.6, 0.55]} position={[0.35, 1.45, 0.25]} color="#DDE7EA" />
      <group ref={arm} position={[0.5, 1.0, -0.2]} rotation={[0, 0, -0.35]}>
        <Box size={[1.9, 0.22, 0.22]} position={[0.95, 0, 0]} color={COLORS.yellow} />
        <group position={[1.9, 0, 0]} rotation={[0, 0, -1.2]}>
          <Box size={[1.2, 0.18, 0.18]} position={[0.6, 0, 0]} color={COLORS.yellow} />
          <Box size={[0.4, 0.35, 0.45]} position={[1.25, -0.05, 0]} color={COLORS.ink} />
        </group>
      </group>
    </group>
  );
}

/** Flashing amber beacon / arrow board light. */
export function Beacon({ position, color = COLORS.yellow, speed = 4, size = 0.12 }: { position: Vec3; color?: string; speed?: number; size?: number }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const { motion } = useSceneSettings();
  useFrame(({ clock }) => {
    if (!mat.current) return;
    mat.current.emissiveIntensity = motion ? (Math.sin(clock.elapsedTime * speed) > 0 ? 2.2 : 0.2) : 1.4;
  });
  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 10, 8]} />
      <meshStandardMaterial ref={mat} color={color} emissive={color} emissiveIntensity={1} />
    </mesh>
  );
}

/* ------------------------------------------------------------------------ */
/* Animated movers (instanced)                                               */
/* ------------------------------------------------------------------------ */

export interface MoverPath {
  points: Vec3[];
  /** Loop back to the start (true) or ping-pong (false). */
  loop?: boolean;
  speed: number;
  count: number;
  color?: string;
  /** Fade (scale) in/out near the ends of open paths. */
  fadeEnds?: boolean;
}

function samplePath(points: Vec3[], lengths: number[], total: number, d: number, out: THREE.Vector3, dir: THREE.Vector3) {
  let i = 0;
  while (i < lengths.length - 1 && d > lengths[i]) {
    d -= lengths[i];
    i += 1;
  }
  const a = points[i];
  const b = points[i + 1] ?? points[i];
  const t = lengths[i] ? Math.min(1, d / lengths[i]) : 0;
  out.set(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
  dir.set(b[0] - a[0], 0, b[2] - a[2]).normalize();
  void total;
}

/**
 * Moves instances of a geometry along polyline paths. Used for traffic,
 * pedestrians, cyclists and flow arrows — one draw call per geometry.
 */
export function Movers({
  paths,
  geometries,
  baseColor,
  colors,
  bob = 0,
  emissive,
}: {
  paths: MoverPath[];
  geometries: { geometry: THREE.BufferGeometry; color?: string; useInstanceColor?: boolean }[];
  baseColor?: string;
  colors?: readonly string[];
  bob?: number;
  emissive?: string;
}) {
  const { motion } = useSceneSettings();
  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const prepared = useMemo(() => {
    const agents: { path: number; offset: number; color: string }[] = [];
    const meta = paths.map((p) => {
      const pts = p.loop ? [...p.points, p.points[0]] : p.points;
      const lengths = pts.slice(0, -1).map((a, i) => Math.hypot(pts[i + 1][0] - a[0], pts[i + 1][2] - a[2]));
      return { pts, lengths, total: lengths.reduce((s, l) => s + l, 0) };
    });
    let k = 0;
    paths.forEach((p, pi) => {
      for (let i = 0; i < p.count; i += 1) {
        const color = p.color ?? colors?.[k % (colors?.length || 1)] ?? baseColor ?? COLORS.white;
        agents.push({ path: pi, offset: (i / p.count) * meta[pi].total + ((k * 7.31) % 1.5), color });
        k += 1;
      }
    });
    return { agents, meta };
  }, [paths, colors, baseColor]);

  const pos = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);

  const update = (time: number) => {
    const { agents, meta } = prepared;
    agents.forEach((agent, i) => {
      const p = paths[agent.path];
      const m = meta[agent.path];
      if (m.total === 0) return;
      let d = agent.offset + time * p.speed;
      let reverse = false;
      if (p.loop || p.fadeEnds) d = ((d % m.total) + m.total) % m.total;
      else {
        const cycle = ((d % (2 * m.total)) + 2 * m.total) % (2 * m.total);
        reverse = cycle > m.total;
        d = reverse ? 2 * m.total - cycle : cycle;
      }
      samplePath(m.pts, m.lengths, m.total, d, pos, dir);
      if (reverse) dir.negate();
      let s = 1;
      if (p.fadeEnds && !p.loop) s = Math.min(1, d / 2, (m.total - d) / 2);
      tmpObj.position.copy(pos);
      if (bob) tmpObj.position.y += Math.abs(Math.sin(time * 6 + i)) * bob;
      tmpObj.rotation.set(0, Math.atan2(-dir.z, dir.x), 0);
      tmpObj.scale.setScalar(Math.max(0.001, s));
      tmpObj.updateMatrix();
      refs.current.forEach((mesh) => mesh?.setMatrixAt(i, tmpObj.matrix));
    });
    refs.current.forEach((mesh) => {
      if (mesh) mesh.instanceMatrix.needsUpdate = true;
    });
  };

  useLayoutEffect(() => {
    refs.current.forEach((mesh, gi) => {
      if (!mesh || !geometries[gi]?.useInstanceColor) return;
      prepared.agents.forEach((a, i) => mesh.setColorAt(i, tmpColor.set(a.color)));
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
    update(motion ? performance.now() / 1000 : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prepared]);

  useFrame(({ clock }) => {
    if (motion) update(clock.elapsedTime);
  });

  const count = prepared.agents.length;
  if (count === 0) return null;
  return (
    <group>
      {geometries.map((g, gi) => (
        <instancedMesh
          key={`${gi}-${count}`}
          ref={(m) => {
            refs.current[gi] = m;
          }}
          args={[g.geometry, undefined, count]}
          frustumCulled={false}
        >
          <meshStandardMaterial
            color={g.useInstanceColor ? COLORS.white : g.color ?? baseColor ?? COLORS.white}
            emissive={emissive ?? "#000"}
            emissiveIntensity={emissive ? 0.6 : 0}
            roughness={0.6}
          />
        </instancedMesh>
      ))}
    </group>
  );
}
