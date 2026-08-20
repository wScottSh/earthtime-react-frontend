// Thin SVG renderer over a DialViewModel (see projection.js). Holds no layout
// math beyond converting (radius, angle) -> point: every angle, radius and
// display decision is precomputed in the view model.
//
// Two bands (research-based, radial-dial-markers.md):
//   - outer chapter ring = the rotating global @beat scale (ticks + numerals),
//     lowest visual weight;
//   - inner band = the four local solar events. Each event draws a colored tick
//     at its exact angle (the point of truth) plus an upright glyph chip that
//     may be dodged, with a leader line back to its tick when displaced.
// The now-indicator is the highest-contrast mark. Glyphs never rotate to the
// tangent — they stay upright at every position.
import React from 'react';
import './RadialDial.css';

const rad = (a) => (a * Math.PI) / 180;

export default function RadialDial({ model }) {
  const { geom, scaleTicks, solarEvents, nowAngle, beatStr, dateStr, relative } = model;
  const { size, C, R, rTick, rNum, rETick, rGlyph, chip, nowR } = geom;
  const pt = (radius, a) => [C + radius * Math.cos(rad(a)), C + radius * Math.sin(rad(a))];

  const [nowX, nowY] = pt(R, nowAngle);

  return (
    <div className="rdial" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="rdial-svg"
        role="img"
        aria-label={`Earth Time @${beatStr}, ${dateStr}`}
      >
        {/* Main ring */}
        <circle cx={C} cy={C} r={R} className="rdial-ring" />

        {/* Outer chapter ring: rotating @beat scale (ticks + numerals). */}
        {scaleTicks.map((t) => {
          const [x1, y1] = pt(R, t.angle);
          const [x2, y2] = pt(rTick, t.angle);
          const [nx, ny] = pt(rNum, t.angle);
          return (
            <g key={t.beat} className="rdial-scale">
              <line x1={x1} y1={y1} x2={x2} y2={y2} />
              <text x={nx} y={ny} dominantBaseline="central" textAnchor="middle">
                {t.beat / 100}
              </text>
            </g>
          );
        })}

        {/* Event markers: true tick (exact) + dodged glyph + leader if moved. */}
        {solarEvents.map((e) => {
          const [tx1, ty1] = pt(R, e.trueAngle);
          const [tx2, ty2] = pt(rETick, e.trueAngle);
          const [gx, gy] = pt(rGlyph, e.displayAngle);
          return (
            <g key={e.key} style={{ color: e.color }}>
              <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} className="rdial-etick" />
              {e.leader && (
                <line x1={tx2} y1={ty2} x2={gx} y2={gy} className="rdial-leader" />
              )}
              <circle cx={gx} cy={gy} r={chip} className="rdial-chip" />
              <text
                x={gx}
                y={gy}
                dominantBaseline="central"
                textAnchor="middle"
                className="rdial-glyph"
              >
                {e.sym}
              </text>
            </g>
          );
        })}

        {/* Now indicator — highest contrast, most prominent mark on the dial. */}
        <circle cx={nowX} cy={nowY} r={nowR} className="rdial-now" />
      </svg>

      {/* Center content: hero beat, Earth date, stacked relative readout. */}
      <div className="rdial-center">
        <div className="rdial-date">{dateStr}</div>
        <div className="rdial-beat">
          <span className="rdial-at">@</span>
          {beatStr}
        </div>
        {relative.prev && relative.next && (
          <div className="rdial-rel">
            <div>
              <span className="rdial-sym" style={{ color: relative.prev.color }}>
                {relative.prev.sym}
              </span>{' '}
              <b>@{relative.prev.beats}</b> ago
            </div>
            <div>
              <span className="rdial-sym" style={{ color: relative.next.color }}>
                {relative.next.sym}
              </span>{' '}
              in <b>@{relative.next.beats}</b>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
