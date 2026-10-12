import client from "./client.js";

export const listReadings = (params) => client.get("/electricity/readings", { params }).then((res) => res.data);
export const createReading = (payload) => client.post("/electricity/readings", payload).then((res) => res.data);
export const listAlerts = (params) => client.get("/electricity/alerts", { params }).then((res) => res.data);
export const addAlertAction = (id, payload) =>
  client.post(`/electricity/alerts/${id}/actions`, payload).then((res) => res.data);
