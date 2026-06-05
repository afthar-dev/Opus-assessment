import { Inbox } from "lucide-react";

const isDate = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const date = new Date(value);
  return !isNaN(date.getTime()) && /^\d{4}-/.test(value);
};

const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean";

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && !isNaN(value);

const formatCell = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return <span className="italic text-slate-400">-</span>;
  }

  if (isBoolean(value)) {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          value
            ? "bg-emerald-50 text-emerald-700"
            : "bg-rose-50 text-rose-700"
        }`}
      >
        {value ? "Yes" : "No"}
      </span>
    );
  }

  if (isDate(value)) {
    return (
      <span className="whitespace-nowrap text-slate-600">
        {new Date(value).toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    );
  }

  if (isNumber(value)) {
    return <span className="font-mono tabular-nums text-slate-700">{value.toLocaleString()}</span>;
  }

  if (typeof value === "object") {
    return (
      <details className="inline-block w-full">
        <summary className="cursor-pointer text-xs text-slate-500 hover:text-teal-600">
          View object
        </summary>
        <pre className="mt-1 max-w-xs overflow-auto rounded-md bg-slate-50 p-2 text-xs text-slate-600">
          {JSON.stringify(value, null, 2)}
        </pre>
      </details>
    );
  }

  return <span className="text-slate-700 break-words">{String(value)}</span>;
};

const formatHeader = (key: string) => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^\w/, (c) => c.toUpperCase())
    .replace(/_/g, " ");
};

type DataTableProps = {
  rows: Record<string, unknown>[];
};

export function DataTable({ rows }: DataTableProps) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
        <Inbox className="size-8 text-slate-400" />
        <p className="text-sm text-slate-500">No records found.</p>
      </div>
    );
  }

  const columns = Object.keys(rows[0]).filter(
    (key) => key !== "rawData" && key !== "uploadId" && key !== "id",
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80 backdrop-blur-sm">
            {columns.map((column) => (
              <th
                key={column}
                className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                {formatHeader(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, rowIndex) => (
            <tr
              key={String(row.id ?? rowIndex)}
              className="transition-colors hover:bg-slate-50/80 even:bg-white odd:bg-slate-50/30"
            >
              {columns.map((column) => (
                <td
                  key={column}
                  className="max-w-xs px-5 py-3.5 text-sm leading-relaxed"
                >
                  {formatCell(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
