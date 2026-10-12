import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/auth.api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    authApi
      .me()
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    setError(null);
    const res = await authApi.login(credentials);
    setUser(res.data.user);
    return res.data.user;
  };

  const loginWithGoogle = async (googlePayload) => {
    setError(null);
    const res = await authApi.googleLogin(googlePayload);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const switchRole = async (targetRole) => {
    setError(null);
    const res = await authApi.switchRole(targetRole);
    setUser(res.data.user);
    return res.data.user;
  };

  const value = useMemo(
    () => ({ user, loading, error, login, loginWithGoogle, logout, switchRole, setError }),
    [user, loading, error]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
