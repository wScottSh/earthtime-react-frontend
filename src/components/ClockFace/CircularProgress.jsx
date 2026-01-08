import React, { useMemo } from 'react';

const CircularProgress = ({ value, size, localData }) => {
  const radius = 47;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  // Calculate gradient stops based on solar events
  const gradientStops = useMemo(() => {
    // defaults
    let stops = [
      { offset: '0%', color: '#fdbb2d' },      // Noon (Sun)
      { offset: '25%', color: '#ff7e5f' },     // Sunrise/Sunset area (Horizon)
      { offset: '40%', color: '#6366f1' },     // Twilight
      { offset: '100%', color: '#1a1a2e' }     // Midnight (Night)
    ];

    if (localData && localData.positions) {
      const { sunrise, dawn } = localData.positions;

      // Calculate Y-percentage for sunrise (0% = Top/Noon, 100% = Bottom/Midnight)
      // Angle 0 at top. 
      // y = 50 - 50 * cos(angle)

      const getYPercent = (beat) => {
        // beat 500 = 0 deg (top)
        // beat 0 = 180 deg (bottom)
        const angle = ((beat - 500) / 1000) * 360;
        const rad = angle * (Math.PI / 180);
        // cos(0) = 1 -> y = 0%. cos(180) = -1 -> y = 100%.
        // We want 0-100 scale.
        // Actually SVG y coords: 0 is top, 100 is bottom.
        // Center is 50,50. 
        // y = 50 - 47 * cos(rad) (using radius but for gradient we map roughly to box)
        return 50 - 50 * Math.cos(rad);
      };

      const sunriseY = getYPercent(sunrise);
      const dawnY = dawn ? getYPercent(dawn) : sunriseY + 10; // Fallback

      // Ensure stops differ slightly to avoid glitches
      stops = [
        { offset: '0%', color: '#fdbb2d' },                // Noon (Bright Day)
        { offset: `${Math.max(0, sunriseY - 15)}%`, color: '#fdbb2d' }, // Keep bright until getting close to sunrise
        { offset: `${sunriseY}%`, color: '#ff7e5f' },      // Horizon (Sunrise/Sunset)
        { offset: `${dawnY}%`, color: '#6366f1' },         // Twilight
        { offset: '100%', color: '#1a1a2e' }               // Midnight
      ];

      // Sort just in case calculation is weird (though sunriseY < dawnY usually)
      stops.sort((a, b) => parseFloat(a.offset) - parseFloat(b.offset));
    }

    return stops;
  }, [localData]);

  return (
    <svg
      className="progress-ring"
      viewBox="0 0 100 100"
      style={{ width: size, height: size }}
    >
      <defs>
        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          {gradientStops.map((stop, i) => (
            <stop key={i} offset={stop.offset} stopColor={stop.color} />
          ))}
        </linearGradient>

        <filter id="progressGlow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background ring - colored with sky gradient */}
      <circle
        className="progress-ring-bg"
        cx="50"
        cy="50"
        r={radius}
        stroke="url(#skyGradient)"
        strokeWidth="4"
        fill="none"
        opacity="0.3"
      />

      {/* Progress ring - matches sky gradient but full opacity/glow */}
      <circle
        className="progress-ring-progress"
        cx="50"
        cy="50"
        r={radius}
        stroke="url(#skyGradient)"
        strokeWidth="4"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        filter="url(#progressGlow)"
      />
    </svg>
  );
};

export default CircularProgress;