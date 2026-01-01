import axiosInstance from '@/utils/axios';
import { useMutation } from '@tanstack/react-query';

export interface VerifyPromoRequest {
    code: string;
}

export interface PromoData {
    code: string;
    type: string;
    duration: string;
    iap_required: boolean;
}

export interface VerifyPromoResponse {
    valid: boolean;
    data: PromoData;
}

const verifyPromo = async (data: VerifyPromoRequest): Promise<VerifyPromoResponse> => {
    try {
        console.log('🔄 Verifying promo code...', data.code);
        const response = await axiosInstance.post<VerifyPromoResponse>('/promo/verify', data);

        if (!response.data) {
            throw new Error('No response data from API');
        }

        return response.data;
    } catch (error: any) {
        console.error('❌ Promo verification error:', {
            message: error.message,
            data: error.response?.data,
        });

        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }

        throw error;
    }
};

export const useVerifyPromo = () => {
    const mutation = useMutation({
        mutationFn: verifyPromo,
    });

    return {
        ...mutation,
        verifyPromo: mutation.mutate,
        isVerifying: mutation.isPending,
    };
};
