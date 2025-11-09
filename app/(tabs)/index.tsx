import { useDashboard } from '@/api/dashboard/useDashboard';
import { TabHeader } from '@/components/TabHeader';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DashboardHome = () => {
  const router = useRouter();
  const { data: dashboardData, isLoading, error, refetch, isFetching } = useDashboard();

  // Get stats cards from API data
  const getStatsCards = () => {
    if (!dashboardData?.cards) return [];

    return [
      {
        id: 1,
        title: 'Active',
        subtitle: 'Reminders',
        value: dashboardData.cards.active.toString(),
        color: '#10B981',
        gradientColors: ['#10B981', '#059669'],
        icon: 'checkmark-circle',
        filter: 'active',
        fullWidth: true,
      },
      {
        id: 2,
        title: 'Expiring',
        subtitle: 'Within 30 days',
        value: dashboardData.cards.expiring.toString(),
        color: '#F59E0B',
        gradientColors: ['#F59E0B', '#D97706'],
        icon: 'alert-circle',
        filter: 'expiring',
        fullWidth: false,
      },
      {
        id: 3,
        title: 'Total',
        subtitle: 'Reminders',
        value: dashboardData.cards.reminders.toString(),
        color: '#6366F1',
        gradientColors: ['#6366F1', '#4F46E5'],
        icon: 'apps',
        filter: 'all',
        fullWidth: false,
      },
      {
        id: 4,
        title: 'Inactive',
        subtitle: 'Reminders',
        value: dashboardData.cards.inactive.toString(),
        color: '#06B6D4',
        gradientColors: ['#06B6D4', '#0891B2'],
        icon: 'ban',
        filter: 'inactive',
        fullWidth: false,
      },
      {
        id: 5,
        title: 'Expired',
        subtitle: 'Reminders',
        value: dashboardData.cards.expired.toString(),
        color: '#EF4444',
        gradientColors: ['#EF4444', '#DC2626'],
        icon: 'close-circle',
        filter: 'expired',
        fullWidth: false,
      },
    ];
  };

  // Build contract reminder data from API response
  const getContractReminderData = () => {
    if (!dashboardData?.tables.reminders) return [];

    const remindersTable = dashboardData.tables.reminders;
    const colorMap = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6'];
    const iconMap = ['alert-circle', 'time', 'calendar', 'calendar-outline'];

    return remindersTable.headers.map((header, index) => ({
      label: header,
      sublabel: `Category ${index + 1}`,
      reminders: remindersTable.reminders[index],
      payments: `$${remindersTable.payments[index].toFixed(2)}`,
      depreciation: `$${remindersTable.depreciation[index].toFixed(2)}`,
      color: colorMap[index],
      icon: iconMap[index],
    }));
  };

  // Build payment stats from API response
  const getPaymentStats = () => {
    if (!dashboardData?.tables.payments) return [];

    const paymentTable = dashboardData.tables.payments;

    return [
      {
        label: 'Current Monthly Payments',
        value: `$${paymentTable.payments_monthly.toFixed(2)}`,
        icon: 'cash-outline',
      },
      {
        label: 'Spending Annualized',
        value: `$${paymentTable.payments_annually.toFixed(2)}`,
        icon: 'trending-up-outline',
      },
      {
        label: 'Current Monthly Depreciation',
        value: `$${paymentTable.depreciation_monthly.toFixed(2)}`,
        icon: 'analytics-outline',
      },
      {
        label: 'Depreciation Annualized',
        value: `$${paymentTable.depreciation_annually.toFixed(2)}`,
        icon: 'stats-chart-outline',
      },
    ];
  };

  const handleCardPress = (filter: string) => {
    // Navigate to reminder tab with filter parameter
    router.push({
      pathname: '/(tabs)/reminder',
      params: { filter },
    });
  };

  const handleRefresh = () => {
    refetch();
  };

  // ============ LOADING STATE ============
  if (isLoading) {
    return (
      <View style={styles.container}>
        <TabHeader title='Dashboard' subtitle='Contract Overview' />

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9A1B2B" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  // ============ ERROR STATE ============
  if (error) {
    return (
      <View style={styles.container}>
        <TabHeader title='Dashboard' subtitle='Contract Overview' />

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Failed to load dashboard</Text>
          <Text style={styles.errorSubtext}>{error.message || 'Please try again'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============ NO DATA STATE ============
  if (!dashboardData) {
    return (
      <View style={styles.container}>
        <TabHeader title='Dashboard' subtitle='Contract Overview' />

        <View style={styles.errorContainer}>
          <Ionicons name="folder-open-outline" size={48} color="#9A1B2B" />
          <Text style={styles.errorText}>No data available</Text>
          <Text style={styles.errorSubtext}>Please try refreshing</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============ SUCCESS STATE - Render Dashboard ============
  const statsCards = getStatsCards();
  const contractReminderData = getContractReminderData();
  const paymentStats = getPaymentStats();

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
       <TabHeader title='Dashboard' subtitle='Contract Overview' />

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={handleRefresh}
            tintColor="#9A1B2B"
          />
        }
      >
        {/* Stats Cards Section */}
        <View style={styles.statsSection}>
          {statsCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.statCard,
                card.fullWidth && styles.statCardFullWidth,
              ]}
              onPress={() => handleCardPress(card.filter)}
              activeOpacity={0.8}
            >
              <View style={styles.statCardContent}>
                <View style={styles.statCardRow}>
                  <View style={styles.statRightContent}>
                    <Text style={styles.statValue}>{card.value}</Text>
                  </View>
                  <View
                    style={[
                      styles.statIconContainer,
                      { backgroundColor: card.color + '15' },
                    ]}
                  >
                    <Ionicons name={card.icon as any} size={24} color={card.color} />
                  </View>
                </View>
                <View>
                  <Text style={styles.statLabel}>
                    {card.title} {card.subtitle}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contract Status Cards Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Contract Reminder Status</Text>
        </View>

        <View style={styles.contractCards}>
          {contractReminderData.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.contractCard}
              activeOpacity={0.8}
            >
              <View style={styles.contractCardHeader}>
                <View
                  style={[
                    styles.contractIconBox,
                    { backgroundColor: item.color + '15' },
                  ]}
                >
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <View style={styles.contractCardInfo}>
                  <Text style={styles.contractLabel}>{item.label}</Text>
                  <Text style={styles.contractSublabel}>{item.sublabel}</Text>
                </View>
              </View>
              <View style={styles.contractCardFooter}>
                <View style={styles.contractMetric}>
                  <Text style={styles.contractMetricLabel}>Total Reminders</Text>
                  <Text style={styles.contractMetricValue}>{item.reminders}</Text>
                </View>
                <View style={styles.contractDivider} />
                <View style={styles.contractMetric}>
                  <Text style={styles.contractMetricLabel}>Total Payments</Text>
                  <Text style={styles.contractMetricValue}>{item.payments}</Text>
                </View>
                <View style={styles.contractDivider} />
                <View style={styles.contractMetric}>
                  <Text style={styles.contractMetricLabel}>Total Depreciation</Text>
                  <Text style={styles.contractMetricValue}>{item.depreciation}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment Overview Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payment Status</Text>
        </View>

        <View style={styles.paymentCard}>
          {paymentStats.map((stat, index) => (
            <View key={index}>
              <View style={styles.paymentItem}>
                <View style={styles.paymentLeft}>
                  <View style={styles.paymentIconBox}>
                    <Ionicons name={stat.icon as any} size={20} color="#9A1B2B" />
                  </View>
                  <Text style={styles.paymentLabel}>{stat.label}</Text>
                </View>
                <Text style={styles.paymentValue}>{stat.value}</Text>
              </View>
              {index < paymentStats.length - 1 && (
                <View style={styles.paymentDivider} />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  statsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statCardFullWidth: {
    width: '100%',
  },
  statCardContent: {
    flexDirection: 'column',
    gap: 12,
  },
  statCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statRightContent: {
    alignItems: 'flex-end',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'left',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  contractCards: {
    gap: 12,
    marginBottom: 28,
  },
  contractCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  contractCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  contractIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contractCardInfo: {
    flex: 1,
  },
  contractLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  contractSublabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  contractCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  contractMetric: {
    flex: 1,
    alignItems: 'center',
  },
  contractMetricLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  contractMetricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  contractDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#9A1B2B10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  paymentValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  paymentDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
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

export default DashboardHome;