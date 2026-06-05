type FileType = "TUTOR_ASSIGNMENT" | "LESSON_LOG" | "INVOICE" | "UNKNOWN";

type ValidationError = {
  code:
    | "REQUIRED_FIELD_MISSING"
    | "INVALID_DATE"
    | "INVALID_AMOUNT"
    | "INVALID_DURATION"
    | "INVALID_FEE"
    | "INVALID_RATE"
    | "UNKNOWN_SUBJECT"
    | "UNKNOWN_STATUS"
    | "DUPLICATE_RECORD"
    | "NEAR_DUPLICATE";
  field: string;
  value: unknown;
  message: string;
};

type ValidationResult = {
  validRows: any[];
  invalidRows: {
    row: any;
    errors: ValidationError[];
  }[];
};

// ─── Validation Constants ──────────────────────────────────────────────────────

const CANONICAL_SUBJECTS = new Set([
  "MATH",
  "ENGLISH",
  "SCIENCE",
  "PHYSICS",
  "CHEMISTRY",
  "BIOLOGY",
  "HISTORY",
  "GEOGRAPHY",
  "ECONOMICS",
]);

const CANONICAL_STATUSES = new Set(["PAID", "PENDING", "OVERDUE", "CANCELLED"]);

// ─── Validation Helpers ───────────────────────────────────────────────────────

const hasValue = (value: unknown) =>
  value !== null && value !== undefined && String(value).trim() !== "";

const addRequiredError = (
  errors: ValidationError[],
  field: string,
  value: unknown,
) => {
  errors.push({
    code: "REQUIRED_FIELD_MISSING",
    field,
    value,
    message: `${field} is required`,
  });
};

/**
 * Two-pass duplicate detection: build a frequency map of identity keys across
 * ALL rows first, then check each row against the global counts. This ensures
 * both duplicate occurrences get flagged and an invalid row's key doesn't
 * pollute tracking for subsequent rows.
 */
const buildKeyFrequencyMap = (
  rows: any[],
  keyExtractor: (row: any) => string | null,
): Map<string, number> => {
  const freq = new Map<string, number>();

  for (const row of rows) {
    const key = keyExtractor(row);
    if (key !== null) {
      freq.set(key, (freq.get(key) ?? 0) + 1);
    }
  }

  return freq;
};

// ─── Invoice Validation ───────────────────────────────────────────────────────
// Required: invoiceNumber (unique), invoiceDate, amount
// Checked: paymentStatus against canonical set (warn only — pass through if unknown)

const validateInvoices = (rows: any[]): ValidationResult => {
  const validRows: any[] = [];
  const invalidRows: ValidationResult["invalidRows"] = [];

  const keyFreq = buildKeyFrequencyMap(rows, (row) => row.invoiceNumber);

  for (const row of rows) {
    const errors: ValidationError[] = [];

    if (!hasValue(row.invoiceNumber)) {
      addRequiredError(errors, "invoiceNumber", row.invoiceNumber);
    } else if ((keyFreq.get(row.invoiceNumber) ?? 0) > 1) {
      errors.push({
        code: "DUPLICATE_RECORD",
        field: "invoiceNumber",
        value: row.invoiceNumber,
        message: "Duplicate invoice detected",
      });
    }

    if (!hasValue(row.invoiceDate)) {
      errors.push({
        code: "INVALID_DATE",
        field: "invoiceDate",
        value: row.invoiceDate,
        message: "Invalid invoice date",
      });
    }

    if (row.amount === null) {
      errors.push({
        code: "INVALID_AMOUNT",
        field: "amount",
        value: row.amount,
        message: "Invalid amount",
      });
    }

    // paymentStatus: not a hard requirement. If present, check canonical set.
    // If missing or unknown, row still passes — unrecognised values pass through
    // as-is (per assessment: "decide and document what happens to unrecognised values").
    if (
      row.paymentStatus !== null &&
      row.paymentStatus !== undefined &&
      !CANONICAL_STATUSES.has(row.paymentStatus)
    ) {
      errors.push({
        code: "UNKNOWN_STATUS",
        field: "paymentStatus",
        value: row.paymentStatus,
        message: `Unknown payment status: ${row.paymentStatus}`,
      });
    }

    if (errors.length) {
      invalidRows.push({ row, errors });
    } else {
      validRows.push(row);
    }
  }

  return { validRows, invalidRows };
};

// ─── Lesson Log Validation ───────────────────────────────────────────────────
// Required: assignmentCode, lessonDate, durationHours (> 0), fee (non-null)
// Unique key: assignmentCode + lessonDate

const validateLessonLogs = (rows: any[]): ValidationResult => {
  const validRows: any[] = [];
  const invalidRows: ValidationResult["invalidRows"] = [];

  const keyFreq = buildKeyFrequencyMap(rows, (row) =>
    row.assignmentCode && row.lessonDate
      ? `${row.assignmentCode}|${row.lessonDate}`
      : null,
  );

  for (const row of rows) {
    const errors: ValidationError[] = [];

    if (!hasValue(row.assignmentCode)) {
      addRequiredError(errors, "assignmentCode", row.assignmentCode);
    }

    if (!hasValue(row.lessonDate)) {
      errors.push({
        code: "INVALID_DATE",
        field: "lessonDate",
        value: row.lessonDate,
        message: "Invalid lesson date",
      });
    }

    if (row.durationHours === null || row.durationHours <= 0) {
      errors.push({
        code: "INVALID_DURATION",
        field: "durationHours",
        value: row.durationHours,
        message: "Duration must be greater than zero",
      });
    }

    if (row.fee === null) {
      errors.push({
        code: "INVALID_FEE",
        field: "fee",
        value: row.fee,
        message: "Invalid fee",
      });
    }

    if (
      hasValue(row.assignmentCode) &&
      hasValue(row.lessonDate) &&
      (keyFreq.get(`${row.assignmentCode}|${row.lessonDate}`) ?? 0) > 1
    ) {
      errors.push({
        code: "DUPLICATE_RECORD",
        field: "assignmentCode",
        value: `${row.assignmentCode}|${row.lessonDate}`,
        message: "Duplicate lesson log",
      });
    }

    if (errors.length) {
      invalidRows.push({ row, errors });
    } else {
      validRows.push(row);
    }
  }

  return { validRows, invalidRows };
};

// ─── Tutor Assignment Validation ──────────────────────────────────────────────
// Required: tutorName, studentName, subject, hourlyRate (> 0), startDate
// Unique key: tutorName + studentName + startDate
// Near-duplicate: same key but different hourlyRate

const validateTutorAssignments = (rows: any[]): ValidationResult => {
  const validRows: any[] = [];
  const invalidRows: ValidationResult["invalidRows"] = [];

  // Build map of composite key → { count, distinct rates }
  const keyRates = new Map<string, { count: number; rates: Set<number> }>();

  for (const row of rows) {
    const key =
      row.tutorName && row.studentName && row.startDate
        ? `${row.tutorName}|${row.studentName}|${row.startDate}`
        : null;

    if (key !== null) {
      const entry = keyRates.get(key) ?? {
        count: 0,
        rates: new Set<number>(),
      };
      entry.count++;
      if (row.hourlyRate !== null) {
        entry.rates.add(row.hourlyRate);
      }
      keyRates.set(key, entry);
    }
  }

  for (const row of rows) {
    const errors: ValidationError[] = [];

    if (!hasValue(row.tutorName)) {
      addRequiredError(errors, "tutorName", row.tutorName);
    }

    if (!hasValue(row.studentName)) {
      addRequiredError(errors, "studentName", row.studentName);
    }

    if (!CANONICAL_SUBJECTS.has(row.subject)) {
      errors.push({
        code: "UNKNOWN_SUBJECT",
        field: "subject",
        value: row.subject,
        message: "Unknown subject",
      });
    }

    if (row.hourlyRate === null || row.hourlyRate <= 0) {
      errors.push({
        code: "INVALID_RATE",
        field: "hourlyRate",
        value: row.hourlyRate,
        message: "Invalid hourly rate",
      });
    }

    if (!hasValue(row.startDate)) {
      errors.push({
        code: "INVALID_DATE",
        field: "startDate",
        value: row.startDate,
        message: "Invalid start date",
      });
    }

    const key = `${row.tutorName}|${row.studentName}|${row.startDate}`;
    const entry = keyRates.get(key);

    if (entry && entry.count > 1) {
      if (entry.rates.size === 1) {
        errors.push({
          code: "DUPLICATE_RECORD",
          field: "tutorName",
          value: key,
          message: "Duplicate tutor assignment",
        });
      } else {
        errors.push({
          code: "NEAR_DUPLICATE",
          field: "hourlyRate",
          value: key,
          message: "Near duplicate assignment",
        });
      }
    }

    if (errors.length) {
      invalidRows.push({ row, errors });
    } else {
      validRows.push(row);
    }
  }

  return { validRows, invalidRows };
};

// ─── Public API ──────────────────────────────────────────────────────────────

export const validateRows = ({
  fileType,
  rows,
}: {
  fileType: FileType;
  rows: any[];
}) => {
  switch (fileType) {
    case "INVOICE":
      return validateInvoices(rows);

    case "LESSON_LOG":
      return validateLessonLogs(rows);

    case "TUTOR_ASSIGNMENT":
      return validateTutorAssignments(rows);

    default:
      return {
        validRows: [],
        invalidRows: [],
      };
  }
};
