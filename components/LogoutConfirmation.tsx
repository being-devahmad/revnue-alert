
import { useLogout } from '@/api/auth/useLogout';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface LogoutConfirmationProps {
  visible: boolean;
  onClose: () => void;
  onLogoutSuccess: () => void;
}

const LogoutConfirmation: React.FC<LogoutConfirmationProps> = ({
  visible,
  onClose,
  onLogoutSuccess,
}) => {
  // ============ STATE ============
  const { mutate: logout, isPending, error } = useLogout();
  const [showError, setShowError] = useState(false);

  const navigation = useNavigation();

  // ============ HANDLERS ============
  const handleLogoutPress = async () => {
    console.log('🚪 Logout button pressed');
    
    logout(undefined, {
      onSuccess: async (data) => {
        console.log('✅ Logout successful:', data.message);
        
        // Show success message
        Alert.alert('Logged Out', 'You have been successfully logged out.', [
          {
            text: 'OK',
            onPress: () => {
              // Close modal
              onClose();
              // Trigger redirect after a short delay
              setTimeout(() => {
                onLogoutSuccess();
              }, 500);
            },
          },
        ]);
      },
      onError: (error: any) => {
        console.error('❌ Logout failed:', error.message);
        
        // Even on error, we should logout locally and redirect
        setShowError(true);
        
        setTimeout(() => {
          Alert.alert(
            'Logged Out',
            'You have been logged out. Please log in again.',
            [
              {
                text: 'OK',
                onPress: () => {
                  onClose();
                  setTimeout(() => {
                    onLogoutSuccess();
                  }, 500);
                },
              },
            ]
          );
        }, 1000);
      },
    });
  };

  const handleCancel = () => {
    console.log('❌ Logout cancelled');
    setShowError(false);
    onClose();
  };

  // ============ RENDER ============
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <LinearGradient
            colors={['#9A1B2B', '#6B1420']}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.iconContainer}>
              <View style={styles.iconBox}>
                <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.title}>Logout</Text>
            <Text style={styles.subtitle}>Are you sure?</Text>
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.message}>
              You are about to log out of your account. You can log back in anytime.
            </Text>

            {/* Error Message */}
            {showError && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>
                  {error?.message || 'An error occurred during logout'}
                </Text>
              </View>
            )}

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={18} color="#3B82F6" />
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>Your data is safe</Text>
                <Text style={styles.infoSubtext}>
                  All your contracts and settings will be preserved when you log back in.
                </Text>
              </View>
            </View>

            {/* Loading Indicator */}
            {isPending && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#9A1B2B" />
                <Text style={styles.loadingText}>Logging out...</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.cancelButton, isPending && styles.buttonDisabled]}
                onPress={handleCancel}
                disabled={isPending}
              >
                <Ionicons name="close" size={18} color="#6B7280" />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.logoutButton, isPending && styles.buttonDisabled]}
                onPress={handleLogoutPress}
                disabled={isPending}
              >
                {isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.logoutButtonText}>Logout</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer Text */}
            <Text style={styles.footerText}>
              Signing out will end your current session.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ============ STYLES ============
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 12,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  content: {
    padding: 24,
  },
  message: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 10,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
    gap: 10,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 2,
  },
  infoSubtext: {
    fontSize: 12,
    color: '#1E3A8A',
    lineHeight: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B7280',
  },
  logoutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
  },
});

export default LogoutConfirmation;