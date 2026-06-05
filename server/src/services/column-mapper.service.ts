export type FileType =
  | "TUTOR_ASSIGNMENT"
  | "LESSON_LOG"
  | "INVOICE"
  | "UNKNOWN";

type MapRowsInput = {
  fileType: FileType;
  rows: any[][];
  headerRowIndex: number | null;
};

const mapTutorAssignments = (rows: any[][], headerRowIndex: number) => {
  const dataRows = rows.slice(headerRowIndex + 1);

  return dataRows
    .filter((row) => row.some((cell) => String(cell).trim() !== ""))
    .map((row, index) => ({
      sourceRow: headerRowIndex + index + 2,

      assignmentCode: row[0],
      tutorName: row[1],
      studentName: row[2],
      subject: row[3],
      level: row[4],
      hourlyRate: row[5],
      startDate: row[6],
      status: row[7],
      contactEmail: row[8],

      rawData: row,
    }));
};
const mapInvoices = (rows: any[][], headerRowIndex: number) => {
  const dataRows = rows.slice(headerRowIndex + 1);

  return dataRows
    .filter((row) => row.some((cell) => String(cell).trim() !== ""))
    .map((row, index) => ({
      sourceRow: headerRowIndex + index + 2,

      invoiceNumber: row[0],
      tutorId: row[1],
      studentName: row[2],
      invoiceDate: row[3],
      amount: row[4],
      paymentStatus: row[5],
      paymentDate: row[6],
      notes: row[7],

      rawData: row,
    }));
};
const mapLessonLogs = (rows: any[][]) => {
  return rows
    .filter((row) => row.some((cell) => String(cell).trim() !== ""))
    .map((row, index) => ({
      sourceRow: index + 1,

      logId: row[0],
      assignmentCode: row[1],
      lessonDate: row[2],
      durationHours: row[3],
      attendance: row[4],
      notes: row[5],
      fee: row[6],

      rawData: row,
    }));
};

export const mapRows = ({ fileType, rows, headerRowIndex }: MapRowsInput) => {
  switch (fileType) {
    case "TUTOR_ASSIGNMENT":
      return mapTutorAssignments(rows, headerRowIndex!);

    case "INVOICE":
      return mapInvoices(rows, headerRowIndex!);

    case "LESSON_LOG":
      return mapLessonLogs(rows);

    default:
      return [];
  }
};
