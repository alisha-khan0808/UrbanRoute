"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { aspectDistanceScale, fovForAspect, INTRO_START, type CameraView } from "./layout";

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

interface Flight {
  curve: THREE.CatmullRomCurve3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
  start: number;
  duration: number;
}

function scaled(view: CameraView, aspect: number) {
  const k = aspectDistanceScale(aspect);
  const target = new THREE.Vector3(...view.target);
  const offset = new THREE.Vector3(...view.position).sub(target).multiplyScalar(k);
  return { position: target.clone().add(offset), target };
}

/**
 * Drives the camera along predetermined paths between approved presets.
 * - `view` changes trigger a flight along a lifted Catmull-Rom curve.
 * - `intro` performs the aerial descent from INTRO_START on first mount.
 * - `instant` (reduced motion / skip) jumps straight to the destination.
 */
export function CameraController({
  view,
  intro,
  instant,
  skipToken,
  onArrive,
  shift = [0, 0],
}: {
  view: CameraView;
  intro: boolean;
  instant: boolean;
  /** Increment to finish any in-progress flight immediately. */
  skipToken: number;
  onArrive?: () => void;
  /**
   * Screen-space framing shift as a fraction of the viewport, so the focus
   * stays visible beside the side panel (desktop) or above the sheet (mobile).
   */
  shift?: [number, number];
}) {
  const { camera, size, pointer } = useThree();
  const currentShift = useRef<[number, number]>([0, 0]);

  useEffect(() => () => (camera as THREE.PerspectiveCamera).clearViewOffset(), [camera]);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = fovForAspect(size.width / Math.max(1, size.height));
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  const flight = useRef<Flight | null>(null);
  const lookAt = useRef(new THREE.Vector3());
  const rest = useRef<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null);
  const initialised = useRef(false);
  const arrive = useRef(onArrive);
  arrive.current = onArrive;
  const aspect = size.width / Math.max(1, size.height);

  const fly = (from: THREE.Vector3, fromTarget: THREE.Vector3, dest: { position: THREE.Vector3; target: THREE.Vector3 }, duration: number) => {
    const mid = from.clone().lerp(dest.position, 0.5);
    const lift = Math.min(28, from.distanceTo(dest.position) * 0.28);
    mid.y = Math.max(mid.y, Math.max(from.y, dest.position.y)) + lift;
    flight.current = {
      curve: new THREE.CatmullRomCurve3([from.clone(), mid, dest.position.clone()], false, "centripetal"),
      fromTarget: fromTarget.clone(),
      toTarget: dest.target.clone(),
      start: performance.now(),
      duration,
    };
  };

  useEffect(() => {
    const dest = scaled(view, aspect);
    rest.current = dest;
    if (!initialised.current) {
      initialised.current = true;
      if (intro && !instant) {
        const start = scaled(INTRO_START, 1);
        camera.position.copy(start.position);
        lookAt.current.copy(start.target);
        camera.lookAt(lookAt.current);
        flight.current = {
          curve: new THREE.CatmullRomCurve3([
            start.position,
            new THREE.Vector3(dest.position.x * 0.35, dest.position.y + 50, dest.position.z * 0.55),
            dest.position.clone(),
          ]),
          fromTarget: start.target,
          toTarget: dest.target.clone(),
          start: performance.now() + 100,
          duration: 2400,
        };
        return;
      }
      camera.position.copy(dest.position);
      lookAt.current.copy(dest.target);
      camera.lookAt(lookAt.current);
      arrive.current?.();
      return;
    }
    if (instant) {
      flight.current = null;
      camera.position.copy(dest.position);
      lookAt.current.copy(dest.target);
      camera.lookAt(lookAt.current);
      arrive.current?.();
      return;
    }
    const distance = camera.position.distanceTo(dest.position);
    fly(camera.position, lookAt.current, dest, THREE.MathUtils.clamp(900 + distance * 22, 1100, 2400));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, instant, aspect]);

  // Skip: jump to the end of the current flight.
  useEffect(() => {
    if (skipToken === 0 || !rest.current) return;
    flight.current = null;
    camera.position.copy(rest.current.position);
    lookAt.current.copy(rest.current.target);
    camera.lookAt(lookAt.current);
    arrive.current?.();
  }, [skipToken, camera]);

  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const k = instant ? 1 : 0.06;
    const [sx, sy] = currentShift.current;
    const nx = sx + (shift[0] - sx) * k;
    const ny = sy + (shift[1] - sy) * k;
    const resized = !cam.view || cam.view.fullWidth !== size.width || cam.view.fullHeight !== size.height;
    if (Math.abs(nx - sx) > 1e-4 || Math.abs(ny - sy) > 1e-4 || resized) {
      currentShift.current = [nx, ny];
      cam.setViewOffset(size.width, size.height, nx * size.width, ny * size.height, size.width, size.height);
    }

    const f = flight.current;
    if (f) {
      const raw = (performance.now() - f.start) / f.duration;
      const t = easeInOutCubic(THREE.MathUtils.clamp(raw, 0, 1));
      camera.position.copy(f.curve.getPoint(t));
      lookAt.current.lerpVectors(f.fromTarget, f.toTarget, t);
      camera.lookAt(lookAt.current);
      if (raw >= 1) {
        flight.current = null;
        arrive.current?.();
      }
      return;
    }
    // Idle: gentle pointer parallax around the resting position.
    if (!instant && rest.current) {
      const goal = rest.current.position.clone().add(new THREE.Vector3(pointer.x * 2.2, pointer.y * 1.2, -pointer.x * 1.2));
      camera.position.lerp(goal, 0.04);
      lookAt.current.lerp(rest.current.target, 0.08);
      camera.lookAt(lookAt.current);
    }
  });

  return null;
}
