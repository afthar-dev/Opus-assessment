import { type Request, type Response } from "express";
import { processUpload } from "../services/upload.service.ts";
import {
  getUploadedFiles,
  getUploadedFileById,
  getUploadRecordsService,
} from "../services/uploadcontroller.service.ts";
import { prisma } from "../lib/prisma.ts";

export const uploadFile = async (req: Request, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const result = await processUpload(file);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
};

export const uploadedFiles = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const { files, total, totalPages } = await getUploadedFiles(page, limit);

    return res.status(200).json({
      success: true,
      data: files,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to get uploaded files",
    });
  }
};

export const getFileById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "File ID is required",
      });
    }

    const idString = String(id);
    const file = await getUploadedFileById(idString);

    res.status(200).json({
      success: true,
      data: file,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to get file",
    });
  }
};

export const getUploadRecords = async (req: Request, res: Response) => {
  try {
    const uploadId = req.params.id as string;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const result = await getUploadRecordsService(uploadId, page, limit);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch records",
    });
  }
};

export const deleteUpload = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "File ID is required",
      });
    }
    const deleted = await prisma.upload.delete({
      where: {
        id: id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Upload deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete upload",
    });
  }
};
