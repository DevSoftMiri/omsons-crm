import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createApp } from "../../src/bootstrap";

let handler: ((req: VercelRequest, res: VercelResponse) => void) | undefined;

export default async function dashboardSummary(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  if (origin === "https://omsonscrm.vercel.app") {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (!handler) {
    const app = await createApp();
    handler = app.getHttpAdapter().getInstance();
  }

  return handler(req, res);
}
