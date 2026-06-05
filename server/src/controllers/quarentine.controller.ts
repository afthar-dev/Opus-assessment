import { type Request, type Response } from "express";
import { prisma } from "../lib/prisma.ts";
import { cleanText } from "../services/cleaning.service.ts";
import {
  evaluateQuarantineCorrection,
  type FileType,
  type ValidationError,
} from "../services/quarantine-correction.service.ts";

type JsonObject = Record<string, unknown>;

type QuarantineRowWithUpload = {
  id: string;
  uploadId: string;
  rowNumber: number;
  rawData: unknown;
  status: "PENDING" | "CORRECTED" | "REPROCESSED";
  upload: {
    id: string;
    fileType: string;
    acceptedRows: number | null;
    quarantinedRows: number | null;
  };
  errors?: {
    code: string;
    field: string | null;
    rawValue: string | null;
    message: string;
  }[];
};

const asObject = (value: unknown): JsonObject =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};

const evaluateRow = (
  row: QuarantineRowWithUpload,
  corrections: JsonObject = {},
  existingDuplicateKeys: string[] = [],
) =>
  evaluateQuarantineCorrection({
    fileType: row.upload.fileType as FileType,
    rawData: asObject(row.rawData),
    corrections,
    existingDuplicateKeys,
    existingErrors: (row.errors ?? []).map((error) => ({
      code: error.code,
      field: error.field,
      value: error.rawValue,
      message: error.message,
    })),
  });

const errorRawValue = (value: unknown) =>
  value === null || value === undefined ? null : String(value);

const getIdParam = (req: Request) =>
  typeof req.params.id === "string" ? req.params.id : "";

const invoiceDuplicateKeyFromRawData = (rawData: unknown) =>
  cleanText(asObject(rawData).invoiceNumber);

const getExistingDuplicateKeys = async (row: QuarantineRowWithUpload) => {
  if (row.upload.fileType !== "INVOICE") return [];

  const [acceptedInvoices, siblingQuarantineRows] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        uploadId: row.uploadId,
      },
      select: {
        invoiceNumber: true,
      },
    }),
    prisma.quarantineRow.findMany({
      where: {
        uploadId: row.uploadId,
        status: "PENDING",
        id: {
          not: row.id,
        },
      },
      select: {
        rawData: true,
      },
    }),
  ]);

  return [
    ...acceptedInvoices.map((invoice) => cleanText(invoice.invoiceNumber)),
    ...siblingQuarantineRows.map((siblingRow) =>
      invoiceDuplicateKeyFromRawData(siblingRow.rawData),
    ),
  ].filter((key): key is string => key !== null);
};

const createQuarantineErrors = async (
  tx: any,
  quarantineRowId: string,
  errors: ValidationError[],
) => {
  if (!errors.length) return;

  await tx.quarantineError.createMany({
    data: errors.map((error) => ({
      quarantineRowId,
      code: error.code,
      field: error.field,
      rawValue: errorRawValue(error.value),
      message: error.message,
    })),
  });
};

const insertCorrectedRecord = async ({
  tx,
  uploadId,
  fileType,
  row,
}: {
  tx: any;
  uploadId: string;
  fileType: FileType;
  row: JsonObject;
}) => {
  switch (fileType) {
    case "INVOICE":
      return tx.invoice.create({
        data: {
          uploadId,
          invoiceNumber: row.invoiceNumber,
          tutorId: row.tutorId,
          studentName: row.studentName,
          invoiceDate: new Date(String(row.invoiceDate)),
          amount: row.amount,
          paymentStatus: row.paymentStatus,
          paymentDate: row.paymentDate ? new Date(String(row.paymentDate)) : null,
          notes: row.notes,
          sourceRow: row.sourceRow,
          rawData: row.rawData,
        },
      });

    case "LESSON_LOG":
      return tx.lessonLog.create({
        data: {
          uploadId,
          logId: row.logId,
          assignmentCode: row.assignmentCode,
          lessonDate: new Date(String(row.lessonDate)),
          durationHours: row.durationHours,
          attendance: row.attendance,
          notes: row.notes,
          fee: row.fee,
          sourceRow: row.sourceRow,
          rawData: row.rawData,
        },
      });

    case "TUTOR_ASSIGNMENT":
      return tx.tutorAssignment.create({
        data: {
          uploadId,
          assignmentCode: row.assignmentCode,
          tutorName: row.tutorName,
          studentName: row.studentName,
          subject: row.subject,
          level: row.level,
          hourlyRate: row.hourlyRate,
          startDate: new Date(String(row.startDate)),
          status: row.status,
          contactEmail: row.contactEmail,
          sourceRow: row.sourceRow,
          rawData: row.rawData,
        },
      });

    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
};

export const getQuarantineRow = async (req: Request, res: Response) => {
  try {
    const id = getIdParam(req);
    const row = await prisma.quarantineRow.findUnique({
      where: {
        id,
      },
      include: {
        upload: true,
        errors: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Quarantine row not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: row,
    });
  } catch (error) {
    console.error("Error fetching quarantine row:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch quarantine row",
    });
  }
};

export const revalidateQuarantineRow = async (req: Request, res: Response) => {
  try {
    const id = getIdParam(req);
    const row = await prisma.quarantineRow.findUnique({
      where: {
        id,
      },
      include: {
        upload: true,
        errors: true,
      },
    });

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Quarantine row not found",
      });
    }

    const quarantineRow = row as unknown as QuarantineRowWithUpload;
    const existingDuplicateKeys = await getExistingDuplicateKeys(quarantineRow);
    const result = evaluateRow(
      quarantineRow,
      asObject(req.body?.corrections),
      existingDuplicateKeys,
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error revalidating quarantine row:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to revalidate quarantine row",
    });
  }
};

export const updateQuarantine = async (req: Request, res: Response) => {
  try {
    const id = getIdParam(req);
    const row = await prisma.quarantineRow.findUnique({
      where: {
        id,
      },
      include: {
        upload: true,
        errors: true,
      },
    });

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Quarantine row not found",
      });
    }

    const quarantineRow = row as unknown as QuarantineRowWithUpload;

    if (quarantineRow.status !== "PENDING") {
      return res.status(409).json({
        success: false,
        message: "Only pending quarantine rows can be corrected",
      });
    }

    const existingDuplicateKeys = await getExistingDuplicateKeys(quarantineRow);
    const result = evaluateRow(
      quarantineRow,
      asObject(req.body?.corrections),
      existingDuplicateKeys,
    );

    if (!result.isValid) {
      return res.status(200).json({
        processed: false,
        errors: result.errors,
      });
    }

    const correctedData = result.cleanedData;
    const nextQuarantinedRows = Math.max(
      (quarantineRow.upload.quarantinedRows ?? 0) - 1,
      0,
    );
    const nextStatus =
      nextQuarantinedRows === 0 ? "COMPLETED" : "PARTIAL_SUCCESS";

    await prisma.$transaction(async (tx) => {
      await insertCorrectedRecord({
        tx,
        uploadId: quarantineRow.uploadId,
        fileType: quarantineRow.upload.fileType as FileType,
        row: correctedData,
      });

      await tx.quarantineError.deleteMany({
        where: {
          quarantineRowId: quarantineRow.id,
        },
      });

      await tx.quarantineRow.update({
        where: {
          id: quarantineRow.id,
        },
        data: {
          status: "REPROCESSED",
          correctedData: correctedData as any,
          correctedAt: new Date(),
        },
      });

      await tx.upload.update({
        where: {
          id: quarantineRow.uploadId,
        },
        data: {
          acceptedRows: {
            increment: 1,
          },
          quarantinedRows: {
            decrement: 1,
          },
          status: nextStatus,
        },
      });

      await tx.processingReport.update({
        where: {
          uploadId: quarantineRow.uploadId,
        },
        data: {
          acceptedRows: {
            increment: 1,
          },
          quarantinedRows: {
            decrement: 1,
          },
        },
      });
    });

    return res.status(200).json({
      processed: true,
    });
  } catch (error) {
    console.error("Error updating quarantine:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update quarantine row",
    });
  }
};
