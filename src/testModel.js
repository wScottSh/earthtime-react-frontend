import axios from 'axios'

class TodoModel {
  static all(){
    let request = axios.get("http://localhost:3000/api/v1/users")
    return request
  }
}

export default TodoModel
