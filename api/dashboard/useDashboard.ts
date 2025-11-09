

import axiosInstance from '@/utils/axios';
import { useQuery } from '@tanstack/react-query';

interface DashboardCards {
  reminders: number;
  active: number;
  inactive: number;
  expiring: number;
  expired: number;
}

interface RemindersTable {
  headers: string[];
  reminders: number[];
  payments: number[];
  depreciation: number[];
}

interface PaymentsTable {
  payments_monthly: number;
  payments_annually: number;
  depreciation_monthly: number;
  depreciation_annually: number;
}

interface DashboardTables {
  reminders: RemindersTable;
  payments: PaymentsTable;
}

interface DashboardData {
  scope: string;
  cards: DashboardCards;
  tables: DashboardTables;
}

interface DashboardResponse {
  status: boolean;
  message: string;
  data: DashboardData;
}

const fetchDashboardData = async (): Promise<DashboardData> => {
  try {
    const response = await axiosInstance.get<DashboardResponse>("/dashboard");


    // Validate response structure
    if (!response.data) {
      throw new Error("No response data from API");
    }

    if (!response.data.status) {
      throw new Error(response.data.message || "API returned status: false");
    }

    if (!response.data.data) {
      throw new Error("No dashboard data in response");
    }

    const dashboardData = response.data.data;
    

    return dashboardData;
  } catch (error: any) {
    console.error('❌ Error fetching dashboard:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    throw error;
  }
};

export const useDashboard = () => {
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
  });

  // Debug logging
  console.log('🎯 useDashboard Hook State:', {
    status: query.status,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isPending: query.isPending,
    hasData: !!query.data,
    hasError: !!query.error,
    error: query.error?.message,
  });

  return {
    ...query,
    data: query.data || null,
  };
};