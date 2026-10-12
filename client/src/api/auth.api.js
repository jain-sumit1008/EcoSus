import client from "./client.js";

export const login = (payload) => client.post("/auth/login", payload).then((res) => res.data);
export const googleLogin = (payload) => client.post("/auth/google", payload).then((res) => res.data);
export const logout = () => client.post("/auth/logout").then((res) => res.data);
export const me = () => client.get("/auth/me").then((res) => res.data);
export const switchRole = (targetRole) => client.post("/auth/switch-role", { targetRole }).then((res) => res.data);
