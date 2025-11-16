import axiosInstance from '@/utils/axios';
import { useQuery } from '@tanstack/react-query';

// ============ TYPE DEFINITIONS ============
export interface UserProfile {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  company: string;
  department: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  stripe_active: number;
  stripe_id: string;
  stripe_subscription: string;
  stripe_plan: string;
  last_four: string | null;
  trial_ends_at: string;
  subscription_ends_at: string | null;
  industry_id: number;
}

export interface UserProfileResponse {
  status: boolean;
  user: UserProfile;
}

export interface FormattedUserProfile {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  company: string;
  department: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  industryId: number;
  createdAt: string;
  updatedAt: string;
  stripeActive: boolean;
  stripeId: string;
  stripeSubscription: string;
  stripePlan: string;
  lastFour: string | null;
  trialEndsAt: string;
  subscriptionEndsAt: string | null;
}

// ============ FETCH USER PROFILE FUNCTION ============
const fetchUserProfile = async (): Promise<UserProfileResponse> => {
  try {
    console.log('📥 Fetching user profile...');

    const response = await axiosInstance.get<UserProfileResponse>(
      '/user'
    );

    console.log('✅ User profile fetched:', {
      userId: response.data.user.id,
      email: response.data.user.email,
      name: `${response.data.user.first_name} ${response.data.user.last_name}`,
    });

    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching user profile:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

// ============ USE USER PROFILE HOOK ============
export const useGetUserDetails = () => {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: fetchUserProfile,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour garbage collection time
    retry: 2, // Retry failed requests twice
  });
};

// ============ HELPER: FORMAT PROFILE DATA ============
/**
 * Convert snake_case API response to camelCase for easier use in components
 */
export const formatUserProfile = (profile: UserProfile): FormattedUserProfile => {
  return {
    id: profile.id,
    firstName: profile.first_name,
    middleName: profile.middle_name,
    lastName: profile.last_name,
    company: profile.company,
    department: profile.department,
    email: profile.email,
    phone: profile.phone,
    address: profile.address,
    city: profile.city,
    state: profile.state,
    zipCode: profile.zip_code,
    industryId: profile.industry_id,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
    stripeActive: profile.stripe_active === 1,
    stripeId: profile.stripe_id,
    stripeSubscription: profile.stripe_subscription,
    stripePlan: profile.stripe_plan,
    lastFour: profile.last_four,
    trialEndsAt: profile.trial_ends_at,
    subscriptionEndsAt: profile.subscription_ends_at,
  };
};

// ============ HELPER: GET SUBSCRIPTION STATUS ============
/**
 * Determine subscription status from profile data
 */
export const getSubscriptionStatus = (profile: UserProfile): string => {
  if (!profile.trial_ends_at && !profile.subscription_ends_at) {
    return 'No Active Subscription';
  }

  const now = new Date();
  const trialEnd = new Date(profile.trial_ends_at);
  const subscriptionEnd = profile.subscription_ends_at
    ? new Date(profile.subscription_ends_at)
    : null;

  // Check if trial is still active
  if (trialEnd > now) {
    const daysLeft = Math.ceil(
      (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return `Trial Period (Expires: ${trialEnd.toLocaleDateString()})`;
  }

  // Check if subscription is active
  if (subscriptionEnd && subscriptionEnd > now) {
    return `Active Subscription (Expires: ${subscriptionEnd.toLocaleDateString()})`;
  }

  // Check if subscription has ended but not too long ago
  if (subscriptionEnd && subscriptionEnd <= now) {
    const daysAgo = Math.ceil(
      (now.getTime() - subscriptionEnd.getTime()) / (1000 * 60 * 60 * 24)
    );
    return `Subscription Expired (${daysAgo} days ago)`;
  }

  return 'No Active Subscription';
};

// ============ HELPER: GET SUBSCRIPTION PLAN ============
/**
 * Map stripe plan ID to readable plan name
 * Note: You may need to adjust this based on your actual plan IDs
 */
export const getSubscriptionPlanName = (stripePlan: string): string => {
  const planMap: { [key: string]: string } = {
    'price_free': 'Free',
    'price_basic': 'Basic',
    'price_standard': 'Standard',
    'price_enterprise': 'Enterprise',
    'uveovetwuctaudbobwsefofupdsdopds': 'Enterprise', // From example data
  };

  return planMap[stripePlan] || 'Custom Plan';
};

// ============ HELPER: GET DISPLAY CARD NUMBER ============
/**
 * Format card number for display
 * Returns masked card number or "No Card" if not available
 */
export const getDisplayCardNumber = (lastFour: string | null): string => {
  if (!lastFour) {
    return 'No payment method on file';
  }
  return `**************${lastFour}`;
};

// ============ HELPER: GET INDUSTRY NAME BY ID ============
/**
 * This is a placeholder - in a real app, you'd fetch industry names from an API
 * or use the industry data from your IndustryBottomSheet
 */
export const getIndustryName = (industryId: number): string => {
  const industryMap: { [key: number]: string } = {
    1: 'General (Default)',
    2: 'Construction',
    3: 'Manufacturing',
    4: 'Healthcare',
    5: 'Retail',
    6: 'Technology',
    7: 'Finance',
    8: 'Education',
    // Add more as needed
  };

  return industryMap[industryId] || 'Industry';
};

// ============ HELPER: FORMAT DATE ============
/**
 * Format ISO date string to readable format
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    return dateString;
  }
};

// ============ HELPER: GET DAYS UNTIL TRIAL ENDS ============
/**
 * Calculate remaining days in trial period
 */
export const getDaysUntilTrialEnds = (trialEndsAt: string): number => {
  const now = new Date();
  const trialEnd = new Date(trialEndsAt);
  const daysLeft = Math.ceil(
    (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(0, daysLeft);
};

// ============ HELPER: IS TRIAL ACTIVE ============
/**
 * Check if trial period is still active
 */
export const isTrialActive = (trialEndsAt: string): boolean => {
  const now = new Date();
  const trialEnd = new Date(trialEndsAt);
  return trialEnd > now;
};

// ============ HELPER: GET PROFILE LOADING STATE ============
/**
 * Combine all possible states into a single status
 */
export const getProfileState = (
  isLoading: boolean,
  isError: boolean,
  data: UserProfileResponse | undefined
): 'loading' | 'error' | 'empty' | 'success' => {
  if (isLoading) return 'loading';
  if (isError) return 'error';
  if (!data?.user) return 'empty';
  return 'success';
};