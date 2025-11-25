import { useCompleteTask } from '@/api/reminders/timeline-details/useCompleteTask';
import { useResendICal } from '@/api/reminders/timeline-details/useResendiCal';
import { useGetTimelineDetails } from '@/api/reminders/useGetTimelineDetails';
import { TabHeader } from '@/components/TabHeader';
import ContractDetailsTab from '@/components/TimelineDetailsTabs/ContractDetailsTab';
import ReminderDetailsTab from '@/components/TimelineDetailsTabs/ReminderDetailsTab';
import TimelineTab from '@/components/TimelineDetailsTabs/TimelineTab';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ActiveTab = 'timeline' | 'contract' | 'reminder';

interface TabConfig {
  id: ActiveTab;
  label: string;
  icon: string;
}

const TABS: TabConfig[] = [
  { id: 'timeline', label: 'Timeline', icon: 'time-outline' },
  { id: 'contract', label: 'Contract', icon: 'document-outline' },
  { id: 'reminder', label: 'Reminders', icon: 'notifications-outline' },
];

const TimelineDetailsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('timeline');
  const router = useRouter();
  const params = useLocalSearchParams();

  console.log('🔍 TimelineDetailsScreen params:', params);

  // Get contract ID from route params
  const contractId = params.contractId as string;


  // ✅ FETCH FULL TIMELINE DETAILS INCLUDING REMINDERS
  const { data, isLoading, error, refetch } = useGetTimelineDetails(contractId);
  console.log('🔄 useGetTimelineDetails state:', {
    data,
    isLoading,
    error,
  });

  console.log('📦 Fetched data:', {
    hasData: !!data,
    isLoading,
    hasError: !!error,
    contractName: data?.data?.contract?.name,
    remindersCount: data?.data?.contract?.reminders?.length || 0,
  });

  // Extract contract and timeline from API response
  const contract = data?.data?.contract;
  const timeline = data?.data?.timeline;


  const handleEditReminder = () => {
    if (!contract) {
      console.warn('❌ No contract data for reminder edit');
      return;
    }

    console.log('✏️ Editing reminder:', contract.name);

    router.push({
      pathname: '/screens/EditReminder',
      params: {
        contractId: contract.id,
        contractName: contract.name,
      },
    });
  };


  // Resend iCal Hook
  const { mutate: resendICal, isPending } = useResendICal();

  const handleResendIcal = (reminderId: number) => {
    resendICal(reminderId, {
      onSuccess: (response) => {
        Alert.alert(
          "iCal Sent 🎉",
          response.message || "Calendar reminder sent successfully!"
        );
      },

      onError: (error: any) => {
        Alert.alert(
          "Error",
          error.response?.data?.message || error.message || "Something went wrong"
        );
      },
    });
  };


  // Complete task handler

  const { mutate: completeTask, isPending: isCompletingTask } = useCompleteTask();

  const handleCompleteTask = (taskId: number) => {
    console.log("⏳ Completing task:", taskId);

    completeTask(taskId, {
      onSuccess: (response) => {
        Alert.alert(
          "Task Completed 🎉",
          response.message || "Successfully completed task!"
        );

        // Optional: Refresh timeline  
        refetch();
      },
      onError: (error: any) => {
        Alert.alert(
          "Error",
          error?.response?.data?.message || error.message || "Failed to complete task"
        );
      },
    });
  };


  const handleGoBack = () => {
    router.back();
  };

  const handleRetry = () => {
    refetch();
  };

  const renderActiveTab = () => {
    console.log('🎯 Rendering tab:', activeTab);

    switch (activeTab) {
      case 'timeline':
        return (
          <TimelineTab
            timeline={timeline}
            contract={contract}
            isLoading={isLoading}
          />
        );
      case 'contract':
        return (
          <ContractDetailsTab
            contract={contract}
            isLoading={isLoading}
            onEdit={handleEditReminder}
            onCompleteTask={handleCompleteTask}
            isCompletingTask={isCompletingTask}
          />
        );
      case 'reminder':
        return (
          <ReminderDetailsTab
            contract={contract}
            isLoading={isLoading}
            onEdit={handleEditReminder}
            onResendIcal={handleResendIcal}
            isResendingIcal={isPending}
          />
        );
      default:
        return null;
    }
  };

  // Error State
  if (error && !data) {
    console.error('❌ Error loading timeline details:', error);
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={handleGoBack} style={styles.headerBack}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Timeline Details</Text>
          </View>
        </View>

        {/* Error State Content */}
        <SafeAreaView style={styles.contentContainer} edges={['bottom']}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
            <Text style={styles.errorTitle}>Error Loading Details</Text>
            <Text style={styles.errorMessage}>
              {error instanceof Error ? error.message : 'Failed to load timeline details'}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Loading State
  if (isLoading && !data) {
    console.log('⏳ Loading timeline details...');
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={handleGoBack} style={styles.headerBack}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Timeline Details</Text>
          </View>
        </View>

        {/* Loading State Content */}
        <SafeAreaView style={styles.contentContainer} edges={['bottom']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9A1B2B" />
            <Text style={styles.loadingText}>Loading timeline details...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Success State
  console.log('✅ Rendering timeline with contract:', contract?.name);
  return (
    <View style={styles.container}>
      {/* Header */}
      <TabHeader
        title='Timeline Details'
        subtitle={contract ? contract.name : ''}
        isChild={true}
      />

      {/* Tabs Navigation */}
      <View style={styles.tabContainerWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContainer}
          scrollEventThrottle={16}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabButton,
                activeTab === tab.id && styles.activeTabButton,
              ]}
              onPress={() => {
                console.log('📑 Tab switched to:', tab.id);
                setActiveTab(tab.id);
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon as any}
                size={18}
                color={activeTab === tab.id ? '#9A1B2B' : '#9CA3AF'}
                style={styles.tabIcon}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>

              {/* Active indicator bar */}
              {activeTab === tab.id && (
                <View style={styles.activeIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <View style={styles.contentWrapper}>
        {renderActiveTab()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerContainer: {
    backgroundColor: '#9A1B2B',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBack: {
    padding: 6,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tabContainerWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginHorizontal: 4,
    borderRadius: 10,
    position: 'relative',
  },
  activeTabButton: {
    backgroundColor: '#F3F4F6',
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: '#9A1B2B',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#9A1B2B',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentWrapper: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 20,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#9A1B2B',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TimelineDetailsScreen;