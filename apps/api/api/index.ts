import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createApp } from "../src/bootstrap";

let handler: ((req: VercelRequest, res: VercelResponse) => void) | undefined;

export default async function api(req: VercelRequest, res: VercelResponse) {
  if (!handler) {
    const app = await createApp();
    handler = app.getHttpAdapter().getInstance();
  }
  const currentHandler = handler;
  if (!currentHandler) return res.status(503).json({ message: "API is initializing" });
  return currentHandler(req, res);
}
