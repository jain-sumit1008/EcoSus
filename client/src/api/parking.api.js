import client from "./client.js";

export const listAreas = () => client.get("/parking/areas").then((res) => res.data);
export const getArea = (id) => client.get(`/parking/areas/${id}`).then((res) => res.data);
export const updateOccupancy = (id, payload) =>
  client.patch(`/parking/areas/${id}/occupancy`, payload).then((res) => res.data);

export const listBlocks = () => client.get("/parking/blocks").then((res) => res.data);
export const getBlockDetails = (block) => client.get(`/parking/blocks/${block}`).then((res) => res.data);
export const updateSlotStatus = (block, slotNumber, payload) =>
  client.patch(`/parking/blocks/${block}/slots/${slotNumber}`, payload).then((res) => res.data);
export const getBlockAnalysis = (block = "A") =>
  client.get("/parking/analysis", { params: { block } }).then((res) => res.data);

// Digital Parking Token & Gate Management
export const reserveSlot = (payload) =>
  client.post("/parking/tokens/reserve", payload).then((res) => res.data);
export const getMyTokens = (params) =>
  client.get("/parking/tokens/my", { params }).then((res) => res.data);
export const getTokenById = (id) =>
  client.get(`/parking/tokens/${id}`).then((res) => res.data);
export const cancelToken = (id, reason) =>
  client.post(`/parking/tokens/${id}/cancel`, { reason }).then((res) => res.data);
export const verifyGateEntry = (payload) =>
  client.post("/parking/gate/entry", payload).then((res) => res.data);
export const verifyGateExit = (payload) =>
  client.post("/parking/gate/exit", payload).then((res) => res.data);
export const getGateDashboard = () =>
  client.get("/parking/gate/dashboard").then((res) => res.data);
