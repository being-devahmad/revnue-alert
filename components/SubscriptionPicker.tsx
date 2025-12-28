import {
  formatPrice,
  getMonthlyProduct,
  sortPlansByTier,
  useGetPlansV2
} from '@/api/settings/useGetPlansv2';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface SubscriptionPickerProps {
  visible: boolean;
  selectedValue: string;
  onSelect: (planCode: string, planName: string) => void;
  onClose: () => void;
}

export const SubscriptionPicker = ({
  visible,
  selectedValue,
  onSelect,
  onClose,
}: SubscriptionPickerProps) => {
  const { data: plansData, isLoading } = useGetPlansV2();

  const plans = plansData?.data ? sortPlansByTier(plansData.data) : [];
  console.log('plans---------->', plans);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.pickerOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.pickerContainer}>
          {/* Header */}
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerHeaderText}>Select Plan</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Loading State */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#9A1B2B" />
              <Text style={styles.loadingText}>Loading plans...</Text>
            </View>
          )}

          {/* Picker Options */}
          {!isLoading && plans.length > 0 && (
            <View>
              {plans.map((plan) => {
                const monthlyProduct = getMonthlyProduct(plan);
                const isSelected = selectedValue === plan.code;

                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.pickerOption,
                      isSelected && styles.pickerOptionSelected,
                    ]}
                    onPress={() => {
                      onSelect(plan.code, plan.name);
                      onClose();
                    }}
                  >
                    <View style={styles.planInfo}>
                      <Text
                        style={[
                          styles.planNameText,
                          isSelected && styles.planNameTextSelected,
                        ]}
                      >
                        {plan.name}
                      </Text>
                      {monthlyProduct && (
                        <Text style={styles.planPriceText}>
                          {formatPrice(monthlyProduct.price, monthlyProduct.currency)}/mo
                        </Text>
                      )}
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color="#9A1B2B" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Empty State */}
          {!isLoading && plans.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="alert-circle-outline" size={40} color="#9CA3AF" />
              <Text style={styles.emptyText}>No plans available</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    minWidth: 300,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerOptionSelected: {
    backgroundColor: 'rgba(154, 27, 43, 0.08)',
  },
  planInfo: {
    flex: 1,
  },
  planNameText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 2,
  },
  planNameTextSelected: {
    color: '#9A1B2B',
    fontWeight: '700',
  },
  planPriceText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});