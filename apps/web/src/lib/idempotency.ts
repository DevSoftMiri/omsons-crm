export function createIdempotencyKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createHeaders(key: string) {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
  return {
    "Content-Type": "application/json",
    "Idempotency-Key": key,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
