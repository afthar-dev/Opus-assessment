import type { FileType } from "../types/upload";

type FieldType = "text" | "date" | "number";

type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
};

const FIELDS_BY_TYPE: Record<FileType, FieldConfig[]> = {
  INVOICE: [
    { name: "invoiceNumber", label: "Invoice number", type: "text" },
    { name: "tutorId", label: "Tutor ID", type: "text" },
    { name: "studentName", label: "Student name", type: "text" },
    { name: "invoiceDate", label: "Invoice date", type: "date" },
    { name: "amount", label: "Amount", type: "number" },
    { name: "paymentStatus", label: "Payment status", type: "text" },
    { name: "paymentDate", label: "Payment date", type: "date" },
    { name: "notes", label: "Notes", type: "text" },
  ],
  LESSON_LOG: [
    { name: "logId", label: "Log ID", type: "text" },
    { name: "assignmentCode", label: "Assignment code", type: "text" },
    { name: "lessonDate", label: "Lesson date", type: "date" },
    { name: "durationHours", label: "Duration hours", type: "number" },
    { name: "attendance", label: "Attendance", type: "text" },
    { name: "notes", label: "Notes", type: "text" },
    { name: "fee", label: "Fee", type: "number" },
  ],
  TUTOR_ASSIGNMENT: [
    { name: "assignmentCode", label: "Assignment code", type: "text" },
    { name: "tutorName", label: "Tutor name", type: "text" },
    { name: "studentName", label: "Student name", type: "text" },
    { name: "subject", label: "Subject", type: "text" },
    { name: "level", label: "Level", type: "text" },
    { name: "hourlyRate", label: "Hourly rate", type: "number" },
    { name: "startDate", label: "Start date", type: "date" },
    { name: "status", label: "Status", type: "text" },
    { name: "contactEmail", label: "Contact email", type: "text" },
  ],
  UNKNOWN: [],
};

type DynamicQuarantineFormProps = {
  fileType: FileType;
  values: Record<string, unknown>;
  errorsByField: Record<string, string[]>;
  disabled: boolean;
  onChange: (field: string, value: string) => void;
};

const formatInputValue = (value: unknown, type: FieldType) => {
  if (value === null || value === undefined) return "";

  const stringValue = String(value);

  if (type === "date") {
    return /^\d{4}-\d{2}-\d{2}$/.test(stringValue) ? stringValue : "";
  }

  return stringValue;
};

export function DynamicQuarantineForm({
  fileType,
  values,
  errorsByField,
  disabled,
  onChange,
}: DynamicQuarantineFormProps) {
  const fields = FIELDS_BY_TYPE[fileType] ?? [];

  if (fields.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        This file type does not support row correction.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {fields.map((field) => {
        const fieldErrors = errorsByField[field.name] ?? [];
        const hasError = fieldErrors.length > 0;

        return (
          <label key={field.name} className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">
              {field.label}
            </span>
            <input
              type={field.type}
              step={field.type === "number" ? "any" : undefined}
              value={formatInputValue(values[field.name], field.type)}
              disabled={disabled}
              onChange={(event) => onChange(field.name, event.target.value)}
              className={`rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none transition-colors disabled:cursor-not-allowed disabled:bg-slate-100 ${
                hasError
                  ? "border-rose-300 bg-rose-50 focus:border-rose-400"
                  : "border-slate-200 bg-white focus:border-teal-400"
              }`}
            />
            {hasError && (
              <span className="text-xs text-rose-600">
                {fieldErrors.join("; ")}
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
}
