// axios.js
import axios from "axios";
export default axios.create({
  baseURL: "http://localhost:3000/movies",
  timeout:10000
});