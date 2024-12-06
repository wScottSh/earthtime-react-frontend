import axios from 'axios'

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class TimeModel {
  static all() {
    return axios.get(`${API_URL}/api/v1/earthtime`);
  }
}

export default TimeModel
