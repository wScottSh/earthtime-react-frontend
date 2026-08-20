// PROTOTYPE — throwaway. Beat-first baseline, relative readout = INLINE.
import React from 'react';
import Dial from './Dial';
import RelReadout from './RelReadout';

export default function VariantDialFirst({ d, place }) {
  return (
    <div className="vDial">
      <div className="vDial-top">📍 {place.label}</div>

      <Dial
        d={d}
        size={360}
        showBeatNumbers
        center={
          <>
            <div className="vDial-date">{d.dateStr}</div>
            <div className="vDial-beat vDial-beat--hero">
              <span className="vDial-at">@</span>
              {d.beatStr}
            </div>
            <RelReadout d={d} styleName="inline" />
          </>
        }
      />

      <div className="vDial-caption">
        <b>{d.gse.currentName}</b> → {d.gse.nextName} in {d.gse.daysUntilNext}d
      </div>
    </div>
  );
}
