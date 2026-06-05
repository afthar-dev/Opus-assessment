import assert from "node:assert/strict";
import test from "node:test";

import { cleanRows } from "../src/services/cleaning.service.ts";
import { validateRows } from "../src/services/validation.service.ts";

const errorSummary = (result: ReturnType<typeof validateRows>) =>
  result.invalidRows.flatMap((invalidRow: any) =>
    invalidRow.errors.map((error: any) => ({
      code: error.code,
      field: error.field,
      value: error.value,
    })),
  );

test("cleans rows by removing blank whitespace and banner rows", () => {
  const cleanedRows = cleanRows({
    fileType: "LESSON_LOG",
    rows: [
      { sourceRow: 1, logId: "", rawData: ["", "   ", ""] },
      { sourceRow: 2, logId: "  OPUS Tuition Lesson Logs  ", rawData: ["  OPUS Tuition Lesson Logs  "] },
      {
        sourceRow: 3,
        logId: " LOG-001 ",
        assignmentCode: " TAS-001 ",
        lessonDate: "2026-04-03",
        durationHours: " 1.5 ",
        attendance: " present ",
        notes: "  trial   lesson  ",
        fee: "SGD 165.00",
        rawData: [" LOG-001 ", " TAS-001 ", "2026-04-03", " 1.5 ", " present ", "  trial   lesson  ", "SGD 165.00"],
      },
    ],
  });

  assert.equal(cleanedRows.length, 1);
  assert.equal(cleanedRows[0].logId, "LOG-001");
  assert.equal(cleanedRows[0].assignmentCode, "TAS-001");
  assert.equal(cleanedRows[0].notes, "trial lesson");
});

test("normalizes accepted date formats to YYYY-MM-DD and quarantines invalid dates", () => {
  const cleanedRows = cleanRows({
    fileType: "INVOICE",
    rows: [
      { sourceRow: 1, invoiceNumber: "INV-1", amount: "100", invoiceDate: "2026-04-01", paymentStatus: "paid", rawData: ["INV-1", "", "", "2026-04-01", "100", "paid"] },
      { sourceRow: 2, invoiceNumber: "INV-2", amount: "100", invoiceDate: "01/04/2026", paymentStatus: "paid", rawData: ["INV-2", "", "", "01/04/2026", "100", "paid"] },
      { sourceRow: 3, invoiceNumber: "INV-3", amount: "100", invoiceDate: "04/15/2026", paymentStatus: "paid", rawData: ["INV-3", "", "", "04/15/2026", "100", "paid"] },
      { sourceRow: 4, invoiceNumber: "INV-4", amount: "100", invoiceDate: "01-04-2026", paymentStatus: "paid", rawData: ["INV-4", "", "", "01-04-2026", "100", "paid"] },
      { sourceRow: 5, invoiceNumber: "INV-5", amount: "100", invoiceDate: "01 Apr 2026", paymentStatus: "paid", rawData: ["INV-5", "", "", "01 Apr 2026", "100", "paid"] },
      { sourceRow: 6, invoiceNumber: "INV-6", amount: "100", invoiceDate: "Apr 01, 2026", paymentStatus: "paid", rawData: ["INV-6", "", "", "Apr 01, 2026", "100", "paid"] },
      { sourceRow: 7, invoiceNumber: "INV-7", amount: "100", invoiceDate: "01/04/26", paymentStatus: "paid", rawData: ["INV-7", "", "", "01/04/26", "100", "paid"] },
      { sourceRow: 8, invoiceNumber: "INV-8", amount: "100", invoiceDate: "32/13/2025", paymentStatus: "paid", rawData: ["INV-8", "", "", "32/13/2025", "100", "paid"] },
    ],
  });

  assert.deepEqual(
    cleanedRows.slice(0, 7).map((row: any) => row.invoiceDate),
    ["2026-04-01", "2026-04-01", "2026-04-15", "2026-04-01", "2026-04-01", "2026-04-01", "2026-04-01"],
  );

  const result = validateRows({ fileType: "INVOICE", rows: cleanedRows });
  assert.deepEqual(errorSummary(result), [
    { code: "INVALID_DATE", field: "invoiceDate", value: "32/13/2025" },
  ]);
});

test("validates lesson log numeric duration fee zero fee and duplicates", () => {
  const cleanedRows = cleanRows({
    fileType: "LESSON_LOG",
    rows: [
      { sourceRow: 1, logId: "LOG-1", assignmentCode: "TAS-1", lessonDate: "2026-04-01", durationHours: "N/A", attendance: "present", fee: "TBC", rawData: ["LOG-1", "TAS-1", "2026-04-01", "N/A", "present", "", "TBC"] },
      { sourceRow: 2, logId: "LOG-2", assignmentCode: "TAS-2", lessonDate: "2026-04-02", durationHours: "0", attendance: "present", fee: "0", rawData: ["LOG-2", "TAS-2", "2026-04-02", "0", "present", "", "0"] },
      { sourceRow: 3, logId: "LOG-3", assignmentCode: "TAS-3", lessonDate: "2026-04-03", durationHours: "2", attendance: "present", fee: "200", rawData: ["LOG-3", "TAS-3", "2026-04-03", "2", "present", "", "200"] },
      { sourceRow: 4, logId: "LOG-4", assignmentCode: "TAS-3", lessonDate: "2026-04-03", durationHours: "2", attendance: "present", fee: "200", rawData: ["LOG-4", "TAS-3", "2026-04-03", "2", "present", "", "200"] },
    ],
  });

  const result = validateRows({ fileType: "LESSON_LOG", rows: cleanedRows });

  assert.equal(result.validRows.length, 0);
  assert.deepEqual(errorSummary(result), [
    { code: "INVALID_DURATION", field: "durationHours", value: "N/A" },
    { code: "INVALID_FEE", field: "fee", value: "TBC" },
    { code: "INVALID_DURATION", field: "durationHours", value: "0" },
    { code: "DUPLICATE_RECORD", field: "assignmentCode", value: "TAS-3|2026-04-03" },
    { code: "DUPLICATE_RECORD", field: "assignmentCode", value: "TAS-3|2026-04-03" },
  ]);
});

test("validates tutor subjects rates duplicates and near duplicates", () => {
  const cleanedRows = cleanRows({
    fileType: "TUTOR_ASSIGNMENT",
    rows: [
      { sourceRow: 1, assignmentCode: "A-1", tutorName: " Alice  Tan ", studentName: " Bob  Lee ", subject: "Mathematics", hourlyRate: "50", startDate: "2026-04-01", status: "active", rawData: ["A-1", " Alice  Tan ", " Bob  Lee ", "Mathematics", "", "50", "2026-04-01", "active"] },
      { sourceRow: 2, assignmentCode: "A-2", tutorName: "Alice Tan", studentName: "Bob Lee", subject: "MATH", hourlyRate: "50", startDate: "2026-04-01", status: "active", rawData: ["A-2", "Alice Tan", "Bob Lee", "MATH", "", "50", "2026-04-01", "active"] },
      { sourceRow: 3, assignmentCode: "A-3", tutorName: "Alice Tan", studentName: "Bob Lee", subject: "MATH", hourlyRate: "60", startDate: "2026-04-01", status: "active", rawData: ["A-3", "Alice Tan", "Bob Lee", "MATH", "", "60", "2026-04-01", "active"] },
      { sourceRow: 4, assignmentCode: "A-4", tutorName: "Carol", studentName: "Dan", subject: "Astrology", hourlyRate: "abc", startDate: "2026-04-02", status: "active", rawData: ["A-4", "Carol", "Dan", "Astrology", "", "abc", "2026-04-02", "active"] },
    ],
  });

  const result = validateRows({ fileType: "TUTOR_ASSIGNMENT", rows: cleanedRows });

  assert.equal(cleanedRows[0].subject, "MATH");
  assert.equal(cleanedRows[0].tutorName, "Alice Tan");
  assert.deepEqual(errorSummary(result), [
    { code: "NEAR_DUPLICATE", field: "hourlyRate", value: "Alice Tan|Bob Lee|2026-04-01" },
    { code: "NEAR_DUPLICATE", field: "hourlyRate", value: "Alice Tan|Bob Lee|2026-04-01" },
    { code: "NEAR_DUPLICATE", field: "hourlyRate", value: "Alice Tan|Bob Lee|2026-04-01" },
    { code: "UNKNOWN_SUBJECT", field: "subject", value: "Astrology" },
    { code: "INVALID_RATE", field: "hourlyRate", value: "abc" },
  ]);
});

test("validates invoice currency status and duplicates", () => {
  const cleanedRows = cleanRows({
    fileType: "INVOICE",
    rows: [
      { sourceRow: 1, invoiceNumber: "INV-1", amount: "SGD 165.00", invoiceDate: "2026-04-01", paymentStatus: "Paid ", rawData: ["INV-1", "", "", "2026-04-01", "SGD 165.00", "Paid "] },
      { sourceRow: 2, invoiceNumber: "INV-2", amount: "$200.50", invoiceDate: "2026-04-02", paymentStatus: "overdue", rawData: ["INV-2", "", "", "2026-04-02", "$200.50", "overdue"] },
      { sourceRow: 3, invoiceNumber: "INV-3", amount: "abc", invoiceDate: "2026-04-03", paymentStatus: "waiting", rawData: ["INV-3", "", "", "2026-04-03", "abc", "waiting"] },
      { sourceRow: 4, invoiceNumber: "INV-1", amount: "100", invoiceDate: "2026-04-04", paymentStatus: "pending", rawData: ["INV-1", "", "", "2026-04-04", "100", "pending"] },
    ],
  });

  const result = validateRows({ fileType: "INVOICE", rows: cleanedRows });

  assert.equal(cleanedRows[0].amount, 165);
  assert.equal(cleanedRows[1].amount, 200.5);
  assert.equal(cleanedRows[0].paymentStatus, "PAID");
  assert.equal(cleanedRows[1].paymentStatus, "OVERDUE");
  assert.deepEqual(errorSummary(result), [
    { code: "DUPLICATE_RECORD", field: "invoiceNumber", value: "INV-1" },
    { code: "INVALID_AMOUNT", field: "amount", value: "abc" },
    { code: "UNKNOWN_STATUS", field: "paymentStatus", value: "waiting" },
    { code: "DUPLICATE_RECORD", field: "invoiceNumber", value: "INV-1" },
  ]);
});

test("validates required fields with one passing and one failing invoice row", () => {
  const cleanedRows = cleanRows({
    fileType: "INVOICE",
    rows: [
      { sourceRow: 1, invoiceNumber: "INV-100", amount: "SGD 150", invoiceDate: "2026-04-01", paymentStatus: "paid", rawData: ["INV-100", "", "", "2026-04-01", "SGD 150", "paid"] },
      { sourceRow: 2, invoiceNumber: "", amount: "SGD 150", invoiceDate: "2026-04-01", paymentStatus: "paid", rawData: ["", "", "", "2026-04-01", "SGD 150", "paid"] },
    ],
  });

  const result = validateRows({ fileType: "INVOICE", rows: cleanedRows });

  assert.equal(result.validRows.length, 1);
  assert.deepEqual(errorSummary(result), [
    { code: "REQUIRED_FIELD_MISSING", field: "invoiceNumber", value: "" },
  ]);
});
