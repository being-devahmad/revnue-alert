import axiosInstance from '@/utils/axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// ============ TYPE DEFINITIONS ============
export interface UpdateProfileRequest {
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  department: string;
  industry_id: number;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
}

export interface UpdateProfileResponse {
  status: boolean;
  message: string;
  data: UpdateProfileRequest;
}

// ============ UPDATE USER PROFILE FUNCTION ============
/**
 * Update user profile using POST method to /api/user endpoint
 * POST is used because the backend expects POST for profile updates
 */
const updateUserProfile = async (
  profileData: UpdateProfileRequest
): Promise<UpdateProfileResponse> => {
  try {
    console.log('📤 Updating user profile (POST /api/user)...', {
      name: `${profileData.first_name} ${profileData.last_name}`,
      email: profileData.email,
      company: profileData.company,
    });

    // ✅ Using POST method to /api/user endpoint
    const response = await axiosInstance.post<UpdateProfileResponse>(
      '/account/info/update',
      profileData
    );

    console.log('✅ User profile updated successfully:', {
      status: response.data.status,
      message: response.data.message,
    });

    return response.data;
  } catch (error: any) {
    console.error('❌ Error updating user profile:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

// ============ USE UPDATE USER PROFILE HOOK ============
/**
 * React Hook for updating user profile
 * Handles mutation, cache invalidation, and real-time updates
 */
export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (data) => {
      console.log('🔄 Invalidating profile cache...');

      // Invalidate the userProfile query to trigger refetch
      queryClient.invalidateQueries({
        queryKey: ['userProfile'],
      });

      // Set the new data immediately for real-time reflection
      queryClient.setQueryData(['userProfile'], {
        status: true,
        user: data.data,
      });

      console.log('✨ Profile cache updated with new data');
    },
    onError: (error: any) => {
      console.error('❌ Profile update mutation failed:', error);
    },
  });
};

// ============ HELPER: VALIDATE PROFILE DATA ============
/**
 * Validate profile data before sending to API
 * Ensures all required fields are present and valid
 */
export const validateProfileData = (
  data: UpdateProfileRequest
): { valid: boolean; error?: string } => {
  // Check required fields
  if (!data.first_name?.trim()) {
    return { valid: false, error: 'First name is required' };
  }

  if (!data.last_name?.trim()) {
    return { valid: false, error: 'Last name is required' };
  }

  if (!data.email?.trim()) {
    return { valid: false, error: 'Email is required' };
  }

  // Email validation - RFC 5322 simplified
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  if (!data.company?.trim()) {
    return { valid: false, error: 'Company name is required' };
  }

  if (data.industry_id <= 0) {
    return { valid: false, error: 'Please select an industry' };
  }

  // Phone validation (basic - at least 7 digits)
  if (data.phone && data.phone.trim().length > 0) {
    const phoneDigits = data.phone.replace(/\D/g, '');
    if (phoneDigits.length < 7) {
      return { valid: false, error: 'Phone number must have at least 7 digits' };
    }
  }

  // Zip code validation (basic - at least 3 characters)
  if (data.zip_code?.trim() && data.zip_code.length < 3) {
    return { valid: false, error: 'Zip code must be at least 3 characters' };
  }

  return { valid: true };
};

// ============ HELPER: GET CHANGED FIELDS ============
/**
 * Compare old and new data to identify what changed
 * Useful for tracking updates or partial sends
 */
export const getChangedFields = (
  oldData: UpdateProfileRequest,
  newData: UpdateProfileRequest
): Partial<UpdateProfileRequest> => {
  const changed: Partial<UpdateProfileRequest> = {};

  (Object.keys(newData) as (keyof UpdateProfileRequest)[]).forEach((key) => {
    if (oldData[key] !== newData[key]) {
      (changed as any)[key] = newData[key];
    }
  });

  return changed;
};

// ============ HELPER: BUILD PROFILE REQUEST ============
/**
 * Build profile update request from component state
 * Converts component form fields into API request format
 */
export const buildProfileRequest = (
  firstName: string,
  lastName: string,
  email: string,
  company: string,
  department: string,
  industryId: number,
  phone: string,
  address: string,
  city: string,
  state: string,
  zipCode: string
): UpdateProfileRequest => {
  return {
    first_name: firstName,
    last_name: lastName,
    email: email,
    company: company,
    department: department,
    industry_id: industryId,
    phone: phone,
    address: address,
    city: city,
    state: state,
    zip_code: zipCode,
  };
};

// ============ HELPER: FORMAT ERROR MESSAGE ============
/**
 * Extract user-friendly error message from API response
 * Handles different error response formats from backend
 */
export const formatErrorMessage = (error: any): string => {
  // Direct message from API
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // Validation errors object
  if (error?.response?.data?.errors) {
    const errors = error.response.data.errors;
    const firstError = Object.values(errors)[0];
    if (Array.isArray(firstError)) {
      return firstError[0] as string;
    }
    return JSON.stringify(firstError);
  }

  // Axios error message
  if (error?.message) {
    return error.message;
  }

  // Default fallback
  return 'Failed to update profile. Please try again.';
};

// ============ HELPER: GET ERROR STATUS ============
/**
 * Get HTTP status code from error
 * Useful for conditional error handling
 */
export const getErrorStatus = (error: any): number | null => {
  return error?.response?.status || null;
};

// ============ HELPER: IS VALIDATION ERROR ============
/**
 * Check if error is a validation error (422)
 */
export const isValidationError = (error: any): boolean => {
  return getErrorStatus(error) === 422;
};

// ============ HELPER: IS NETWORK ERROR ============
/**
 * Check if error is a network error
 */
export const isNetworkError = (error: any): boolean => {
  return !error?.response;
};