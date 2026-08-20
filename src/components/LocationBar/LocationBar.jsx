import React, { useState, useEffect } from 'react';
import './LocationBar.css';
import { searchLocations } from '../../utils/geocoding';

// City typeahead. Debounced search against the geocoding util; a chosen result
// is bubbled up via onSelect.
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

/**
 * The location chrome shared by the clock faces: a pill showing the current
 * place with GPS + Search actions, the (toggleable) city typeahead, and an
 * error line. Presentational — the parent owns geocoding and data fetching.
 *
 * @param {object|null} props.location  resolved location ({ displayName, ... })
 * @param {boolean} props.isLoading     a location lookup is in flight
 * @param {string|null} props.error     error text to surface, if any
 * @param {(result:object)=>void} props.onSelect  a search result was chosen
 * @param {()=>void} props.onUseGPS     the GPS button was pressed
 */
export default function LocationBar({ location, isLoading, error, onSelect, onUseGPS }) {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <>
      <div className="location-bar">
        <span className="location-bar-icon">📍</span>
        <span className="location-bar-text">
          {isLoading ? (
            <span className="loading">
              <span className="loading-spinner"></span>
            </span>
          ) : location ? (
            location.displayName
          ) : (
            'Default Location'
          )}
        </span>
        <span className="location-bar-divider"></span>
        <button className="location-bar-button" onClick={onUseGPS} disabled={isLoading}>
          📡 GPS
        </button>
        <button className="location-bar-button" onClick={() => setShowSearch((s) => !s)}>
          🔍 Search
        </button>
      </div>

      {showSearch && (
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <LocationSearch onSelect={onSelect} onClose={() => setShowSearch(false)} />
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </>
  );
}
