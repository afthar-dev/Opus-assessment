import { prisma } from "../lib/prisma.ts";
import { runPipeline } from "./pipeline.service.ts";

export const processUpload = async (file: Express.Multer.File) => {
  const upload = await prisma.upload.create({
    data: {
      fileName: file.originalname,
      fileType: "UNKNOWN",
      status: "PROCESSING",
    },
  });

  const report = await runPipeline({
    uploadId: upload.id,
    filePath: file.path,
  });

  return {
    uploadId: upload.id,
    report,
  };
};
