
import axiosInstance from '@/utils/axios';
import { useMutation } from '@tanstack/react-query';

// ============ TYPE DEFINITIONS ============
export interface UpdatePasswordRequest {
  password_old: string;
  password: string;
  password_confirmation: string;
}

export interface UpdatePasswordResponse {
  status: boolean;
  message: string;
  data?: {
    user_id: number;
    email: string;
    message: string;
  };
}

export interface PasswordError {
  field?: string;
  message: string;
}

// ============ VALIDATION ============
export const validatePassword = (password: string): PasswordError | null => {
  if (!password) {
    return { field: 'password', message: 'Password is required' };
  }

  if (password.length < 8) {
    return { field: 'password', message: 'Password must be at least 8 characters' };
  }

  // Check for uppercase
  if (!/[A-Z]/.test(password)) {
    return { field: 'password', message: 'Password must contain at least one uppercase letter' };
  }

  // Check for lowercase
  if (!/[a-z]/.test(password)) {
    return { field: 'password', message: 'Password must contain at least one lowercase letter' };
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    return { field: 'password', message: 'Password must contain at least one number' };
  }

  return null;
};

export const validatePasswordChange = (
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): PasswordError | null => {
  // Check current password
  if (!currentPassword) {
    return { field: 'password_old', message: 'Current password is required' };
  }

  // Check new password
  if (!newPassword) {
    return { field: 'password', message: 'New password is required' };
  }

  if (!confirmPassword) {
    return { field: 'password_confirmation', message: 'Password confirmation is required' };
  }

  // Check if passwords match
  if (newPassword !== confirmPassword) {
    return { field: 'password_confirmation', message: 'Passwords do not match' };
  }

  // Check if new password is same as old
  if (currentPassword === newPassword) {
    return { field: 'password', message: 'New password must be different from current password' };
  }

  // Validate new password strength
  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    return passwordError;
  }

  return null;
};

// ============ FETCH PASSWORD UPDATE ============
const updatePassword = async (
  data: UpdatePasswordRequest
): Promise<UpdatePasswordResponse> => {
  try {
    console.log('🔐 Updating password...');

    // Validate before sending
    const validationError = validatePasswordChange(
      data.password_old,
      data.password,
      data.password_confirmation
    );

    if (validationError) {
      throw new Error(validationError.message);
    }

    const response = await axiosInstance.post<UpdatePasswordResponse>(
      '/update-password',
      {
        password_old: data.password_old,
        password: data.password,
        password_confirmation: data.password_confirmation,
      }
    );

    console.log('✅ Password updated successfully:', {
      status: response.data.status,
      message: response.data.message,
    });

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to update password');
    }

    return response.data;
  } catch (error: any) {
    console.error('❌ Error updating password:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    // Parse error message from API
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    if (error.response?.status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    }

    if (error.response?.status === 422) {
      const errors = error.response.data?.errors;
      if (errors) {
        const errorMessages = Object.values(errors)
          .flat()
          .join(', ');
        throw new Error(errorMessages);
      }
    }

    throw error;
  }
};

// ============ USE UPDATE PASSWORD HOOK ============
export const useUpdatePassword = () => {
  return useMutation({
    mutationFn: updatePassword,
    onSuccess: (data) => {
      console.log('✅ Password change mutation success');
    },
    onError: (error: any) => {
      console.error('❌ Password change mutation error:', error.message);
    },
  });
};

// ============ HELPER: GET PASSWORD STRENGTH ============
export const getPasswordStrength = (password: string): {
  strength: 'weak' | 'fair' | 'good' | 'strong';
  score: number;
  tips: string[];
} => {
  let score = 0;
  const tips: string[] = [];

  if (password.length >= 8) {
    score += 1;
  } else {
    tips.push('At least 8 characters');
  }

  if (password.length >= 12) {
    score += 1;
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    tips.push('Add lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    tips.push('Add uppercase letters');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    tips.push('Add numbers');
  }

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  } else {
    tips.push('Add special characters');
  }

  let strength: 'weak' | 'fair' | 'good' | 'strong';
  if (score <= 2) {
    strength = 'weak';
  } else if (score <= 3) {
    strength = 'fair';
  } else if (score <= 4) {
    strength = 'good';
  } else {
    strength = 'strong';
  }

  return { strength, score, tips };
};