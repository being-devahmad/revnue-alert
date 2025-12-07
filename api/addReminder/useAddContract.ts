import axiosInstance from '@/utils/axios';
import { useMutation } from '@tanstack/react-query';

interface AddContractRequest {
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
  supplier_rating: string;
  last_payment_amount: number;
  last_payment_at: string;
  last_payment_notes: string;
  website_email: string;
  phone_number: string;
  non_renew_sent_at?: string | null;
  notes: string;
}

interface AddContractResponse {
  status: boolean;
  message: string;
  data: {
    contract_id: number;
    user_id: number;
    reminder_added: boolean;
  };
}

const addContractAPI = async (contractData: AddContractRequest): Promise<AddContractResponse> => {
  try {
    console.log('📤 Adding contract...');
    console.log('📦 Payload:', contractData);

    const response = await axiosInstance.post<AddContractResponse>(
      "/contracts/add",
      contractData
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

    console.log('✅ Contract added successfully!');
    console.log('📋 Contract ID:', response.data.data.contract_id);
    console.log('📊 Response:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Error adding contract:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    throw error;
  }
};

export const useAddContract = () => {
  const mutation = useMutation({
    mutationFn: addContractAPI,
    onMutate: () => {
      console.log('🔄 Mutation started: Adding contract...');
    },
    onSuccess: (data) => {
      console.log('🎉 Mutation success:', data);
    },
    onError: (error: any) => {
      console.error('💥 Mutation error:', error.message);
    },
  });

  // Debug logging
  console.log('🎯 useAddContract Hook State:', {
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error?.message,
  });

  return mutation;
};