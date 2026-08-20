// PROTOTYPE — throwaway. Host for the layout variants.
// Reachable only via ?variant= on the existing route (see main.jsx).
// Read-only: fetches the same /earthtime endpoint, swaps only the rendering.
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { derive } from './derive';
import VariantBeatFirst from './VariantBeatFirst';
import VariantDialFirst from './VariantDialFirst';
import VariantMomentFirst from './VariantMomentFirst';
import PrototypeSwitcher from './PrototypeSwitcher';
import './prototype.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const PRESETS = [
  { label: 'Oregon', lat: 44.9725, lng: -122.9566 },
  { label: 'Austin', lat: 30.2672, lng: -97.7431 },
  { label: 'Tokyo', lat: 35.68, lng: 139.69 },
  { label: 'London', lat: 51.5074, lng: -0.1278 },
  { label: 'Reykjavík', lat: 64.1466, lng: -21.9426 },
];

const VARIANTS = { A: VariantBeatFirst, B: VariantDialFirst, C: VariantMomentFirst };
const NAMES = { A: 'Relative — stacked', B: 'Relative — inline', C: 'Relative — named' };

function readVariant() {
  const v = (new URLSearchParams(window.location.search).get('variant') || 'A').toUpperCase();
  return VARIANTS[v] ? v : 'A';
}

export default function ClockPrototype() {
  const [variant, setVariant] = useState(readVariant);
  const [data, setData] = useState(null);
  const [place, setPlace] = useState(PRESETS[0]);

  const fetchData = useCallback(async (p) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/v1/earthtime/coords`, {
        lat: p.lat,
        lng: p.lng,
      });
      setData(data);
    } catch (e) {
      console.error('[prototype] fetch failed', e);
    }
  }, []);

  // Fetch on place change + keep it live (motion is fine; 1s is plenty).
  useEffect(() => {
    fetchData(place);
    const id = setInterval(() => fetchData(place), 1000);
    return () => clearInterval(id);
  }, [place, fetchData]);

  const setVar = useCallback((v) => {
    const url = new URL(window.location.href);
    url.searchParams.set('variant', v);
    window.history.replaceState(null, '', url);
    setVariant(v);
  }, []);

  // ←/→ cycle variants, unless typing in a field.
  useEffect(() => {
    const keys = ['A', 'B', 'C'];
    const onKey = (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const i = keys.indexOf(variant);
      if (e.key === 'ArrowLeft') setVar(keys[(i + 2) % 3]);
      if (e.key === 'ArrowRight') setVar(keys[(i + 1) % 3]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [variant, setVar]);

  const Variant = VARIANTS[variant];
  const d = data ? derive(data) : null;

  return (
    <div className="proto-root">
      <div className="proto-presets">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            className={`proto-preset ${p.label === place.label ? 'is-active' : ''}`}
            onClick={() => setPlace(p)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="proto-stage">
        {d ? <Variant d={d} place={place} /> : <div className="proto-loading">Loading…</div>}
      </div>

      <PrototypeSwitcher variants={['A', 'B', 'C']} names={NAMES} current={variant} onChange={setVar} />
    </div>
  );
}
