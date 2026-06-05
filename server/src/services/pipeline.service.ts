import { cleanRows } from "./cleaning.service.ts";
import { mapRows } from "./column-mapper.service.ts";
import { readExcel } from "./excel.service.ts";
import { detectFileType } from "./file-type-detector.service.ts";
import {
  detectHeaderRow,
  type HeaderDetectionResult,
} from "./header-detection.service.ts";
import { createProcessingReport } from "./report.service.ts";
import { storeRecords } from "./record-storage.service.ts";
import { quarantineRows } from "./quarantine.service.ts";
import { validateRows } from "./validation.service.ts";

type PipelineInput = {
  uploadId: string;
  filePath: string;
};

export const runPipeline = async ({ uploadId, filePath }: PipelineInput) => {
  const startedAt = Date.now();

  /*
   * Read Excel
   */
  const rows = readExcel(filePath);

  /*
   * Detect Header
   */
  const headerResult: HeaderDetectionResult | null =
    rows.length > 0 ? detectHeaderRow(rows) : null;

  /*
   * Detect File Type
   */
  const fileType = detectFileType({
    headerRow: headerResult?.hasHeader ? headerResult.headerRow : null,
    rows,
  });

  /*
   * Map Columns
   */
  const mappedRows = mapRows({
    fileType,
    rows,
    headerRowIndex: headerResult?.headerRowIndex ?? null,
  });

  /*
   * Clean Data
   */
  const cleanedRows = cleanRows({
    fileType,
    rows: mappedRows,
  });

  /*
   * Validate
   */
  const validationResult = validateRows({
    fileType,
    rows: cleanedRows,
  });

  /*
   * Store Valid Records
   */
  await storeRecords({
    uploadId,
    fileType,
    rows: validationResult.validRows,
  });

  /*
   * Quarantine Invalid Records
   */
  await quarantineRows(uploadId, validationResult.invalidRows);

  /*
   * Create Report
   */
  const report = await createProcessingReport({
    uploadId,

    totalRows: cleanedRows.length,

    validRows: validationResult.validRows.length,

    invalidRows: validationResult.invalidRows.length,

    fileType,

    headerRowDetected: headerResult?.headerRowIndex ?? null,

    processingDurationMs: Date.now() - startedAt,
  });
  console.log(
    `Pipeline completed for upload ${uploadId}. FileType: ${fileType}, Total: ${cleanedRows.length}, Valid: ${validationResult.validRows.length}, Invalid: ${validationResult.invalidRows.length}, Duration: ${
      Date.now() - startedAt
    }ms`,
  );
  console.log(`Report `, report);
  return {
    fileType,

    totalRows: cleanedRows.length,

    validRows: validationResult.validRows.length,

    invalidRows: validationResult.invalidRows.length,

    report,
  };
};
