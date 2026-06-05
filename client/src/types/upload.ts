export type UploadStatus =
  | "PROCESSING"
  | "COMPLETED"
  | "PARTIAL_SUCCESS"
  | "FAILED";

export type FileType = "INVOICE" | "LESSON_LOG" | "TUTOR_ASSIGNMENT" | "UNKNOWN";

export type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ProcessingReport = {
  id: string;
  uploadId: string;
  totalRows: number;
  acceptedRows: number;
  quarantinedRows: number;
  generatedAt: string;
};

export type QuarantineError = {
  id: string;
  quarantineRowId: string;
  code: string;
  field: string | null;
  rawValue: string | null;
  message: string;
  createdAt: string;
};

export type QuarantineRow = {
  id: string;
  uploadId: string;
  rowNumber: number;
  rawData: Record<string, unknown>;
  status: "PENDING" | "CORRECTED" | "REPROCESSED";
  correctedData: Record<string, unknown> | null;
  correctedAt: string | null;
  createdAt: string;
  errors: QuarantineError[];
};

export type QuarantineValidationError = {
  code: string;
  field: string | null;
  value: unknown;
  message: string;
};

export type QuarantineRowDetail = QuarantineRow & {
  upload: Pick<Upload, "id" | "fileType">;
};

export type QuarantineRevalidationResponse = {
  isValid: boolean;
  cleanedData: Record<string, unknown>;
  errors: QuarantineValidationError[];
};

export type QuarantineCorrectionResponse = {
  processed: boolean;
  errors?: QuarantineValidationError[];
};

export type Upload = {
  id: string;
  fileName: string;
  fileType: FileType;
  status: UploadStatus;
  totalRows: number | null;
  acceptedRows: number | null;
  quarantinedRows: number | null;
  headerRowDetected: number | null;
  processingDurationMs: number | null;
  uploadedAt: string;
  completedAt: string | null;
};

export type UploadDetail = Upload & {
  report: ProcessingReport | null;
  quarantineRows: QuarantineRow[];
};

export type UploadResponse = {
  uploadId: string;
  report: ProcessingReport;
};

export type UploadListResponse = {
  data: Upload[];
  pagination: Pagination;
};

export type UploadRecordsResponse = {
  fileType: string;
  records: Record<string, unknown>[];
  pagination: Pagination;
};

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type PaginatedApiEnvelope<T> = ApiEnvelope<T> & {
  pagination: Pagination;
};
