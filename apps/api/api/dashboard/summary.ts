import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createApp } from "../../src/bootstrap";
import { handleCors } from "../cors";

let handler: ((req: VercelRequest, res: VercelResponse) => void) | undefined;

export default async function dashboardSummary(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return res.status(204).end();

  if (!handler) {
    const app = await createApp();
    handler = app.getHttpAdapter().getInstance();
  }

  return handler(req, res);
}
