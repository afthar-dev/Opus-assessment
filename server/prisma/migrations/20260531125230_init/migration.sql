-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'PARTIAL_SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "QuarantineStatus" AS ENUM ('PENDING', 'CORRECTED', 'REPROCESSED');

-- CreateTable
CREATE TABLE "Upload" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "status" "UploadStatus" NOT NULL DEFAULT 'PROCESSING',
    "totalRows" INTEGER,
    "acceptedRows" INTEGER,
    "quarantinedRows" INTEGER,
    "headerRowDetected" INTEGER,
    "processingDurationMs" INTEGER,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessingReport" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "acceptedRows" INTEGER NOT NULL,
    "quarantinedRows" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessingReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuarantineRow" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "rawData" JSONB NOT NULL,
    "status" "QuarantineStatus" NOT NULL DEFAULT 'PENDING',
    "correctedData" JSONB,
    "correctedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuarantineRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuarantineError" (
    "id" TEXT NOT NULL,
    "quarantineRowId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "field" TEXT,
    "rawValue" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuarantineError_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorAssignment" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "assignmentCode" TEXT NOT NULL,
    "tutorName" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "level" TEXT,
    "hourlyRate" DECIMAL(10,2) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "contactEmail" TEXT,
    "sourceRow" INTEGER,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TutorAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonLog" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "logId" TEXT NOT NULL,
    "assignmentCode" TEXT,
    "lessonDate" TIMESTAMP(3) NOT NULL,
    "durationHours" DECIMAL(5,2),
    "attendance" TEXT NOT NULL,
    "notes" TEXT,
    "fee" DECIMAL(10,2),
    "sourceRow" INTEGER,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "tutorId" TEXT,
    "studentName" TEXT,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "notes" TEXT,
    "sourceRow" INTEGER,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Upload_status_idx" ON "Upload"("status");

-- CreateIndex
CREATE INDEX "Upload_uploadedAt_idx" ON "Upload"("uploadedAt");

-- CreateIndex
CREATE INDEX "Upload_fileType_idx" ON "Upload"("fileType");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessingReport_uploadId_key" ON "ProcessingReport"("uploadId");

-- CreateIndex
CREATE INDEX "QuarantineRow_uploadId_idx" ON "QuarantineRow"("uploadId");

-- CreateIndex
CREATE INDEX "QuarantineRow_rowNumber_idx" ON "QuarantineRow"("rowNumber");

-- CreateIndex
CREATE INDEX "QuarantineRow_status_idx" ON "QuarantineRow"("status");

-- CreateIndex
CREATE INDEX "QuarantineError_code_idx" ON "QuarantineError"("code");

-- CreateIndex
CREATE INDEX "TutorAssignment_uploadId_idx" ON "TutorAssignment"("uploadId");

-- CreateIndex
CREATE INDEX "TutorAssignment_startDate_idx" ON "TutorAssignment"("startDate");

-- CreateIndex
CREATE INDEX "TutorAssignment_tutorName_idx" ON "TutorAssignment"("tutorName");

-- CreateIndex
CREATE INDEX "TutorAssignment_studentName_idx" ON "TutorAssignment"("studentName");

-- CreateIndex
CREATE INDEX "TutorAssignment_subject_idx" ON "TutorAssignment"("subject");

-- CreateIndex
CREATE INDEX "TutorAssignment_assignmentCode_idx" ON "TutorAssignment"("assignmentCode");

-- CreateIndex
CREATE INDEX "TutorAssignment_tutorName_studentName_startDate_idx" ON "TutorAssignment"("tutorName", "studentName", "startDate");

-- CreateIndex
CREATE INDEX "LessonLog_uploadId_idx" ON "LessonLog"("uploadId");

-- CreateIndex
CREATE INDEX "LessonLog_lessonDate_idx" ON "LessonLog"("lessonDate");

-- CreateIndex
CREATE INDEX "LessonLog_assignmentCode_idx" ON "LessonLog"("assignmentCode");

-- CreateIndex
CREATE INDEX "LessonLog_attendance_idx" ON "LessonLog"("attendance");

-- CreateIndex
CREATE INDEX "LessonLog_logId_idx" ON "LessonLog"("logId");

-- CreateIndex
CREATE INDEX "LessonLog_assignmentCode_lessonDate_idx" ON "LessonLog"("assignmentCode", "lessonDate");

-- CreateIndex
CREATE INDEX "Invoice_uploadId_idx" ON "Invoice"("uploadId");

-- CreateIndex
CREATE INDEX "Invoice_invoiceDate_idx" ON "Invoice"("invoiceDate");

-- CreateIndex
CREATE INDEX "Invoice_paymentStatus_idx" ON "Invoice"("paymentStatus");

-- CreateIndex
CREATE INDEX "Invoice_invoiceNumber_idx" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_invoiceNumber_invoiceDate_idx" ON "Invoice"("invoiceNumber", "invoiceDate");

-- AddForeignKey
ALTER TABLE "ProcessingReport" ADD CONSTRAINT "ProcessingReport_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuarantineRow" ADD CONSTRAINT "QuarantineRow_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuarantineError" ADD CONSTRAINT "QuarantineError_quarantineRowId_fkey" FOREIGN KEY ("quarantineRowId") REFERENCES "QuarantineRow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorAssignment" ADD CONSTRAINT "TutorAssignment_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonLog" ADD CONSTRAINT "LessonLog_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;
