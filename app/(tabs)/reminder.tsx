import {
  flattenReminders,
  getDaysLeft,
  getPaginationInfo,
  getStatusBadge,
  getStatusColor,
  ReminderData,
  useReminders,
} from "@/api/reminders/useGetReminders";
import { TabHeader } from "@/components/TabHeader";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const ReminderScreen: React.FC = () => {
  const router = useRouter();
  const { filter } = useLocalSearchParams();
  console.log('filter-->', filter)
  useEffect(() => {
    if (filter) {
      setSelectedFilter(filter.toString());
    }
  }, [filter]);

  // ============ STATE MANAGEMENT ============
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Advanced Filter States
  const [nameFilter, setNameFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [inceptionDate, setInceptionDate] = useState<Date | null>(null);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentInterval, setPaymentInterval] = useState("");
  const [descriptionFilter, setDescriptionFilter] = useState("");
  const [reminderNotesFilter, setReminderNotesFilter] = useState("");

  // Date picker states
  const [showInceptionPicker, setShowInceptionPicker] = useState(false);
  const [showExpirationPicker, setShowExpirationPicker] = useState(false);
  const [showPaymentIntervalDropdown, setShowPaymentIntervalDropdown] =
    useState(false);

  // ============ API INTEGRATION ============
  // Map UI filters to API status filter
  const getApiStatus = (filterValue: string | string[]) => {
    const statusMap: Record<string, any> = {
      all: undefined,
      active: "active",
      expiring: "expiring",
      inactive: "inactive",
      expired: "expired",
    };
    const filterStr = Array.isArray(filterValue) ? filterValue[0] : filterValue;
    return statusMap[filterStr];
  };

  // Build filters for API
  const apiFilters = {
    status: getApiStatus(selectedFilter),
    search: searchQuery || undefined,
    category_id: categoryFilter ? parseInt(categoryFilter) : undefined,
    per_page: 10,
  };

  // Fetch reminders with infinite query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isLoading,
    isError,
    error,
    refetch,
  } = useReminders(apiFilters);

  const activeCount = data?.pages[0]?.data?.tag_counts?.active || 0;
  const expiredCount = data?.pages[0]?.data?.tag_counts?.expired || 0;
  const expiringCount = data?.pages[0]?.data?.tag_counts?.expiring || 0;
  const disabledCount = data?.pages[0]?.data?.tag_counts?.inactive || 0;
  const totalCount = data?.pages[0]?.data?.tag_counts?.total || 0;

  // Flatten and combine all pages
  const allReminders = flattenReminders(data);
  const paginationInfo = getPaginationInfo(data);

  // ============ LOCAL FILTERING ============
  // Apply local filters (name, category, dates, etc.)
  const filteredReminders = allReminders.filter((reminder) => {
    // Advanced name filter
    if (
      nameFilter.trim() &&
      !reminder.name.toLowerCase().includes(nameFilter.toLowerCase())
    ) {
      return false;
    }

    // Advanced category filter
    if (
      categoryFilter.trim() &&
      !reminder.category.name
        .toLowerCase()
        .includes(categoryFilter.toLowerCase())
    ) {
      return false;
    }

    // Advanced description filter
    if (
      descriptionFilter.trim() &&
      !reminder.description
        .toLowerCase()
        .includes(descriptionFilter.toLowerCase())
    ) {
      return false;
    }

    // Advanced notes filter
    if (
      reminderNotesFilter.trim() &&
      !reminder.notes.toLowerCase().includes(reminderNotesFilter.toLowerCase())
    ) {
      return false;
    }

    // Advanced inception date filter
    if (inceptionDate) {
      const reminderInceptionDate = new Date(
        reminder.started_at
      ).toDateString();
      const selectedInceptionDate = inceptionDate.toDateString();
      if (reminderInceptionDate !== selectedInceptionDate) {
        return false;
      }
    }

    // Advanced expiration date filter
    if (expirationDate) {
      const reminderExpirationDate = new Date(
        reminder.expired_at
      ).toDateString();
      const selectedExpirationDate = expirationDate.toDateString();
      if (reminderExpirationDate !== selectedExpirationDate) {
        return false;
      }
    }

    // Advanced payment amount filter
    if (paymentAmount.trim()) {
      const filterAmount = parseFloat(paymentAmount);
      if (reminder.amount !== filterAmount) {
        return false;
      }
    }

    // Advanced payment interval filter
    if (paymentInterval && reminder.interval !== paymentInterval) {
      return false;
    }

    return true;
  });

  // ============ QUICK FILTERS DATA ============
  const filters = [
    { id: "all", label: "All", count: totalCount, icon: "apps" },
    {
      id: "active",
      label: "Active",
      count: '',
      icon: "checkmark-circle",
    },
    {
      id: "expiring",
      label: "Expiring",
      count: '',
      icon: "alert-circle",
    },
    { id: "inactive", label: "Inactive", count: '', icon: "ban" },
    {
      id: "expired",
      label: "Expired",
      count: '',
      icon: "close-circle",
    },
  ];

  const paymentIntervalOptions = [
    "Weekly",
    "Monthly",
    "Semi-Quarterly",
    "Quarterly",
    "Semi-Annually",
    "Annually",
  ];

  // ============ ANIMATIONS ============
  const filterHeight = useRef(new Animated.Value(0)).current;
  const filterOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showAdvancedFilters) {
      Animated.parallel([
        Animated.timing(filterHeight, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(filterOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(filterHeight, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(filterOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [showAdvancedFilters]);

  // ============ HANDLERS ============
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetching) {
      console.log("📜 Loading next page...");
      fetchNextPage();
    }
  }, [hasNextPage, isFetching, fetchNextPage]);

  const handleRefresh = useCallback(() => {
    console.log("🔄 Refreshing reminders...");
    refetch();
  }, [refetch]);

  // ✅ FIXED: Pass contractId to TimelineDetails
  const handleCardPress = (reminder: ReminderData) => {
    console.log("📌 Navigating to timeline for contract ID:", reminder.id);

    router.push({
      pathname: "/screens/TimelineDetails",
      params: {
        // ✅ IMPORTANT: Pass the contract ID for API call
        contractId: reminder.id.toString(),
        reminderName: reminder.name,
        accountNumber: reminder.account_number,
        inceptionDate: reminder.started_at,
        expirationDate: reminder.expired_at,
        paymentAmount: reminder.amount.toString(),
        paymentInterval: reminder.interval,
        lastPaymentDate: reminder.last_payment_at,
        category: reminder.category.name,
        description: reminder.description,
        supplier: reminder.website_email,
        website: reminder.website_email,
        phone: reminder.phone_number,
        status: getStatusBadge(reminder),
        rating: reminder.supplier_rating?.toString(),
        daysLeft: getDaysLeft(reminder.expired_at).toString(),
      },
    });
  };

  const clearFilters = () => {
    setNameFilter("");
    setCategoryFilter("");
    setInceptionDate(null);
    setExpirationDate(null);
    setPaymentAmount("");
    setPaymentInterval("");
    setDescriptionFilter("");
    setReminderNotesFilter("");
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString();
  };

  // ============ RENDER FUNCTIONS ============
  const maxHeight = filterHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 600],
  });

  const renderReminderCard = ({ item: reminder }: { item: ReminderData }) => {
    const daysLeft = getDaysLeft(reminder.expired_at);
    const statusColor = getStatusColor(reminder);
    const statusBadge = getStatusBadge(reminder);

    return (
      <TouchableOpacity
        style={styles.reminderCard}
        onPress={() => handleCardPress(reminder)}
        activeOpacity={0.7}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {reminder.name}
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {reminder.category.name} • {reminder.account_number}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${statusColor}15` },
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: statusColor }]}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusBadge}
            </Text>
          </View>
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          <View style={styles.cardInfoRow}>
            <View style={styles.cardInfo}>
              <Ionicons name="pricetag" size={14} color="#9CA3AF" />
              <Text style={styles.cardInfoText}>
                ${reminder?.amount?.toFixed(2)}
              </Text>
            </View>
            <View style={styles.cardInfo}>
              <Ionicons name="calendar" size={14} color="#9CA3AF" />
              <Text style={styles.cardInfoText}>
                {new Date(reminder.expired_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <View style={styles.cardInfoRow}>
            <View style={styles.cardInfo}>
              <Ionicons name="time" size={14} color="#9CA3AF" />
              <Text style={styles.cardInfoText}>
                {daysLeft >= 0
                  ? `${daysLeft} days left`
                  : `Expired ${Math.abs(daysLeft)} days ago`}
              </Text>
            </View>
            <View style={styles.cardInfo}>
              <Ionicons name="repeat" size={14} color="#9CA3AF" />
              <Text style={styles.cardInfoText}>
                {reminder.interval || "One-time"}
              </Text>
            </View>
          </View>
        </View>

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.cardFooterLeft}>
            <Text style={styles.paymentText}>
              ${reminder?.amount?.toFixed(2)}
            </Text>
          </View>
          <View style={styles.cardFooterRight}>
            {reminder.auto_renew ? (
              <View style={styles.autoRenewBadge}>
                <Ionicons name="refresh" size={12} color="#10b981" />
                <Text style={styles.autoRenewText}>Auto-renew</Text>
              </View>
            ) : (
              <View style={styles.noRenewBadge}>
                <Text style={styles.noRenewText}>No auto-renew</Text>
              </View>
            )}
          </View>
        </View>

        {/* Renew Button for Expired */}
        {reminder?.auto_renew !== 1 && (
          <TouchableOpacity
            style={styles.renewButton}
            onPress={(e) => {
              // e.stopPropagation();
              // handleRenewPress(reminder);
              Alert.alert('This feature isn’t supported in the mobile app yet. To renew your contract, please edit the reminder or use the web portal to complete the renewal.')
            }}
          >
            <Ionicons name="refresh-circle" size={18} color="#FFFFFF" />
            <Text style={styles.renewButtonText}>Renew Contract</Text>
          </TouchableOpacity>
        )}

        {/* Urgent Indicator */}
        {daysLeft < 30 && daysLeft >= 0 && (
          <View style={styles.urgentIndicator} />
        )}
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!isFetching) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="large" color="#9A1B2B" />
        <Text style={styles.loadingText}>Loading more contracts...</Text>
      </View>
    );
  };

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#9A1B2B" />
          <Text style={styles.emptyStateText}>Loading reminders...</Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.emptyStateText}>Error loading reminders</Text>
          <Text style={styles.emptyStateSubtext}>
            {error?.message || "Please try again"}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (filteredReminders.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyStateText}>No reminders found</Text>
          <Text style={styles.emptyStateSubtext}>
            Try adjusting your filters or search query
          </Text>
        </View>
      );
    }

    return null;
  };

  // ============ RENDER ============
  return (
    <View style={styles.container}>
      {/* Header */}

      <TabHeader title="Reminders" subtitle={`${totalCount} contracts`} />

      {/* Search and Filter Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contracts..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.filterButton,
            showAdvancedFilters && styles.filterButtonActive,
          ]}
          onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          <Ionicons
            name="options"
            size={22}
            color={showAdvancedFilters ? "#FFFFFF" : "#6B7280"}
          />
        </TouchableOpacity>
      </View>

      {/* Quick Filters */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {filters.map((filterItem) => (
            <TouchableOpacity
              key={filterItem.id}
              style={[
                styles.filterChip,
                selectedFilter === filterItem.id && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter(filterItem.id)}
            >
              <Ionicons
                name={filterItem.icon as any}
                size={14}
                color={selectedFilter === filterItem.id ? "#FFFFFF" : "#6B7280"}
              />
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === filterItem.id && styles.filterChipTextActive,
                ]}
              >
                {filterItem.label}
              </Text>
              {
                Boolean(filterItem.count) && (
                  <View
                    style={[
                      styles.filterBadge,
                      selectedFilter === filterItem.id && styles.filterBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterBadgeText,
                        selectedFilter === filterItem.id &&
                        styles.filterBadgeTextActive,
                      ]}
                    >
                      {filterItem.count}
                    </Text>
                  </View>
                )
              }
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>


      {/* Advanced Filters */}
      <Animated.View
        style={[
          styles.advancedFiltersContainer,
          {
            maxHeight: maxHeight,
            opacity: filterOpacity,
          },
        ]}
      >
        <View style={styles.advancedFiltersContent}>
          <View style={styles.advancedFiltersHeader}>
            <Text style={styles.advancedFiltersTitle}>Advanced Filters</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filtersScrollView}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              {/* Name Filter */}
              <View style={styles.filterInputGroup}>
                <Text style={styles.filterLabel}>Name</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="search contract name"
                  placeholderTextColor="#9CA3AF"
                  value={nameFilter}
                  onChangeText={setNameFilter}
                />
              </View>

              {/* Category Filter */}
              <View style={styles.filterInputGroup}>
                <Text style={styles.filterLabel}>Category</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="search by categories"
                  placeholderTextColor="#9CA3AF"
                  value={categoryFilter}
                  onChangeText={setCategoryFilter}
                />
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              {/* Description Filter */}
              <View style={styles.filterInputGroup}>
                <Text style={styles.filterLabel}>Description</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="search description"
                  placeholderTextColor="#9CA3AF"
                  value={descriptionFilter}
                  onChangeText={setDescriptionFilter}
                />
              </View>
              {/* Payment Amount Filter */}
              <View style={styles.filterInputGroup}>
                <Text style={styles.filterLabel}>Payment Amount</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="search amount"
                  placeholderTextColor="#9CA3AF"
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              {/* Payment Interval Filter */}
              <View style={styles.filterInputGroup}>
                <Text style={styles.filterLabel}>Payment Interval</Text>
                <TouchableOpacity
                  style={styles.filterInput}
                  onPress={() => setShowPaymentIntervalDropdown(true)}
                >
                  <Text
                    style={
                      paymentInterval ? styles.dateText : styles.datePlaceholder
                    }
                  >
                    {paymentInterval || "search interval"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Inception Date */}
              <View style={styles.filterInputGroup}>
                <Text style={styles.filterLabel}>Inception Date</Text>
                <TouchableOpacity
                  style={styles.filterInput}
                  onPress={() => setShowInceptionPicker(true)}
                >
                  <Text
                    style={
                      inceptionDate ? styles.dateText : styles.datePlaceholder
                    }
                  >
                    {inceptionDate ? formatDate(inceptionDate) : "search date"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              {/* Expiration Date */}
              <View style={styles.filterInputGroup}>
                <Text style={styles.filterLabel}>Expiration Date</Text>
                <TouchableOpacity
                  style={styles.filterInput}
                  onPress={() => setShowExpirationPicker(true)}
                >
                  <Text
                    style={
                      expirationDate ? styles.dateText : styles.datePlaceholder
                    }
                  >
                    {expirationDate
                      ? formatDate(expirationDate)
                      : "search date"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Reminder Notes Filter */}
              <View style={styles.filterInputGroup}>
                <Text style={styles.filterLabel}>Reminder Notes</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="search notes"
                  placeholderTextColor="#9CA3AF"
                  value={reminderNotesFilter}
                  onChangeText={setReminderNotesFilter}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.applyFiltersButton}
            onPress={() => setShowAdvancedFilters(false)}
          >
            <Text style={styles.applyFiltersText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Date Pickers
      {showInceptionPicker && (
        <DateTimePicker
          value={inceptionDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedDate) => {
            setShowInceptionPicker(Platform.OS === "ios");
            if (selectedDate) {
              setInceptionDate(selectedDate);
            }
          }}
        />
      )}

      {showExpirationPicker && (
        <DateTimePicker
          value={expirationDate || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedDate) => {
            setShowExpirationPicker(Platform.OS === "ios");
            if (selectedDate) {
              setExpirationDate(selectedDate);
            }
          }}
        />
      )} */}

      <Modal
        visible={showInceptionPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInceptionPicker(false)}
      >
        <View style={styles.modalOverlayFull}>
          <View style={styles.datePickerContainer}>
            <DateTimePicker
              value={inceptionDate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setInceptionDate(selectedDate);
                }
                if (Platform.OS === "android") {
                  setShowInceptionPicker(false);
                }
              }}
            />
            {Platform.OS === "ios" && (
              <View style={styles.datePickerActions}>
                <TouchableOpacity
                  style={styles.datePickerCancel}
                  onPress={() => setShowInceptionPicker(false)}
                >
                  <Text style={styles.datePickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.datePickerDone}
                  onPress={() => setShowInceptionPicker(false)}
                >
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Expiration Date Picker */}
      <Modal
        visible={showExpirationPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowExpirationPicker(false)}
      >
        <View style={styles.modalOverlayFull}>
          <View style={styles.datePickerContainer}>
            <DateTimePicker
              value={expirationDate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setExpirationDate(selectedDate);
                }
                if (Platform.OS === "android") {
                  setShowExpirationPicker(false);
                }
              }}
            />
            {Platform.OS === "ios" && (
              <View style={styles.datePickerActions}>
                <TouchableOpacity
                  style={styles.datePickerCancel}
                  onPress={() => setShowExpirationPicker(false)}
                >
                  <Text style={styles.datePickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.datePickerDone}
                  onPress={() => setShowExpirationPicker(false)}
                >
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Payment Interval Dropdown */}
      <Modal
        visible={showPaymentIntervalDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPaymentIntervalDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPaymentIntervalDropdown(false)}
        >
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select Payment Interval</Text>
              <TouchableOpacity
                onPress={() => setShowPaymentIntervalDropdown(false)}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.dropdownList}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setPaymentInterval("");
                  setShowPaymentIntervalDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    !paymentInterval && styles.dropdownItemTextActive,
                  ]}
                >
                  All Intervals
                </Text>
                {!paymentInterval && (
                  <Ionicons name="checkmark" size={20} color="#9A1B2B" />
                )}
              </TouchableOpacity>
              {paymentIntervalOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setPaymentInterval(option);
                    setShowPaymentIntervalDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      paymentInterval === option &&
                      styles.dropdownItemTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                  {paymentInterval === option && (
                    <Ionicons name="checkmark" size={20} color="#9A1B2B" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Reminders List with Infinite Scroll */}
      {renderEmptyState() || (
        <FlatList
          data={filteredReminders}
          renderItem={renderReminderCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5} // Load when 50% from bottom
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor="#9A1B2B"
            />
          }
          scrollEnabled={true}
          nestedScrollEnabled={false}
        />
      )}
    </View>
  );
};

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  headerContainer: {
    overflow: "hidden",
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  searchSection: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 10,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1F2937",
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonActive: {
    backgroundColor: "#9A1B2B",
  },
  filterContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    maxHeight: 60,
  },
  filterContent: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingRight: 20,
  },

  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: "#9A1B2B",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  filterBadge: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 20,
    alignItems: "center",
  },
  filterBadgeActive: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#4B5563",
  },
  filterBadgeTextActive: {
    color: "#FFFFFF",
  },
  advancedFiltersContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    overflow: "hidden",
  },
  advancedFiltersContent: {
    padding: 20,
  },
  advancedFiltersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  advancedFiltersTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9A1B2B",
  },
  filtersScrollView: {
    maxHeight: 350,
  },
  filterInputGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  filterInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1F2937",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    width: 170,
  },
  dateText: {
    fontSize: 14,
    color: "#1F2937",
  },
  datePlaceholder: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  applyFiltersButton: {
    backgroundColor: "#9A1B2B",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  applyFiltersText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "80%",
    maxHeight: "60%",
    overflow: "hidden",
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  dropdownList: {
    maxHeight: 400,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemText: {
    fontSize: 15,
    color: "#4B5563",
  },
  dropdownItemTextActive: {
    color: "#9A1B2B",
    fontWeight: "600",
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: "#9A1B2B",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  reminderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: "relative",
    overflow: "hidden",
  },
  urgentIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 4,
    height: "100%",
    backgroundColor: "#F59E0B",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#6B7280",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  cardBody: {
    gap: 8,
    marginBottom: 12,
  },
  cardInfoRow: {
    flexDirection: "row",
    gap: 12,
  },
  cardInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardInfoText: {
    fontSize: 12,
    color: "#6B7280",
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  cardFooterLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardFooterRight: {
    flexDirection: "row",
    gap: 8,
  },
  paymentText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  autoRenewBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  autoRenewText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#10b981",
  },
  noRenewBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  noRenewText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
  },
  renewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9A1B2B",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  renewButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  // date options
  modalOverlayFull: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  datePickerContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  datePickerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  datePickerCancel: {
    padding: 10,
  },
  datePickerCancelText: {
    fontSize: 17,
    color: "#6B7280",
  },
  datePickerDone: {
    padding: 10,
  },
  datePickerDoneText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#9A1B2B",
  },
});

export default ReminderScreen;
