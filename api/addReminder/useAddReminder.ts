import axiosInstance from '@/utils/axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface AddReminderRequest {
  contract_id: number;
  name: string;
  quantity: number; // 0, 1, 2, 3
  period: string; // "P1M", "P30D", "P1Y", etc.
  contacts: string[]; // email addresses
  active: boolean;
  ical: boolean;
  notes: string;
}

interface AddReminderResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    contract_id: number;
  };
}

const addReminderAPI = async (reminderData: AddReminderRequest): Promise<AddReminderResponse> => {
  try {
    console.log('📤 Adding reminder...');
    console.log('📦 Payload:', reminderData);

    const response = await axiosInstance.post<AddReminderResponse>(
      "/reminders/add",
      reminderData
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

    console.log('✅ Reminder added successfully!');
    console.log('📋 Reminder ID:', response.data.data.id);
    console.log('📊 Response:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('❌ Error adding reminder:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    throw error;
  }
};

export const useAddReminder = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: addReminderAPI,
    onMutate: () => {
      console.log('🔄 Mutation started: Adding reminder...');
    },
    onSuccess: (data) => {
      console.log('🎉 Mutation success:', data);


      // ✅ 1️⃣ Timeline details refresh
      queryClient.invalidateQueries({
        queryKey: ['timelineDetails'],
      });

      // ✅ 2️⃣ Reminder related lists (if any list screen exists)
      queryClient.invalidateQueries({
        queryKey: ['reminders'],
      });

      // ✅ 3️⃣ Contract related data (list / details)
      queryClient.invalidateQueries({
        queryKey: ['contracts'],
      });

    },
    onError: (error: any) => {
      console.error('💥 Mutation error:', error.message);
    },
  });

  // Debug logging
  console.log('🎯 useAddReminder Hook State:', {
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error?.message,
  });

  return mutation;
};