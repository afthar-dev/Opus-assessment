import multer, { type FileFilterCallback } from "multer";
import { type Request } from "express";
import path from "path";
import fs from "fs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const ALLOWED_EXTENSIONS = [".xls", ".xlsx"];

const UPLOAD_DIR = "uploads";

// Create uploads folder if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },

  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);

    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  const extension = path.extname(file.originalname).toLowerCase();

  const isValidMime = ALLOWED_MIME_TYPES.includes(file.mimetype);
  const isValidExtension = ALLOWED_EXTENSIONS.includes(extension);

  if (!isValidMime || !isValidExtension) {
    return cb(
      new Error("Invalid file type. Please upload a .xls or .xlsx file."),
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

export default upload;
