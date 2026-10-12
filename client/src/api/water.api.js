import client from "./client.js";

export const listReadings = (params) => client.get("/water/readings", { params }).then((res) => res.data);
export const createReading = (payload) => client.post("/water/readings", payload).then((res) => res.data);
export const listAlerts = (params) => client.get("/water/alerts", { params }).then((res) => res.data);
export const patchAlert = (id, payload) => client.patch(`/water/alerts/${id}`, payload).then((res) => res.data);
export const addAlertAction = (id, payload) => client.post(`/water/alerts/${id}/actions`, payload).then((res) => res.data);
