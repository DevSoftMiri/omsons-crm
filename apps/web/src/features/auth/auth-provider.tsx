"use client";

import { createContext, useContext, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
export type CurrentUser = { id: string; email: string; name: string; roles: string[] };
const AuthContext = createContext<{ user: CurrentUser | null; loading: boolean; logout: () => Promise<void> }>({ user: null, loading: true, logout: async () => undefined });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = (input, init = {}) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const nextInit = url.startsWith(API_URL) ? { ...init, credentials: "include" as RequestCredentials } : init;
      return originalFetch(input, nextInit).then((response) => {
        if (url.startsWith(API_URL) && response.status === 401 && window.location.pathname !== "/") window.location.assign("/");
        return response;
      });
    };
    originalFetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then(async (response) => { if (response.ok) setUser(await response.json()); })
      .catch(() => { setUser(null); })
      .finally(() => setLoading(false));
    return () => { window.fetch = originalFetch; };
  }, []);
  const logout = async () => {
    try { await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" }); }
    catch { /* The local session is cleared even if the API is unavailable. */ }
    setUser(null); window.location.assign("/");
  };
  return <AuthContext.Provider value={{ user, loading, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
