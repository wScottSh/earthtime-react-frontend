
import React from 'react';

const CircularProgress = ({ value, size }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <svg viewBox="0 0 100 100" style={{ transform: 'rotate(180deg)' }}>
      <circle
        className="progress-background"
        cx="50"
        cy="50"
        r={radius}
        stroke="#886d4d"
        strokeWidth="2"
        fill="none"
      />
      <circle
        className="progress-bar"
        cx="50"
        cy="50"
        r={radius}
        stroke="#a75149"
        strokeWidth="2"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="butt"
      />
    </svg>
  );
};

export default CircularProgress;