// PROTOTYPE — throwaway. Pure formatters shared by the layout variants.
// Turns the raw /earthtime response into display-ready, ranked data.

export const EVENT_META = {
  midnight: { sym: '*', name: 'Midnight', color: 'var(--color-accent-midnight)' },
  sunrise:  { sym: '^', name: 'Sunrise',  color: 'var(--color-accent-sunrise)' },
  midday:   { sym: '#', name: 'Midday',   color: 'var(--color-accent-noon)' },
  sunset:   { sym: '-', name: 'Sunset',   color: 'var(--color-accent-sunset)' },
};

// Order around one solar day, midnight -> next midnight.
const SOLAR_ORDER = ['midnight', 'sunrise', 'midday', 'sunset'];
const GSE_ORDER = ['ss', 'mss', 'ne', 'mne', 'ns', 'mns', 'se', 'mse'];

export function derive(data) {
  const beat = data.global.beat;
  const beatStr = String(Math.floor(Math.round(beat * 10) / 10)).padStart(3, '0');
  const day3 = String(data.global.dayOfYear).padStart(3, '0');
  const dateStr = `!${data.global.year}:${day3}`;

  const solar = SOLAR_ORDER.map((key) => ({
    key,
    ...EVENT_META[key],
    pos: data.local.positions[key],   // 0..1000 around the dial (0 = midnight)
    beat: data.local.beats[key],      // global @beat label
  }));

  // Nearest solar events either side of now, handling the 0-1000 wrap.
  const cand = solar.flatMap((e) =>
    [e.beat - 1000, e.beat, e.beat + 1000].map((v) => ({ ...e, v }))
  );
  const next = cand.filter((e) => e.v > beat).sort((a, b) => a.v - b.v)[0];
  const nextEvent = next
    ? { sym: next.sym, name: next.name, color: next.color, inBeats: Math.round(next.v - beat) }
    : null;
  const prev = cand.filter((e) => e.v <= beat).sort((a, b) => b.v - a.v)[0];
  const prevEvent = prev
    ? { sym: prev.sym, name: prev.name, color: prev.color, agoBeats: Math.round(beat - prev.v) }
    : null;

  const g = data.gse || {};
  const gse = {
    order: GSE_ORDER,
    segments: GSE_ORDER.map((k) => ({
      key: k,
      name: g.events?.[k]?.name,
      isCurrent: k === g.current,
    })),
    currentName: g.events?.[g.current]?.name,
    nextName: g.events?.[g.next]?.name,
    daysUntilNext: g.daysUntilNext,
    daysSinceCurrent: g.daysSinceCurrent,
    progress: data.global.yearProgress,
  };

  return {
    beat,
    beatStr,
    dateStr,
    year: data.global.year,
    dayOfYear: data.global.dayOfYear,
    coords: data.local.coords,
    nowPos: data.local.currentPosition, // 0..1000 on the local solar day
    solar,
    nextEvent,
    prevEvent,
    gse,
  };
}
