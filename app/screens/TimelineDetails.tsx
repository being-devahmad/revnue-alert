import { useGetTimelineDetails } from "@/api/reminders/useGetTimelineDetails";
import { TabHeader } from "@/components/TabHeader";
import ContractDetailsTab from "@/components/TimelineDetailsTabs/ContractDetailsTab";
import ReminderDetailsTab from "@/components/TimelineDetailsTabs/ReminderDetailsTab";
import TimelineTab from "@/components/TimelineDetailsTabs/TimelineTab";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ActiveTab = "timeline" | "contract" | "reminder";

interface TabConfig {
  id: ActiveTab;
  label: string;
  icon: string;
}

const TABS: TabConfig[] = [
  { id: "timeline", label: "Timeline", icon: "time-outline" },
  { id: "contract", label: "Contract", icon: "document-outline" },
  { id: "reminder", label: "Reminders", icon: "notifications-outline" },
];

const TimelineDetailsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("timeline");
  const router = useRouter();
  const params = useLocalSearchParams();

  console.log("TimelineDetailsScreen params:", params);

  // Get contract ID from route params
  const contractId = params.id as string;

  // Fetch timeline details
  const { data, isLoading, error, refetch } = useGetTimelineDetails(contractId);

  const handleEditContract = () => {
    if (!data?.data?.contract) return;

    const contract = data.data.contract;
    router.push({
      pathname: "/(screens)/editReminder",
      params: {
        contractId: contract.id,
        name: contract.name,
        accountNumber: contract.account_number,
        startDate: contract.started_at,
        endDate: contract.expired_at,
        amount: contract.amount,
        interval: contract.interval,
        categoryId: contract.category_id,
        autoRenew: contract.auto_renew ? "true" : "false",
      },
    });
  };

  const handleEditReminder = () => {
    if (!data?.data?.contract) return;

    const contract = data.data.contract;
    router.push({
      pathname: "/(screens)/editReminder",
      params: {
        contractId: contract.id,
        contractName: contract.name,
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
    switch (activeTab) {
      case "timeline":
        return (
          <TimelineTab
            timeline={data?.data?.timeline}
            contract={data?.data?.contract}
            isLoading={isLoading}
          />
        );
      case "contract":
        return (
          <ContractDetailsTab
            contract={data?.data?.contract}
            isLoading={isLoading}
            onEdit={handleEditContract}
          />
        );
      case "reminder":
        return (
          <ReminderDetailsTab
            contract={data?.data?.contract}
            isLoading={isLoading}
            onEdit={handleEditReminder}
          />
        );
      default:
        return null;
    }
  };

  // Error State
  if (error && !data) {
    return (
      <View style={styles.container}>
        {/* Header - Outside SafeAreaView to attach to notch */}
        <TabHeader title="Timeline Details" isChild={true} />

        {/* SafeAreaView for content only */}
        <SafeAreaView style={styles.contentContainer} edges={["bottom"]}>
          {/* Error State */}
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
            <Text style={styles.errorTitle}>Error Loading Details</Text>
            <Text style={styles.errorMessage}>
              {error instanceof Error ? error.message : "Failed to load details"}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Ionicons name="refresh" size={18} color="#FFF" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Loading State
  if (isLoading && !data) {
    return (
      <View style={styles.container}>
        {/* Header - Outside SafeAreaView to attach to notch */}
        <TabHeader title="Timeline Details" isChild={true} />

        {/* SafeAreaView for content only */}
        <SafeAreaView style={styles.contentContainer} edges={["bottom"]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9A1B2B" />
            <Text style={styles.loadingText}>Loading details...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header - Outside SafeAreaView to attach to notch */}
      <TabHeader title="Timeline Details" isChild={true} />

      {/* SafeAreaView for content only */}
      <SafeAreaView style={styles.contentContainer} edges={["bottom"]}>
        {/* Tabs - New Styled Version */}
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
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={18}
                  color={activeTab === tab.id ? "#9A1B2B" : "#9CA3AF"}
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
                {activeTab === tab.id && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content */}
        {/* <View style={styles.contentWrapper}>
          {renderActiveTab()}
        </View> */}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  headerContainer: {
    overflow: "hidden",
  },
  headerGradient: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBack: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    flex: 1,
    marginLeft: 12,
  },

  // Tab Styles
  tabContainerWrapper: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 0,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 8,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginHorizontal: 4,
    borderRadius: 10,
    position: "relative",
  },
  activeTabButton: {
    backgroundColor: "#F3F4F6",
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  activeTabText: {
    color: "#9A1B2B",
    fontWeight: "700",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#9A1B2B",
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },

  // Content
  contentWrapper: {
    flex: 1,
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 12,
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 20,
  },
  errorMessage: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#9A1B2B",
    borderRadius: 10,
    gap: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default TimelineDetailsScreen;