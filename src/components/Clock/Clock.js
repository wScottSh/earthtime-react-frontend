import React, { Component } from 'react';
import './Clock.css';
import ClockFace from '../ClockFace/ClockFace'

class Clock extends Component {
  render() {
    return (
      <ClockFace />
    );
  }
}

export default Clock;
