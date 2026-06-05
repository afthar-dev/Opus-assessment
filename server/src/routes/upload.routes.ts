import { Router } from "express";
import {
  deleteUpload,
  getFileById,
  getUploadRecords,
  uploadedFiles,
  uploadFile,
} from "../controllers/upload.controller.js";
import upload from "../middlewares/upload.middleware.ts";

const router = Router();

router.post("/", upload.single("file"), uploadFile);
router.get("/", uploadedFiles);
router.get("/:id/records", getUploadRecords);
router.get("/:id", getFileById);
router.delete("/:id", deleteUpload);

export default router;
