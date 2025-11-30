import { useAuthStore } from '@/store/authStore';
import axiosInstance from '@/utils/axios';
import { useInfiniteQuery } from '@tanstack/react-query';

// ============ TYPE DEFINITIONS ============
export interface ReminderCategory {
  id: number;
  name: string;
}

export interface ReminderData {
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
  reminder_count: number;
  reminder_active_count: number;
  category: ReminderCategory;
  reminders: {
    id: number;
    contract_id: number;
    active: boolean;
  }[];
}

export interface PaginationData {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

export interface RemindersFilters {
  status?: 'active' | 'inactive' | 'expired' | 'expiring';
  search?: string;
  category_id?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
  per_page?: number;
}

export interface TagCount {
  [tag: string]: number;
}

export interface RemindersResponse {
  status: boolean;
  message: string;
  data: {
    scope: string;
    pagination: PaginationData;
    filters: Record<string, any>;
    reminders: ReminderData[];
    tag_counts: TagCount;
  };
}

// ============ FETCH REMINDERS FUNCTION ============
const fetchReminders = async (
  pageParam: number = 1,
  filters: RemindersFilters = {}
): Promise<RemindersResponse> => {
  try {
    const perPage = filters.per_page || 10;
    
    console.log('📥 Fetching reminders:', {
      page: pageParam,
      perPage,
      filters,
    });

    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('page', String(pageParam));
    queryParams.append('per_page', String(perPage));

    // Add filters
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.category_id) queryParams.append('category_id', String(filters.category_id));
    if (filters.sort) queryParams.append('sort', filters.sort);
    if (filters.direction) queryParams.append('direction', filters.direction);

    const response = await axiosInstance.get<RemindersResponse>(
      `/reminders?${queryParams.toString()}`
    );

    console.log('✅ Reminders fetched:', {
      page: response.data.data.pagination.current_page,
      total: response.data.data.pagination.total,
      count: response.data.data.reminders.length,
      hasNextPage: !!response.data.data.pagination.next_page_url,
    });

    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching reminders:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

// ============ USE REMINDERS HOOK ============
export const useReminders = (filters: RemindersFilters = {}) => {
  // ✅ Get current user ID from auth store
  const user = useAuthStore((state) => state.user);
  const userId = user?.id;

  return useInfiniteQuery({
    // ✅ KEY FIX: Include userId in query key so different users have different cache
    queryKey: ['reminders', userId, filters],
    queryFn: ({ pageParam = 1 }) => fetchReminders(pageParam, filters),
    getNextPageParam: (lastPage) => {
      // If there's a next page, return the next page number
      if (lastPage.data.pagination.next_page_url) {
        return lastPage.data.pagination.current_page + 1;
      }
      // Return undefined to signal no more pages
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes garbage collection time
    maxPages: Infinity, // Allow loading unlimited pages (scroll through all)
    // ✅ Only run query if user is authenticated
    enabled: !!userId,
  });
};

// ============ HELPER: FLATTEN ALL REMINDERS ============
export const flattenReminders = (data: any): ReminderData[] => {
  if (!data?.pages) return [];
  return data.pages.reduce(
    (acc: ReminderData[], page: RemindersResponse) => [
      ...acc,
      ...page.data.reminders,
    ],
    []
  );
};

// ============ HELPER: GET PAGINATION INFO ============
export const getPaginationInfo = (data: any) => {
  if (!data?.pages || data.pages.length === 0) {
    return {
      total: 0,
      currentPage: 0,
      lastPage: 0,
      hasNextPage: false,
    };
  }

  const lastPage = data.pages[data.pages.length - 1];
  const pagination = lastPage.data.pagination;

  return {
    total: pagination.total,
    currentPage: pagination.current_page,
    lastPage: pagination.last_page,
    hasNextPage: !!pagination.next_page_url,
  };
};

// ============ HELPER: GET STATUS COLOR ============
export const getStatusColor = (reminder: ReminderData): string => {
  const expirationDate = new Date(reminder.expired_at);
  const today = new Date();
  const daysUntilExpiry = Math.floor(
    (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry < 0) return '#EF4444'; // Expired - Red
  if (daysUntilExpiry < 30) return '#F59E0B'; // Expiring Soon - Amber
  return '#10B981'; // Active - Green
};

// ============ HELPER: GET STATUS BADGE ============
export const getStatusBadge = (reminder: ReminderData): string => {
  console.log('Calculating status badge for reminder ID:', reminder);

  // Step 1: Check if reminders array exists and has any active reminders
  const hasActiveReminder = reminder.reminders?.some(r => r.active);

  if (!hasActiveReminder) return 'Inactive';

  // Step 2: Calculate based on expiry date
  const expirationDate = new Date(reminder.expired_at);
  const today = new Date();
  const daysUntilExpiry = Math.floor(
    (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry < 0) return 'Expired';
  if (daysUntilExpiry < 30) return 'Expiring Soon';
  return 'Active';
};


// ============ HELPER: GET DAYS LEFT ============
export const getDaysLeft = (expirationDate: string): number => {
  const expiry = new Date(expirationDate);
  const today = new Date();
  return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};