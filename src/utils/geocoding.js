/**
 * Geocoding utilities using OpenStreetMap Nominatim API
 * Free, no API key required, but please respect usage limits
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

// Rate limiting helper
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

const rateLimitedFetch = async (url) => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        await new Promise(resolve =>
            setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
        );
    }

    lastRequestTime = Date.now();

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'EarthTime-App/1.0'
        }
    });

    if (!response.ok) {
        throw new Error(`Geocoding request failed: ${response.status}`);
    }

    return response.json();
};

/**
 * Search for locations by name (forward geocoding)
 * @param {string} query - City or place name to search
 * @returns {Promise<Array>} Array of location results
 */
export const searchLocations = async (query) => {
    if (!query || query.trim().length < 2) {
        return [];
    }

    const url = `${NOMINATIM_BASE}/search?` + new URLSearchParams({
        q: query,
        format: 'json',
        addressdetails: '1',
        limit: '5',
        featuretype: 'city'
    });

    try {
        const results = await rateLimitedFetch(url);

        return results.map(result => ({
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            displayName: formatDisplayName(result),
            city: result.address?.city || result.address?.town || result.address?.village || result.name,
            region: result.address?.state || result.address?.county || result.address?.region,
            country: result.address?.country,
            countryCode: result.address?.country_code?.toUpperCase()
        }));
    } catch (error) {
        console.error('Location search failed:', error);
        return [];
    }
};

/**
 * Get location name from coordinates (reverse geocoding)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Location details
 */
export const reverseGeocode = async (lat, lng) => {
    const url = `${NOMINATIM_BASE}/reverse?` + new URLSearchParams({
        lat: lat.toString(),
        lon: lng.toString(),
        format: 'json',
        addressdetails: '1'
    });

    try {
        const result = await rateLimitedFetch(url);

        return {
            lat,
            lng,
            displayName: formatDisplayName(result),
            city: result.address?.city || result.address?.town || result.address?.village || result.address?.municipality,
            region: result.address?.state || result.address?.county || result.address?.region,
            country: result.address?.country,
            countryCode: result.address?.country_code?.toUpperCase()
        };
    } catch (error) {
        console.error('Reverse geocoding failed:', error);
        return {
            lat,
            lng,
            displayName: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
            city: null,
            region: null,
            country: null
        };
    }
};

/**
 * Format a nice display name from geocoding result
 */
const formatDisplayName = (result) => {
    const address = result.address || {};
    const parts = [];

    // City/town
    const city = address.city || address.town || address.village || address.municipality;
    if (city) parts.push(city);

    // State/region
    const region = address.state || address.county;
    if (region) parts.push(region);

    // Country (use code for common countries, full name otherwise)
    const countryCode = address.country_code?.toUpperCase();
    if (countryCode) {
        if (['US', 'UK', 'CA', 'AU'].includes(countryCode)) {
            parts.push(countryCode);
        } else if (address.country) {
            parts.push(address.country);
        }
    }

    return parts.join(', ') || result.display_name || 'Unknown Location';
};

/**
 * Get user's location using browser geolocation API
 * @returns {Promise<{lat: number, lng: number}>}
 */
export const getBrowserLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (error) => {
                let message = 'Unable to get your location';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'Location permission denied';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'Location information unavailable';
                        break;
                    case error.TIMEOUT:
                        message = 'Location request timed out';
                        break;
                }
                reject(new Error(message));
            },
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        );
    });
};

/**
 * Load saved location from localStorage
 */
export const getSavedLocation = () => {
    try {
        const saved = localStorage.getItem('earthtime_location');
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
};

/**
 * Save location to localStorage
 */
export const saveLocation = (location) => {
    try {
        localStorage.setItem('earthtime_location', JSON.stringify(location));
    } catch {
        // Storage might be full or disabled
    }
};

/**
 * Clear saved location
 */
export const clearSavedLocation = () => {
    try {
        localStorage.removeItem('earthtime_location');
    } catch {
        // Ignore errors
    }
};
