import axiosInstance from '@/utils/axios';
import { useQuery } from '@tanstack/react-query';

export interface ContractInReminder {
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
  notes: string | null;
  auto_renew: number;
  auto_renew_period: string;
  last_payment_amount: number;
  last_payment_at: string;
  last_payment_notes: string | null;
  supplier_rating: number;
  category_id: number;
  user_id: number;
  completed_at: string | null;
  non_renew_sent_at: string;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ReminderData {
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
  contract: ContractInReminder;
}

interface FetchReminderResponse {
  status: boolean;
  data: ReminderData;
}

const fetchReminderAPI = async (reminderId: number): Promise<ReminderData> => {
  try {
    console.log('📤 Fetching reminder...');
    console.log('📋 Reminder ID:', reminderId);

    const response = await axiosInstance.get<FetchReminderResponse>(
      `/reminders/${reminderId}`
    );

    // Validate response structure
    if (!response.data) {
      throw new Error("No response data from API");
    }

    if (!response.data.status) {
      throw new Error("API returned status: false");
    }

    if (!response.data.data) {
      throw new Error("No reminder data in response");
    }

    console.log('✅ Reminder fetched successfully!');
    console.log('📊 Response:', response.data);

    return response.data.data;
  } catch (error: any) {
    console.error('❌ Error fetching reminder:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    throw error;
  }
};

export const useFetchReminderById = (reminderId: number | string | undefined) => {
  const query = useQuery({
    queryKey: ['reminder', reminderId],
    queryFn: () => fetchReminderAPI(Number(reminderId)),
    enabled: !!reminderId,
    // 🔁 Optional: prevent auto retries if you don’t want retries
    retry: 0,

    // 🔄 Always refetch when screen refocuses (useful for mobile)
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  console.log('🎯 useFetchReminderById Hook State:', {
    isLoading: query.isLoading,
    isError: query.isError,
    data: query.data,
    error: query.error?.message,
  });

  return query;
};