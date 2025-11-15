import axiosInstance from '@/utils/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';

export interface Plan {
  product_id: string;
  price_id: string;
  name: string;
  description: string;
  amount: string;
  currency: string;
  interval: "month" | "year";
}

export interface Industry {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PlansData {
  homeAndFamilyIndustry: Industry;
  industries: Industry[];
  plans: {
    month: Plan[];
    year: Plan[];
  };
}

interface PlansResponse {
  status: boolean;
  data: PlansData;
}

// ============ CACHE CONFIGURATION ============
const PLANS_CACHE_KEY = 'app_plans_cache';
const PLANS_CACHE_EXPIRY_KEY = 'app_plans_cache_expiry';
const CACHE_DURATION = 1000 * 60 * 60 * 24 * 7; // 7 days
const API_STALE_TIME = 1000 * 60 * 60 * 24; // 24 hours

// ============ CACHE MANAGEMENT FUNCTIONS ============

/**
 * Save plans data to AsyncStorage (local device storage)
 * @param data - PlansData to cache
 */
const savePlansToCache = async (data: PlansData): Promise<void> => {
  try {
    await AsyncStorage.multiSet([
      [PLANS_CACHE_KEY, JSON.stringify(data)],
      [PLANS_CACHE_EXPIRY_KEY, Date.now().toString()],
    ]);
    console.log('✅ Plans cached to local storage (7 days)');
  } catch (error) {
    console.warn('⚠️ Failed to save plans to cache:', error);
  }
};

/**
 * Retrieve plans data from AsyncStorage
 * Checks if cache is still valid (not expired)
 * @returns PlansData if valid cache exists, null otherwise
 */
const getPlansFromCache = async (): Promise<PlansData | null> => {
  try {
    const [cachedPlans, cacheExpiry] = await AsyncStorage.multiGet([
      PLANS_CACHE_KEY,
      PLANS_CACHE_EXPIRY_KEY,
    ]);

    // Check if both cache and expiry exist
    if (!cachedPlans[1] || !cacheExpiry[1]) {
      console.log('❌ No cached plans found');
      return null;
    }

    const expiredAt = parseInt(cacheExpiry[1]);
    const now = Date.now();
    const ageInDays = Math.floor((now - expiredAt) / (1000 * 60 * 60 * 24));

    // Check if cache is still valid (7 days)
    if (now - expiredAt < CACHE_DURATION) {
      console.log(`✅ Using cached plans from local storage (${ageInDays} days old)`);
      return JSON.parse(cachedPlans[1]);
    }

    console.log('⏰ Cache expired (older than 7 days), will fetch fresh data');
    return null;
  } catch (error) {
    console.warn('⚠️ Failed to retrieve plans from cache:', error);
    return null;
  }
};

/**
 * Clear plans cache manually
 * Useful for settings page or force refresh
 */
export const clearPlansCache = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([PLANS_CACHE_KEY, PLANS_CACHE_EXPIRY_KEY]);
    console.log('✅ Plans cache cleared');
  } catch (error) {
    console.warn('⚠️ Failed to clear plans cache:', error);
  }
};

/**
 * Get cache age in days
 * Useful for displaying cache status
 */
export const getPlanssCacheAge = async (): Promise<number | null> => {
  try {
    const cacheExpiry = await AsyncStorage.getItem(PLANS_CACHE_EXPIRY_KEY);
    if (!cacheExpiry) return null;

    const expiredAt = parseInt(cacheExpiry);
    const now = Date.now();
    const ageInDays = Math.floor((now - expiredAt) / (1000 * 60 * 60 * 24));

    return ageInDays;
  } catch (error) {
    console.warn('⚠️ Failed to get cache age:', error);
    return null;
  }
};

/**
 * Validate plans data structure
 * Ensures response has required fields
 */
const validatePlansData = (data: any): data is PlansData => {
  return (
    data &&
    data.plans &&
    Array.isArray(data.plans.month) &&
    Array.isArray(data.plans.year) &&
    Array.isArray(data.industries) &&
    data.plans.month.length > 0 &&
    data.plans.year.length > 0 &&
    data.homeAndFamilyIndustry &&
    typeof data.homeAndFamilyIndustry === 'object'
  );
};

// ============ MAIN FETCH FUNCTION ============

/**
 * Fetch plans from API with intelligent caching
 * 
 * Flow:
 * 1. Try to fetch from API
 * 2. If successful, save to local cache (7 days)
 * 3. If API fails, try to use local cache as fallback
 * 4. If no cache available, throw error
 * 
 * @returns PlansData from API or cache
 * @throws Error if both API and cache fail
 */
const fetchPlansData = async (): Promise<PlansData> => {
  try {
    console.log('🔄 Fetching plans from API...');
    const response = await axiosInstance.get<PlansResponse>("/plans");

    // ============ API RESPONSE VALIDATION ============
    if (!response.data) {
      throw new Error("No response data from API");
    }

    if (!response.data.status) {
      throw new Error(
        response.data.status === false
          ? "API returned status: false"
          : "Invalid API response"
      );
    }

    if (!response.data.data) {
      throw new Error("No plans data in response");
    }

    const plansData = response.data.data;

    // Validate data structure
    if (!validatePlansData(plansData)) {
      throw new Error("Invalid plans structure in response");
    }

    // ============ CACHE & RETURN ============
    // Save to local cache for offline support
    await savePlansToCache(plansData);
    console.log('✅ Plans fetched successfully from API');
    console.log(`📊 Loaded ${plansData.plans.month.length} plans (month/year)`);

    return plansData;
  } catch (apiError: any) {
    // ============ API FAILED - TRY CACHE ============
    console.warn('❌ API fetch failed:', apiError.message);
    console.log('🔄 Attempting to use cached plans as fallback...');

    const cachedPlans = await getPlansFromCache();

    if (cachedPlans) {
      console.log('✅ Successfully using cached plans');
      return cachedPlans;
    }

    // ============ NO CACHE AVAILABLE - ERROR ============
    console.error('❌ No cached plans available');
    throw new Error(
      apiError.message || "Failed to fetch plans and no cache available"
    );
  }
};

// ============ REACT QUERY HOOK ============

/**
 * usePlans Hook - Intelligent plan fetching with caching
 * 
 * Features:
 * - Fetches from API first
 * - Falls back to local cache if API fails
 * - Caches data for 7 days locally
 * - API stale time: 24 hours (refreshes daily)
 * - Works offline after first load
 * - No unnecessary refetches on window focus/mount
 * 
 * Usage:
 * ```
 * const { data: plansData, isLoading, error } = usePlans();
 * 
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage error={error} />;
 * if (!plansData) return <NoDataMessage />;
 * 
 * // Use plansData.plans.month and plansData.plans.year
 * ```
 */
export const usePlans = () => {
  const query = useQuery({
    queryKey: ["plans"],
    queryFn: fetchPlansData,
    
    // ============ CACHE CONFIGURATION ============
    staleTime: API_STALE_TIME, // 24 hours
    // After 24 hours, data is considered "stale"
    // Query will refetch if needed (but uses cache first)
    
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days (was called cacheTime in older versions)
    // How long to keep data in memory after last use
    // Even if stale, memory cache is used before refetching
    
    retry: 2, // Retry failed API calls 2 times
    
    // ============ REFETCH CONFIGURATION ============
    // These prevent unnecessary refetches for static data
    refetchOnWindowFocus: false,
    // Don't refetch when user switches tabs/apps
    
    refetchOnMount: false,
    // Don't refetch when component mounts if we already have data
    
    refetchIntervalInBackground: false,
    // Don't refetch in background
  });

  // ============ DEBUG LOGGING ============
  console.log('🎯 usePlans Hook State:', {
    status: query.status,           // 'pending' | 'error' | 'success'
    isLoading: query.isLoading,     // True while first fetch is in progress
    isFetching: query.isFetching,   // True while any fetch is in progress
    isPending: query.isPending,     // True if no data yet
    hasData: !!query.data,          // True if data is available
    hasError: !!query.error,        // True if error occurred
    error: query.error?.message,    // Error message if any
  });

  return {
    ...query,
    data: query.data || null,
  };
};