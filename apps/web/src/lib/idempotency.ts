export function createIdempotencyKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createHeaders(key: string) {
  return { "Content-Type": "application/json", "Idempotency-Key": key };
}
