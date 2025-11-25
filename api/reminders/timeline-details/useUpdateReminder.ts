import axiosInstance from '@/utils/axios';
import { useMutation } from '@tanstack/react-query';

export interface UpdateReminderRequest {
  contract_id: number;
  name: string;
  quantity: number; // 0, 1, 2, 3
  period: string; // "P1M", "P30D", "P1Y", etc.
  contacts: string[]; // email addresses
  active: boolean;
  ical: boolean;
  notes: string;
}

export interface UpdateReminderResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    period: string;
    quantity: number;
    contacts: string[];
    notes: string;
    ical: number;
    active: boolean;
    contract_id: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
}

interface UpdateReminderParams {
  reminderId: number;
  payload: UpdateReminderRequest;
}

const updateReminderAPI = async ({ reminderId, payload }: UpdateReminderParams): Promise<UpdateReminderResponse> => {
  try {
    console.log('📤 Updating reminder...');
    console.log('📋 Reminder ID:', reminderId);
    console.log('📦 Payload:', payload);

    const response = await axiosInstance.put<UpdateReminderResponse>(
      `/reminders/${reminderId}`,
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
      throw new Error("No reminder data in response");
    }

    console.log('✅ Reminder updated successfully!');
    console.log('📋 Reminder ID:', response.data.data.id);
    console.log('📊 Response:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Error updating reminder:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    throw error;
  }
};

export const useUpdateReminder = () => {
  const mutation = useMutation({
    mutationFn: updateReminderAPI,
    onMutate: () => {
      console.log('🔄 Mutation started: Updating reminder...');
    },
    onSuccess: (data) => {
      console.log('🎉 Mutation success:', data);
    },
    onError: (error: any) => {
      console.error('💥 Mutation error:', error.message);
    },
  });

  // Debug logging
  console.log('🎯 useUpdateReminder Hook State:', {
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error?.message,
  });

  return mutation;
};