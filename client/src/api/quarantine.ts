import { apiClient } from "./client";
import type {
  ApiEnvelope,
  QuarantineCorrectionResponse,
  QuarantineRevalidationResponse,
  QuarantineRowDetail,
} from "../types/upload";

export const fetchQuarantineRow = async (id: string) => {
  const response = await apiClient.get<ApiEnvelope<QuarantineRowDetail>>(
    `/quarantine/${id}`,
  );

  return response.data.data;
};

export const revalidateQuarantineRow = async (
  id: string,
  corrections: Record<string, unknown>,
) => {
  const response = await apiClient.post<QuarantineRevalidationResponse>(
    `/quarantine/${id}/revalidate`,
    {
      corrections,
    },
  );

  return response.data;
};

export const saveQuarantineCorrection = async (
  id: string,
  corrections: Record<string, unknown>,
) => {
  const response = await apiClient.patch<QuarantineCorrectionResponse>(
    `/quarantine/${id}`,
    {
      corrections,
    },
  );

  return response.data;
};
