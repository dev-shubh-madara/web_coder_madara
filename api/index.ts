// Vercel Serverless Function entrypoint.
//
// Vercel builds every file under /api into its own serverless function.
// This file re-exports the existing Express app (artifacts/api-server) as a
// single handler so ALL routes under /api/* (auth, tests, questions, admin,
// etc.) are served by one function. vercel.json rewrites "/api/(.*)" to
// "/api" so this file receives every API request regardless of sub-path.
import type { IncomingMessage, ServerResponse } from "http";
import app from "../artifacts/api-server/src/app";

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return app(req as any, res as any);
}
