import type { VercelRequest, VercelResponse } from "@vercel/node";

export function handleCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  const configured = (process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);
  const allowed = new Set([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://omsonscrm.vercel.app",
    ...configured,
  ]);

  if (origin && allowed.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Idempotency-Key");
  res.setHeader("Access-Control-Max-Age", "86400");

  return req.method === "OPTIONS";
}
