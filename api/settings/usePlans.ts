import axiosInstance from '@/utils/axios';
import { useMutation, useQuery } from '@tanstack/react-query';

// ============ TYPE DEFINITIONS ============
export interface Plan {
  id: string;
  name: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  interval_count: number;
  trial_period_days: number;
  active: boolean;
  account_type: string;
  statement_descriptor: string | null;
}

export interface Card {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  country: string;
  funding: string;
}

export interface PlansResponse {
  status: boolean;
  data: {
    current_plan: Plan;
    plans: Plan[];
    card: Card;
    is_home_and_family: boolean;
  };
}

export interface ChangePlanRequest {
  plan_id: string;
  card_token: string;
  coupon_code?: string;
}

export interface ChangePlanResponse {
  status: boolean;
  message: string;
  data: {
    current_plan: Plan;
    card: Card;
  };
}

export interface PlansError {
  message: string;
  code?: string;
}

// ============ FETCH PLANS ============
const fetchPlans = async (): Promise<PlansResponse> => {
  try {
    console.log('📋 Fetching subscription plans...');

    const response = await axiosInstance.get<PlansResponse>('/account/plans');

    console.log('✅ Plans fetched successfully:', {
      currentPlan: response.data.data.current_plan.name,
      totalPlans: response.data.data.plans.length,
      cardBrand: response.data.data.card.brand,
    });

    if (!response.data.status) {
      throw new Error('Failed to fetch plans');
    }

    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching plans:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    if (error.response?.status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    }

    if (error.response?.status === 404) {
      throw new Error('Plans not found.');
    }

    throw error;
  }
};

// ============ CHANGE PLAN ============
const changePlan = async (payload: ChangePlanRequest): Promise<ChangePlanResponse> => {
  try {
    console.log('🔄 Changing subscription plan...');
    console.log('📦 Payload:', { plan_id: payload.plan_id });

    const response = await axiosInstance.post<ChangePlanResponse>(
      '/account/plans/change',
      payload
    );

    console.log('✅ Plan changed successfully:', {
      newPlan: response.data.data.current_plan.name,
      message: response.data.message,
    });

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to change plan');
    }

    return response.data;
  } catch (error: any) {
    console.error('❌ Error changing plan:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    if (error.response?.status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    }

    if (error.response?.status === 400) {
      throw new Error('Invalid plan or card details.');
    }

    throw error;
  }
};

// ============ USE PLANS HOOK ============
export const usePlans = () => {
  return useQuery({
    queryKey: ['plans'],
    queryFn: fetchPlans,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
    enabled: true,
  });
};

// ============ USE CHANGE PLAN MUTATION ============
export const useChangePlan = () => {
  return useMutation({
    mutationFn: changePlan,
    onSuccess: (data) => {
      console.log('🎉 Plan change mutation successful');
    },
    onError: (error: any) => {
      console.error('❌ Plan change mutation failed:', error.message);
    },
  });
};

// ============ HELPER: GET SUBSCRIPTION PLAN NAME ============
export const getSubscriptionPlanName = (planId?: string, plans?: Plan[]): string => {
  if (!planId) {
    return 'Free';
  }

  if (plans && plans.length > 0) {
    const plan = plans.find((p) => p.id === planId);
    return plan?.name || 'Free';
  }

  return 'Free';
};

// ============ HELPER: GET SUBSCRIPTION STATUS ============
export const getSubscriptionStatus = (plan: Plan | null): string => {
  if (!plan || !plan.active) {
    return 'Inactive';
  }

  return 'Active';
};

// ============ HELPER: FORMAT PLAN AMOUNT ============
export const getFormattedPlanAmount = (amount: number, currency: string): string => {
  try {
    const value = amount / 100; // Convert cents to dollars
    return `$${value.toFixed(2)} ${currency.toUpperCase()}`;
  } catch (error) {
    return `${amount} ${currency}`;
  }
};

// ============ HELPER: GET PLAN OPTIONS ============
export const getPlanOptions = (plans: Plan[]): string[] => {
  return plans.map((plan) => plan.name).filter((name) => name);
};

// ============ HELPER: FIND PLAN BY NAME ============
export const findPlanByName = (plans: Plan[], planName: string): Plan | undefined => {
  return plans.find(
    (plan) => plan.name.toLowerCase() === planName.toLowerCase()
  );
};

// ============ HELPER: FIND PLAN BY ID ============
export const findPlanById = (plans: Plan[], planId: string): Plan | undefined => {
  return plans.find((plan) => plan.id === planId);
};

// ============ HELPER: GET CARD DISPLAY ============
export const getDisplayCardNumber = (lastFour: string): string => {
  if (!lastFour) {
    return 'No card on file';
  }
  return `•••• •••• •••• ${lastFour}`;
};

// ============ HELPER: GET CARD EXPIRATION ============
export const getCardExpiration = (expMonth: number, expYear: number): string => {
  const month = String(expMonth).padStart(2, '0');
  const year = String(expYear).slice(-2);
  return `${month}/${year}`;
};