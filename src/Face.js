import React, { Component } from 'react';
import './Face.css';
import axios from 'axios';

class Face extends Component {
  state = {
    users: []
  }

  componentDidMount() {
    axios.get(`http://localhost:3000/api/v1/users`)
      .then(res => {
        const users = res.data;
        this.setState({ users });
      })
  }

  render() {
    return (
      <ul className="Face">
        <h1>{this.state.name}</h1>
      </ul>
    );
  }
}

export default Face;
