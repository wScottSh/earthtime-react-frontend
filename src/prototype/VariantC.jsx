// PROTOTYPE — throwaway. Variant C: "Labeled cards".
// Explicitly non-circular. Every info type in its own titled card so nothing
// is a mystery. Maximizes legibility; sacrifices elegance.
import React from 'react';

export default function VariantC({ d, place }) {
  const { solar, nowPos, nextEvent, gse } = d;

  return (
    <div className="vC">
      {/* Card 1 — the headline number */}
      <section className="vC-card vC-hero">
        <div className="vC-card-title">Global Beat · universal, same everywhere</div>
        <div className="vC-beat">
          <span className="vC-at">@</span>
          {d.beatStr}
        </div>
        <div className="vC-hero-meta">
          {place.label} · {d.coords.lat.toFixed(2)}°, {d.coords.lng.toFixed(2)}° · {d.dateStr}
        </div>
      </section>

      {/* Card 2 — the local solar day */}
      <section className="vC-card">
        <div className="vC-card-title">Your Solar Day</div>
        {nextEvent && (
          <div className="vC-nextline">
            Now <b>@{d.beatStr}</b> · {nextEvent.name} in <b>@{nextEvent.inBeats}</b>
          </div>
        )}
        <div className="vC-events">
          {solar.map((e) => {
            const isNext = nextEvent && nextEvent.sym === e.sym;
            return (
              <div key={e.key} className={`vC-event ${isNext ? 'is-next' : ''}`}>
                <span className="vC-event-sym" style={{ color: e.color }}>
                  {e.sym}
                </span>
                <span className="vC-event-beat">@{e.beat}</span>
                <span className="vC-event-name">{e.name}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Card 3 — the Earth year */}
      <section className="vC-card">
        <div className="vC-card-title">Earth Year</div>
        <div className="vC-year">
          {gse.segments.map((s) => (
            <div key={s.key} className={`vC-yseg ${s.isCurrent ? 'is-current' : ''}`}>
              <span className="vC-yseg-name">{s.name}</span>
            </div>
          ))}
          <div className="vC-year-now" style={{ left: `${gse.progress * 100}%` }} />
        </div>
        <div className="vC-year-caption">
          {d.dateStr} · day {d.dayOfYear} · <b>{gse.currentName}</b> → {gse.nextName} ({gse.daysUntilNext}d)
        </div>
      </section>
    </div>
  );
}
