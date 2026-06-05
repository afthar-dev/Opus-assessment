import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { DataTable } from "../components/DataTable";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingState } from "../components/LoadingState";
import { Pagination } from "../components/Pagination";
import { useUploadStore } from "../store/uploadStore";

export function UploadRecordsPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");
  const recordsResult = useUploadStore((state) => state.recordsResult);
  const loading = useUploadStore((state) => state.loading.records);
  const error = useUploadStore((state) => state.error);
  const loadUploadRecords = useUploadStore((state) => state.loadUploadRecords);

  useEffect(() => {
    if (id) {
      void loadUploadRecords(id, page, 20);
    }
  }, [id, loadUploadRecords, page]);

  if (!id) {
    return <ErrorMessage message="Upload id is missing." />;
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-bold text-slate-900">Upload Records</h1>
          <p className="text-slate-500">{recordsResult?.fileType ?? "Stored rows for this upload"}</p>
        </div>
        <Link
          to={`/uploads/${id}`}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
        >
          <ArrowLeft className="size-4" />
          Back to detail
        </Link>
      </div>

      <ErrorMessage message={error} />

      {loading || !recordsResult ? (
        <LoadingState label="Loading records..." />
      ) : (
        <>
          <DataTable rows={recordsResult.records} />
          <Pagination
            pagination={recordsResult.pagination}
            onPageChange={(nextPage) => setSearchParams({ page: String(nextPage) })}
          />
        </>
      )}
    </section>
  );
}
