import axios from 'axios'

class TimeModel {
  static all(){
    let request = axios.get("https://earthtime-react.herokuapp.com/api/v1/earthtime")
    return request
  }
}

export default TimeModel
