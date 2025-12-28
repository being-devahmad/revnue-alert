import { formatDeleteErrorMessage, useDeleteAccount } from '@/api/settings/useDeleteAccount';
import LogoutConfirmation from '@/components/LogoutConfirmation';
import { TabHeader } from '@/components/TabHeader';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

const SettingsScreen = () => {
  const router = useRouter();

  // ============ STATE ============
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // ============ API HOOKS ============
  const deleteAccountMutation = useDeleteAccount();

  // ============ SETTINGS DATA ============
  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          id: 'account-settings',
          label: 'Account Settings',
          sublabel: 'Manage your account details',
          icon: 'person-circle-outline',
          color: '#9A1B2B',
          hasNavigation: true,
          screen: 'AccountSettings',
          navigationPath: '/screens/AccountSettings',
        },
        {
          id: 'billing',
          label: 'Billing',
          sublabel: 'Manage subscription plans',
          icon: 'wallet-outline',
          color: '#9A1B2B',
          hasNavigation: true,
          screen: 'Billing',
          navigationPath: '/screens/Billing',
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help-center',
          label: 'Help Center',
          sublabel: 'FAQs and support',
          icon: 'help-circle-outline',
          color: '#6366F1',
          hasNavigation: false,
          screen: 'HelpCenter',
        },
        {
          id: 'feedback',
          label: 'Send Feedback',
          sublabel: 'Share your thoughts',
          icon: 'chatbubble-outline',
          color: '#EC4899',
          hasNavigation: false,
          screen: 'Feedback',
        },
        {
          id: 'about',
          label: 'About',
          sublabel: 'Version 1.0.0',
          icon: 'information-circle-outline',
          color: '#14B8A6',
          hasNavigation: false,
          screen: 'About',
        },
      ],
    },
    {
      title: 'Account Actions',
      items: [
        {
          id: 'delete-account',
          label: 'Delete Account',
          sublabel: 'Permanently delete your account',
          icon: 'trash-outline',
          color: '#DC2626',
          hasNavigation: false,
          isDestructive: true,
        },
        {
          id: 'logout',
          label: 'Logout',
          sublabel: 'Sign out of your account',
          icon: 'log-out-outline',
          color: '#EF4444',
          hasNavigation: false,
          isDestructive: true,
        },
      ],
    },
  ];

  // ============ HANDLERS ============
  const handleItemPress = (item: any) => {
    if (item.hasNavigation && item.navigationPath) {
      // ⭐ Use navigationPath if available
      console.log(`📍 Navigating to ${item.label}`);
      console.log(`🔗 Navigation path: ${item.navigationPath}`);

      router.push(item.navigationPath as any);
    } else if (item.id === 'delete-account') {
      // Show delete account confirmation
      console.log('🗑️ Delete account requested');
      setShowDeleteConfirmation(true);
    } else if (item.id === 'logout') {
      // Show logout confirmation
      console.log('🚪 Logout requested');
      setShowLogoutConfirmation(true);
    } else if (
      settingsSections
        .find((section) => section.title === 'Support')
        ?.items.includes(item)
    ) {
      // Show popup for support items
      console.log(`ℹ️ ${item.label} not available`);
      setPopupMessage(`${item.label} is not available`);
      setIsPopupVisible(true);
    }
  };

  const closePopup = () => {
    setIsPopupVisible(false);
    setPopupMessage('');
  };

  const handleLogoutSuccess = () => {
    console.log('✅ User logged out successfully');
    setShowLogoutConfirmation(false);

    // Redirect to login screen
    router.replace('/(auth)/login' as any);
  };

  const handleDeleteAccount = async () => {
    try {
      console.log('🗑️ Deleting account...');

      await deleteAccountMutation.mutateAsync();

      console.log('✅ Account deleted successfully');
      setShowDeleteConfirmation(false);

      // Show success message
      Alert.alert(
        'Account Deleted',
        'Your account has been deleted successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Redirect to login screen
              router.replace('/(auth)/login' as any);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Failed to delete account:', error);
      setShowDeleteConfirmation(false);

      // Show error message
      Alert.alert(
        'Error',
        formatDeleteErrorMessage(error),
        [{ text: 'OK' }]
      );
    }
  };

  // ============ RENDER ============
  return (
    <View style={styles.container}>
      {/* Header */}
      <TabHeader title='Settings' subtitle='Manage your preferences' />

      {/* Scroll Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.settingsCard}>
              {section.items.map((item, itemIndex) => (
                <View key={item.id}>
                  <TouchableOpacity
                    style={styles.settingItem}
                    onPress={() => handleItemPress(item)}
                    activeOpacity={0.7}
                    disabled={item.hasToggle}
                  >
                    <View style={styles.settingLeft}>
                      {/* Icon */}
                      <View
                        style={[
                          styles.iconBox,
                          { backgroundColor: item.color + '15' },
                        ]}
                      >
                        <Ionicons
                          name={item.icon as any}
                          size={22}
                          color={item.color}
                        />
                      </View>

                      {/* Text */}
                      <View style={styles.settingInfo}>
                        <Text
                          style={[
                            styles.settingLabel,
                            item.isDestructive && styles.destructiveLabel,
                          ]}
                        >
                          {item.label}
                        </Text>
                        <Text style={styles.settingSublabel}>
                          {item.sublabel}
                        </Text>
                      </View>
                    </View>

                    {/* Right Content */}
                    <View style={styles.settingRight}>
                      {item.hasToggle && item.onToggle && (
                        <Switch
                          value={item.toggleValue}
                          onValueChange={item.onToggle}
                          trackColor={{ false: '#D1D5DB', true: '#9A1B2B' }}
                          thumbColor={
                            item.toggleValue ? '#FFFFFF' : '#F3F4F6'
                          }
                          ios_backgroundColor="#D1D5DB"
                        />
                      )}
                      {item.hasNavigation && (
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color="#9CA3AF"
                        />
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Divider */}
                  {itemIndex < section.items.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Popup Modal - Feature Unavailable */}
      <Modal
        visible={isPopupVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closePopup}
      >
        <View style={styles.popupOverlay}>
          <View style={styles.popupContainer}>
            <LinearGradient
              colors={['#9A1B2B', '#6B1420']}
              style={styles.popupHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.popupTitle}>Feature Unavailable</Text>
            </LinearGradient>
            <View style={styles.popupContent}>
              <Text style={styles.popupMessage}>{popupMessage}</Text>
              <TouchableOpacity
                style={styles.popupButton}
                onPress={closePopup}
              >
                <Text style={styles.popupButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmation
        visible={showLogoutConfirmation}
        onClose={() => setShowLogoutConfirmation(false)}
        onLogoutSuccess={handleLogoutSuccess}
      />

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteConfirmation}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirmation(false)}
      >
        <View style={styles.popupOverlay}>
          <View style={styles.popupContainer}>
            <LinearGradient
              colors={['#DC2626', '#991B1B']}
              style={styles.popupHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.popupTitle}>Delete Account</Text>
            </LinearGradient>
            <View style={styles.popupContent}>
              <Text style={styles.deleteWarningText}>
                ⚠️ This action cannot be undone!
              </Text>
              <Text style={styles.popupMessage}>
                Are you sure you want to permanently delete your account? All your data will be lost.
              </Text>

              <View style={styles.deleteButtonContainer}>
                <TouchableOpacity
                  style={styles.cancelDeleteButton}
                  onPress={() => setShowDeleteConfirmation(false)}
                  disabled={deleteAccountMutation.isPending}
                >
                  <Text style={styles.cancelDeleteButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmDeleteButton,
                    deleteAccountMutation.isPending && styles.confirmDeleteButtonDisabled,
                  ]}
                  onPress={handleDeleteAccount}
                  disabled={deleteAccountMutation.isPending}
                >
                  {deleteAccountMutation.isPending ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.confirmDeleteButtonText}>Delete Account</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerContainer: {
    overflow: 'hidden',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  destructiveLabel: {
    color: '#EF4444',
  },
  settingSublabel: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  settingRight: {
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 74,
  },
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  popupHeader: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  popupContent: {
    padding: 20,
    alignItems: 'center',
  },
  popupMessage: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  popupButton: {
    backgroundColor: '#9A1B2B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  popupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteWarningText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 12,
  },
  deleteButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelDeleteButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  cancelDeleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  confirmDeleteButtonDisabled: {
    opacity: 0.6,
  },
  confirmDeleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default SettingsScreen;