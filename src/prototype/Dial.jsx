// PROTOTYPE — throwaway. Baseline dial, rebuilt on the research findings
// (docs/research/radial-dial-markers.md):
//   - TWO bands: rotating @beat scale on an outer chapter ring; the 4 event
//     markers on a dedicated inner band, so scale & events never collide.
//   - Tick = point of truth (exact angle); glyph = movable label that DODGES
//     when neighbors fall under a min angular separation, with a leader line
//     back to its true tick.
//   - Glyphs upright at all angles. Hierarchy: now > events > numerals > ticks;
//     @0 gets no extra weight.
// SVG so ticks/leaders are geometrically exact.
import React from 'react';

const BEAT_TICKS = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900];

// Screen angle (deg, +x east, +y down): pos 500 (midday) -> top, 0 -> bottom.
const angleFor = (pos) => ((pos - 500) / 1000) * 360 - 90;
const norm = (a) => ((a % 360) + 360) % 360;

// Circular min-separation dodge for the event glyphs. Returns key -> display
// angle; true angles stay on the ticks.
function dodgeAngles(evs, minGap) {
  const items = evs
    .map((e) => ({ key: e.key, a: norm(angleFor(e.pos)) }))
    .sort((x, y) => x.a - y.a);
  const n = items.length;
  for (let it = 0; it < 120; it++) {
    let moved = false;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      let gap = items[j].a - items[i].a;
      if (j === 0) gap += 360; // wrap
      if (gap < minGap - 1e-6) {
        const push = (minGap - gap) / 2;
        items[i].a = norm(items[i].a - push);
        items[j].a = norm(items[j].a + push);
        moved = true;
      }
    }
    if (!moved) break;
  }
  const map = {};
  items.forEach((i) => (map[i.key] = i.a));
  return map;
}

export default function Dial({ d, size = 360, center = null }) {
  const C = size / 2;
  const R = size * 0.4; // main ring line
  const R_TICK = R + size * 0.014; // outer scale ticks
  const R_NUM = R + size * 0.045; // outer chapter-ring numerals
  const R_ETICK = R - size * 0.022; // inner end of an event's anchor tick
  const R_GLYPH = R - size * 0.085; // event glyph band (inner)
  const CHIP = size * 0.026; // glyph chip radius
  const MIN_GAP = 17; // degrees between event glyphs

  const { solar, nowPos } = d;
  const offset = d.beat - nowPos;
  const posForBeat = (b) => (((b - offset) % 1000) + 1000) % 1000;

  const rad = (a) => (a * Math.PI) / 180;
  const pt = (radius, a) => [C + radius * Math.cos(rad(a)), C + radius * Math.sin(rad(a))];

  const disp = dodgeAngles(solar, MIN_GAP);
  const aNow = angleFor(nowPos);

  return (
    <div className="dial" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="dial-svg">
        {/* Main ring */}
        <circle cx={C} cy={C} r={R} className="dial-svg-ring" />

        {/* Outer chapter ring: rotating @beat scale (ticks + numerals). */}
        {BEAT_TICKS.map((t) => {
          const a = angleFor(posForBeat(t));
          const [x1, y1] = pt(R, a);
          const [x2, y2] = pt(R_TICK, a);
          const [nx, ny] = pt(R_NUM, a);
          return (
            <g key={t} className="dial-svg-scale">
              <line x1={x1} y1={y1} x2={x2} y2={y2} />
              <text x={nx} y={ny} dominantBaseline="central" textAnchor="middle">
                {t / 100}
              </text>
            </g>
          );
        })}

        {/* Event markers: true tick (exact angle) + dodged glyph + leader. */}
        {solar.map((e) => {
          const aTrue = norm(angleFor(e.pos));
          const aDisp = disp[e.key];
          const [tx1, ty1] = pt(R, aTrue);
          const [tx2, ty2] = pt(R_ETICK, aTrue);
          const [gx, gy] = pt(R_GLYPH, aDisp);
          let ad = Math.abs(aDisp - aTrue);
          if (ad > 180) ad = 360 - ad;
          const dodged = ad > 1.5;
          return (
            <g key={e.key} style={{ color: e.color }}>
              <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} className="dial-svg-etick" />
              {dodged && (
                <line x1={tx2} y1={ty2} x2={gx} y2={gy} className="dial-svg-leader" />
              )}
              <circle cx={gx} cy={gy} r={CHIP} className="dial-svg-chip" />
              <text x={gx} y={gy} dominantBaseline="central" textAnchor="middle" className="dial-svg-glyph">
                {e.sym}
              </text>
            </g>
          );
        })}

        {/* Now indicator — highest contrast. */}
        {(() => {
          const [x, y] = pt(R, aNow);
          return <circle cx={x} cy={y} r={size * 0.017} className="dial-svg-now" />;
        })()}
      </svg>

      <div className="dial-center">{center}</div>
    </div>
  );
}
