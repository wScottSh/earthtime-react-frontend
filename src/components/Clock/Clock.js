import React, { Component } from 'react';
import './Clock.css';
import ClockFace from '../ClockFace/ClockFace'

class Clock extends Component {
  render() {
    return (
      <div className="clockFace">
        <ClockFace />
      </div>
    );
  }
}

export default Clock;
