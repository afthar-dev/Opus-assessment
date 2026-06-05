import type { UploadStatus } from "../types/upload";
import { CheckCircle2, AlertCircle, Clock, XCircle, MinusCircle } from "lucide-react";

const statusConfig: Record<string, { label: string; icon: React.ReactNode; classes: string }> = {
  completed: {
    label: "Completed",
    icon: <CheckCircle2 className="size-3.5" />,
    classes: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  partial_success: {
    label: "Partial",
    icon: <MinusCircle className="size-3.5" />,
    classes: "text-amber-700 bg-amber-50 border-amber-200",
  },
  processing: {
    label: "Processing",
    icon: <Clock className="size-3.5" />,
    classes: "text-amber-700 bg-amber-50 border-amber-200",
  },
  failed: {
    label: "Failed",
    icon: <XCircle className="size-3.5" />,
    classes: "text-red-700 bg-red-50 border-red-200",
  },
  default: {
    label: "Unknown",
    icon: <AlertCircle className="size-3.5" />,
    classes: "text-slate-700 bg-slate-50 border-slate-200",
  },
};

type StatusBadgeProps = {
  status: UploadStatus | string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] ?? statusConfig.default;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.classes}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
