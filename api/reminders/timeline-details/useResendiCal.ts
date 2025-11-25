import axiosInstance from '@/utils/axios';
import { useMutation } from '@tanstack/react-query';

export interface ResendICalResponse {
    status: boolean;
    message: string;
    data: {
        reminder_id: number;
        contract_name: string;
    };
}

const resendICalAPI = async (reminderId: number): Promise<ResendICalResponse> => {
    try {
        console.log('📤 Resending iCal...');
        console.log('📋 Reminder ID:', reminderId);

        const response = await axiosInstance.get<ResendICalResponse>(
            `/reminders/${reminderId}/resend-ical`
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

        console.log('✅ iCal resent successfully!');
        console.log('📊 Response:', response.data);

        return response.data;
    } catch (error: any) {
        console.error('❌ Error resending iCal:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            url: error.config?.url,
        });
        throw error;
    }
};

export const useResendICal = () => {
    const mutation = useMutation({
        mutationFn: resendICalAPI,
        onMutate: () => {
            console.log('🔄 Mutation started: Resending iCal...');
        },
        onSuccess: (data) => {
            console.log('🎉 Mutation success:', data);
        },
        onError: (error: any) => {
            console.error('💥 Mutation error:', error.message);
        },
    })

    // Debug logging
    console.log('🎯 useResendICal Hook State:', {
        isPending: mutation.isPending,
        isSuccess: mutation.isSuccess,
        isError: mutation.isError,
        error: mutation.error?.message,
    });

    return mutation;
}