import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export interface Industry {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

interface SearchableIndustryDropdownProps {
  industries: Industry[];
  selectedIndustry: Industry | null;
  onSelect: (industry: Industry) => void;
  isLoading?: boolean;
  disabled?: boolean;
  isLocked?: boolean;
}

/**
 * Professional Searchable Industry Dropdown Component
 * 
 * Features:
 * - Search/filter industries by name
 * - Modal-based dropdown for better UX
 * - Blurred background (with Android optimization)
 * - Smooth animations
 * - Professional styling
 * - Keyboard responsive
 * - Accessibility support
 * - Locked state support
 * 
 * Blur Optimization:
 * - iOS: expo-blur with intensity 90
 * - Android: Dark overlay + semi-transparent background for better effect
 */
export const SearchableIndustryDropdown: React.FC<SearchableIndustryDropdownProps> = ({
  industries,
  selectedIndustry,
  onSelect,
  isLoading = false,
  disabled = false,
  isLocked = false,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isAndroid = Platform.OS === 'android';
  const isIOS = Platform.OS === 'ios';

  // Filter industries based on search query
  const filteredIndustries = useMemo(() => {
    if (!searchQuery.trim()) return industries;

    const query = searchQuery.toLowerCase();
    return industries.filter((industry) =>
      industry.name.toLowerCase().includes(query)
    );
  }, [industries, searchQuery]);

  const handleSelect = (industry: Industry) => {
    // Prevent selection if locked
    if (isLocked) return;
    
    onSelect(industry);
    setIsModalVisible(false);
    setSearchQuery('');
  };

  // ============ ANDROID BLUR OPTIMIZATION ============
  // For Android, we use a semi-transparent dark overlay since expo-blur doesn't work as well
  const renderBlurContainer = (content: React.ReactNode) => {
    if (isIOS) {
      // iOS: Use expo-blur for better visual effect
      return (
        <BlurView intensity={85} style={styles.blurContainer}>
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setIsModalVisible(false)}
          />
          {content}
        </BlurView>
      );
    } else {
      // Android: Use dark overlay for better effect
      return (
        <View style={styles.androidBlurContainer}>
          <TouchableOpacity
            style={styles.androidOverlay}
            activeOpacity={1}
            onPress={() => setIsModalVisible(false)}
          />
          {content}
        </View>
      );
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <TouchableOpacity
        style={[
          styles.triggerButton,
          (disabled || isLocked) && styles.triggerButtonDisabled,
          isLocked && styles.triggerButtonLocked,
        ]}
        onPress={() => !disabled && !isLocked && setIsModalVisible(true)}
        disabled={disabled || isLocked}
        activeOpacity={0.7}
      >
        <View style={styles.triggerContent}>
          <Ionicons
            name="briefcase-outline"
            size={20}
            color={disabled || isLocked ? '#9CA3AF' : '#800000'}
          />
          <Text style={[styles.triggerText, !selectedIndustry && styles.triggerPlaceholder]}>
            {selectedIndustry?.name || 'Select your industry'}
          </Text>
          {isLocked && (
            <Ionicons name="lock-closed" size={16} color="#10B981" />
          )}
        </View>
        {!isLocked && (
          <Ionicons
            name={isModalVisible ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={disabled ? '#9CA3AF' : '#800000'}
          />
        )}
      </TouchableOpacity>

      {/* Modal Dropdown with Blur Background */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        {renderBlurContainer(
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Industry</Text>
                <TouchableOpacity
                  onPress={() => setIsModalVisible(false)}
                  hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                >
                  <Ionicons name="close" size={24} color="#1F2937" />
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search industries..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                  clearButtonMode="while-editing"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  >
                    <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Industries List */}
              {filteredIndustries.length > 0 ? (
                <FlatList
                  data={filteredIndustries}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      style={[
                        styles.industryItem,
                        index === filteredIndustries.length - 1 && styles.industryItemLast,
                        selectedIndustry?.id === item.id && styles.industryItemSelected,
                      ]}
                      onPress={() => handleSelect(item)}
                      activeOpacity={0.7}
                      disabled={isLocked && selectedIndustry?.id === item.id}
                    >
                      <View style={styles.industryContent}>
                        <Ionicons
                          name="business"
                          size={18}
                          color={selectedIndustry?.id === item.id ? '#800000' : '#6B7280'}
                        />
                        <Text
                          style={[
                            styles.industryName,
                            selectedIndustry?.id === item.id && styles.industryNameSelected,
                          ]}
                        >
                          {item.name}
                        </Text>
                      </View>
                      <View style={styles.selectionIndicator}>
                        {selectedIndustry?.id === item.id && (
                          <Ionicons name="checkmark-circle" size={20} color="#800000" />
                        )}
                        {isLocked && selectedIndustry?.id === item.id && (
                          <Ionicons name="lock-closed" size={16} color="#10B981" />
                        )}
                      </View>
                    </TouchableOpacity>
                  )}
                  scrollEnabled
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyText}>No industries found</Text>
                  <Text style={styles.emptySubtext}>
                    Try a different search term
                  </Text>
                </View>
              )}

              {/* Footer Note */}
              <View style={styles.modalFooter}>
                <Text style={styles.footerText}>
                  {filteredIndustries.length} of {industries.length} industries
                </Text>
              </View>
            </View>
          </SafeAreaView>
        )}
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // ============ BLUR CONTAINER (iOS) ============
  blurContainer: {
    flex: 1,
  },

  // ============ ANDROID BLUR CONTAINER ============
  androidBlurContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Darker overlay for Android
  },

  // ============ OVERLAY ============
  overlay: {
    flex: 1,
  },
  androidOverlay: {
    flex: 1,
    opacity: 0.3, // Additional semi-transparent layer
  },

  // ============ TRIGGER BUTTON ============
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  triggerButtonDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  triggerButtonLocked: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  triggerText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  triggerPlaceholder: {
    color: '#9CA3AF',
  },

  // ============ LOCKED BADGE ============
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: '#10B981',
  },
  lockedBadgeText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },

  // ============ MODAL CONTAINER ============
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    height: 500,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%', // ⬆️ INCREASED from 90% to 85% to give more content space
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },

  // ============ MODAL HEADER ============
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },

  // ============ SEARCH BAR ============
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },

  // ============ INDUSTRIES LIST ============
  industryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  industryItemLast: {
    marginBottom: 0,
  },
  industryItemSelected: {
    backgroundColor: '#FFFBF5',
    borderColor: '#800000',
  },
  industryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  selectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  industryName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4B5563',
    flex: 1,
  },
  industryNameSelected: {
    color: '#800000',
    fontWeight: '600',
  },

  // ============ EMPTY STATE ============
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
  },

  // ============ MODAL FOOTER ============
  modalFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '500',
  },
});