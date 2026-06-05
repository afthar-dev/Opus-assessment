import { create } from "zustand";
import {
  deleteUpload,
  fetchUploadById,
  fetchUploadRecords,
  fetchUploads,
  getApiErrorMessage,
  uploadSpreadsheet,
} from "../api/uploads";
import type {
  Pagination,
  Upload,
  UploadDetail,
  UploadRecordsResponse,
} from "../types/upload";

type LoadingState = {
  uploading: boolean;
  uploads: boolean;
  detail: boolean;
  records: boolean;
};

type UploadStore = {
  uploads: Upload[];
  uploadsPagination: Pagination | null;
  currentUpload: UploadDetail | null;
  recordsResult: UploadRecordsResponse | null;
  loading: LoadingState;
  error: string | null;
  uploadFile: (file: File) => Promise<string>;
  loadUploads: (page?: number, limit?: number) => Promise<void>;
  loadUploadDetail: (id: string) => Promise<void>;
  loadUploadRecords: (
    uploadId: string,
    page?: number,
    limit?: number,
  ) => Promise<void>;
  removeUpload: (id: string) => Promise<void>;
  clearError: () => void;
};

const initialLoading: LoadingState = {
  uploading: false,
  uploads: false,
  detail: false,
  records: false,
};

export const useUploadStore = create<UploadStore>((set) => ({
  uploads: [],
  uploadsPagination: null,
  currentUpload: null,
  recordsResult: null,
  loading: initialLoading,
  error: null,
  uploadFile: async (file) => {
    set((state) => ({
      error: null,
      loading: { ...state.loading, uploading: true },
    }));

    try {
      const result = await uploadSpreadsheet(file);
      return result.uploadId;
    } catch (error) {
      const message = getApiErrorMessage(error, "Upload failed");
      set({ error: message });
      throw new Error(message, { cause: error });
    } finally {
      set((state) => ({
        loading: { ...state.loading, uploading: false },
      }));
    }
  },
  loadUploads: async (page = 1, limit = 10) => {
    set((state) => ({
      error: null,
      loading: { ...state.loading, uploads: true },
    }));

    try {
      const result = await fetchUploads(page, limit);
      set({
        uploads: result.data,
        uploadsPagination: result.pagination,
      });
    } catch (error) {
      set({
        error: getApiErrorMessage(error, "Failed to load uploads"),
      });
    } finally {
      set((state) => ({
        loading: { ...state.loading, uploads: false },
      }));
    }
  },
  loadUploadDetail: async (id) => {
    set((state) => ({
      currentUpload: null,
      error: null,
      loading: { ...state.loading, detail: true },
    }));

    try {
      const upload = await fetchUploadById(id);
      set({ currentUpload: upload });
    } catch (error) {
      set({
        error: getApiErrorMessage(error, "Failed to load upload details"),
      });
    } finally {
      set((state) => ({
        loading: { ...state.loading, detail: false },
      }));
    }
  },
  loadUploadRecords: async (uploadId, page = 1, limit = 20) => {
    set((state) => ({
      recordsResult: null,
      error: null,
      loading: { ...state.loading, records: true },
    }));

    try {
      const result = await fetchUploadRecords(uploadId, page, limit);
      set({ recordsResult: result });
    } catch (error) {
      set({
        error: getApiErrorMessage(error, "Failed to load upload records"),
      });
    } finally {
      set((state) => ({
        loading: { ...state.loading, records: false },
      }));
    }
  },
  removeUpload: async (id) => {
    set((state) => ({ error: null, loading: { ...state.loading, uploads: true } }));

    try {
      await deleteUpload(id);
      set((state) => ({
        uploads: state.uploads.filter((u) => u.id !== id),
      }));
    } catch (error) {
      set({
        error: getApiErrorMessage(error, "Failed to delete upload"),
      });
    } finally {
      set((state) => ({ loading: { ...state.loading, uploads: false } }));
    }
  },
  clearError: () => {
    set({ error: null });
  },
}));
