import React, { Component } from 'react';
import './ClockFace.css';
import TimeModel from '../../models/TimeModel.js'
import axios from 'axios';

let fromJSON
// const apiENV = 'https://earthtime-react.herokuapp.com'
const apiENV = 'http://localhost:3000'

class ClockFace extends Component {
  constructor() {
    super();
    this.state = {
      now: 0
    }
  }

  componentDidMount() {
    let self = this;
    axios.get(apiENV + '/api/v1/earthtime')
      .then( (res) => {
        fromJSON = res.data;
        console.log(fromJSON);

        let beatCounter = fromJSON.beatLength
        this.timer = setInterval(function(){
          let rightNow = fromJSON.earthTime.now += .01;
          // console.log(rightNow);
          self.setState({
            now: rightNow
          })
        }, beatCounter/100)
      })
  }

  render() {
    let roundedBeat = Number(Math.round(this.state.now+'e1')+'e-1');
    return (
      <div className="clockFace">
        <h1>{roundedBeat}</h1>
        <div className="spinnyBox"></div>
      </div>
    );
  }
}

export default ClockFace;
