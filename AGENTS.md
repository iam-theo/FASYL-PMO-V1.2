# AGENTS.md

React (Vite, plain JS/JSX) frontend in `src/` + Express backend in `backend/`, one package.json, no TypeScript, no tests.

## Commands

- `npm run dev` — Vite dev server (frontend on :5173)
- `npm run server` — `node --watch backend/server.js` (Express API on :5000)
- `npm run lint` — `eslint .` (flat config, JS/JSX only)
- `npm run build` — `vite build`
- No test runner/scripts exist. Verification is `lint` + manual.
- Prisma: no npm script; run `npx prisma migrate dev`, `npx prisma db seed`, etc. from repo root. Schema: `backend/prisma/schema.prisma`; seed: `backend/prisma/seed.js`.

## Setup

- `.env` is not committed — copy `.env.example` to `.env`. `server.js` calls `dotenv.config()` from CWD, and `backend/prisma.config.ts` loads it too, so run both server and Prisma from repo root.
- Frontend env vars must be `VITE_`-prefixed (`VITE_API_BASE_URL`, `VITE_API_URL`).
- Backend env vars: `CORS_ORIGINS` (comma-separated, defaults to the two localhost dev ports), `PUBLIC_API_URL` (Swagger server URL), `PUBLIC_BASE_URL` (base used to build uploaded-file URLs), `UPLOAD_DIR` (multer target, auto-created), `SALES_API_URL` (sales-sync cron; without it the sync job logs errors every minute but the server keeps running).
- Seed login: `admin@test.com` / `123456` (HEADOFOPS), `user@test.com` / `654321` (PROJECTMANAGER).

## Architecture

- Backend is feature-modular: `backend/modules/<feature>/` with `*.routes.js`, `*.controller.js`, `*.service.js` (auth, projects, workflow, tasks, reports, reminders).
- Every route is mounted **twice** in `backend/server.js`: under `/api/v1/*` and legacy `/api/*`. Swagger UI at `/docs`. CORS is env-driven via `CORS_ORIGINS`.
- Server start also starts `node-cron` jobs: sales→PMO sync (every minute) and a reminder scheduler.
- Auth: JWT bearer access token (`JWT_SECRET`), refresh tokens persisted in the `RefreshToken` table and delivered via cookie. Roles in schema: `HEADOFOPS`, `PROJECTMANAGER`, `STAFF`.
- Uploads go to `UPLOAD_DIR` (`backend/uploads/` by default) via multer; file URLs returned to clients are built from `PUBLIC_BASE_URL`.

## Gotchas

- **Two frontend HTTP clients** hit different hosts:
  - `src/api.js` — main client: `VITE_API_BASE_URL ?? http://localhost:5000/api/v1`. Interceptor handles FormData (must not set Content-Type manually for uploads).
  - Reports module has its own client configured in `src/main.jsx` via `configureReports(...)`.
  - Check which client a component imports before touching endpoints.
- **`Project` has two different keys**: numeric `id` and string `projectId`. `ProjectStage`, `Report`, `Escalation`, `ProjectApproval`, `ProjectTimeline`, `Reminder`, `AuditLog` relate to `Project` via the string `projectId`, but `Task.projectId` is the numeric `id`. Get this wrong in Prisma queries and nothing joins.
- **Reports module** (`src/components/reports/`) is deliberately self-contained and Zustand-free; its `store/README.md` explains the state design (server state in `utils/requestCache`, filters in the URL). Public surface is `index.js` only (`configureReports`, `ReportsRoutes`, `resetReportsCache`); pages are lazy-loaded, don't import them via the barrel.
- **`swagger.js` builds the spec at import time**, before `server.js` calls `dotenv.config()`, so it does its own `import "dotenv/config"` — keep that if you touch it.
- **Task constants** live in `src/components/projects/tasks/tasks/taskConstants.js` (renamed from `mockTasks.js`); they are real UI constants, not fixtures.
