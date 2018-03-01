import React, { Component } from 'react';
import './ClockFace.css';
import TimeModel from '../../models/TimeModel.js'
import axios from 'axios';

class ClockFace extends Component {
  constructor() {
    super();
    this.state = {
      timeAPI: {
        "beatLength": 0,
        "coords": {
          "lat": 0,
          "lng": 0
        },
        "earthTime": {
          "now": 0,
          "dayStart": 0,
          "solarSight": 0,
          "solarNoon": 0,
          "solarClipse": 0,
          "dayEnd": 0
        },
        "unixTime": {
          "now": 0,
          "dayStart": 0,
          "solarSight": 0,
          "solarNoon": 0,
          "solarClipse": 0,
          "dayEnd": 0
        }
      }
    }
  }

  componentDidMount() {
    let self = this;
    axios.get('https://earthtime-react.herokuapp.com/api/v1/earthtime')
      .then( (res) => {
        const fromJSON = res.data;
        console.log(fromJSON);
        self.setState({
          timeAPI: fromJSON
        })
        console.log(this.state.timeAPI.earthTime.now);
      })
  }

  incrementTimer = () => {
    let beatCounter = this.state.timeAPI.beatLength
    console.log(beatCounter);
  }

  render() {
    return (
      <div className="clockFace">
        <h1>{this.state.timeAPI.earthTime.now}</h1>
        <div className="spinnyBox"></div>
      </div>
    );
  }
}

export default ClockFace;
