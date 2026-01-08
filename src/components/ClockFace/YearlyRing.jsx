import React, { useMemo } from 'react';

const YearlyRing = ({ yearProgress, size, gse }) => {
    const radius = size / 2 + 15; // Slightly larger than clock face

    // Process GSE data for rendering
    const markers = useMemo(() => {
        if (!gse || !gse.events) return [];

        // Order of events in the year cycle (starting from SS at 0)
        const eventKeys = ['ss', 'mss', 'ne', 'mne', 'ns', 'mns', 'se', 'mse'];

        return eventKeys.map((key) => {
            const event = gse.events[key];
            if (!event) return null;

            // Calculate angle based on day of year (0-365)
            // 365.25 days per year
            // SS (Day 0) -> Angle 0 (Bottom)
            // SVG 0 is Right. So we want 0 -> 90deg.
            // Angle = (day / 365.25) * 360

            const day = event.day;
            const angleDeg = (day / 365.24) * 360;

            return {
                key,
                label: key,
                day,
                angle: angleDeg,
                name: event.name // Optional if we want full names later
            };
        }).filter(Boolean);
    }, [gse]);

    // Current time marker angle
    // yearProgress 0 -> Bottom.
    const markerAngle = yearProgress * 360;

    return (
        <div className="yearly-ring" style={{ width: size + 60, height: size + 60, position: 'absolute', pointerEvents: 'none' }}>
            <svg width="100%" height="100%" viewBox={`0 0 100 100`}>
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="1" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Ring Segments */}
                <circle cx="50" cy="50" r="49" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                {/* Markers for GSE events */}
                {markers.map((marker, i) => {
                    // Rotate to position: 0 (SS) -> 90 deg (Bottom)
                    // Transform uses center (50,50)
                    const rot = marker.angle + 90;

                    return (
                        <g key={marker.key}>
                            {/* Tick mark */}
                            <g transform={`rotate(${rot}, 50, 50)`}>
                                <line x1="50" y1="10" x2="50" y2="4" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                            </g>

                            {/* Label */}
                            {/* We calculate precise X/Y for text to avoid rotation issues */}
                            <text
                                x={50 + 44 * Math.cos((rot - 90) * Math.PI / 180)} // rot-90 converts back to SVG angle (0=Right)
                                y={50 + 44 * Math.sin((rot - 90) * Math.PI / 180)}
                                fontSize="2.5"
                                fill="rgba(255,255,255,0.5)"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                style={{ fontFamily: 'var(--font-mono)' }}
                            >
                                {marker.label}
                            </text>
                        </g>
                    );
                })}

                {/* Current Day Marker */}
                <g transform={`rotate(${markerAngle + 90}, 50, 50)`}>
                    <circle cx="50" cy="1" r="2" fill="#fff" filter="url(#glow)" />
                    <text x="50" y="1.8" fontSize="2" textAnchor="middle" fill="#000" fontWeight="bold">:</text>
                </g>
            </svg>
        </div>
    );
};

export default YearlyRing;
