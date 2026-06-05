import { cleanRows } from "./cleaning.service.ts";
import { validateRows } from "./validation.service.ts";

export type FileType =
  | "INVOICE"
  | "LESSON_LOG"
  | "TUTOR_ASSIGNMENT"
  | "UNKNOWN";

export type ValidationError = {
  code: string;
  field: string | null;
  value: unknown;
  message: string;
};

type EvaluateQuarantineCorrectionInput = {
  fileType: FileType;
  rawData: Record<string, unknown>;
  corrections?: Record<string, unknown>;
  existingErrors?: ValidationError[];
  existingDuplicateKeys?: string[];
};

type QuarantineCorrectionResult = {
  isValid: boolean;
  cleanedData: Record<string, unknown>;
  errors: ValidationError[];
};

const normalizeFileType = (fileType: string): FileType => {
  if (
    fileType === "INVOICE" ||
    fileType === "LESSON_LOG" ||
    fileType === "TUTOR_ASSIGNMENT"
  ) {
    return fileType;
  }

  return "UNKNOWN";
};

const normalizeErrors = (errors: ValidationError[]) =>
  errors.map((error) => ({
    code: error.code,
    field: error.field ?? null,
    value: error.value,
    message: error.message,
  }));

const duplicateKeyFor = (
  fileType: FileType,
  row: Record<string, unknown>,
): string | null => {
  switch (fileType) {
    case "INVOICE":
      return row.invoiceNumber ? String(row.invoiceNumber) : null;

    case "LESSON_LOG":
      return row.assignmentCode && row.lessonDate
        ? `${row.assignmentCode}|${row.lessonDate}`
        : null;

    case "TUTOR_ASSIGNMENT":
      return row.tutorName && row.studentName && row.startDate
        ? `${row.tutorName}|${row.studentName}|${row.startDate}`
        : null;

    default:
      return null;
  }
};

const unchangedDuplicateErrors = ({
  fileType,
  cleanedData,
  existingErrors,
}: {
  fileType: FileType;
  cleanedData: Record<string, unknown>;
  existingErrors: ValidationError[];
}) => {
  const duplicateKey = duplicateKeyFor(fileType, cleanedData);
  if (duplicateKey === null) return [];

  return existingErrors.filter(
    (error) =>
      error.code === "DUPLICATE_RECORD" && String(error.value) === duplicateKey,
  );
};

const duplicateFieldFor = (fileType: FileType): string | null => {
  switch (fileType) {
    case "INVOICE":
      return "invoiceNumber";

    case "LESSON_LOG":
      return "assignmentCode";

    case "TUTOR_ASSIGNMENT":
      return "tutorName";

    default:
      return null;
  }
};

const uploadWideDuplicateErrors = ({
  fileType,
  cleanedData,
  existingDuplicateKeys,
}: {
  fileType: FileType;
  cleanedData: Record<string, unknown>;
  existingDuplicateKeys: string[];
}) => {
  const duplicateKey = duplicateKeyFor(fileType, cleanedData);
  if (duplicateKey === null) return [];

  const duplicateKeys = new Set(existingDuplicateKeys.map((key) => String(key)));
  if (!duplicateKeys.has(duplicateKey)) return [];

  const field = duplicateFieldFor(fileType);
  if (field === null) return [];

  return [
    {
      code: "DUPLICATE_RECORD",
      field,
      value: duplicateKey,
      message:
        fileType === "INVOICE"
          ? "Duplicate invoice detected"
          : "Duplicate record detected",
    },
  ];
};

const uniqueErrors = (errors: ValidationError[]) => {
  const seen = new Set<string>();

  return errors.filter((error) => {
    const key = `${error.code}|${error.field ?? ""}|${String(error.value)}`;
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

export const evaluateQuarantineCorrection = ({
  fileType,
  rawData,
  corrections = {},
  existingErrors = [],
  existingDuplicateKeys = [],
}: EvaluateQuarantineCorrectionInput): QuarantineCorrectionResult => {
  const mergedData = {
    ...rawData,
    ...corrections,
  };

  const normalizedFileType = normalizeFileType(fileType);
  const cleanedRows = cleanRows({
    fileType: normalizedFileType,
    rows: [mergedData],
  });

  const cleanedData = (cleanedRows[0] ?? mergedData) as Record<string, unknown>;

  if (cleanedRows.length === 0) {
    return {
      isValid: false,
      cleanedData,
      errors: [
        {
          code: "EMPTY_ROW",
          field: null,
          value: null,
          message: "Corrected row does not contain enough data",
        },
      ],
    };
  }

  const validationResult = validateRows({
    fileType: normalizedFileType,
    rows: cleanedRows,
  });

  const errors = validationResult.invalidRows[0]?.errors ?? [];
  const duplicateErrors = unchangedDuplicateErrors({
    fileType: normalizedFileType,
    cleanedData,
    existingErrors,
  });
  const contextDuplicateErrors = uploadWideDuplicateErrors({
    fileType: normalizedFileType,
    cleanedData,
    existingDuplicateKeys,
  });
  const allErrors = uniqueErrors([
    ...errors,
    ...duplicateErrors,
    ...contextDuplicateErrors,
  ]);

  return {
    isValid: allErrors.length === 0,
    cleanedData,
    errors: normalizeErrors(allErrors),
  };
};
