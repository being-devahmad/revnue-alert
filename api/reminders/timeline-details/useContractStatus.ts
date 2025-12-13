import axiosInstance from "@/utils/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface ToggleContractStatusPayload {
  contractId: number;
  active: boolean;
}

export interface ToggleContractStatusResponse {
  status: boolean;
  message: string;
}

const toggleContractStatusAPI = async (
  payload: ToggleContractStatusPayload
): Promise<ToggleContractStatusResponse> => {
  const { contractId, active } = payload;

  try {
    console.log("📤 Toggling contract status...");
    console.log("📋 Contract ID:", contractId, "Active:", active);

    const response =
      await axiosInstance.post<ToggleContractStatusResponse>(
        `/contracts/${contractId}/enabled`,
        { active }
      );

    if (!response.data) {
      throw new Error("No response data from API");
    }

    if (!response.data.status) {
      throw new Error(response.data.message || "API returned status false");
    }

    console.log("✅ Contract status updated!");
    console.log("📊 Response:", response.data);

    return response.data;
  } catch (error: any) {
    console.error("❌ Error toggling contract status:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    throw error;
  }
};

export const useToggleContractStatus = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: toggleContractStatusAPI,

    onMutate: () => {
      console.log("🔄 Mutation started: Toggle contract status");
    },

    onSuccess: () => {
      // 🔥 Keep timeline data fresh
      queryClient.invalidateQueries({ queryKey: ["timelineDetails"] });
    },

    onError: (error: any) => {
      console.error("💥 Mutation error:", error.message);
    },
  });

  console.log("🎯 useToggleContractStatus Hook State:", {
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error?.message,
  });

  return mutation;
};
