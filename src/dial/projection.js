// The single dial-projection seam (parent issue #7).
//
// One pure function maps the raw `/api/v1/earthtime` payload plus a dial size
// to a fully-resolved `DialViewModel`. No React, no DOM: feed it a
// `getEarthTime` payload and a size, get back formatted text plus every angle
// and geometry constant the SVG renderer needs. All layout math lives here so
// the renderer stays a thin drawing layer, and so the projection can be
// unit-tested without rendering.

export const EVENT_META = {
  midnight: { sym: '*', name: 'Midnight', color: 'var(--color-accent-midnight)' },
  sunrise: { sym: '^', name: 'Sunrise', color: 'var(--color-accent-sunrise)' },
  midday: { sym: '#', name: 'Midday', color: 'var(--color-accent-noon)' },
  sunset: { sym: '-', name: 'Sunset', color: 'var(--color-accent-sunset)' },
};

// Order around one solar day: midnight -> sunrise -> midday -> sunset.
const SOLAR_ORDER = ['midnight', 'sunrise', 'midday', 'sunset'];

// Global @beat scale: a tick + numeral every 100 beats on the outer ring.
const BEAT_TICKS = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900];

// Minimum angular separation between event glyphs (deg). ~17deg is the WCAG
// 2.5.8 24px spacing measured at the glyph radius (see radial-dial-markers.md).
export const DEFAULT_MIN_GAP = 17;

export const norm = (a) => ((a % 360) + 360) % 360;

// Screen angle (deg, +x east, +y down) for a local-solar-day position:
// pos 500 (midday) -> top (-90); pos 0/1000 (midnight) -> bottom.
export const angleFor = (pos) => ((pos - 500) / 1000) * 360 - 90;

// 3-digit, zero-padded @beat string. Rounds to the whole beat and wraps
// 1000 -> 000 so the display never shows a 4-digit value at the 999->0 seam.
export function beatStr(beat) {
  const whole = Math.floor(Math.round(beat * 10) / 10);
  return String(((whole % 1000) + 1000) % 1000).padStart(3, '0');
}

// Circular min-separation dodge for the event glyphs. Returns key -> display
// angle (deg); true angles stay on their ticks. Wrap-safe: the seam between
// the last and first item (across 0/1000 midnight) is relaxed like any other,
// which a naive linear sort would miss.
export function dodgeAngles(evs, minGap = DEFAULT_MIN_GAP) {
  const items = evs
    .map((e) => ({ key: e.key, a: norm(angleFor(e.pos)) }))
    .sort((x, y) => x.a - y.a);
  const n = items.length;
  for (let it = 0; it < 120; it++) {
    let moved = false;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      let gap = items[j].a - items[i].a;
      if (j === 0) gap += 360; // wrap seam
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

// Layout radii/geometry derived from the dial's pixel size. The renderer only
// converts (radius, angle) -> point; every radius decision lives here.
function geometryFor(size) {
  const C = size / 2;
  const R = size * 0.4; // main ring line
  return {
    size,
    C,
    R,
    rTick: R + size * 0.014, // outer scale ticks
    rNum: R + size * 0.045, // outer chapter-ring numerals
    rETick: R - size * 0.022, // inner end of an event's anchor tick
    rGlyph: R - size * 0.085, // event glyph band (inner)
    chip: size * 0.026, // glyph chip radius
    nowR: size * 0.032, // now-indicator radius — the largest mark on the dial
  };
}

/**
 * Project a raw earthtime payload onto the two-band radial dial.
 *
 * @param {object} data  the `/api/v1/earthtime` response
 * @param {number} size  dial size in px (drives the geometry constants)
 * @param {object} [opts]
 * @param {number} [opts.minGap] min angular separation between glyphs (deg)
 * @returns {DialViewModel}
 */
export function deriveDialViewModel(data, size = 360, { minGap = DEFAULT_MIN_GAP } = {}) {
  const beat = data.global.beat;
  const day3 = String(data.global.dayOfYear).padStart(3, '0');
  const dateStr = `!${data.global.year}:${day3}`;

  const nowPos = data.local.currentPosition;
  // Global-beat scale rotation. A global beat B maps to local position
  // B - offset; changing location changes nowPos and rotates the whole scale.
  // Constant-offset approximation (local solar day ~= Nemo solar day), per #7.
  const offset = beat - nowPos;
  const posForBeat = (b) => (((b - offset) % 1000) + 1000) % 1000;

  // Four local solar events, each anchored to its exact tick angle.
  const solarBase = SOLAR_ORDER.map((key) => ({
    key,
    sym: EVENT_META[key].sym,
    name: EVENT_META[key].name,
    color: EVENT_META[key].color,
    pos: data.local.positions[key], // 0..1000 around the dial (0 = midnight)
    beat: data.local.beats[key], // global @beat label
  }));

  // Tick = truth (exact angle); glyph = movable label that dodges neighbours.
  const disp = dodgeAngles(solarBase, minGap);
  const solarEvents = solarBase.map((e) => {
    const trueAngle = norm(angleFor(e.pos));
    const displayAngle = disp[e.key];
    let delta = Math.abs(displayAngle - trueAngle);
    if (delta > 180) delta = 360 - delta;
    return { ...e, trueAngle, displayAngle, leader: delta > 1.5 };
  });

  // Outer chapter ring: rotating global-beat scale. @0 carries no extra
  // weight and only lands at the bottom on Point Nemo's meridian (offset 0).
  const scaleTicks = BEAT_TICKS.map((b) => ({
    beat: b,
    angle: norm(angleFor(posForBeat(b))),
  }));

  const nowAngle = norm(angleFor(nowPos));

  // Relative readout: nearest solar events either side of now, by beat,
  // handling the 0-1000 wrap. prev = largest beat <= now; next = smallest > now.
  const cand = solarBase.flatMap((e) =>
    [e.beat - 1000, e.beat, e.beat + 1000].map((v) => ({ ...e, v }))
  );
  const nextCand = cand.filter((e) => e.v > beat).sort((a, b) => a.v - b.v)[0];
  const prevCand = cand.filter((e) => e.v <= beat).sort((a, b) => b.v - a.v)[0];
  const relative = {
    prev: prevCand
      ? { key: prevCand.key, sym: prevCand.sym, name: prevCand.name, color: prevCand.color, beats: Math.round(beat - prevCand.v) }
      : null,
    next: nextCand
      ? { key: nextCand.key, sym: nextCand.sym, name: nextCand.name, color: nextCand.color, beats: Math.round(nextCand.v - beat) }
      : null,
  };

  // Global Solar Event summary — rendered as a caption outside the dial.
  const g = data.gse || {};
  const gse = {
    currentName: g.events?.[g.current]?.name,
    nextName: g.events?.[g.next]?.name,
    daysUntilNext: g.daysUntilNext,
    progress: data.global.yearProgress,
  };

  return {
    beatStr: beatStr(beat),
    dateStr,
    coords: data.local.coords,
    solarEvents,
    scaleTicks,
    nowAngle,
    relative,
    gse,
    geom: geometryFor(size),
  };
}
