import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "backend/uploads/";

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/* =========================
    STORAGE CONFIG
========================= */
const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },

    filename: (req, file, cb) => {

        const uniqueSuffix =
        Date.now() + "-" + Math.round(Math.random() * 1e9);

        cb(
        null,
        uniqueSuffix + path.extname(file.originalname)
        );
    },
});

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
    fileSize: 5 * 1024 * 1024, // 5MB
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
                message: "File is too large. Maximum allowed size is 5MB",
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