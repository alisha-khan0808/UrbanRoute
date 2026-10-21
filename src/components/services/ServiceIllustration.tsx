import { cn } from "@/lib/utils";

/**
 * Static isometric illustrations used as the no-WebGL / reduced-data
 * fallback for each 3D scene, and as lightweight card art.
 */
const C = {
  ink: "#17232B",
  road: "#2C3740",
  flare: "#FF6542",
  teal: "#21B7AA",
  grass: "#C9DDB8",
  ground: "#E4E8E1",
  white: "#FFFFFF",
  glass: "#9FD3D6",
  soil: "#B98B62",
  yellow: "#F6B73C",
  blue: "#3A7FC1",
};

/* Map (x, y) on an isometric grid to SVG coordinates. */
const iso = (x: number, y: number, z = 0) => [200 + (x - y) * 17, 120 + (x + y) * 9.8 - z * 19] as const;
const pts = (list: [number, number, number?][]) => list.map(([x, y, z]) => iso(x, y, z ?? 0).join(",")).join(" ");

function Tile({ x0, y0, x1, y1, fill, z = 0 }: { x0: number; y0: number; x1: number; y1: number; fill: string; z?: number }) {
  return <polygon points={pts([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]])} fill={fill} />;
}

function Block({ x, y, w, d, h, top, left = "#D5D9D2", right = "#C2C8C0" }: { x: number; y: number; w: number; d: number; h: number; top: string; left?: string; right?: string }) {
  return (
    <g>
      <polygon points={pts([[x, y + d, 0], [x + w, y + d, 0], [x + w, y + d, h], [x, y + d, h]])} fill={left} />
      <polygon points={pts([[x + w, y, 0], [x + w, y + d, 0], [x + w, y + d, h], [x + w, y, h]])} fill={right} />
      <polygon points={pts([[x, y, h], [x + w, y, h], [x + w, y + d, h], [x, y + d, h]])} fill={top} />
    </g>
  );
}

function Cone({ x, y }: { x: number; y: number }) {
  const [cx, cy] = iso(x, y);
  return <polygon points={`${cx - 3},${cy} ${cx + 3},${cy} ${cx},${cy - 10}`} fill={C.flare} />;
}

function Person({ x, y, color = C.flare }: { x: number; y: number; color?: string }) {
  const [cx, cy] = iso(x, y);
  return (
    <g>
      <rect x={cx - 2} y={cy - 9} width={4} height={8} rx={2} fill={color} />
      <circle cx={cx} cy={cy - 11} r={2} fill="#F1C9A5" />
    </g>
  );
}

function Arrow({ from, to, color }: { from: [number, number]; to: [number, number]; color: string }) {
  const [x1, y1] = iso(...from);
  const [x2, y2] = iso(...to);
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={3} strokeDasharray="6 5" strokeLinecap="round" markerEnd="url(#arrow)" />;
}

function Scene({ sceneKey }: { sceneKey: string }) {
  const road = <Tile x0={-6} y0={-1} x1={6} y1={1} fill={C.road} />;
  const crossRoad = (
    <>
      {road}
      <Tile x0={-1} y0={-6} x1={1} y1={6} fill={C.road} />
    </>
  );
  switch (sceneKey) {
    case "roadworks":
      return (
        <>
          {road}
          <Tile x0={-2} y0={0.2} x1={3} y1={0.9} fill="#5B4636" />
          {[-4, -3.2, -2.4, -1.6, -0.8, 0, 0.8, 1.6, 2.4, 3.2, 4].map((x, i) => (
            <Cone key={x} x={x} y={i < 2 ? 0.8 - i * 0.4 : 0.05} />
          ))}
          <Block x={3.5} y={0.2} w={1.3} d={0.6} h={0.7} top={C.white} />
          <Person x={0} y={1.4} />
          <Person x={1.2} y={1.5} />
        </>
      );
    case "intersection":
      return (
        <>
          {crossRoad}
          {[-0.8, -0.4, 0, 0.4, 0.8].map((v) => (
            <Tile key={v} x0={v - 0.12} y0={1.2} x1={v + 0.12} y1={1.9} fill={C.white} />
          ))}
          <Person x={-0.4} y={1.5} color="#3D7BFF" />
          <Person x={0.6} y={1.6} color={C.teal} />
          <Block x={2} y={2} w={3} d={3} h={0.2} top="#C9CCC6" />
          <Block x={2.5} y={1.3} w={1.6} d={0.6} h={0.8} top={C.yellow} />
        </>
      );
    case "event":
      return (
        <>
          <Tile x0={-5} y0={-4} x1={5} y1={4} fill="#BFD6A8" />
          {[-3, -1, 1, 3].map((x) => (
            <Block key={x} x={x} y={-2} w={1.1} d={1.1} h={0.9} top={x % 2 ? C.flare : C.teal} left={C.white} right="#EEE" />
          ))}
          {[-3, -1.5, 0, 1.5, 3].map((x) => (
            <Person key={x} x={x} y={0.6} color={x > 0 ? C.teal : C.flare} />
          ))}
          <Tile x0={-5} y0={2.4} x1={5} y1={2.9} fill="#D93A2B" />
        </>
      );
    case "advisory":
      return (
        <>
          <Tile x0={-5} y0={-4} x1={5} y1={4} fill="#D8CBB7" />
          <Block x={-4} y={-3} w={2.4} d={1.2} h={0.8} top={C.teal} left={C.white} right="#EEE" />
          <Block x={1} y={-1} w={1.4} d={1} h={0.8} top={C.yellow} />
          <Tile x0={-4} y0={-4} x1={4} y1={4} fill={C.teal} z={2.4} />
          <Arrow from={[-4, 2]} to={[3, 2]} color={C.flare} />
        </>
      );
    case "qs":
      return (
        <>
          <Block x={-4} y={-4} w={8} d={8} h={1.2} top={C.grass} left={C.soil} right="#A57A54" />
          <Block x={-2.5} y={-2.5} w={5} d={4} h={3.6} top="#56636B" left="#F3EFE7" right="#E6E1D6" />
          <line x1={iso(-4, 4.4)[0]} y1={iso(-4, 4.4)[1] - 6} x2={iso(4, 4.4)[0]} y2={iso(4, 4.4)[1] - 6} stroke={C.blue} strokeWidth={5} />
          <Tile x0={-2.6} y0={1.4} x1={2.6} y1={1.6} fill={C.flare} z={1.2} />
        </>
      );
    case "coordination":
      return (
        <>
          <Tile x0={-5} y0={-4} x1={5} y1={4} fill="#D8CBB7" />
          <Block x={-2.5} y={-2} w={5} d={4} h={0.3} top="#C9CCC6" />
          <Block x={-2.5} y={-2} w={5} d={4} h={2.2} top="#B8BCB6" left="rgba(159,211,214,.85)" right="#DCE3E5" />
          <Block x={3.4} y={-3.4} w={0.4} d={0.4} h={6} top={C.yellow} left={C.yellow} right="#D9A02F" />
          <line x1={iso(3.6, -3.6, 6)[0]} y1={iso(3.6, -3.6, 6)[1]} x2={iso(-3, -3.6, 6)[0]} y2={iso(-3, -3.6, 6)[1]} stroke={C.yellow} strokeWidth={4} />
        </>
      );
    case "tia":
      return (
        <>
          {crossRoad}
          <Block x={2} y={-5} w={3} d={3} h={4} top={C.teal} left="rgba(159,211,214,.95)" right="#86C2C6" />
          <Arrow from={[-5, -0.5]} to={[-0.5, -0.5]} color={C.teal} />
          <Arrow from={[-0.5, -1]} to={[-0.5, -4]} color={C.teal} />
          <Arrow from={[0.5, -3]} to={[0.5, 4.5]} color={C.flare} />
        </>
      );
    default:
      return road;
  }
}

export function ServiceIllustration({ sceneKey, className, title }: { sceneKey: string; className?: string; title?: string }) {
  return (
    <svg viewBox="40 20 320 230" className={cn("h-full w-full", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
        </marker>
      </defs>
      <polygon points={pts([[-6.5, -6.5, 0], [6.5, -6.5, 0], [6.5, 6.5, 0], [-6.5, 6.5, 0]])} fill={C.ground} />
      <polygon points={pts([[-6.5, 6.5, 0], [6.5, 6.5, 0], [6.5, 6.5, -0.5], [-6.5, 6.5, -0.5]])} fill="#CDD2CA" />
      <polygon points={pts([[6.5, -6.5, 0], [6.5, 6.5, 0], [6.5, 6.5, -0.5], [6.5, -6.5, -0.5]])} fill="#BCC2B9" />
      <Scene sceneKey={sceneKey} />
    </svg>
  );
}
