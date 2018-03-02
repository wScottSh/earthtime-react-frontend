import React, { Component } from 'react';
import 'react-circular-progressbar/dist/styles.css';
import './ClockFace.css';
import CircularProgressbar from 'react-circular-progressbar';
import axios from 'axios';
import $ from 'jquery';

let fromJSON
// const apiENV = 'https://earthtime-react.herokuapp.com'
const apiENV = 'http://localhost:3000'

$(function(){
  $(window).resize(function(){
    var width  = $(window).width(),
        height = $(window).height(),
        padding = .9;

    if (width > height) {
      $('.clockFace').css('width', height*padding);
      $('.clockFace').css('height', height*padding);
    } else {
      $('.clockFace').css('width', width*padding);
      $('.clockFace').css('height', width*padding);
    }
  })
  .trigger('resize');

});

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
          // let dayStart = fromJSON.earthTime.dayStart
          self.setState({
            now: rightNow,
            fauxPercent: rightNow * .1,
          })
        }, beatCounter/100)
      })
  }

  render() {
    let roundedBeat = Number(Math.round(this.state.now+'e1')+'e-1');
    return (
      <div className="clockFace">
        <CircularProgressbar percentage={this.state.fauxPercent} />
        <time className="nowText">@{roundedBeat}</time>
        {/* <p>{this.state.faceRotation}</p> */}
      </div>
    );
  }
}

export default ClockFace;
