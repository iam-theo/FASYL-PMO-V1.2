import { createServer } from "node:http";
import { app } from "../backend/app.js";
import { setupRealtime } from "../backend/modules/realtime/realtime.service.js";

/**
 * Vercel Function entrypoint.
 *
 * Vercel routes /api/*, /docs and /ws here (see vercel.json). The default
 * export is an http.Server with a WebSocketServer attached — the exact
 * pattern Vercel's docs document for Express + `ws` on Functions. `setupRealtime`
 * also boots the Redis subscriber so events fan out across function instances.
 */
const server = createServer(app);

setupRealtime(server);

export default server;
