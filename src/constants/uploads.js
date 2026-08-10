/**
 * Maximum accepted upload size, in MB.
 *
 * Local/VPS keeps the original 5MB. Vercel Functions hard-cap request bodies
 * at 4.5MB, so Vercel builds set VITE_MAX_UPLOAD_MB=4 (build-time env) to keep
 * multipart uploads under the limit. Backend enforces the same via
 * MAX_UPLOAD_MB.
 */
export const MAX_UPLOAD_MB = Number(import.meta.env.VITE_MAX_UPLOAD_MB ?? 5);
export const MAX_FILE_SIZE = MAX_UPLOAD_MB * 1024 * 1024;
