import client from "./client.js";

export const listSheets = (params) => client.get("/sheets", { params }).then((res) => res.data);
export const getSheetSummary = () => client.get("/sheets/summary").then((res) => res.data);
export const createSheet = (payload) => client.post("/sheets", payload).then((res) => res.data);
export const updateSheet = (id, payload) => client.patch(`/sheets/${id}`, payload).then((res) => res.data);
export const deleteSheet = (id) => client.delete(`/sheets/${id}`).then((res) => res.data);
