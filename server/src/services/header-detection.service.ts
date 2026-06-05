import type { ExcelRows } from "./excel.service.ts";

export type HeaderDetectionResult = {
  hasHeader: boolean;
  headerRowIndex: number | null;
  score: number;
  headerRow: unknown[] | null;
};

export const detectHeaderRow = (rows: ExcelRows): HeaderDetectionResult => {
  let bestScore = -1;
  let bestRow: number | null = null;

  const maxRowsToCheck = Math.min(rows.length, 30);

  for (let i = 0; i < maxRowsToCheck; i++) {
    const row = rows[i];

    let score = 0;

    const nonEmptyCells = row!.filter(
      (cell) =>
        cell !== null && cell !== undefined && String(cell).trim() !== "",
    );

    if (nonEmptyCells.length >= 3) {
      score += 3;
    }

    const stringCells = nonEmptyCells.filter(
      (cell) => typeof cell === "string",
    );

    if (stringCells.length === nonEmptyCells.length) {
      score += 2;
    }

    const headerKeywords = [
      "id",
      "name",
      "date",
      "student",
      "tutor",
      "subject",
      "amount",
      "status",
      "invoice",
      "rate",
      "fee",
    ];

    for (const cell of nonEmptyCells) {
      const value = String(cell).toLowerCase().trim();

      if (headerKeywords.some((keyword) => value.includes(keyword))) {
        score += 5;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestRow = i;
    }
  }
  const HEADER_THRESHOLD = 12;
  return {
    hasHeader: bestScore >= HEADER_THRESHOLD,
    headerRowIndex: bestScore >= HEADER_THRESHOLD ? bestRow : null,

    score: bestScore,
    headerRow:
      bestRow !== null && bestScore >= HEADER_THRESHOLD
        ? (rows[bestRow] ?? null)
        : null,
  };
};
