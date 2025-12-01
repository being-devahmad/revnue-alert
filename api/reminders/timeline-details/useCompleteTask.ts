import axiosInstance from "@/utils/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface CompleteTaskResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    expired_at: string;
    auto_renew: boolean;
  };
}

const completeTaskAPI = async (
  contractId: number
): Promise<CompleteTaskResponse> => {
  try {
    console.log("📤 Completing task...");
    console.log("📋 Contract ID:", contractId);

    const response = await axiosInstance.get<CompleteTaskResponse>(
      `/contracts/${contractId}/complete`
    );

    // Validate response structure
    if (!response.data) {
      throw new Error("No response data from API");
    }

    if (!response.data.status) {
      throw new Error(response.data.message || "API returned status: false");
    }

    if (!response.data.data) {
      throw new Error("No data in response");
    }

    console.log("✅ Task completed successfully!");
    console.log("📊 Response:", response.data);

    return response.data;
  } catch (error: any) {
    console.error("❌ Error completing task:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    throw error;
  }
};

export const useCompleteTask = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: completeTaskAPI,
    onMutate: () => {
      console.log("🔄 Mutation started: Completing task...");
    },
    onSuccess: (data) => {
      console.log("🎉 Mutation success:", data);

      // 🔥 Invalidate all timeline details queries
      queryClient.invalidateQueries({ queryKey: ["timelineDetails"] });
    },
    onError: (error: any) => {
      console.error("💥 Mutation error:", error.message);
    },
  });

  // Debug logging
  console.log("🎯 useCompleteTask Hook State:", {
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error?.message,
  });

  return mutation;
};
