import client from "./client.js";

export const getSummary = (params) => client.get("/dashboard/summary", { params }).then((res) => res.data);
export const runDemo = () => client.post("/demo/run").then((res) => res.data);
