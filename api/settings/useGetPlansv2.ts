import axiosInstance from '@/utils/axios';
import { useQuery } from '@tanstack/react-query';
import { Platform } from 'react-native';

// ============ TYPE DEFINITIONS ============
export interface PlanProduct {
    platform: 'ios' | 'android';
    period: 'monthly' | 'yearly';
    store_product_id: string;
    price: string;
    currency: string;
    trial_days: number;
    is_active: boolean;
}

export interface PlanV2 {
    id: number;
    code: string;
    name: string;
    tier_rank: number;
    features: string[] | null;
    products: PlanProduct[];
}

export interface PlansV2Response {
    status: boolean;
    data: PlanV2[];
}

export interface PlansV2Error {
    message: string;
    code?: string;
}

// ============ FETCH PLANS V2 ============
const fetchPlansV2 = async (): Promise<PlansV2Response> => {
    try {
        const platform = Platform.OS === 'ios' ? 'ios' : 'android';
        console.log(`📋 Fetching subscription plans V2 for platform: ${platform}...`);

        const response = await axiosInstance.get<PlansV2Response>(
            `/app/plans?platform=${platform}`
        );

        console.log('✅ Plans V2 fetched successfully:', {
            totalPlans: response.data.data.length,
            plans: response.data.data.map(p => p.name),
        });

        if (!response.data.status) {
            throw new Error('Failed to fetch plans');
        }

        return response.data;
    } catch (error: any) {
        console.error('❌ Error fetching plans V2:', {
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

// ============ USE PLANS V2 HOOK ============
export const useGetPlansV2 = () => {
    return useQuery({
        queryKey: ['plansV2', Platform.OS],
        queryFn: fetchPlansV2,
        enabled: true,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

// ============ HELPER: GET MONTHLY PRODUCT ============
export const getMonthlyProduct = (plan: PlanV2): PlanProduct | undefined => {
    return plan.products.find(
        (p) => p.period === 'monthly' && p.is_active
    );
};

// ============ HELPER: GET YEARLY PRODUCT ============
export const getYearlyProduct = (plan: PlanV2): PlanProduct | undefined => {
    return plan.products.find(
        (p) => p.period === 'yearly' && p.is_active
    );
};

// ============ HELPER: FORMAT PRICE ============
export const formatPrice = (price: string, currency: string): string => {
    const currencySymbol = currency === 'USD' ? '$' : currency;
    return `${currencySymbol}${price}`;
};

// ============ HELPER: GET PLAN BY CODE ============
export const getPlanByCode = (
    plans: PlanV2[],
    code: string
): PlanV2 | undefined => {
    return plans.find((plan) => plan.code === code);
};

// ============ HELPER: GET PLAN BY TIER ============
export const getPlanByTier = (
    plans: PlanV2[],
    tierRank: number
): PlanV2 | undefined => {
    return plans.find((plan) => plan.tier_rank === tierRank);
};

// ============ HELPER: SORT PLANS BY TIER ============
export const sortPlansByTier = (plans: PlanV2[]): PlanV2[] => {
    return [...plans].sort((a, b) => a.tier_rank - b.tier_rank);
};
