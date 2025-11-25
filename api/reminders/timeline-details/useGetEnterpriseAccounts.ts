import axiosInstance from '@/utils/axios';
import { useQuery } from '@tanstack/react-query';

export interface EnterpriseAccount {
  id: number;
  name: string;
  department: string;
  email: string;
}

interface GetEnterpriseAccountsResponse {
  status: boolean;
  is_enterprise: boolean;
  accounts: EnterpriseAccount[];
}

const getEnterpriseAccountsAPI = async (): Promise<EnterpriseAccount[]> => {
  try {
    console.log('📤 Fetching enterprise accounts...');

    const response = await axiosInstance.get<GetEnterpriseAccountsResponse>(
      '/enterprise/accounts'
    );

    // Validate response structure
    if (!response.data) {
      throw new Error("No response data from API");
    }

    if (!response.data.status) {
      throw new Error("API returned status: false");
    }

    if (!response.data.accounts) {
      throw new Error("No accounts data in response");
    }

    console.log('✅ Enterprise accounts fetched successfully!');
    console.log('📊 Total accounts:', response.data.accounts.length);
    console.log('📋 Accounts:', response.data.accounts);

    return response.data.accounts;
  } catch (error: any) {
    console.error('❌ Error fetching enterprise accounts:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    throw error;
  }
};

export const useGetEnterpriseAccounts = () => {
  const query = useQuery({
    queryKey: ['enterprise-accounts'],
    queryFn: getEnterpriseAccountsAPI,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    onError: (error: any) => {
      console.error('💥 Query error:', error.message);
    },
  });

  console.log('🎯 useGetEnterpriseAccounts Hook State:', {
    isLoading: query.isLoading,
    isError: query.isError,
    data: query.data,
    error: query.error?.message,
  });

  return query;
};