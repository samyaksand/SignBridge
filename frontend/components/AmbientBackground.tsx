// Decorative, ambient backdrop: soft gradient glow plus a loose web of
// connection points and lines, evoking "connecting hands, bridging worlds."
// Pure CSS/SVG, no canvas or WebGL. Values below are fixed (not random) so
// server and client render identically. Respects prefers-reduced-motion via
// globals.css, stays behind content (z-index -1), and never intercepts clicks.
const NODES = [
  { x: 60, y: 90 },
  { x: 220, y: 40 },
  { x: 360, y: 140 },
  { x: 520, y: 70 },
  { x: 680, y: 160 },
  { x: 150, y: 220 },
  { x: 430, y: 240 },
  { x: 610, y: 260 },
  { x: 90, y: 330 },
  { x: 320, y: 360 },
  { x: 560, y: 380 },
  { x: 700, y: 330 },
];

const EDGES: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [1, 6],
  [2, 6],
  [3, 7],
  [4, 7],
  [5, 8],
  [5, 9],
  [6, 9],
  [7, 10],
  [8, 9],
  [9, 10],
  [10, 11],
];

export function AmbientBackground() {
  return (
    <div className="sb-ambient" aria-hidden="true">
      <div className="sb-ambient__glow" />
      <svg
        className="sb-ambient__lines"
        viewBox="0 0 760 420"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        {EDGES.map(([a, b], i) => (
          <line
            key={i}
            x1={NODES[a].x}
            y1={NODES[a].y}
            x2={NODES[b].x}
            y2={NODES[b].y}
          />
        ))}
        {NODES.map((n, i) => (
          <circle key={i} className="sb-ambient__node" cx={n.x} cy={n.y} r={3} />
        ))}
      </svg>
    </div>
  );
}
