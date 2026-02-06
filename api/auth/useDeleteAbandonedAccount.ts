import { API_BASE_URL } from '@/utils/axios';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

interface DeleteAbandonedAccountResponse {
    status: boolean;
    message: string;
}

/**
 * Delete an account that was abandoned during the subscription payment phase.
 * This endpoint MUST be called without Authorization header.
 * 
 * @param userId - The ID of the user to delete
 */
export const deleteAbandonedAccount = async (userId: number): Promise<DeleteAbandonedAccountResponse> => {
    console.log('🗑️ Deleting abandoned account:', userId);

    try {
        // We use a clean axios call to avoid the interceptors in utils/axios.js
        // which would attach the Authorization header.
        const response = await axios.post(
            `${API_BASE_URL}/account/abandoned-delete`,
            { id: userId },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data;
    } catch (error: any) {
        console.error('❌ Failed to delete abandoned account:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
        });
        throw error;
    }
};

export const useDeleteAbandonedAccount = () => {
    return useMutation({
        mutationFn: deleteAbandonedAccount,
        onSuccess: (data) => {
            console.log('✅ Abandoned account deleted successfully:', data.message);
        },
        onError: (error: any) => {
            // We process the error log in the fetcher, but can handle specific UI logic here if needed
            console.log('⚠️ Error cleaning up abandoned account (ignoring as per flow).');
        },
    });
};
