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
        size,
        padding = .9;

    if (width > height) {
      size = height * padding
    } else {
      size = width * padding
    }
    $('.clockFace').css('width', size);
    $('.clockFace').css('height', size);
    $('.nowTime').css('font-size', size * .01 + 'em')
    $('.relativeTimes').css('font-size', size * .005 + 'em')
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
            relativeTimes: ''
          })

          const obj = fromJSON.earthTime
          if (rightNow > (obj.dayStart) && rightNow < obj.solarSight) {
            self.setState({relativeTimes: '*| ' + Math.round(rightNow - obj.dayStart) + ' | ' + Math.round(obj.solarSight - rightNow) + '|^'})
          } else if (rightNow > obj.solarSight && rightNow < obj.solarNoon) {
            self.setState({relativeTimes: '^| ' + Math.round(rightNow - obj.solarSight) + ' | ' + Math.round(obj.solarNoon - rightNow) + '|#'})
          } else if (rightNow > obj.solarNoon && rightNow < obj.solarClipse) {
            self.setState({relativeTimes: '#| ' + Math.round(rightNow - obj.solarNoon) + ' | ' + Math.round(obj.solarClipse - rightNow) + '|-'})
          } else if (rightNow > obj.solarClipse && rightNow < obj.dayEnd) {
            self.setState({relativeTimes: '-| ' + Math.round(rightNow - obj.solarClipse) + ' | ' + Math.round(obj.dayEnd - rightNow) + ' |*'})
          }
          this.dayStart = '*' + Math.round((obj.dayStart + 1000) % 1000)
          this.sunSight = '^' + Math.round((obj.solarSight + 1000) % 1000)
          this.solarNoon = '#' + Math.round((obj.solarNoon + 1000) % 1000)
          this.sunClipse = '-' + Math.round((obj.solarClipse + 1000) % 1000)
          this.dayEnd = '*' + Math.round((obj.dayEnd + 1000) % 1000)
        }, beatCounter/100)

        $(function() {
          let rotation = (180+(-1*fromJSON.earthTime.dayStart*.001)*360)
          $('.CircularProgressbar-path').css('transform', 'rotate(' + rotation + 'deg)')
        })

      })
  }

  render() {
    let roundedBeat = Number(Math.round(this.state.now+'e1')+'e-1');
    return (
      <div className="clockFace">
        <CircularProgressbar percentage={this.state.fauxPercent} />
        <div className="timeContainer">
          <time className="nowTime">@{roundedBeat}</time>
          <time className="relativeTimes">{this.state.relativeTimes}</time>
        </div>
      </div>
    );
  }
}

export default ClockFace;
