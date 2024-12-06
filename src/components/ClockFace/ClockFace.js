import React, { useState, useCallback, useEffect } from 'react';
import './ClockFace.css';
import axios from 'axios';
import CircularProgress from './CircularProgress';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Ensure TimeMarker is properly defined as a React component
const TimeMarker = React.memo(({ type, transform }) => (
  <div className={`spinnyBox ${type}`} style={{ transform }}>
    <svg>
      <circle cx="30" cy="30" r="25" stroke="black" strokeWidth="8" fill="#302b63"/>
    </svg>
    <p>{type === 'sunrise' ? '^' : type === 'sunset' ? '-' : type === 'solarNoon' ? '#' : '*'}</p>
  </div>
));

const ClockFace = () => {
  const [timeState, setTimeState] = useState({
    now: 0,
    fauxPercent: 0,
    relativeTimes: '',
    dayStart: '*0',
    sunSight: '^0',
    solarNoon: '#0',
    sunClipse: '-0',
    dayEnd: '*0'
  });

  const [dimensions, setDimensions] = useState({
    size: 0,
    distance: 0
  });

  const updateDimensions = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const padding = 0.9;
    const newSize = width > height ? height * padding : width * padding;
    const distance = newSize * 0.460;

    setDimensions({ size: newSize, distance });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/v1/earthtime`);
        const beatCounter = data.beatLength || 1000;

        // Initial state update
        setTimeState(prevState => ({
          ...prevState,
          now: data.earthTime.now,
          fauxPercent: data.earthTime.now * 0.1,
          dayStart: `*${Math.round((data.earthTime.dayStart + 1000) % 1000)}`,
          sunSight: `^${Math.round((data.earthTime.solarSight + 1000) % 1000)}`,
          solarNoon: `#${Math.round((data.earthTime.solarNoon + 1000) % 1000)}`,
          sunClipse: `-${Math.round((data.earthTime.solarClipse + 1000) % 1000)}`,
          dayEnd: `*${Math.round((data.earthTime.dayEnd + 1000) % 1000)}`
        }));

        const timer = setInterval(() => {
          setTimeState(prev => {
            const rightNow = prev.now + 0.01;
            const obj = data.earthTime;

            let relativeTimes = '';
            if (rightNow > obj.dayStart && rightNow < obj.solarSight) {
              relativeTimes = `*| ${Math.round(rightNow - obj.dayStart)} | ${Math.round(obj.solarSight - rightNow)}|^`;
            }
            // ... add other time conditions

            return {
              now: rightNow,
              fauxPercent: rightNow * 0.1,
              relativeTimes,
              dayStart: `*${Math.round((obj.dayStart + 1000) % 1000)}`,
              sunSight: `^${Math.round((obj.solarSight + 1000) % 1000)}`,
              solarNoon: `#${Math.round((obj.solarNoon + 1000) % 1000)}`,
              sunClipse: `-${Math.round((obj.solarClipse + 1000) % 1000)}`,
              dayEnd: `*${Math.round((obj.dayEnd + 1000) % 1000)}`
            };
          });
        }, beatCounter/100);

        return () => clearInterval(timer);
      } catch (error) {
        console.error('Failed to fetch time data:', error);
      }
    };

    fetchData();
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [updateDimensions]);

  const getRotation = (offset, time) => {
    return `rotate(${(-1 * offset * 0.36) + 90 + (time * 0.36)}deg) 
            translateX(${dimensions.distance}px) 
            rotate(${-(-1 * offset * 0.36) + 90 + (time * 0.36)}deg)`;
  };

  const roundedBeat = Number(Math.round(timeState.now + 'e1') + 'e-1');

  return (
    <div className="clockFace" style={{ width: dimensions.size, height: dimensions.size }}>
      <CircularProgress value={timeState.fauxPercent} size={dimensions.size} />
      <div className="timeContainer">
        <time className="nowTime" style={{ fontSize: `${dimensions.size * 0.01}em` }}>
          @{roundedBeat}
        </time>
        <time className="relativeTimes" style={{ fontSize: `${dimensions.size * 0.005}em` }}>
          {timeState.relativeTimes}
        </time>
      </div>
      
      <TimeMarker type="sunrise" transform={getRotation(timeState.dayStart, timeState.sunSight)} />
      <TimeMarker type="sunset" transform={getRotation(timeState.dayStart, timeState.sunClipse)} />
      <TimeMarker type="solarNoon" transform={getRotation(timeState.dayStart, timeState.solarNoon)} />
      <TimeMarker type="midnight" transform={getRotation(timeState.dayStart, timeState.dayStart)} />
    </div>
  );
};

// Make sure to use default export
export default ClockFace;
