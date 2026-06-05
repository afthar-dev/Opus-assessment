import { useEffect, useMemo, useState } from "react";
import { CheckCircle, RefreshCw, Save, X } from "lucide-react";
import {
  fetchQuarantineRow,
  revalidateQuarantineRow,
  saveQuarantineCorrection,
} from "../api/quarantine";
import { getApiErrorMessage } from "../api/uploads";
import type {
  QuarantineRowDetail,
  QuarantineValidationError,
} from "../types/upload";
import { DynamicQuarantineForm } from "./DynamicQuarantineForm";
import { LoadingState } from "./LoadingState";

type QuarantineEditModalProps = {
  rowId: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

const buildErrorsByField = (
  errors: Array<Pick<QuarantineValidationError, "field" | "message">>,
) =>
  errors.reduce<Record<string, string[]>>((acc, error) => {
    const field = error.field ?? "_row";
    acc[field] = [...(acc[field] ?? []), error.message];
    return acc;
  }, {});

const buildInitialErrors = (row: QuarantineRowDetail) =>
  row.errors.map((error) => ({
    field: error.field,
    message: error.message,
  }));

export function QuarantineEditModal({
  rowId,
  onClose,
  onSuccess,
}: QuarantineEditModalProps) {
  const [row, setRow] = useState<QuarantineRowDetail | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [validationErrors, setValidationErrors] = useState<
    Array<Pick<QuarantineValidationError, "field" | "message">>
  >([]);
  const [loading, setLoading] = useState(false);
  const [revalidating, setRevalidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [validMessage, setValidMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!rowId) return;

    let isCurrent = true;

    const loadRow = async () => {
      setLoading(true);
      setMessage(null);
      setValidMessage(null);
      setRow(null);

      try {
        const nextRow = await fetchQuarantineRow(rowId);

        if (!isCurrent) return;

        setRow(nextRow);
        setValues(nextRow.rawData);
        setValidationErrors(buildInitialErrors(nextRow));
      } catch (error) {
        if (!isCurrent) return;
        setMessage(getApiErrorMessage(error, "Failed to load quarantine row"));
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    };

    void loadRow();

    return () => {
      isCurrent = false;
    };
  }, [rowId]);

  const errorsByField = useMemo(
    () => buildErrorsByField(validationErrors),
    [validationErrors],
  );

  if (!rowId) return null;

  const disabled = loading || revalidating || saving || !row;

  const handleChange = (field: string, value: string) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
    setValidMessage(null);
  };

  const handleRevalidate = async () => {
    if (!row) return;

    setRevalidating(true);
    setMessage(null);
    setValidMessage(null);

    try {
      const result = await revalidateQuarantineRow(row.id, values);
      setValidationErrors(result.errors);
      setValues(result.cleanedData);

      if (result.isValid) {
        setValidMessage("Row is valid and ready to save.");
      }
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Failed to revalidate row"));
    } finally {
      setRevalidating(false);
    }
  };

  const handleSave = async () => {
    if (!row) return;

    setSaving(true);
    setMessage(null);
    setValidMessage(null);

    try {
      const result = await saveQuarantineCorrection(row.id, values);

      if (!result.processed) {
        setValidationErrors(result.errors ?? []);
        return;
      }

      onSuccess();
      onClose();
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Failed to save correction"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Edit Quarantine Row
            </h2>
            <p className="text-sm text-slate-500">
              {row
                ? `Row #${row.rowNumber} - ${row.upload.fileType}`
                : "Loading row details"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-5">
          {loading ? (
            <LoadingState label="Loading quarantine row..." />
          ) : row ? (
            <div className="flex flex-col gap-4">
              {message && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {message}
                </div>
              )}

              {validMessage && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <CheckCircle className="size-4" />
                  {validMessage}
                </div>
              )}

              {errorsByField._row?.length ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorsByField._row.join("; ")}
                </div>
              ) : null}

              <DynamicQuarantineForm
                fileType={row.upload.fileType}
                values={values}
                errorsByField={errorsByField}
                disabled={disabled}
                onChange={handleChange}
              />
            </div>
          ) : (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {message ?? "Unable to load quarantine row."}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRevalidate}
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`size-4 ${revalidating ? "animate-spin" : ""}`}
            />
            {revalidating ? "Revalidating" : "Revalidate"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="size-4" />
            {saving ? "Saving" : "Save Correction"}
          </button>
        </div>
      </div>
    </div>
  );
}
