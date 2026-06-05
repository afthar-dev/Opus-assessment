import { prisma } from "../lib/prisma.ts";

type FileType = "INVOICE" | "LESSON_LOG" | "TUTOR_ASSIGNMENT" | "UNKNOWN";

type StoreRecordsInput = {
  uploadId: string;
  fileType: FileType;
  rows: any[];
};

const storeInvoices = async (uploadId: string, rows: any[]) => {
  if (!rows.length) return;

  await prisma.invoice.createMany({
    data: rows.map((row) => ({
      uploadId,

      invoiceNumber: row.invoiceNumber,

      tutorId: row.tutorId,

      studentName: row.studentName,

      invoiceDate: new Date(row.invoiceDate),

      amount: row.amount,

      paymentStatus: row.paymentStatus,

      paymentDate: row.paymentDate ? new Date(row.paymentDate) : null,

      notes: row.notes,

      sourceRow: row.sourceRow,

      rawData: row.rawData,
    })),
  });
};
const storeLessonLogs = async (uploadId: string, rows: any[]) => {
  if (!rows.length) return;

  await prisma.lessonLog.createMany({
    data: rows.map((row) => ({
      uploadId,

      logId: row.logId,

      assignmentCode: row.assignmentCode,

      lessonDate: new Date(row.lessonDate),

      durationHours: row.durationHours,

      attendance: row.attendance,

      notes: row.notes,

      fee: row.fee,

      sourceRow: row.sourceRow,

      rawData: row.rawData,
    })),
  });
};
const storeTutorAssignments = async (uploadId: string, rows: any[]) => {
  if (!rows.length) return;

  await prisma.tutorAssignment.createMany({
    data: rows.map((row) => ({
      uploadId,

      assignmentCode: row.assignmentCode,

      tutorName: row.tutorName,

      studentName: row.studentName,

      subject: row.subject,

      level: row.level,

      hourlyRate: row.hourlyRate,

      startDate: new Date(row.startDate),

      status: row.status,

      contactEmail: row.contactEmail,

      sourceRow: row.sourceRow,

      rawData: row.rawData,
    })),
  });
};
export const storeRecords = async ({
  uploadId,
  fileType,
  rows,
}: StoreRecordsInput) => {
  switch (fileType) {
    case "INVOICE":
      return storeInvoices(uploadId, rows);

    case "LESSON_LOG":
      return storeLessonLogs(uploadId, rows);

    case "TUTOR_ASSIGNMENT":
      return storeTutorAssignments(uploadId, rows);

    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
};
