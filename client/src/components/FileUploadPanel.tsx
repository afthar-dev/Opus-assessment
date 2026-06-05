import { useState, useCallback } from "react";
import type { FormEvent, DragEvent } from "react";
import { Upload, File as FileIcon, X } from "lucide-react";

type FileUploadPanelProps = {
  loading: boolean;
  onUpload: (file: File) => Promise<void>;
};

export function FileUploadPanel({ loading, onUpload }: FileUploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) return;
    await onUpload(file);
  };

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) setFile(droppedFile);
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      className="flex justify-center items-center max-w-xl flex-col gap-5"
    >
      <label className="text-sm font-semibold text-slate-700">
        Spreadsheet file
      </label>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragOver
            ? "border-teal-500 bg-teal-50"
            : "border-slate-300 bg-white hover:border-slate-400"
        }`}
      >
        {!file ? (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Upload className="size-6 text-slate-500" />
            </div>
            <div className="text-sm text-slate-500">
              <span className="font-medium text-slate-700">Drag and drop</span>{" "}
              or{" "}
              <label
                htmlFor="spreadsheet"
                className="cursor-pointer font-medium text-teal-700 hover:text-teal-800 hover:underline"
              >
                browse
              </label>{" "}
              to upload a file
            </div>
            <ManipulateInput
              id="spreadsheet"
              accept=".xlsx,.xls"
              setFile={setFile}
            />
          </>
        ) : (
          <div className="flex w-full items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50">
              <FileIcon className="size-5 text-teal-700" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col text-left">
              <span className="truncate text-sm font-medium text-slate-700">
                {file.name}
              </span>
              <span className="text-xs text-slate-500">
                {(file.size / 1024).toFixed(1)} KB
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Remove file"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
      </div>

      <div className="text-xs text-slate-400">
        Supported formats: .xlsx, .xls
      </div>

      <button
        type="submit"
        disabled={!file || loading}
        className="inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="size-4" />
            Upload file
          </>
        )}
      </button>
    </form>
  );
}

function ManipulateInput({
  id,
  accept,
  setFile,
}: {
  id: string;
  accept: string;
  setFile: (file: File | null) => void;
}) {
  return (
    <input
      id={id}
      type="file"
      accept={accept}
      onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      className="sr-only"
    />
  );
}
