import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Pagination as PaginationType } from "../types/upload";

type PaginationProps = {
  pagination: PaginationType | null;
  onPageChange: (page: number) => void;
};

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-end gap-3" aria-label="Pagination controls">
      <button
        type="button"
        onClick={() => onPageChange(pagination.page - 1)}
        disabled={pagination.page <= 1}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-teal-600 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft className="size-4" />
        Previous
      </button>
      <span className="text-sm text-slate-500">
        Page {pagination.page} of {pagination.totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(pagination.page + 1)}
        disabled={pagination.page >= pagination.totalPages}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-teal-600 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
