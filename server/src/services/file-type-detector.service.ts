import type { ExcelRows } from "./excel.service.ts";

export type FileType =
  | "TUTOR_ASSIGNMENT"
  | "LESSON_LOG"
  | "INVOICE"
  | "UNKNOWN";

type DetectFileTypeInput = {
  headerRow: unknown[] | null;
  rows: ExcelRows;
};

export const detectFileType = ({
  headerRow,
  rows,
}: DetectFileTypeInput): FileType => {
  /*
   * CASE 1
   * Header exists
   */

  if (headerRow) {
    const normalizedHeaders = headerRow.map((header) =>
      String(header).toLowerCase().trim(),
    );

    const headerText = normalizedHeaders.join(" ");

    /*
     * Tutor Assignment
     */

    const tutorAssignmentKeywords = [
      "assignment id",
      "tutor name",
      "student name",
      "hourly rate",
      "subject",
      "level",
    ];

    const tutorMatches = tutorAssignmentKeywords.filter((keyword) =>
      headerText.includes(keyword),
    ).length;

    /*
     * Invoice
     */

    const invoiceKeywords = [
      "invoice",
      "invoice id",
      "invoice number",
      "payment status",
      "amount",
      "payment date",
    ];

    const invoiceMatches = invoiceKeywords.filter((keyword) =>
      headerText.includes(keyword),
    ).length;

    if (tutorMatches >= 2 && tutorMatches > invoiceMatches) {
      return "TUTOR_ASSIGNMENT";
    }

    if (invoiceMatches >= 2 && invoiceMatches >= tutorMatches) {
      return "INVOICE";
    }
  }

  /*
   * CASE 2
   * No header found
   * Lesson Logs file
   */

  const sampleRows = rows
    .filter(
      (row) =>
        Array.isArray(row) && row.some((cell) => String(cell).trim() !== ""),
    )
    .slice(0, 10);

  let lessonLogScore = 0;

  for (const row of sampleRows) {
    const values = row.map((cell) => String(cell).trim());

    /*
     * LOG-001
     */

    if (/^LOG-\d+/i.test(values[0] || "")) {
      lessonLogScore += 5;
    }

    /*
     * TAS-001
     */

    if (/^TAS-\d+/i.test(values[1] || "")) {
      lessonLogScore += 4;
    }

    /*
     * Attendance
     */

    const attendance = (values[4] || "").toLowerCase();

    if (["present", "absent", "late"].includes(attendance)) {
      lessonLogScore += 3;
    }

    /*
     * Duration
     */

    const duration = Number(values[3]);

    if (!Number.isNaN(duration) && duration > 0 && duration <= 12) {
      lessonLogScore += 2;
    }

    /*
     * Fee
     */

    const fee = values[6] || "";

    if (fee === "TBC" || fee === "N/A" || !Number.isNaN(Number(fee))) {
      lessonLogScore += 2;
    }
  }

  if (lessonLogScore >= 10) {
    return "LESSON_LOG";
  }

  return "UNKNOWN";
};
