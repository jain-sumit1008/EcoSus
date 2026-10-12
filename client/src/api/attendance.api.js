import client from "./client.js";

export const createSession = (payload) => client.post("/attendance/sessions", payload).then((res) => res.data);
export const listSessions = (params) => client.get("/attendance/sessions", { params }).then((res) => res.data);
export const generateQr = (id, validityMinutes = 10) =>
  client.post(`/attendance/sessions/${id}/qr`, { validityMinutes }).then((res) => res.data);
export const revokeSession = (id) => client.post(`/attendance/sessions/${id}/revoke`).then((res) => res.data);
export const validateQr = (token) => client.post("/attendance/validate-qr", { token }).then((res) => res.data);
export const webauthnOptions = () => client.post("/attendance/webauthn/authentication/options").then((res) => res.data);
export const webauthnVerify = (response) =>
  client.post("/attendance/webauthn/authentication/verify", { response }).then((res) => res.data);
export const submitRecord = (id, payload) =>
  client.post(`/attendance/sessions/${id}/records`, payload).then((res) => res.data);
export const listRecords = (params) => client.get("/attendance/records", { params }).then((res) => res.data);
export const closeSession = (id) => client.post(`/attendance/sessions/${id}/close`).then((res) => res.data);
export const paperSummary = () => client.get("/attendance/paper").then((res) => res.data);
