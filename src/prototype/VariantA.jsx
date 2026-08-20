// PROTOTYPE — throwaway. Variant A: "Broadcast headline".
// No dial. Beat is the hero; the solar day is a linear left->right bar;
// the Earth year is a thin segmented bar. Importance reads top-to-bottom.
import React from 'react';

const pct = (v) => `${(v / 1000) * 100}%`;

export default function VariantA({ d, place }) {
  const { solar, nowPos, nextEvent, gse } = d;
  const sunrise = solar.find((s) => s.key === 'sunrise');
  const sunset = solar.find((s) => s.key === 'sunset');

  return (
    <div className="vA">
      <div className="vA-meta">
        {place.label} · {d.coords.lat.toFixed(2)}°, {d.coords.lng.toFixed(2)}° · {d.dateStr}
      </div>

      <div className="vA-hero">
        <span className="vA-at">@</span>
        {d.beatStr}
      </div>

      {nextEvent && (
        <div className="vA-next">
          <span style={{ color: nextEvent.color }}>{nextEvent.sym}</span> {nextEvent.name} in{' '}
          <b>@{nextEvent.inBeats}</b>
        </div>
      )}

      {/* Linear solar day: midnight -> sunrise -> midday -> sunset -> midnight */}
      <div className="vA-section-label">Your solar day</div>
      <div className="vA-solarbar">
        <div
          className="vA-daylight"
          style={{ left: pct(sunrise.pos), width: pct(sunset.pos - sunrise.pos) }}
        />
        {solar.map((e) => (
          <div key={e.key} className="vA-tick" style={{ left: pct(e.pos) }}>
            <span className="vA-tick-dot" style={{ background: e.color }} />
            <span className="vA-tick-label" style={{ color: e.color }}>
              {e.sym}
              {e.beat}
            </span>
          </div>
        ))}
        <div className="vA-now" style={{ left: pct(nowPos) }} title="now" />
      </div>

      {/* Earth year: 8 Global Solar Events */}
      <div className="vA-section-label">Earth year</div>
      <div className="vA-yearbar">
        {gse.segments.map((s) => (
          <div
            key={s.key}
            className={`vA-seg ${s.isCurrent ? 'is-current' : ''}`}
            title={s.name}
          />
        ))}
        <div className="vA-year-now" style={{ left: `${gse.progress * 100}%` }} />
      </div>
      <div className="vA-year-caption">
        {gse.currentName} → {gse.nextName} · {gse.daysUntilNext}d
      </div>
    </div>
  );
}
