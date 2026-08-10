import multer from "multer";

const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 5);

/* =========================
    STORAGE CONFIG
========================= */
// Memory storage: the final persistence step (Vercel Blob or local disk) is
// handled in backend/utils/upload.service.js. On serverless hosts the
// filesystem is ephemeral, so files must not be written to disk here.
const storage = multer.memoryStorage();

/* =========================
    FILE FILTER
========================= */
// Mirrors the frontend allow-list (SVG, JPG, PDF) so validation is identical
// on both sides.
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "image/svg+xml",
    "image/jpeg",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error("Invalid file type. Only SVG, JPG, or PDF allowed");
    error.code = "INVALID_FILE_TYPE";
    cb(error, false);
  }
};

/* =========================
    MULTER INSTANCE
========================= */
const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: MAX_UPLOAD_MB * 1024 * 1024,
  },
});

/* =========================
    UPLOAD MIDDLEWARE
========================= */
// Express 5 does not reliably route multer's asynchronous fileFilter / size
// errors to the app-level error handler (it falls through to the HTML 500
// default). Handle them inline here so rejected uploads get a clean JSON 400.
const uploadSingleFile = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (!err) return next();

    if (err?.code === "INVALID_FILE_TYPE") {
      return res.status(400).json({
        success: false,
        message: err?.message || "Invalid file type. Only SVG, JPG, or PDF allowed",
      });
    }

    if (err?.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: `File is too large. Maximum allowed size is ${MAX_UPLOAD_MB}MB`,
      });
    }

    return next(err);
  });
};

/* =========================
    STAGE DOC UPLOAD MIDDLEWARE
========================= */
export const uploadStageDocumentFile = uploadSingleFile;

/* =========================
    TASK DOC UPLOAD MIDDLEWARE
========================= */
export const uploadTaskDocumentFile = uploadSingleFile;

export default upload;
