import axios from "axios";
import { errorToast } from "../utils/toast";
import { loginUser } from "./authApi";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5500/api",
  withCredentials: true
});

axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Prevent infinite redirect loops if already on login/signup page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        errorToast("Unauthorized: Session Expired.");
        // window.location.href = "/login"; // Removed aggressive redirect to allow UI to show errors
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
