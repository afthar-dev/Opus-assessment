import assert from "node:assert/strict";
import test from "node:test";

import { cleanRows } from "../src/services/cleaning.service.ts";
import { validateRows } from "../src/services/validation.service.ts";

test("lesson logs clean two-digit dates and preserve raw invalid numeric values", () => {
  const cleanedRows = cleanRows({
    fileType: "LESSON_LOG",
    rows: [
      {
        sourceRow: 4,
        logId: " LOG-001 ",
        assignmentCode: " TAS-001 ",
        lessonDate: "03/04/26",
        durationHours: "N/A",
        attendance: " present ",
        notes: "  trial lesson  ",
        fee: "TBC",
        rawData: [" LOG-001 ", " TAS-001 ", "03/04/26", "N/A", " present ", "  trial lesson  ", "TBC"],
      },
      {
        sourceRow: 5,
        logId: "LOG-002",
        assignmentCode: "TAS-002",
        lessonDate: "2026-04-04",
        durationHours: "",
        attendance: "absent",
        notes: "",
        fee: "",
        rawData: ["LOG-002", "TAS-002", "2026-04-04", "", "absent", "", ""],
      },
    ],
  });

  assert.equal(cleanedRows[0].lessonDate, "2026-04-03");
  assert.equal(cleanedRows[0].attendance, "PRESENT");
  assert.equal(cleanedRows[0].durationHours, null);
  assert.equal(cleanedRows[0].fee, null);

  const validationResult = validateRows({
    fileType: "LESSON_LOG",
    rows: cleanedRows,
  });

  assert.equal(validationResult.validRows.length, 1);
  assert.equal(validationResult.invalidRows.length, 1);
  assert.deepEqual(
    validationResult.invalidRows[0].errors.map((error: any) => ({
      code: error.code,
      field: error.field,
      value: error.value,
    })),
    [
      { code: "INVALID_NUMBER", field: "durationHours", value: "N/A" },
      { code: "INVALID_NUMBER", field: "fee", value: "TBC" },
    ],
  );
});
