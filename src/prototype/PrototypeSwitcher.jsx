// PROTOTYPE — throwaway. Floating variant switcher. Dev-only.
import React from 'react';

export default function PrototypeSwitcher({ variants, names, current, onChange }) {
  if (import.meta.env.PROD) return null;
  const i = variants.indexOf(current);
  const go = (delta) =>
    onChange(variants[(i + delta + variants.length) % variants.length]);

  return (
    <div className="proto-switcher">
      <button className="proto-switcher-arrow" onClick={() => go(-1)} aria-label="Previous variant">
        ←
      </button>
      <span className="proto-switcher-label">
        <b>{current}</b> — {names[current]}
      </span>
      <button className="proto-switcher-arrow" onClick={() => go(1)} aria-label="Next variant">
        →
      </button>
    </div>
  );
}
