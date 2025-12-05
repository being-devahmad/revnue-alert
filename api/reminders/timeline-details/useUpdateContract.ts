import axiosInstance from '@/utils/axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface UpdateContractRequest {
  name: string;
  description: string;
  category_id: number;
  started_at: string; // "YYYY-MM-DD"
  expired_at: string; // "YYYY-MM-DD"
  account_number: string;
  amount: number;
  interval: string;
  payments?: number;
  auto_renew: boolean | number;
  auto_renew_period?: string | null;
  supplier_rating: number | null;
  last_payment_amount: number | null;
  last_payment_at: string;
  last_payment_notes: string;
  website_email: string;
  phone_number: string;
  non_renew_sent_at?: string | null;
  notes: string;
}

export interface UpdateContractResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    name: string;
    description: string;
    started_at: string;
    expired_at: string;
    account_number: string;
    website_email: string;
    phone_number: string;
    amount: number;
    interval: string;
    payments: number;
    notes: string;
    auto_renew: number;
    auto_renew_period: string | null;
    last_payment_amount: number | null;
    last_payment_at: string;
    last_payment_notes: string;
    supplier_rating: number | null;
    category_id: number;
    user_id: number;
    completed_at: string | null;
    non_renew_sent_at: string | null;
    completed_by: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
}

interface UpdateContractParams {
  contractId: number;
  payload: UpdateContractRequest;
}

const updateContractAPI = async ({ contractId, payload }: UpdateContractParams): Promise<UpdateContractResponse> => {
  try {
    console.log('📤 Updating contract...');
    console.log('📋 Contract ID:', contractId);
    console.log('📦 Payload:', payload);

    const response = await axiosInstance.put<UpdateContractResponse>(
      `/contracts/${contractId}`,
      payload
    );

    // Validate response structure
    if (!response.data) {
      throw new Error("No response data from API");
    }

    if (!response.data.status) {
      throw new Error(response.data.message || "API returned status: false");
    }

    if (!response.data.data) {
      throw new Error("No contract data in response");
    }

    console.log('✅ Contract updated successfully!');
    console.log('📋 Contract ID:', response.data.data.id);
    console.log('📊 Response:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Error updating contract:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    throw error;
  }
};

export const useUpdateContract = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: updateContractAPI,
    onMutate: () => {
      console.log('🔄 Mutation started: Updating contract...');
    },
    onSuccess: (data) => {
      console.log('🎉 Mutation success:', data);
      queryClient.invalidateQueries({ queryKey: ['timelineDetails'] });
    },
    onError: (error: any) => {
      console.error('💥 Mutation error:', error.message);
    },
  });

  // Debug logging
  console.log('🎯 useUpdateContract Hook State:', {
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error?.message,
  });

  return mutation;
};