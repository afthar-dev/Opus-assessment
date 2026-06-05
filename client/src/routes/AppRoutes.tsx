import { Navigate, Route, Routes } from "react-router-dom";
import { UploadDetailPage } from "../pages/UploadDetailPage";
import { UploadPage } from "../pages/UploadPage";
import { UploadRecordsPage } from "../pages/UploadRecordsPage";
import { UploadsPage } from "../pages/UploadsPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/uploads" replace />} />
      <Route path="/upload" element={<UploadPage />} />
      <Route path="/uploads" element={<UploadsPage />} />
      <Route path="/uploads/:id" element={<UploadDetailPage />} />
      <Route path="/uploads/:id/records" element={<UploadRecordsPage />} />
    </Routes>
  );
}
