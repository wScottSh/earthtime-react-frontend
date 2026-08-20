// PROTOTYPE — throwaway. The relative readout: where "now" sits between the
// previous and next solar events. Cleans up the old `^|@13|@200|#` cram.
// Three wordings to compare via the switcher.
import React from 'react';

export default function RelReadout({ d, styleName = 'stack' }) {
  const { prevEvent: p, nextEvent: n } = d;
  if (!p || !n) return null;

  const Sym = ({ e }) => (
    <span className="rel-sym" style={{ color: e.color }}>
      {e.sym}
    </span>
  );

  if (styleName === 'inline') {
    return (
      <div className="rel rel--inline">
        <span>
          <Sym e={p} /> <b>@{p.agoBeats}</b> ago
        </span>
        <span className="rel-div">·</span>
        <span>
          <Sym e={n} /> in <b>@{n.inBeats}</b>
        </span>
      </div>
    );
  }

  if (styleName === 'named') {
    return (
      <div className="rel rel--inline">
        <span>
          {p.name} <b>@{p.agoBeats}</b> ago
        </span>
        <span className="rel-div">·</span>
        <span>
          {n.name} in <b>@{n.inBeats}</b>
        </span>
      </div>
    );
  }

  // stack (default)
  return (
    <div className="rel rel--stack">
      <div>
        <Sym e={p} /> <b>@{p.agoBeats}</b> ago
      </div>
      <div>
        <Sym e={n} /> in <b>@{n.inBeats}</b>
      </div>
    </div>
  );
}
