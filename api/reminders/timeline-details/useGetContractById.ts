import axiosInstance from '@/utils/axios';
import { useQuery } from '@tanstack/react-query';

export interface ReminderItem {
  id: number;
  period: string;
  quantity: number;
  contacts: string[];
  notes: string | null;
  ical: number;
  active: boolean;
  contract_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ContractData {
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
  last_payment_at: string | null;
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
  reminders: ReminderItem[];
}

interface FetchContractResponse {
  status: boolean;
  data: ContractData;
}

const fetchContractAPI = async (contractId: number): Promise<ContractData> => {
  try {
    console.log('📤 Fetching contract...');
    console.log('📋 Contract ID:', contractId);

    const response = await axiosInstance.get<FetchContractResponse>(
      `/contracts/${contractId}`
    );

    // Validate response structure
    if (!response.data) {
      throw new Error("No response data from API");
    }

    if (!response.data.status) {
      throw new Error("API returned status: false");
    }

    if (!response.data.data) {
      throw new Error("No contract data in response");
    }

    console.log('✅ Contract fetched successfully!');
    console.log('📊 Response:', response.data);

    return response.data.data;
  } catch (error: any) {
    console.error('❌ Error fetching contract:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    throw error;
  }
};

export const useFetchContractById = (contractId: number | string | undefined) => {
  const query = useQuery({
    queryKey: ['contract', contractId],
    queryFn: () => fetchContractAPI(Number(contractId)),
    enabled: !!contractId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });

  console.log('🎯 useFetchContractById Hook State:', {
    isLoading: query.isLoading,
    isError: query.isError,
    data: query.data,
    error: query.error?.message,
  });

  return query;
};