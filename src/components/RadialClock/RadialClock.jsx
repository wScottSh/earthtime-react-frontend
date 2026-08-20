import React, { useState, useCallback, useEffect, useMemo } from 'react';
import axios from 'axios';
import './RadialClock.css';
import RadialDial from '../../dial/RadialDial.jsx';
import LocationBar from '../LocationBar/LocationBar.jsx';
import { deriveDialViewModel } from '../../dial/projection.js';
import {
  reverseGeocode,
  getBrowserLocation,
  getSavedLocation,
  saveLocation,
} from '../../utils/geocoding';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const RadialClock = () => {
  const [data, setData] = useState(null);
  const [location, setLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [error, setError] = useState(null);
  const [size, setSize] = useState(360);

  // Dial size tracks the viewport; capped so it stays legible on any screen.
  const updateSize = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const avail = (w > h ? h : w) * 0.85;
    setSize(Math.max(280, Math.min(avail, 460)));
  }, []);

  const fetchTimeData = useCallback(
    async (coords) => {
      try {
        const target = coords || (location ? { lat: location.lat, lng: location.lng } : null);
        const { data } = target
          ? await axios.post(`${API_URL}/api/v1/earthtime/coords`, { lat: target.lat, lng: target.lng })
          : await axios.get(`${API_URL}/api/v1/earthtime`);
        if (data && data.global && data.local) setData(data);
        return data;
      } catch (err) {
        console.error('Failed to fetch time data:', err);
        return null;
      }
    },
    [location]
  );

  // Keep it live — motion is fine (parent #7); matches the previous 10s cadence.
  useEffect(() => {
    const id = setInterval(() => fetchTimeData(), 10000);
    return () => clearInterval(id);
  }, [fetchTimeData]);

  // Initial load + responsive sizing. Runs once; fetchTimeData is stable enough
  // for the initial call and the interval effect above tracks it thereafter.
  useEffect(() => {
    const saved = getSavedLocation();
    let coords = null;
    if (saved) {
      setLocation(saved);
      coords = saved;
    }
    fetchTimeData(coords);
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []); // eslint-disable-line -- intentional one-time init

  const handleLocationSelect = useCallback(
    async (loc) => {
      setIsLoadingLocation(true);
      setError(null);
      try {
        if (!loc.displayName) loc = await reverseGeocode(loc.lat, loc.lng);
        setLocation(loc);
        saveLocation(loc);
        await fetchTimeData({ lat: loc.lat, lng: loc.lng });
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoadingLocation(false);
      }
    },
    [fetchTimeData]
  );

  const handleUseGPS = useCallback(async () => {
    setIsLoadingLocation(true);
    setError(null);
    try {
      const coords = await getBrowserLocation();
      await handleLocationSelect(coords);
    } catch (err) {
      setError(err.message);
      setIsLoadingLocation(false);
    }
  }, [handleLocationSelect]);

  const model = useMemo(() => (data ? deriveDialViewModel(data, size) : null), [data, size]);

  return (
    <div className="rclock">
      {/* Location name — outside the dial so the face stays uncluttered (#17). */}
      <LocationBar
        location={location}
        isLoading={isLoadingLocation}
        error={error}
        onSelect={handleLocationSelect}
        onUseGPS={handleUseGPS}
      />

      {model ? (
        <RadialDial model={model} />
      ) : (
        <div className="rclock-loading">Loading…</div>
      )}

      {/* GSE caption — outside the dial (#12), current -> next, days remaining. */}
      {model && model.gse.currentName && (
        <div className="rclock-caption">
          <b>{model.gse.currentName}</b> → {model.gse.nextName} in {model.gse.daysUntilNext}d
        </div>
      )}
    </div>
  );
};

export default RadialClock;
