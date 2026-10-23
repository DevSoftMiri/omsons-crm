import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createApp } from "../../../src/bootstrap";

let handler: ((req: VercelRequest, res: VercelResponse) => void) | undefined;

export default async function dashboardSummary(req: VercelRequest, res: VercelResponse) {
  if (!handler) {
    const app = await createApp();
    handler = app.getHttpAdapter().getInstance();
  }

  return handler(req, res);
}
