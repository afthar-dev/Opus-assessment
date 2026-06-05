import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Eye, FileText, Trash2, AlertTriangle } from "lucide-react";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingState } from "../components/LoadingState";
import { Pagination } from "../components/Pagination";
import { StatusBadge } from "../components/StatusBadge";
import { useUploadStore } from "../store/uploadStore";

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleString() : "-";

export function UploadsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");
  const uploads = useUploadStore((state) => state.uploads);
  const pagination = useUploadStore((state) => state.uploadsPagination);
  const loading = useUploadStore((state) => state.loading.uploads);
  const error = useUploadStore((state) => state.error);
  const loadUploads = useUploadStore((state) => state.loadUploads);
  const removeUpload = useUploadStore((state) => state.removeUpload);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    void loadUploads(page, 10);
  }, [loadUploads, page]);

  const handleDelete = async (id: string, fileName: string) => {
    const confirmed = window.confirm(`Delete "${fileName}"? This cannot be undone.`);
    if (!confirmed) return;
    setDeletingId(id);
    try {
      await removeUpload(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-bold text-slate-900">Uploads</h1>
          <p className="text-slate-500">Review imported files and processing outcomes.</p>
        </div>
        <Link
          to="/upload"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-medium text-teal-700 transition-colors hover:border-teal-300 hover:bg-teal-100"
        >
          <Plus className="size-4" />
          New upload
        </Link>
      </div>

      <ErrorMessage message={error} />

      {loading ? (
        <LoadingState label="Loading uploads..." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">File</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Type</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Rows</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Uploaded</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {uploads.map((upload) => (
                  <tr
                    key={upload.id}
                    className="transition-colors hover:bg-slate-50/80 even:bg-white odd:bg-slate-50/30"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100">
                          <FileText className="size-4 text-slate-500" />
                        </div>
                        <span className="font-medium text-slate-800">{upload.fileName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {upload.fileType.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={upload.status} />
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      <span className="font-mono text-xs tabular-nums">
                        {upload.acceptedRows ?? 0}/{upload.totalRows ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-500">
                      {formatDate(upload.uploadedAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/uploads/${upload.id}`}
                          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-50"
                        >
                          <Eye className="size-4" />
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(upload.id, upload.fileName)}
                          disabled={deletingId === upload.id}
                          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
                          title="Delete upload"
                        >
                          <Trash2 className="size-4" />
                          {deletingId === upload.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {uploads.length === 0 && (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-slate-100">
                <AlertTriangle className="size-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">No uploads found.</p>
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
              >
                <Plus className="size-4" />
                Upload your first file
              </Link>
            </div>
          )}
          <Pagination
            pagination={pagination}
            onPageChange={(nextPage) => setSearchParams({ page: String(nextPage) })}
          />
        </>
      )}
    </section>
  );
}
