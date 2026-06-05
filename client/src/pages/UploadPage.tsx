import { useNavigate } from "react-router-dom";
import { ErrorMessage } from "../components/ErrorMessage";
import { FileUploadPanel } from "../components/FileUploadPanel";
import { useUploadStore } from "../store/uploadStore";

export function UploadPage() {
  const navigate = useNavigate();
  const uploadFile = useUploadStore((state) => state.uploadFile);
  const loading = useUploadStore((state) => state.loading.uploading);
  const error = useUploadStore((state) => state.error);

  const handleUpload = async (file: File) => {
    const uploadId = await uploadFile(file);
    navigate(`/uploads/${uploadId}`);
  };

  return (
    <section className="flex flex-col items-center justify-center p-5 gap-6">
      <div className="flex flex-col items-center justify-center gap-1.5">
        <h1 className="text-3xl font-bold text-slate-900">
          Upload Spreadsheet
        </h1>
        <p className="text-slate-500">
          Import invoice, lesson log, or tutor assignment spreadsheets.
        </p>
      </div>
      <ErrorMessage message={error} />
      <FileUploadPanel loading={loading} onUpload={handleUpload} />
    </section>
  );
}
