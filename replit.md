# JEE Test Mock Free

A production-ready educational platform for JEE Main exam preparation, simulating the official CBT (Computer Based Test) environment with real exam accuracy.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/jee-mock run dev` — run the frontend (port assigned by workflow)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS, Wouter routing, TanStack Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Charts: Recharts

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/` — Drizzle schema files (users, tests, questions, sessions, responses, auth_tokens, otps)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/middlewares/auth.ts` — Bearer token auth middleware
- `artifacts/jee-mock/src/` — React frontend
- `artifacts/jee-mock/src/lib/auth.tsx` — AuthContext with token management
- `lib/api-client-react/src/generated/` — Generated React Query hooks

## Architecture decisions

- Phone OTP login: OTPs stored in DB with 10-min expiry. In production, send via SMS (currently returned in API response for development).
- Bearer token auth: Tokens stored in `auth_tokens` table with 30-day expiry. Frontend uses `setAuthTokenGetter` from `@workspace/api-client-react` to attach tokens to all requests.
- Exam fullscreen security: Frontend enforces fullscreen on test start, warns on first exit, auto-submits on second exit.
- Auto-save: Answers saved every 30 seconds via `PATCH /api/sessions/:id/answers`.
- Scoring: Implemented server-side on submit — +4 for correct, -1 for incorrect MCQ/numerical, 0 for unattempted.
- No separate sessions table for web (uses `auth_tokens`); exam sessions are in `sessions` table.

## Product

- **Homepage**: Hero, live platform stats, features, testimonials
- **Login**: Phone number → OTP verification
- **Dashboard**: User stats (score, rank, percentile), recent attempts, performance charts
- **Tests catalog**: Browse available mock tests (Full JEE, Physics, Chemistry, Mathematics)
- **Exam interface**: Full JEE CBT simulator with color-coded question palette, countdown timer, fullscreen enforcement, calculator, auto-save
- **Results**: Score breakdown, subject-wise analysis, per-question review, percentile/rank
- **Leaderboard**: Top students ranked by score
- **Admin panel**: Platform stats, user management, test CRUD, question management, announcements

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm run typecheck:libs` after adding new schema files to `lib/db/src/schema/` before typechecking the API server.
- Deep imports from `@workspace/api-client-react` (like `/src/custom-fetch`) don't work — only the main export `"."` is registered. Use `import { setAuthTokenGetter } from "@workspace/api-client-react"` instead.
- Exam interface is desktop-only by design; mobile shows a notice.
- OTPs are returned in API response during development — in production, wire up an SMS provider (Twilio/MSG91).

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
