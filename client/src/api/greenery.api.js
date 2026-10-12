import client from "./client.js";

export const listBlocks = () => client.get("/greenery/blocks").then((res) => res.data);
export const getBlock = (id) => client.get(`/greenery/blocks/${id}`).then((res) => res.data);
export const createAssessment = (payload) => client.post("/greenery/assessments", payload).then((res) => res.data);
export const listActions = () => client.get("/greenery/actions").then((res) => res.data);
export const createAction = (payload) => client.post("/greenery/actions", payload).then((res) => res.data);
export const patchAction = (id, payload) => client.patch(`/greenery/actions/${id}`, payload).then((res) => res.data);
