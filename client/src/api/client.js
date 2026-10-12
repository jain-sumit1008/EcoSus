import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  withCredentials: true,
  timeout: 20000,
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const payload = error.response?.data;
    const message =
      payload?.message ||
      (error.code === "ERR_NETWORK"
        ? "Cannot reach the EcoPulse API. Start the backend on port 5000 and confirm MongoDB is running."
        : "Request failed. Retry the action or check your connection.");
    const wrapped = new Error(message);
    wrapped.status = error.response?.status;
    wrapped.code = payload?.code;
    wrapped.details = payload?.details;
    throw wrapped;
  }
);

export default client;
