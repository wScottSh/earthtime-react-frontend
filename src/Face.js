import React, { Component } from 'react';
import './Face.css';
import TodoModel from './testModel.js'

class Face extends Component {
  constructor(){
    super()
    this.state = {
      names: []
    }
  }
  componentDidMount(){
    this.fetchData()
  }
  fetchData(){
    TodoModel.all().then( (res) => {
      this.setState ({
        names: res.data.name,
        name: ''
      })
    })
  }

  render() {
    return (
      <h1>Name: {this.state.names}</h1>
    );
  }
}

export default Face;
