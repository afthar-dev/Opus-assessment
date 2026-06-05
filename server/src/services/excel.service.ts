import XLSX from "xlsx";

export type ExcelRows = unknown[][];

export const readExcel = (filePath: string): ExcelRows => {
  const workbook = XLSX.readFile(filePath);

  const firstSheet = workbook.SheetNames[0];

  const worksheet = workbook.Sheets[firstSheet!];

  const rows = XLSX.utils.sheet_to_json(worksheet!, {
    header: 1,
    defval: "",
  }) as ExcelRows;

  return rows;
};
