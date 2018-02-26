import React, { Component } from 'react';
import './Face.css';
import TodoModel from './testModel.js'

class Face extends Component {
  render() {
    TodoModel.all().then( (res) => {
      console.log(res);
    })
    return (
      <h1>Well, hello!</h1>
    );
  }
}

export default Face;
