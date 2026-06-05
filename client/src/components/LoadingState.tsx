import { Loader2 } from "lucide-react";

type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Loading..." }: LoadingStateProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">
      <Loader2 className="size-4 animate-spin" />
      <span>{label}</span>
    </div>
  );
}
