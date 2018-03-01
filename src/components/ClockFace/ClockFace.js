import React, { Component } from 'react';
import './ClockFace.css';
import TimeModel from '../../models/TimeModel.js'
import axios from 'axios';

class ClockFace extends Component {
  state = []

  componentDidMount() {
      axios.get('https://earthtime-react.herokuapp.com/api/v1/earthtime')
        .then(res => {
          const solarEvents = res.data.earthTime
          console.log(solarEvents);
          this.setState({solarEvents})
          console.log(this.state.now);
        })
    }

  render() {
    return (
      <ul>
        <li>@{this.state.now}</li>
      </ul>
    );
  }
}

export default ClockFace;
