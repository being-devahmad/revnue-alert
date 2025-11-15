import axiosInstance from '@/utils/axios';
import { useQuery } from '@tanstack/react-query';

// ============ TYPE DEFINITIONS ============
export interface Reminder {
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
  notifications: any[];
  events: any[];
}

export interface ReminderCategory {
  id: number;
  name: string;
}

export interface ContractData {
  id: number;
  name: string;
  description: string;
  started_at: string;
  expired_at: string;
  account_number: string;
  website_email: string | null;
  phone_number: string | null;
  amount: number;
  interval: string | null;
  payments: number;
  notes: string;
  auto_renew: number;
  auto_renew_period: string | null;
  last_payment_amount: number | null;
  last_payment_at: string | null;
  last_payment_notes: string | null;
  supplier_rating: string | null;
  category_id: number;
  user_id: number;
  completed_at: string | null;
  non_renew_sent_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  reminders: Reminder[];
  category: ReminderCategory;
}

export interface TimelineRow {
  reminder_id: number;
  contract_name: string;
  start_timestamp: string;
  expire_timestamp: string;
  monthly_payment: number;
  auto_renew_period: string | null;
}

export interface TimelineData {
  rows: TimelineRow[];
  min_timestamp: string;
  max_timestamp: string;
  colors: {
    expired: string;
    warning: string;
    active: string;
    curdate: string;
  };
  warning_period_days: number;
}

export interface TimelineDetailsResponse {
  status: boolean;
  message: string;
  data: {
    timeline: TimelineData;
    contract: ContractData;
  };
}

// ============ FETCH TIMELINE DETAILS FUNCTION ============
const fetchTimelineDetails = async (contractId: string): Promise<TimelineDetailsResponse> => {
  try {
    console.log(`📥 Fetching timeline details for contract: ${contractId}`);

    const response = await axiosInstance.get<TimelineDetailsResponse>(
      `/contracts/${contractId}/timeline`
    );

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to fetch timeline details');
    }

    console.log('✅ Timeline details fetched successfully:', {
      contractId,
      contractName: response.data.data.contract.name,
      remindersCount: response.data.data.contract.reminders.length,
      timelineEvents: response.data.data.timeline.rows.length,
    });

    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching timeline details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

// ============ USE TIMELINE DETAILS HOOK ============
export const useGetTimelineDetails = (contractId: string) => {
  return useQuery({
    queryKey: ['timelineDetails', contractId],
    queryFn: () => fetchTimelineDetails(contractId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes garbage collection time
    enabled: !!contractId, // Only fetch if contractId is provided
  });
};

// ============ HELPER: GET DAYS LEFT ============
export const getDaysLeft = (expirationDate: string): number => {
  const expiry = new Date(expirationDate);
  const today = new Date();
  return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

// ============ HELPER: GET STATUS COLOR ============
export const getStatusColor = (daysLeft: number): string => {
  if (daysLeft < 0) return '#EF4444'; // Expired - Red
  if (daysLeft < 30) return '#F59E0B'; // Expiring Soon - Amber
  return '#10B981'; // Active - Green
};

// ============ HELPER: GET STATUS TEXT ============
export const getStatusText = (daysLeft: number): string => {
  if (daysLeft < 0) return 'Expired';
  if (daysLeft < 30) return 'Expiring Soon';
  return 'Active';
};

// ============ HELPER: FORMAT DATE ============
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return 'Invalid Date';
  }
};

// ============ HELPER: FORMAT DATE LONG ============
export const formatDateLong = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return 'Invalid Date';
  }
};