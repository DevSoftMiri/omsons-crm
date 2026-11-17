"use client";

import { createContext, useContext, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
export type CurrentUser = { id: string; email: string; name: string; roles: string[] };
const AuthContext = createContext<{ user: CurrentUser | null; loading: boolean; logout: () => Promise<void> }>({ user: null, loading: true, logout: async () => undefined });
const SESSION_USER_KEY = "omsons_session_user";
const GET_CACHE_TTL_MS = 5000;
const getCache = new Map<string, { expiresAt: number; body: string; status: number; statusText: string }>();
const responseFromCache = (entry: { body: string; status: number; statusText: string }) => new Response(entry.body, { status: entry.status, statusText: entry.statusText, headers: { "Content-Type": "application/json" } });
const requestWithTimeout = async (url: string, init: RequestInit = {}, timeoutMs = 5000) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...init, signal: controller.signal }); }
  finally { window.clearTimeout(timeout); }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Keep the first render identical on the server and browser. Session storage
  // is hydrated in the effect below to avoid a server/client markup mismatch.
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const originalFetch = window.fetch;
    let refreshing: Promise<Response> | null = null;
    const refreshSession = () => {
      if (!refreshing) {
        refreshing = requestWithTimeout(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" })
          .finally(() => { refreshing = null; });
      }
      return refreshing;
    };
    window.fetch = async (input, init = {}) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const nextInit = url.startsWith(API_URL) ? { ...init, credentials: "include" as RequestCredentials } : init;
      const method = (nextInit.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
      const cacheable = url.startsWith(API_URL) && method === "GET" && !url.endsWith("/auth/me");
      if (cacheable) {
        const cached = getCache.get(url);
        if (cached && cached.expiresAt > Date.now()) return responseFromCache(cached);
        if (cached) getCache.delete(url);
      } else if (url.startsWith(API_URL) && method !== "GET") {
        getCache.clear();
      }
      const response = await originalFetch(input, nextInit);
      if (cacheable && response.ok) {
        const body = await response.clone().text();
        getCache.set(url, { body, expiresAt: Date.now() + GET_CACHE_TTL_MS, status: response.status, statusText: response.statusText });
      }
      if (!url.startsWith(API_URL) || response.status !== 401 || url.endsWith("/auth/refresh") || url.endsWith("/auth/logout")) return response;
      const refreshed = await refreshSession().catch(() => null);
      if (!refreshed?.ok) {
        if (window.location.pathname !== "/") window.location.assign("/");
        return response;
      }
      return originalFetch(input, nextInit);
    };
    let hasCachedUser = false;
    try {
      const stored = window.sessionStorage.getItem(SESSION_USER_KEY);
      if (stored) {
        setUser(JSON.parse(stored) as CurrentUser);
        hasCachedUser = true;
        setLoading(false);
      }
    } catch { /* Ignore malformed or unavailable session storage. */ }

    const loadSession = async () => {
      let response = await requestWithTimeout(`${API_URL}/auth/me`, { credentials: "include" });
      if (response.status === 401) {
        const refreshed = await refreshSession().catch(() => null);
        if (refreshed?.ok) response = await requestWithTimeout(`${API_URL}/auth/me`, { credentials: "include" });
      }
      if (response.ok) {
        const nextUser = await response.json() as CurrentUser;
        setUser(nextUser);
        window.sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(nextUser));
      } else if (response.status === 401) {
        setUser(null);
        window.sessionStorage.removeItem(SESSION_USER_KEY);
      }
    };
    loadSession()
      .catch(() => { /* Keep a cached session visible while the API is temporarily unavailable. */ })
      .finally(() => { if (!hasCachedUser) setLoading(false); });
    return () => { window.fetch = originalFetch; };
  }, []);
  const logout = async () => {
    try { await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" }); }
    catch { /* The local session is cleared even if the API is unavailable. */ }
    setUser(null); window.sessionStorage.removeItem(SESSION_USER_KEY); window.location.assign("/");
  };
  return <AuthContext.Provider value={{ user, loading, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
