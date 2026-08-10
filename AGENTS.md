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
- Frontend env vars must be `VITE_`-prefixed (`VITE_API_BASE_URL`, `VITE_API_URL`, `VITE_WS_URL`).
- Backend env vars: `CORS_ORIGINS` (comma-separated, defaults to `localhost:5173,localhost:5174`), `PUBLIC_API_URL` (Swagger server URL), `PUBLIC_BASE_URL` (base used to build uploaded-file URLs), `UPLOAD_DIR` (multer target, auto-created), `SALES_API_URL` (sales-sync cron; without it the sync job logs errors every minute but the server keeps running), `SMTP_*` / `APP_BASE_URL` (notification emails; without SMTP, `sendEmail` logs "SMTP not configured" and skips).
- Seed login: `admin@test.com` / `123456` (HEADOFOPS), `user@test.com` / `654321` (PROJECTMANAGER).

## Architecture

- Backend is feature-modular: `backend/modules/<feature>/` with `*.routes.js`, `*.controller.js`, `*.service.js` (auth, projects, workflow, tasks, reports, reminders, notifications, realtime).
- Every route is mounted **twice** in `backend/server.js`: under `/api/v1/*` and legacy `/api/*`. Swagger UI at `/docs`. CORS is env-driven via `CORS_ORIGINS`.
- Server start also starts `node-cron` jobs (sales→PMO sync every minute, reminder scheduler) and the WebSocket realtime service via `setupRealtime(server)`.
- Auth: JWT bearer access token (`JWT_SECRET`), refresh tokens persisted in the `RefreshToken` table and delivered via cookie. Roles in schema: `HEADOFOPS`, `PROJECTMANAGER`, `STAFF`.
- Uploads go to `UPLOAD_DIR` (`backend/uploads/` by default) via multer; file URLs returned to clients are built from `PUBLIC_BASE_URL`.

## Gotchas

- **Two frontend HTTP clients** hit different hosts:
  - `src/api.js` — main client: `VITE_API_BASE_URL ?? http://localhost:5000/api/v1`. Interceptor handles FormData (must not set Content-Type manually for uploads). Background requests can set `config.skipLoader = true` to avoid flashing the global spinner.
  - Reports module has its own client configured in `src/main.jsx` via `configureReports(...)`.
  - Check which client a component imports before touching endpoints.
- **Realtime WebSocket** (`src/realtime.js`): derives `ws://` URL from `VITE_API_BASE_URL` (override with `VITE_WS_URL`). Connects with JWT as a query param. Exports `startRealtime`, `stopRealtime`, `useRealtimeEvent`. Server side: `backend/modules/realtime/realtime.service.js` — `setupRealtime(server)` is called at the top level of `server.js`, not inside the listen callback.
- **`Project` has two different keys**: numeric `id` and string `projectId`. `ProjectStage`, `Report`, `Escalation`, `ProjectApproval`, `ProjectTimeline`, `Reminder`, `AuditLog`, `Notification` relate to `Project` via the string `projectId`, but `Task.projectId` is the numeric `id`. Get this wrong in Prisma queries and nothing joins.
- **Reports module** (`src/components/reports/`) is deliberately self-contained and Zustand-free; its `store/README.md` explains the state design (server state in `utils/requestCache`, filters in the URL). Public surface is `index.js` only (`configureReports`, `ReportsRoutes`, `resetReportsCache`); pages are lazy-loaded, don't import them via the barrel.
- **`swagger.js` builds the spec at import time**, before `server.js` calls `dotenv.config()`, so it does its own `import "dotenv/config"` — keep that if you touch it.
- **Task constants** live in `src/components/projects/tasks/tasks/taskConstants.js` (renamed from `mockTasks.js`); they are real UI constants, not fixtures.

## Production deployment (fasylpmo.sflbk.com)

- **Live URL**: `https://fasylpmo.sflbk.com` (frontend + `/api/*` + `/docs` + `/uploads` + `/ws` all same origin, proxied by nginx on port 80 → backend on **port 5002**).
- **Deployed copy** lives at `/var/www/html/fasylpmo/` (repo is source of truth; deploy = `npm install && npm run build && rsync -a --exclude .git --exclude backend/uploads/* /home/digital-auracle/FASYL-PMO-V1.2/ /var/www/html/fasylpmo/`). nginx cannot read the repo dir (`/home/digital-auracle` is 750), so dist must be under `/var/www/html`.
- **Backend** runs under pm2 as `fasylpmo-api` (`/var/www/html/fasylpmo/ecosystem.config.cjs`, `PORT=5002`, cwd `/var/www/html/fasylpmo`). Restart after deploy: `pm2 restart fasylpmo-api`.
- **Reverse proxy**: nginx site `/etc/nginx/sites-enabled/fasylpmo.sflbk` (frontend + `/api/` + `/uploads/` + `/docs/` + `/ws` with upgrade headers). Reload with `sudo systemctl restart nginx` (passwordless sudo).
- **Tunnel/DNS**: Cloudflare Tunnel `auracle-tunnel` (service runs as `digital-auracle`, config `~/.cloudflared/config.yml` — the `/etc/cloudflared` path does NOT exist). `fasylpmo.sflbk.com` CNAME already routes to it. After editing config: `cloudflared tunnel ingress validate` + `sudo systemctl restart cloudflared`.
- **Database**: Neon Postgres (`.env` `DATABASE_URL`), already migrated (`npx prisma migrate deploy --schema backend/prisma/schema.prisma` from the deployed dir). `UPLOAD_DIR` in the deployed `.env` is absolute; the repo `.env` uses the repo path.
- **Port 5001 is taken** by an unrelated app; 5000 by the old `sflbk.com` deployment. Use 5002+ for this app.
- `SALES_API_URL` (10.10.1.20:9098) is **not reachable from this host** — the sync cron logs `ECONNREFUSED` every minute but the server stays up. Do not mistake that log noise for a crash.

## Vercel deployment (serverless)

The same codebase also deploys to Vercel. The Express app is exported as a serverless Function; it is **not** a long-lived server there.

- **Entrypoints**:
  - `api/index.js` — default-exported `http.Server` with the WebSocketServer attached (the documented Express-on-Vercel pattern). `vercel.json` rewrites `/api/*`, `/docs`, `/ws`, `/uploads/*` to it; everything else is SPA-served from `dist/`.
  - `api/cron/reminders.js` + `api/cron/sales-sync.js` — replace the node-cron jobs (`server.js` only starts those on a persistent host). Both check `CRON_SECRET`.
- **Backend structure**: `backend/app.js` holds the Express app + Prisma instance (shared by `server.js`, `api/index.js`, cron functions). `server.js` is now only the persistent-host entry (listen + realtime + cron + graceful shutdown).
- **Realtime**: `backend/modules/realtime/realtime.service.js` + `redis.pubsub.js`. On Vercel, function instances don't share memory, so `sendToUser`/`broadcast` publish to Redis (`REDIS_URL`, e.g. Upstash) and every instance relays to its own sockets. Without `REDIS_URL` it degrades to same-instance-only delivery. WebSocket connections are capped by the plan (Hobby: 300s) — the client in `src/realtime.js` already reconnects.
- **Uploads**: `backend/utils/upload.service.js` stores to **Vercel Blob** when `BLOB_READ_WRITE_TOKEN` is set, else local `UPLOAD_DIR` (dev/VPS). Multer uses memory storage. Vercel hard-caps request bodies at **4.5MB**, so the Vercel project must set `MAX_UPLOAD_MB=4` (backend) and `VITE_MAX_UPLOAD_MB=4` (frontend, build-time) — see `src/constants/uploads.js`.
- **Crons**: `vercel.json` uses daily schedules (`0 6 * * *`, `0 7 * * *`) because **Hobby plans reject cron expressions that run more than once per day**. `processDueReminders()` catches up any reminders that fell due between runs, so nothing is lost, only delayed. Upgrade to Pro to restore per-minute cadence.
- **Prisma**: `postinstall` runs `prisma generate --schema backend/prisma/schema.prisma`; the generator has `binaryTargets = ["native", "rhel-openssl-3.0.x"]` (Amazon Linux 2023 runtime).
- **Env vars to set in the Vercel project**: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN`, `PUBLIC_API_URL` (https://<app>.vercel.app/api/v1), `APP_BASE_URL` (https://<app>.vercel.app), `CORS_ORIGINS` (https://<app>.vercel.app), `PUBLIC_BASE_URL`, `CRON_SECRET`, `MAX_UPLOAD_MB=4`, `VITE_API_BASE_URL=/api/v1`, `VITE_MAX_UPLOAD_MB=4`, `REDIS_URL`, `BLOB_READ_WRITE_TOKEN`, `SMTP_*`, `SALES_API_URL` (optional; likely unreachable from Vercel).
- **Deploy**: `npx vercel --prod` after `npx vercel link`. New projects get Fluid compute by default, which WebSockets require. `BLOB_READ_WRITE_TOKEN` and `REDIS_URL` are provisioned from the Vercel Blob store / Upstash respectively.
