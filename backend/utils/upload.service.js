import { put } from "@vercel/blob";
import path from "path";
import fs from "fs";

/**
 * Persists an uploaded file and returns a publicly fetchable URL.
 *
 * - On Vercel (BLOB_READ_WRITE_TOKEN set): the file goes to Vercel Blob and
 *   the returned URL points there. Serverless filesystems are ephemeral, so
 *   local disk is never an option in production.
 * - Everywhere else (local dev, VPS): falls back to writing to UPLOAD_DIR and
 *   returns a /uploads/... URL served by express.static.
 */
const UPLOAD_DIR = process.env.UPLOAD_DIR || "backend/uploads/";

const randomSuffix = () => Date.now() + "-" + Math.round(Math.random() * 1e9);

export const storeUploadedFile = async (file) => {
  if (!file) return null;

  const ext = path.extname(file.originalname || "");

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`uploads/${randomSuffix()}${ext}`, file.buffer, {
      access: "public",
      contentType: file.mimetype,
      addRandomSuffix: true,
    });

    return blob.url;
  }

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const filename = `${randomSuffix()}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), file.buffer);

  const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "http://localhost:5000";
  return `${PUBLIC_BASE_URL.replace(/\/+$/, "")}/uploads/${filename}`;
};
