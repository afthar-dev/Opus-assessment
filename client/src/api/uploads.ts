import axios from "axios";
import { apiClient } from "./client";
import type {
  ApiEnvelope,
  PaginatedApiEnvelope,
  Upload,
  UploadDetail,
  UploadListResponse,
  UploadRecordsResponse,
  UploadResponse,
} from "../types/upload";

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? error.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

export const uploadSpreadsheet = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<ApiEnvelope<UploadResponse>>(
    "/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data.data;
};

export const fetchUploads = async (page = 1, limit = 10) => {
  const response = await apiClient.get<PaginatedApiEnvelope<Upload[]>>("/upload", {
    params: {
      page,
      limit,
    },
  });

  return {
    data: response.data.data,
    pagination: response.data.pagination,
  } as UploadListResponse;
};

export const fetchUploadById = async (id: string) => {
  const response = await apiClient.get<ApiEnvelope<UploadDetail>>(
    `/upload/${id}`,
  );

  return response.data.data;
};

export const deleteUpload = async (id: string) => {
  const response = await apiClient.delete<ApiEnvelope<void>>(`/upload/${id}`);
  return response.data;
};

export const fetchUploadRecords = async (
  uploadId: string,
  page = 1,
  limit = 20,
) => {
  const response = await apiClient.get<ApiEnvelope<UploadRecordsResponse>>(
    `/upload/${uploadId}/records`,
    {
      params: {
        page,
        limit,
      },
    },
  );

  return response.data.data;
};
