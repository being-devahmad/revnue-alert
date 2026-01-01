import axiosInstance from '@/utils/axios';
import { useQuery } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { PlanV2 } from './useGetPlansv2';

// ============ TYPE DEFINITIONS ============
export interface UserSubscriptionV2 {
    id: number;
    user_id: number;
    source: string;
    platform: 'ios' | 'android';
    app_plan_id: number;
    period: string; // e.g. "forever", "monthly", "yearly"
    status: string;
    started_at: string;
    current_period_start: string | null;
    current_period_end: string | null;
    cancelled_at: string | null;
    trial_ends_at: string | null;
    will_renew: boolean;
    rc_entitlement_id: string | null;
    rc_product_id: string | null;
    rc_transaction_id: string | null;
    rc_original_transaction_id: string | null;
    rc_customer_id: string | null;
    created_at: string;
    updated_at: string;
    plan: PlanV2;
}

export interface UserPlanResponse {
    status: boolean;
    message: UserSubscriptionV2;
}

// ============ FETCH USER PLAN ============
const fetchUserPlan = async (userId: number): Promise<UserPlanResponse> => {
    try {
        const platform = Platform.OS === 'ios' ? 'ios' : 'android';
        console.log(`📋 Fetching user plan for user ${userId} on platform ${platform}...`);

        const response = await axiosInstance.get<UserPlanResponse>(
            `/user/plan?platform=${platform}&id=${userId}`
        );

        if (!response.data.status) {
            throw new Error('Failed to fetch user plan');
        }

        return response.data;
    } catch (error: any) {
        console.error('❌ Error fetching user plan:', error);
        throw error;
    }
};

// ============ USE USER PLAN HOOK ============
export const useGetUserPlan = (userId: number | undefined) => {
    return useQuery({
        queryKey: ['userPlan', userId, Platform.OS],
        queryFn: () => fetchUserPlan(userId!),
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
    });
};
