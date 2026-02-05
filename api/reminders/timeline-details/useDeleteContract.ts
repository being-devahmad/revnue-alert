import axiosInstance from '@/utils/axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface DeleteContractResponse {
  status: boolean;
  message: string;
}

const deleteContractAPI = async (contractId: number): Promise<DeleteContractResponse> => {
  const response = await axiosInstance.delete<DeleteContractResponse>(
    `/contracts/${contractId}`
  );

  if (!response.data?.status) {
    throw new Error(response.data?.message || 'Failed to delete contract.');
  }

  return response.data;
};

export const useDeleteContract = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteContractAPI,
    onSuccess: (_data, contractId) => {
      // Remove cached data for the deleted contract so no refetch (404) is triggered
      queryClient.removeQueries({ queryKey: ['contract', contractId] });
      queryClient.removeQueries({ queryKey: ['timelineDetails', contractId] });
      // Refresh the reminders list only
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });

  return mutation;
};

/**
 * Get user-friendly message from API error (401, 403, 404).
 */
export const getDeleteContractErrorMessage = (error: any): string => {
  const data = error?.response?.data;
  const message = data?.message;
  const status = error?.response?.status;

  if (message && typeof message === 'string') return message;
  if (status === 401) return 'Unauthorized. Please log in again.';
  if (status === 403) return 'You do not have permission to delete this contract.';
  if (status === 404) return 'Contract not found.';
  return 'Failed to delete contract. Please try again.';
};
