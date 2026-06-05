import { prisma } from "../lib/prisma.ts";

export const quarantineRows = async (uploadId: string, invalidRows: any[]) => {
  for (const invalidRow of invalidRows) {
    await prisma.$transaction(async (tx) => {
      const quarantine = await tx.quarantineRow.create({
        data: {
          uploadId,

          rowNumber: invalidRow.row.sourceRow,

          rawData: invalidRow.row,
        },
      });

      await tx.quarantineError.createMany({
        data: invalidRow.errors.map((error: any) => ({
          quarantineRowId: quarantine.id,

          code: error.code,

          field: error.field,

          rawValue: String(error.value),

          message: error.message,
        })),
      });
    });
  }
};
