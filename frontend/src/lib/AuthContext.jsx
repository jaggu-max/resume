import { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/auth/me").then(r => setUser(r.data)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    if (data.token) localStorage.setItem("token", data.token);
    setUser(data);
    return data;
  };
  const register = async (email, password, name) => {
    const { data } = await api.post("/auth/register", { email, password, name });
    if (data.token) localStorage.setItem("token", data.token);
    setUser(data);
    return data;
  };
  const googleLogin = async (email, name) => {
    const { data } = await api.post("/auth/google", { email, name });
    if (data.token) localStorage.setItem("token", data.token);
    setUser(data);
    return data;
  };
  const logout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    localStorage.removeItem("token");
    setUser(null);
  };
  const refreshMe = async () => {
    try { const r = await api.get("/auth/me"); setUser(r.data); } catch {}
  };

  return <AuthCtx.Provider value={{ user, loading, login, register, googleLogin, logout, refreshMe }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
