import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FileText,
  Rows3,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Database,
  XCircle,
  RefreshCw,
  Pencil,
} from "lucide-react";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingState } from "../components/LoadingState";
import { QuarantineEditModal } from "../components/QuarantineEditModal";
import { StatusBadge } from "../components/StatusBadge";
import { useUploadStore } from "../store/uploadStore";
import type { QuarantineRow } from "../types/upload";

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleString() : "-";

const DetailCard = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
}) => (
  <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
      {icon}
      {label}
    </div>
    <div className="text-lg font-semibold text-slate-900">{value}</div>
  </div>
);

const QuarantineStatusBadge = ({
  status,
}: {
  status: QuarantineRow["status"];
}) => {
  const styles: Record<QuarantineRow["status"], string> = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    CORRECTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    REPROCESSED: "bg-blue-50 text-blue-700 border-blue-200",
  };

  const labels: Record<QuarantineRow["status"], string> = {
    PENDING: "Pending",
    CORRECTED: "Corrected",
    REPROCESSED: "Reprocessed",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {status === "PENDING" && <AlertTriangle className="size-3" />}
      {status === "CORRECTED" && <CheckCircle className="size-3" />}
      {status === "REPROCESSED" && <RefreshCw className="size-3" />}
      {labels[status]}
    </span>
  );
};

const ErrorBadge = ({
  error,
}: {
  error: { code: string; message: string; field: string | null };
}) => (
  <div className="flex flex-col gap-0.5 rounded-lg border border-rose-100 bg-rose-50/80 px-3 py-2">
    <div className="flex items-center gap-1.5">
      <XCircle className="size-3.5 shrink-0 text-rose-500" />
      <span className="text-xs font-semibold text-rose-700">{error.code}</span>
    </div>
    {error.field && (
      <span className="ml-5 text-xs text-rose-600/70">
        Field: {error.field}
      </span>
    )}
    <span className="ml-5 text-xs text-rose-600">{error.message}</span>
  </div>
);

const RawDataDisplay = ({ data }: { data: Record<string, unknown> }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-slate-100/50"
      >
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <Database className="size-3.5" />
          Raw Data
        </span>
        {isOpen ? (
          <ChevronUp className="size-4 text-slate-400" />
        ) : (
          <ChevronDown className="size-4 text-slate-400" />
        )}
      </button>
      {isOpen && (
        <div className="border-t border-slate-200 px-3 py-2">
          <pre className="max-h-64 overflow-auto rounded-md bg-slate-900 p-3 font-mono text-xs leading-relaxed text-emerald-400">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export function UploadDetailPage() {
  const { id } = useParams();
  const upload = useUploadStore((state) => state.currentUpload);
  const loading = useUploadStore((state) => state.loading.detail);
  const error = useUploadStore((state) => state.error);
  const loadUploadDetail = useUploadStore((state) => state.loadUploadDetail);
  const [selectedQuarantineRowId, setSelectedQuarantineRowId] = useState<
    string | null
  >(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      void loadUploadDetail(id);
    }
  }, [id, loadUploadDetail]);

  if (!id) {
    return <ErrorMessage message="Upload id is missing." />;
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-bold text-slate-900">Upload Detail</h1>
          <p className="text-slate-500">
            {upload?.fileName ?? "Processing file details"}
          </p>
        </div>
        <Link
          to={`/uploads/${id}/records`}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-medium text-teal-700 transition-colors hover:border-teal-300 hover:bg-teal-100"
        >
          View records
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <ErrorMessage message={error} />
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      {loading || !upload ? (
        <LoadingState label="Loading upload details..." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailCard
              label="Status"
              value={<StatusBadge status={upload.status} />}
              icon={<CheckCircle className="size-3.5 text-slate-400" />}
            />
            <DetailCard
              label="File type"
              value={
                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-sm font-medium text-slate-700">
                  {upload.fileType.toUpperCase()}
                </span>
              }
              icon={<FileText className="size-3.5 text-slate-400" />}
            />
            <DetailCard
              label="Total rows"
              value={
                <span className="font-mono">{upload.totalRows ?? 0}</span>
              }
              icon={<Rows3 className="size-3.5 text-slate-400" />}
            />
            <DetailCard
              label="Accepted"
              value={
                <span className="font-mono text-emerald-600">
                  {upload.acceptedRows ?? 0}
                </span>
              }
              icon={<CheckCircle className="size-3.5 text-emerald-500" />}
            />
            <DetailCard
              label="Quarantined"
              value={
                <span className="font-mono text-amber-600">
                  {upload.quarantinedRows ?? 0}
                </span>
              }
              icon={<AlertTriangle className="size-3.5 text-amber-500" />}
            />
            <DetailCard
              label="Completed"
              value={formatDate(upload.completedAt)}
              icon={<Clock className="size-3.5 text-slate-400" />}
            />
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Processing Report
            </h2>
            {upload.report ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-2 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                  <span className="text-xs font-medium uppercase tracking-wider text-emerald-600/70">
                    Accepted rows
                  </span>
                  <span className="text-2xl font-bold text-emerald-700">
                    {upload.report.acceptedRows.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col gap-2 rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                  <span className="text-xs font-medium uppercase tracking-wider text-amber-600/70">
                    Quarantined rows
                  </span>
                  <span className="text-2xl font-bold text-amber-700">
                    {upload.report.quarantinedRows.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500/70">
                    Generated
                  </span>
                  <span className="text-lg font-semibold text-slate-700">
                    {formatDate(upload.report.generatedAt)}
                  </span>
                </div>
              </div>
            ) : (
              <LoadingState label="No report generated yet." />
            )}
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Quarantine Rows
              </h2>
              {upload.quarantineRows.length > 0 && (
                <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  {upload.quarantineRows.length} rows
                </span>
              )}
            </div>
            {upload.quarantineRows.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl bg-slate-50 py-12 text-center">
                <CheckCircle className="size-8 text-emerald-400" />
                <p className="text-sm text-slate-500">
                  No quarantined rows. All data passed validation.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {upload.quarantineRows.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                          #{row.rowNumber}
                        </span>
                        <QuarantineStatusBadge status={row.status} />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">
                          {formatDate(row.createdAt)}
                        </span>
                        {row.status === "PENDING" && (
                          <button
                            type="button"
                            onClick={() => {
                              setSuccessMessage(null);
                              setSelectedQuarantineRowId(row.id);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                          >
                            <Pencil className="size-3.5" />
                            Edit
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      {row.errors.map((error) => (
                        <ErrorBadge
                          key={error.id}
                          error={{
                            code: error.code,
                            message: error.message,
                            field: error.field,
                          }}
                        />
                      ))}
                    </div>

                    <div className="mt-3">
                      <RawDataDisplay data={row.rawData} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      <QuarantineEditModal
        rowId={selectedQuarantineRowId}
        onClose={() => setSelectedQuarantineRowId(null)}
        onSuccess={() => {
          setSuccessMessage("Quarantine row corrected successfully.");
          if (upload) {
            void loadUploadDetail(upload.id);
          }
        }}
      />
    </section>
  );
}
