import React, { useState, useCallback, useEffect, useMemo } from 'react';
import './ClockFace.css';
import axios from 'axios';
import CircularProgress from './CircularProgress.jsx';
import YearlyRing from './YearlyRing.jsx';
import TooltipWrapper from '../UI/TooltipWrapper.jsx';
import {
  searchLocations,
  reverseGeocode,
  getBrowserLocation,
  getSavedLocation,
  saveLocation
} from '../../utils/geocoding';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Time marker component with hover effect
// Helper to get local time string with TZ
const getLocalTimeString = () => {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });
};

// Helper to get generic event time string (mocking event time for now as "Local Time")
// In a real app, we'd calculate the specific time of the event.
// For now, satisfy the "Show Local Time" requirement basics.
const getEventTooltip = (label, beat) => {
  return `${label} @${beat}\n${getLocalTimeString()}`; // Simple stack for now, can refine if we have event timestamps
};

// Time marker component with hover effect
const TimeMarker = React.memo(({ type, transform, label, beat }) => {
  const icons = {
    sunrise: '^',
    sunset: '-',
    midday: '#',
    midnight: '*'
  };

  return (
    <div
      className={`time-marker time-marker--${type}`}
      style={{ transform }}
      data-tooltip-id="global-tooltip"
      data-tooltip-content={`@${beat}\n${label}`} /* Stacked: Beat \n Label */
    >
      <span className="time-marker-icon">{icons[type]}</span>
      <span className="time-marker-label">@{beat}</span>
    </div>
  );
});

// Location search component
const LocationSearch = ({ onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      const locations = await searchLocations(query);
      setResults(locations);
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="search-container">
      <span className="search-icon">🔍</span>
      <input
        type="text"
        className="search-input"
        placeholder="Search for a city..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />
      {(results.length > 0 || isSearching) && (
        <div className="search-results">
          {isSearching ? (
            <div className="search-result-item">
              <span className="loading">
                <span className="loading-spinner"></span>
                Searching...
              </span>
            </div>
          ) : (
            results.map((result, index) => (
              <div
                key={index}
                className="search-result-item"
                onClick={() => {
                  onSelect(result);
                  onClose();
                }}
              >
                <div className="search-result-item-name">{result.city || result.displayName}</div>
                <div className="search-result-item-region">
                  {[result.region, result.country].filter(Boolean).join(', ')}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// Info Modal component
const InfoModal = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Earth Time Notation</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ textAlign: 'left', padding: 'var(--space-sm)', color: 'var(--color-text-muted)' }}>Symbol</th>
                <th style={{ textAlign: 'left', padding: 'var(--space-sm)', color: 'var(--color-text-muted)' }}>Meaning</th>
                <th style={{ textAlign: 'left', padding: 'var(--space-sm)', color: 'var(--color-text-muted)' }}>Example</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['@', 'Global Time (Beats)', '@045'],
                ['^', 'Local Solar Rise', '^109'],
                ['#', 'Local Solar Midday', '#337'],
                ['-', 'Local Solar Set', '-560'],
                ['*', 'Local Solar Midnight', '*837'],
                [':', 'Days since S. Solstice', ':287'],
                ['!', 'Earth Year', '!2026'],
              ].map(([symbol, meaning, example]) => (
                <tr key={symbol} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-mono)', color: 'var(--color-accent-primary)' }}>{symbol}</td>
                  <td style={{ padding: 'var(--space-sm)' }}>{meaning}</td>
                  <td style={{ padding: 'var(--space-sm)', fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>{example}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'rgba(99, 102, 241, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-accent-primary)', fontWeight: 500, marginBottom: 'var(--space-xs)' }}>📍 Point Nemo Reference</p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              @0 is locked to solar midnight at <strong>Point Nemo</strong>.
              All beats are universal. The clock face shows your <strong>local solar day</strong>,
              so # (Midday) is always at the top, and other markers move seasonally.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ClockFace = () => {
  const [data, setData] = useState({
    global: { beat: 0, year: 2026, dayOfYear: 0, yearProgress: 0 },
    local: {
      currentPosition: 500,
      positions: { midday: 500, midnight: 0, sunrise: 250, sunset: 750 },
      beats: { midday: 500, midnight: 0, sunrise: 250, sunset: 750 },
      coords: { lat: 0, lng: 0 }
    }
  });

  const [location, setLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [error, setError] = useState(null);

  const [dimensions, setDimensions] = useState({
    size: 0,
    distance: 0
  });

  // Calculate dimensions based on viewport
  const updateDimensions = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const padding = 0.85;
    const maxSize = 500;
    const newSize = Math.min(
      width > height ? height * padding : width * padding,
      maxSize
    );
    const distance = newSize * 0.42;

    setDimensions({ size: newSize, distance });
  }, []);

  // Fetch time data from backend
  const fetchTimeData = useCallback(async (coords) => {
    try {
      // Use current location if no specific coords passed
      const targetCoords = coords || (location ? { lat: location.lat, lng: location.lng } : null);

      const { data } = targetCoords
        ? await axios.post(`${API_URL}/api/v1/earthtime/coords`, { lat: targetCoords.lat, lng: targetCoords.lng })
        : await axios.get(`${API_URL}/api/v1/earthtime`);

      if (data && data.global && data.local) {
        setData(data);
      }
      return data;
    } catch (err) {
      console.error('Failed to fetch time data:', err);
      // Only set error on initial load or manual action, not background refresh
      // setError('Unable to connect to server');
      return null;
    }
  }, [location]);

  // Periodic refresh (every 10s) relative to server time
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Only fetch if we have established a location context
      fetchTimeData();
    }, 10000); // 10 seconds

    return () => clearInterval(intervalId);
  }, [fetchTimeData]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      const saved = getSavedLocation();
      let coords = null;

      if (saved) {
        setLocation(saved);
        coords = saved;
      }

      await fetchTimeData(coords);
    };

    init();
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Handle location selection
  const handleLocationSelect = useCallback(async (loc) => {
    setIsLoadingLocation(true);
    setError(null);

    try {
      if (!loc.displayName) {
        loc = await reverseGeocode(loc.lat, loc.lng);
      }
      setLocation(loc);
      saveLocation(loc);
      await fetchTimeData({ lat: loc.lat, lng: loc.lng });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingLocation(false);
    }
  }, [fetchTimeData]);

  // Use browser geolocation
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

  // Calculate marker rotation on LOCAL clock face
  // 500 (Midday) is FIXED at TOP (0 degrees for vertical, but SVG/CSS 0 is Right)
  // We want Midday at -90deg (Top).
  // Formula: ((pos - 500) / 1000) * 360 - 90
  const getLocalRotation = useCallback((localPosition) => {
    const angle = ((localPosition - 500) / 1000) * 360 - 90;
    return `rotate(${angle}deg) translateX(${dimensions.distance}px) rotate(${-angle}deg)`;
  }, [dimensions.distance]);

  // Format global beat display
  const displayBeat = useMemo(() => {
    const rounded = Math.round(data.global.beat * 10) / 10;
    const whole = Math.floor(rounded);
    return whole.toString().padStart(3, '0');
  }, [data.global.beat]);

  // Format year/day display
  const displayYearDay = useMemo(() => {
    const day = data.global.dayOfYear.toString().padStart(3, '0');
    return `!${data.global.year}:${day}`;
  }, [data.global]);

  // Calculate Relative String (*|@52|@225|^)
  const relativeString = useMemo(() => {
    const now = data.global.beat;
    const beats = data.local.beats;

    const events = [
      { sym: '*', val: beats.midnight },
      { sym: '^', val: beats.sunrise },
      { sym: '#', val: beats.midday },
      { sym: '-', val: beats.sunset }
    ];

    // Sort by beat value (logic handles 0-1000 wrap via math)
    events.sort((a, b) => a.val - b.val);

    // Find previous and next events
    // Case 1: normal (e.g. at 500. Events: 0, 250, 500, 750)
    // Case 2: wrap-around (e.g. at 900. Events: 0, 250...)

    // We want the event strictly <= now (Previous)
    // And strictly > now (Next)

    // Simplest: Duplicate events with +1000 and -1000 to handle wrap
    const allEvents = [
      ...events.map(e => ({ ...e, val: e.val - 1000 })),
      ...events,
      ...events.map(e => ({ ...e, val: e.val + 1000 }))
    ];

    // Find closest previous
    const prev = allEvents
      .filter(e => e.val <= now)
      .sort((a, b) => b.val - a.val)[0]; // max value satisfying <= now

    // Find closest next
    const next = allEvents
      .filter(e => e.val > now)
      .sort((a, b) => a.val - b.val)[0]; // min value satisfying > now

    if (!prev || !next) return " Calculating... ";

    const diffPrev = Math.round(now - prev.val);
    const diffNext = Math.round(next.val - now);

    return `${prev.sym}|@${diffPrev}|@${diffNext}|${next.sym}`;
  }, [data.global.beat, data.local.beats]);

  // Gregorian Date Formatter
  const getGregorianDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Timezone formatter
  const getCurrentTimeWithTZ = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  return (
    <div className="clock-container">
      {/* Location Bar */}
      <div className="location-bar">
        <span className="location-bar-icon">📍</span>
        <span className="location-bar-text">
          {isLoadingLocation ? (
            <span className="loading"><span className="loading-spinner"></span></span>
          ) : location ? (
            location.displayName
          ) : (
            'Default Location'
          )}
        </span>
        <span className="location-bar-divider"></span>
        <button className="location-bar-button" onClick={handleUseGPS} disabled={isLoadingLocation}>
          📡 GPS
        </button>
        <button className="location-bar-button" onClick={() => setShowSearch(!showSearch)}>
          🔍 Search
        </button>
      </div>

      {showSearch && (
        <div style={{ width: '100%', maxWidth: '400px', animation: 'slideUp 0.2s ease-out' }}>
          <LocationSearch onSelect={handleLocationSelect} onClose={() => setShowSearch(false)} />
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {/* Main Clock Face */}
      <div className="clock-face" style={{ width: dimensions.size, height: dimensions.size }}>
        {/* Outer Yearly Ring */}
        <YearlyRing
          yearProgress={data.global.yearProgress}
          size={dimensions.size}
          gse={data.gse}
        />

        {/* Progress Ring showing daylight gradient */}
        {/* Note: CircularProgress needs update to receive both current position and solar events for gradient */}
        <CircularProgress
          value={(data.local.currentPosition / 1000) * 100}
          size={dimensions.size}
          localData={data.local}
        />

        <div className="time-container">
          {/* Yearly Display */}
          <div
            className="year-display"
            data-tooltip-id="global-tooltip"
            data-tooltip-content={`${displayYearDay}\n${getGregorianDate()}`}
          >
            {displayYearDay}
          </div>

          {/* Main Global Time */}
          <time
            className="now-time"
            data-tooltip-id="global-tooltip"
            data-tooltip-content={`@${displayBeat}\n${getCurrentTimeWithTZ()}`}
          >
            <span className="at-symbol">@</span>{displayBeat}
          </time>

          {/* Relative Time String */}
          <div className="relative-times">{relativeString}</div>

          {/* GPS Coords */}
          <div className="gps-display">
            {data.local.coords.lat?.toFixed(4)}°, {data.local.coords.lng?.toFixed(4)}°
          </div>
        </div>

        {/* Time Markers */}
        <TimeMarker
          type="sunrise"
          transform={getLocalRotation(data.local.positions.sunrise)}
          label="Solar Rise"
          beat={data.local.beats.sunrise}
        />
        <TimeMarker
          type="midday"
          transform={getLocalRotation(data.local.positions.midday)}
          label="Solar Midday"
          beat={data.local.beats.midday}
        />
        <TimeMarker
          type="sunset"
          transform={getLocalRotation(data.local.positions.sunset)}
          label="Solar Set"
          beat={data.local.beats.sunset}
        />
        <TimeMarker
          type="midnight"
          transform={getLocalRotation(data.local.positions.midnight)}
          label="Solar Midnight"
          beat={data.local.beats.midnight}
        />

        {/* Global Midnight Marker (Red Line) - Position at relative 0 */}
        {/* If local.positions.midnight is 0 on the face, then Global 0 is diff? */}
        {/* Wait. Local Positions: 0=Midnight, 500=Midday. */}
        {/* Current Position = X. The user wants "Indicator on Local Clock for Global Midnight (@0)" */}
        {/* @0 Global Beat occurs at a specific LOCAL position. */}
        {/* We have: data.local.beats.midnight (Global beat when local midnight happens) */}
        {/* We can solve: Position of Global 0. */}
        {/* If Global Beat B corresponds to Local Pos P... */}
        {/* Global 0 is at Local Pos? */}
        {/* global.beat = 0 when local.currentPosition = ? */}
        {/* Shift = currentPosition - globalBeat (approx in 1000 units). */}
        {/* Let's use the offset: offset = local.currentPosition - global.beat */}
        {/* Target Position (for @0) = 0 + offset */}
        <div
          className="global-midnight-marker"
          style={{
            transform: getLocalRotation(
              (data.local.currentPosition - data.global.beat + 1000) % 1000
            )
          }}
          data-tooltip-id="global-tooltip"
          data-tooltip-content={`Global Midnight (@0)\nPoint Nemo`}
        />

        {/* Current Beat Dot - Tracks currentPosition */}
        <div
          className="current-beat-dot"
          style={{
            transform: getLocalRotation(data.local.currentPosition)
          }}
          data-tooltip-id="global-tooltip"
          data-tooltip-content={`Current Beat @${displayBeat}\n${getCurrentTimeWithTZ()}`}
        />
      </div>

      <TooltipWrapper id="global-tooltip" />

      {/* Solar Info Panel */}
      <div className="solar-info">
        <div className="solar-info-item">
          <span className="solar-info-icon" style={{ color: 'var(--color-accent-sunrise)' }}>☀️</span>
          <span className="solar-info-value">^{data.local.beats.sunrise}</span>
          <span className="solar-info-label">Solar Rise</span>
        </div>
        <div className="solar-info-item">
          <span className="solar-info-icon" style={{ color: 'var(--color-accent-noon)' }}>🌞</span>
          <span className="solar-info-value">#{data.local.beats.midday}</span>
          <span className="solar-info-label">Solar Midday</span>
        </div>
        <div className="solar-info-item">
          <span className="solar-info-icon" style={{ color: 'var(--color-accent-sunset)' }}>🌅</span>
          <span className="solar-info-value">-{data.local.beats.sunset}</span>
          <span className="solar-info-label">Solar Set</span>
        </div>
        <div className="solar-info-item">
          <span className="solar-info-icon" style={{ color: 'var(--color-accent-midnight)' }}>🌙</span>
          <span className="solar-info-value">*{data.local.beats.midnight}</span>
          <span className="solar-info-label">Solar Midnight</span>
        </div>
      </div>

      <button className="info-button" onClick={() => setShowInfo(true)} title="About Earth Time">?</button>
      <InfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} />
    </div>
  );
};

export default ClockFace;
