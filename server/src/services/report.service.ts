import { prisma } from "../lib/prisma.ts";

type CreateReportInput = {
  uploadId: string;

  totalRows: number;
  validRows: number;
  invalidRows: number;

  fileType: string;

  headerRowDetected: number | null;

  processingDurationMs: number;
};

export const createProcessingReport = async ({
  uploadId,
  totalRows,
  validRows,
  invalidRows,
  fileType,
  headerRowDetected,
  processingDurationMs,
}: CreateReportInput) => {
  const status =
    invalidRows === 0
      ? "COMPLETED"
      : validRows === 0
        ? "FAILED"
        : "PARTIAL_SUCCESS";

  const report = await prisma.processingReport.create({
    data: {
      uploadId,

      totalRows,

      acceptedRows: validRows,

      quarantinedRows: invalidRows,
    },
  });

  await prisma.upload.update({
    where: {
      id: uploadId,
    },
    data: {
      status,

      totalRows,

      acceptedRows: validRows,

      quarantinedRows: invalidRows,

      completedAt: new Date(),

      fileType,

      headerRowDetected,

      processingDurationMs,
    },
  });

  return report;
};
