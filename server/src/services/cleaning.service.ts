import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";

dayjs.extend(customParseFormat);

// ─── Types ────────────────────────────────────────────────────────────────────

type FileType = "TUTOR_ASSIGNMENT" | "LESSON_LOG" | "INVOICE" | "UNKNOWN";

type CleanRowsInput = {
  fileType: FileType;
  rows: any[];
};

// ─── Cleaning Helpers ─────────────────────────────────────────────────────────

const DATE_FORMATS = [
  // ISO
  "YYYY-MM-DD",
  // Slash: day/month/year and month/day/year variants
  "DD/MM/YYYY",
  "D/M/YYYY",
  "DD/MM/YY",
  "D/M/YY",
  "MM/DD/YYYY",
  "M/D/YYYY",
  "MM/DD/YY",
  "M/D/YY",
  // Hyphen: numeric day-month-year
  "DD-MM-YYYY",
  "D-M-YYYY",
  "DD-MM-YY",
  "D-M-YY",
  // Space: abbreviated month names
  "DD MMM YYYY",
  "D MMM YYYY",
  "MMM DD, YYYY",
  "MMM D, YYYY",
  // Space: full month names (e.g. "12 February 2025")
  "DD MMMM YYYY",
  "D MMMM YYYY",
  "MMMM D, YYYY",
  "MMMM DD, YYYY",
  // Hyphen: abbreviated month names (e.g. "15-Oct-2025")
  "DD-MMM-YYYY",
  "D-MMM-YYYY",
];

const SUBJECT_ALIASES: Record<string, string> = {
  MATH: "MATH",
  MATHS: "MATH",
  MATHEMATICS: "MATH",
  ENGLISH: "ENGLISH",
  SCIENCE: "SCIENCE",
  PHYSICS: "PHYSICS",
  CHEMISTRY: "CHEMISTRY",
  BIOLOGY: "BIOLOGY",
  HISTORY: "HISTORY",
  GEOGRAPHY: "GEOGRAPHY",
  ECONOMICS: "ECONOMICS",
};

const STATUS_ALIASES: Record<string, string> = {
  PAID: "PAID",
  PENDING: "PENDING",
  PEND: "PENDING",
  OVERDUE: "OVERDUE",
  CANCELLED: "CANCELLED",
  CANCELED: "CANCELLED",
};

export const cleanText = (value: unknown): string | null => {
  const cleaned = String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");

  return cleaned === "" ? null : cleaned;
};

export const cleanCurrency = (value: unknown): number | null => {
  const cleaned = String(value ?? "")
    .replace(/SGD/gi, "")
    .replace(/\$/g, "")
    .replace(/,/g, "")
    .trim();

  if (!cleaned) return null;

  const number = Number(cleaned);

  return Number.isNaN(number) ? null : number;
};

export const cleanNumber = (value: unknown): number | null => {
  const cleaned = String(value ?? "").trim();

  if (!cleaned) return null;

  const number = Number(cleaned);

  return Number.isNaN(number) ? null : number;
};

export const cleanStatus = (value: unknown): string | null => {
  const status = cleanText(value)?.toUpperCase();

  if (!status) return null;

  return STATUS_ALIASES[status] ?? status;
};

export const cleanSubject = (value: unknown): string | null => {
  const subject = cleanText(value)?.toUpperCase();

  if (!subject) return null;

  return SUBJECT_ALIASES[subject] ?? subject;
};

export const cleanDate = (value: unknown): string | null => {
  if (value == null || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : dayjs(value).format("YYYY-MM-DD");
  }

  if (typeof value === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    excelEpoch.setUTCDate(excelEpoch.getUTCDate() + value);
    return dayjs(excelEpoch).format("YYYY-MM-DD");
  }

  const raw = String(value).trim();

  for (const format of DATE_FORMATS) {
    const parsed = dayjs(raw, format, true);

    if (parsed.isValid()) {
      return parsed.format("YYYY-MM-DD");
    }
  }

  // Handle string-encoded Excel serial dates (e.g. "44927")
  const numericValue = Number(raw);
  if (
    !Number.isNaN(numericValue) &&
    Number.isInteger(numericValue) &&
    numericValue > 0
  ) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    excelEpoch.setUTCDate(excelEpoch.getUTCDate() + numericValue);
    const result = dayjs(excelEpoch).format("YYYY-MM-DD");
    if (result.startsWith("19") || result.startsWith("20")) {
      return result;
    }
  }

  return null;
};

// ─── Row Cleaning Pipeline ────────────────────────────────────────────────────

const getMeaningfulCellCount = (row: any) => {
  if (Array.isArray(row.rawData)) {
    return row.rawData.filter((cell: unknown) => cleanText(cell) !== null)
      .length;
  }

  return Object.entries(row).filter(
    ([key, value]) =>
      key !== "rawData" && key !== "sourceRow" && cleanText(value) !== null,
  ).length;
};

const removeNonDataRows = (rows: any[]) =>
  rows.filter((row) => getMeaningfulCellCount(row) > 1);

const withRawSnapshot = (row: any) => ({
  ...row,
  __raw: { ...row },
});

const cleanInvoices = (rows: any[]) =>
  removeNonDataRows(rows).map((row) => ({
    ...withRawSnapshot(row),
    invoiceNumber: cleanText(row.invoiceNumber),
    tutorId: cleanText(row.tutorId),
    studentName: cleanText(row.studentName),
    invoiceDate: cleanDate(row.invoiceDate),
    amount: cleanCurrency(row.amount),
    paymentStatus: cleanStatus(row.paymentStatus),
    paymentDate: cleanDate(row.paymentDate),
    notes: cleanText(row.notes),
  }));

const cleanLessonLogs = (rows: any[]) =>
  removeNonDataRows(rows).map((row) => ({
    ...withRawSnapshot(row),
    logId: cleanText(row.logId),
    assignmentCode: cleanText(row.assignmentCode),
    lessonDate: cleanDate(row.lessonDate),
    durationHours: cleanNumber(row.durationHours),
    attendance: cleanStatus(row.attendance),
    notes: cleanText(row.notes),
    fee: cleanCurrency(row.fee),
  }));

const cleanTutorAssignments = (rows: any[]) =>
  removeNonDataRows(rows).map((row) => ({
    ...withRawSnapshot(row),
    assignmentCode: cleanText(row.assignmentCode),
    tutorName: cleanText(row.tutorName),
    studentName: cleanText(row.studentName),
    subject: cleanSubject(row.subject),
    level: cleanText(row.level),
    hourlyRate: cleanCurrency(row.hourlyRate),
    startDate: cleanDate(row.startDate),
    status: cleanText(row.status),
    contactEmail: cleanText(row.contactEmail),
  }));

export const cleanRows = ({ fileType, rows }: CleanRowsInput) => {
  switch (fileType) {
    case "INVOICE":
      return cleanInvoices(rows);

    case "LESSON_LOG":
      return cleanLessonLogs(rows);

    case "TUTOR_ASSIGNMENT":
      return cleanTutorAssignments(rows);

    default:
      return removeNonDataRows(rows);
  }
};
