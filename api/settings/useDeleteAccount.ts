import axiosInstance from '@/utils/axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// ============ TYPE DEFINITIONS ============
export interface DeleteAccountResponse {
    status: boolean;
    message: string;
}

// ============ DELETE ACCOUNT FUNCTION ============
/**
 * Delete user account using DELETE method to /account/delete endpoint
 */
const deleteAccount = async (): Promise<DeleteAccountResponse> => {
    try {
        console.log('📤 Deleting user account (DELETE /account/delete)...');

        // ✅ Using DELETE method to /account/delete endpoint
        const response = await axiosInstance.delete<DeleteAccountResponse>(
            '/account/delete'
        );

        console.log('✅ User account deleted successfully:', {
            status: response.data.status,
            message: response.data.message,
        });

        return response.data;
    } catch (error: any) {
        console.error('❌ Error deleting user account:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
        });
        throw error;
    }
};

// ============ USE DELETE ACCOUNT HOOK ============
/**
 * React Hook for deleting user account
 * Handles mutation, cache invalidation, and cleanup
 */
export const useDeleteAccount = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteAccount,
        onSuccess: (data) => {
            console.log('🔄 Clearing user cache after account deletion...');

            // Clear all user-related queries
            queryClient.invalidateQueries({
                queryKey: ['userProfile'],
            });

            // Clear all cached data
            queryClient.clear();

            console.log('✨ User cache cleared successfully');
        },
        onError: (error: any) => {
            console.error('❌ Account deletion mutation failed:', error);
        },
    });
};

// ============ HELPER: FORMAT ERROR MESSAGE ============
/**
 * Extract user-friendly error message from API response
 * Handles different error response formats from backend
 */
export const formatDeleteErrorMessage = (error: any): string => {
    // Direct message from API
    if (error?.response?.data?.message) {
        return error.response.data.message;
    }

    // Validation errors object
    if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0];
        if (Array.isArray(firstError)) {
            return firstError[0] as string;
        }
        return JSON.stringify(firstError);
    }

    // Axios error message
    if (error?.message) {
        return error.message;
    }

    // Default fallback
    return 'Failed to delete account. Please try again.';
};

// ============ HELPER: GET ERROR STATUS ============
/**
 * Get HTTP status code from error
 * Useful for conditional error handling
 */
export const getErrorStatus = (error: any): number | null => {
    return error?.response?.status || null;
};

// ============ HELPER: IS NETWORK ERROR ============
/**
 * Check if error is a network error
 */
export const isNetworkError = (error: any): boolean => {
    return !error?.response;
};
