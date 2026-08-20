// PROTOTYPE — throwaway. Variant B: "Disciplined dial".
// Keeps the circle, but ONE ring, clean center, no redundant bottom panel,
// year info demoted to a caption. Midday (#) is fixed at the top.
//
// Ring geometry (local solar day, 0..1000): 500 (midday) at top, 0/1000
// (midnight) at bottom. Dots mark each element's exact spot.
//
// Ticks mark the GLOBAL @beat scale, not the local day. A beat B sits at local
// position (B - offset), where offset = beat_now - nowPos. So changing location
// rotates the whole tick grid around the dial; @0 only lands at the bottom on
// Point Nemo's meridian. The @0 crossover tick is heavier + capped with a dot.
import React from 'react';

// Like a traditional clock face, the scale lives INSIDE the rim: dots + ticks
// on the ring; hundreds numerals and solar-event labels just inside it.
const R = 150;           // ring radius: dots, ticks and the now-marker live here
const R_TICKLABEL = 133; // hundreds numerals, just inside the rim
const R_LABEL = 114;     // solar-event labels, further in (clear the center)
const BEAT_TICKS = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900];

const angleFor = (pos) => ((pos - 500) / 1000) * 360 - 90;
// Upright: element stays level (for text labels).
const uprightAt = (pos, dist) => {
  const a = angleFor(pos);
  return `rotate(${a}deg) translateX(${dist}px) rotate(${-a}deg)`;
};
// Radial: element aligns along the radius (for ticks); dots are symmetric so
// this works for them too.
const radialAt = (pos, dist) => `rotate(${angleFor(pos)}deg) translateX(${dist}px)`;

export default function VariantB({ d, place }) {
  const { solar, nowPos, gse, nextEvent } = d;

  // Where each global beat lands on the local dial (rotates with location).
  const offset = d.beat - nowPos;
  const posForBeat = (b) => (((b - offset) % 1000) + 1000) % 1000;

  return (
    <div className="vB">
      <div className="vB-place">
        <span>📍</span> {place.label}
      </div>

      <div className="vB-dial">
        <div className="vB-ring" />

        {/* Global @beat ticks every 100; the @0 crossover is heavier + capped.
            Hundreds are labeled 1..9 (900 = "9"); @0 is marked by the cap dot. */}
        {BEAT_TICKS.map((t) => (
          <React.Fragment key={t}>
            <div
              className={`vB-tick ${t === 0 ? 'is-crossover' : ''}`}
              style={{ transform: radialAt(posForBeat(t), R) }}
            >
              {t === 0 && <span className="vB-tick-cap" />}
            </div>
            {t !== 0 && (
              <div
                className="vB-ticklabel"
                style={{ transform: uprightAt(posForBeat(t), R_TICKLABEL) }}
              >
                {t / 100}
              </div>
            )}
          </React.Fragment>
        ))}

        {/* Now marker on the ring. */}
        <div className="vB-nowdot" style={{ transform: radialAt(nowPos, R) }} />

        {/* Each solar event: a dot at its exact spot + an upright label outside. */}
        {solar.map((e) => (
          <React.Fragment key={e.key}>
            <div
              className="vB-dot"
              style={{ transform: radialAt(e.pos, R), background: e.color, color: e.color }}
            />
            <div className="vB-marker" style={{ transform: uprightAt(e.pos, R_LABEL) }}>
              <span className="vB-marker-sym" style={{ color: e.color }}>
                {e.sym}
              </span>
              <span className="vB-marker-beat">{e.beat}</span>
            </div>
          </React.Fragment>
        ))}

        <div className="vB-center">
          <div className="vB-date">{d.dateStr}</div>
          <div className="vB-beat">
            <span className="vB-at">@</span>
            {d.beatStr}
          </div>
          {nextEvent && (
            <div className="vB-next">
              {nextEvent.name} @{nextEvent.inBeats}
            </div>
          )}
        </div>
      </div>

      <div className="vB-caption">
        <span className="vB-caption-strong">{gse.currentName}</span>
        <span className="vB-caption-arrow">→</span>
        {gse.nextName} in {gse.daysUntilNext}d
      </div>
    </div>
  );
}
