import { describe, it, expect } from 'vitest';
import {
  deriveDialViewModel,
  dodgeAngles,
  angleFor,
  beatStr,
  norm,
  DEFAULT_MIN_GAP,
} from './projection';

// A deterministic getEarthTime-shaped payload. `local.currentPosition` and the
// per-event positions/beats are what the projection actually consumes; the
// helper lets each test pin exactly the fields under test.
function payload({
  beat = 500,
  year = 2026,
  dayOfYear = 241,
  yearProgress = 0.66,
  currentPosition = 500,
  positions = { midnight: 0, sunrise: 250, midday: 500, sunset: 750 },
  beats = { midnight: 0, sunrise: 250, midday: 500, sunset: 750 },
  coords = { lat: 35.68, lng: 139.69 },
  gse = {
    events: {
      se: { name: 'Southward Equinox' },
      mse: { name: 'Mid-Southward Equinox' },
    },
    current: 'se',
    next: 'mse',
    daysUntilNext: 23,
  },
} = {}) {
  return {
    global: { beat, year, dayOfYear, yearProgress },
    local: { coords, currentPosition, positions, beats },
    gse,
  };
}

describe('beatStr — 3-digit zero-padded @beat with 999->0 wrap', () => {
  it('zero-pads to three digits', () => {
    expect(beatStr(7)).toBe('007');
    expect(beatStr(42)).toBe('042');
    expect(beatStr(500)).toBe('500');
  });

  it('floors fractional beats', () => {
    expect(beatStr(123.9)).toBe('123');
  });

  it('wraps 1000 back to 000 at the 999->0 seam', () => {
    // 999.95 rounds up to a whole 1000 -> must display as 000, not 1000.
    expect(beatStr(999.95)).toBe('000');
    expect(beatStr(1000)).toBe('000');
    expect(beatStr(999)).toBe('999');
  });
});

describe('solar events — ordering and exact angles', () => {
  const vm = deriveDialViewModel(payload());

  it('keeps the four events in solar-day order with matching sym/color/pos/beat', () => {
    expect(vm.solarEvents.map((e) => e.key)).toEqual([
      'midnight',
      'sunrise',
      'midday',
      'sunset',
    ]);
    const midday = vm.solarEvents.find((e) => e.key === 'midday');
    expect(midday.sym).toBe('#');
    expect(midday.pos).toBe(500);
    expect(midday.beat).toBe(500);
    expect(midday.color).toBe('var(--color-accent-noon)');
  });

  it('anchors each glyph to the exact tick angle of its position', () => {
    const midday = vm.solarEvents.find((e) => e.key === 'midday');
    const midnight = vm.solarEvents.find((e) => e.key === 'midnight');
    expect(midday.trueAngle).toBeCloseTo(norm(angleFor(500)), 6); // top (270)
    expect(midnight.trueAngle).toBeCloseTo(norm(angleFor(0)), 6); // bottom (90)
    expect(norm(angleFor(500))).toBeCloseTo(270, 6);
    expect(norm(angleFor(0))).toBeCloseTo(90, 6);
  });
});

describe('now-angle', () => {
  it('places midday now at the top', () => {
    const vm = deriveDialViewModel(payload({ currentPosition: 500 }));
    expect(vm.nowAngle).toBeCloseTo(270, 6);
  });

  it('places midnight now at the bottom', () => {
    const vm = deriveDialViewModel(payload({ currentPosition: 0 }));
    expect(vm.nowAngle).toBeCloseTo(90, 6);
  });
});

describe('rotating global-beat scale (#9)', () => {
  it('emits a tick + numeral every 100 beats', () => {
    const vm = deriveDialViewModel(payload());
    expect(vm.scaleTicks.map((t) => t.beat)).toEqual([
      0, 100, 200, 300, 400, 500, 600, 700, 800, 900,
    ]);
  });

  it('rotates with location: same beat, different coords -> different angles', () => {
    // Same global beat, but a different local currentPosition (i.e. a
    // different meridian) must rotate the whole scale.
    const a = deriveDialViewModel(payload({ beat: 500, currentPosition: 500 }));
    const b = deriveDialViewModel(payload({ beat: 500, currentPosition: 200 }));
    const angA = a.scaleTicks.find((t) => t.beat === 0).angle;
    const angB = b.scaleTicks.find((t) => t.beat === 0).angle;
    expect(angA).not.toBeCloseTo(angB, 3);
  });

  it('lands @0 at the bottom only on Point Nemo meridian (beat == nowPos)', () => {
    // On Nemo's meridian the local solar day and the global beat coincide:
    // currentPosition == beat, so @0 sits at the bottom (angle 90).
    const onNemo = deriveDialViewModel(payload({ beat: 300, currentPosition: 300 }));
    expect(onNemo.scaleTicks.find((t) => t.beat === 0).angle).toBeCloseTo(90, 6);

    const offNemo = deriveDialViewModel(payload({ beat: 300, currentPosition: 500 }));
    expect(offNemo.scaleTicks.find((t) => t.beat === 0).angle).not.toBeCloseTo(90, 3);
  });

  it('gives @0 no special weighting — it is an ordinary scale tick', () => {
    const vm = deriveDialViewModel(payload());
    const zero = vm.scaleTicks.find((t) => t.beat === 0);
    expect(zero).toEqual({ beat: 0, angle: expect.any(Number) });
    // Same shape as every other tick — no extra flags.
    expect(Object.keys(zero).sort()).toEqual(['angle', 'beat']);
  });
});

describe('declustering (#10)', () => {
  const minGap = DEFAULT_MIN_GAP;
  const gapsOf = (map) => {
    const angs = Object.values(map).sort((a, b) => a - b);
    return angs.map((a, i) => {
      let g = angs[(i + 1) % angs.length] - a;
      if (i === angs.length - 1) g += 360;
      return g;
    });
  };

  it('spreads a tight midday cluster to at least the min gap', () => {
    const evs = [
      { key: 'sunrise', pos: 480 },
      { key: 'midday', pos: 500 },
      { key: 'sunset', pos: 520 },
      { key: 'midnight', pos: 0 },
    ];
    const map = dodgeAngles(evs, minGap);
    for (const g of gapsOf(map)) expect(g).toBeGreaterThanOrEqual(minGap - 1e-6);
  });

  it('handles a cluster straddling the 0/1000 midnight wrap', () => {
    // sunset just before midnight, sunrise just after — a naive linear sort
    // would treat these as far apart and fail to declutter across the seam.
    const evs = [
      { key: 'sunset', pos: 990 },
      { key: 'midnight', pos: 0 },
      { key: 'sunrise', pos: 10 },
      { key: 'midday', pos: 500 },
    ];
    const map = dodgeAngles(evs, minGap);
    for (const g of gapsOf(map)) expect(g).toBeGreaterThanOrEqual(minGap - 1e-6);
  });

  it('sets the leader flag only for displaced glyphs', () => {
    // Well-spread events: nothing should be displaced, so no leaders.
    const spread = deriveDialViewModel(
      payload({ positions: { midnight: 0, sunrise: 250, midday: 500, sunset: 750 } })
    );
    expect(spread.solarEvents.every((e) => e.leader === false)).toBe(true);

    // A tight cluster: at least one glyph is displaced and flagged.
    const clustered = deriveDialViewModel(
      payload({ positions: { midnight: 0, sunrise: 480, midday: 500, sunset: 520 } })
    );
    expect(clustered.solarEvents.some((e) => e.leader === true)).toBe(true);
  });

  it('keeps the true tick angle put even when the glyph dodges', () => {
    const vm = deriveDialViewModel(
      payload({ positions: { midnight: 0, sunrise: 480, midday: 500, sunset: 520 } })
    );
    const sunset = vm.solarEvents.find((e) => e.key === 'sunset');
    expect(sunset.trueAngle).toBeCloseTo(norm(angleFor(520)), 6);
  });
});

describe('relative prev/next readout (#11)', () => {
  it('selects the nearest previous and next events with correct distances', () => {
    // now @500 == midday. prev = midday (0 ago); next = sunset (@750, in 250).
    const vm = deriveDialViewModel(
      payload({ beat: 600, beats: { midnight: 0, sunrise: 250, midday: 500, sunset: 750 } })
    );
    expect(vm.relative.prev.key).toBe('midday');
    expect(vm.relative.prev.beats).toBe(100);
    expect(vm.relative.next.key).toBe('sunset');
    expect(vm.relative.next.beats).toBe(150);
  });

  it('is wrap-aware at the 999->0 boundary', () => {
    // now @950. prev = sunset (@750, 200 ago). next wraps to midnight (@0 ==
    // @1000, in 50).
    const vm = deriveDialViewModel(
      payload({ beat: 950, beats: { midnight: 0, sunrise: 250, midday: 500, sunset: 750 } })
    );
    expect(vm.relative.prev.key).toBe('sunset');
    expect(vm.relative.prev.beats).toBe(200);
    expect(vm.relative.next.key).toBe('midnight');
    expect(vm.relative.next.beats).toBe(50);
  });
});

describe('GSE caption summary (#12)', () => {
  it('exposes current/next name, days remaining, and progress', () => {
    const vm = deriveDialViewModel(payload());
    expect(vm.gse.currentName).toBe('Southward Equinox');
    expect(vm.gse.nextName).toBe('Mid-Southward Equinox');
    expect(vm.gse.daysUntilNext).toBe(23);
    expect(vm.gse.progress).toBeCloseTo(0.66, 6);
  });
});

describe('view model shape', () => {
  it('formats date and echoes coords + geometry', () => {
    const vm = deriveDialViewModel(payload({ year: 2026, dayOfYear: 5 }), 400);
    expect(vm.dateStr).toBe('!2026:005');
    expect(vm.coords).toEqual({ lat: 35.68, lng: 139.69 });
    expect(vm.geom.size).toBe(400);
    expect(vm.geom.C).toBe(200);
  });
});
