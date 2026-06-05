import assert from "node:assert/strict";
import test from "node:test";

import { evaluateQuarantineCorrection } from "../src/services/quarantine-correction.service.ts";

test("evaluates corrections by merging raw data before cleaning and validation", () => {
  const result = evaluateQuarantineCorrection({
    fileType: "INVOICE",
    rawData: {
      sourceRow: 7,
      invoiceNumber: " INV-100 ",
      invoiceDate: "bad-date",
      amount: "SGD 120.50",
      paymentStatus: "paid",
      rawData: [" INV-100 ", "bad-date", "SGD 120.50", "paid"],
    },
    corrections: {
      invoiceDate: "04/03/2026",
    },
  });

  assert.equal(result.isValid, true);
  assert.equal(result.cleanedData.invoiceNumber, "INV-100");
  assert.equal(result.cleanedData.invoiceDate, "2026-03-04");
  assert.equal(result.cleanedData.amount, 120.5);
  assert.deepEqual(result.errors, []);
});

test("returns field errors without accepting invalid corrections", () => {
  const result = evaluateQuarantineCorrection({
    fileType: "LESSON_LOG",
    rawData: {
      sourceRow: 10,
      logId: "LOG-10",
      assignmentCode: "",
      lessonDate: "2026-04-01",
      durationHours: "0",
      attendance: "present",
      fee: "TBC",
    },
    corrections: {},
  });

  assert.equal(result.isValid, false);
  assert.equal(result.cleanedData.logId, "LOG-10");
  assert.deepEqual(
    result.errors.map((error) => ({
      code: error.code,
      field: error.field,
    })),
    [
      { code: "REQUIRED_FIELD_MISSING", field: "assignmentCode" },
      { code: "INVALID_DURATION", field: "durationHours" },
      { code: "INVALID_FEE", field: "fee" },
    ],
  );
});

test("keeps an existing duplicate error when the duplicate key is unchanged", () => {
  const result = evaluateQuarantineCorrection({
    fileType: "INVOICE",
    rawData: {
      sourceRow: 8,
      invoiceNumber: " INV-100 ",
      invoiceDate: "04/03/2026",
      amount: "SGD 120.50",
      paymentStatus: "paid",
    },
    corrections: {
      amount: "130",
    },
    existingErrors: [
      {
        code: "DUPLICATE_RECORD",
        field: "invoiceNumber",
        value: "INV-100",
        message: "Duplicate invoice detected",
      },
    ],
  });

  assert.equal(result.isValid, false);
  assert.deepEqual(
    result.errors.map((error) => ({
      code: error.code,
      field: error.field,
      value: error.value,
    })),
    [
      {
        code: "DUPLICATE_RECORD",
        field: "invoiceNumber",
        value: "INV-100",
      },
    ],
  );
});

test("rejects invoice corrections that duplicate an upload-wide invoice key", () => {
  const result = evaluateQuarantineCorrection({
    fileType: "INVOICE",
    rawData: {
      sourceRow: 9,
      invoiceNumber: "INV-2025-002",
      invoiceDate: "04/03/2026",
      amount: "SGD 120.50",
      paymentStatus: "paid",
    },
    corrections: {
      invoiceNumber: "INV-2025-001",
    },
    existingDuplicateKeys: ["INV-2025-001"],
  });

  assert.equal(result.isValid, false);
  assert.deepEqual(
    result.errors.map((error) => ({
      code: error.code,
      field: error.field,
      value: error.value,
    })),
    [
      {
        code: "DUPLICATE_RECORD",
        field: "invoiceNumber",
        value: "INV-2025-001",
      },
    ],
  );
});
