import {
  formatDateLong,
  getDaysLeft,
} from "@/api/reminders/useGetTimelineDetails";
import { formatISODuration } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface TimelineTabProps {
  timeline?: any;
  contract?: any;
  isLoading?: boolean;
  timelineEnabled: boolean;
}

const TimelineTab: React.FC<TimelineTabProps> = ({
  timeline,
  contract,
  isLoading = false,
  timelineEnabled,
}) => {
  const router = useRouter();

  console.log("🕒 Rendering TimelineTab with contract:", contract);
  console.log("🕒 Timeline data:", timeline?.rows?.length);

  // Calculate timeline progress percentage
  const calculateProgress = useMemo(() => {
    if (!contract) return 0;

    const inception = new Date(contract.started_at);
    const expiration = new Date(contract.expired_at);
    const today = new Date();

    const totalDuration = expiration.getTime() - inception.getTime();
    const elapsed = today.getTime() - inception.getTime();

    const progress = Math.max(
      0,
      Math.min(100, (elapsed / totalDuration) * 100)
    );
    return progress;
  }, [contract]);

  // Calculate days left
  const daysLeft = useMemo(() => {
    if (!contract) return 0;
    return getDaysLeft(contract.expired_at);
  }, [contract?.expired_at]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Generate month labels based on contract duration
  const generateMonthLabels = useMemo(() => {
    if (!contract) return [];

    const inception = new Date(contract.started_at);
    const expiration = new Date(contract.expired_at);
    const labels = [];

    const totalMonths = Math.ceil(
      (expiration.getTime() - inception.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    const interval = Math.max(1, Math.floor(totalMonths / 5));

    for (let i = 0; i <= 5; i++) {
      const date = new Date(inception);
      date.setMonth(inception.getMonth() + i * interval);

      const monthYear = date.toLocaleDateString("en-US", {
        month: "short",
        year: i === 0 || i === 5 ? "numeric" : undefined,
      });
      labels.push(monthYear);
    }

    return labels;
  }, [contract]);

  // Determine auto-renew status
  const getAutoRenewStatus = useMemo(() => {
    if (contract?.auto_renew) {
      return "✓ " + formatISODuration(contract.auto_renew_period);
    }
    return "N/A";
  }, [contract?.auto_renew, contract?.auto_renew_period]);

  // Determine timeline color based on days left
  const getTimelineColors = (): readonly [string, string, ...string[]] => {
    if (daysLeft < 0) {
      return ["#EF4444", "#EF4444", "#EF4444"];
    } else if (daysLeft < 30) {
      return ["#10B981", "#F59E0B", "#EF4444"];
    } else if (daysLeft < 90) {
      return ["#10B981", "#F59E0B", "#F59E0B"];
    } else {
      return ["#10B981", "#10B981", "#3B82F6"];
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading timeline...</Text>
      </View>
    );
  }

  if (!contract) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No contract data available</Text>
      </View>
    );
  }

  const timelineColors = getTimelineColors();

  // If no timeline rows → show Add Reminder box
  if (!timeline?.rows || timeline.rows.length === 0) {
    return (
      <View style={styles.emptyTimelineBox}>
        <Text style={styles.emptyTimelineText}>
          No reminders found for this contract.
        </Text>

        {
          timelineEnabled && (
            <>
              <TouchableOpacity
                style={styles.addReminderButton}
                onPress={() => {
                  router.push({
                    pathname: "/(tabs)/addReminder",
                    params: {
                      contractId: contract?.id,
                      defaultTab: "reminder",
                    },
                  });
                }}
              >
                <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.addReminderButtonText}>Add Reminder</Text>
              </TouchableOpacity>
            </>
          )
        }
      </View>
    );
  }

  return (
    <ScrollView style={styles.timelineContainer}>
      {/* Header */}
      <View style={styles.timelineHeader}>
        <Text style={styles.reminderName}>Contract Timeline</Text>
        <Text style={styles.timelineTitle}>{contract.name}</Text>
      </View>

      {/* KEY CONTRACT INFORMATION CARD */}
      <View style={styles.keyInfoCard}>
        <View style={styles.keyInfoHeader}>
          <Ionicons name="information-circle" size={20} color="#9A1B2B" />
          <Text style={styles.keyInfoHeaderTitle}>
            Key Contract Information
          </Text>
        </View>

        <View style={styles.keyInfoContent}>
          <View style={styles.keyInfoRow}>
            <View style={styles.keyInfoItem}>
              <Text style={styles.keyInfoLabel}>Inception Date</Text>
              <Text style={styles.keyInfoValue}>
                {formatDateLong(contract.started_at)}
              </Text>
            </View>
            <View style={styles.keyInfoDivider} />
            <View style={styles.keyInfoItem}>
              <Text style={styles.keyInfoLabel}>Expiration Date</Text>
              <Text style={styles.keyInfoValue}>
                {formatDateLong(contract.expired_at)}
              </Text>
            </View>
          </View>

          <View style={styles.keyInfoSeparator} />

          <View style={styles.keyInfoRow}>
            <View style={styles.keyInfoItem}>
              <Text style={styles.keyInfoLabel}>
                {contract.interval ? `${contract.interval} Payment` : "Payment"}
              </Text>
              <Text style={styles.keyInfoValue}>
                ${contract.amount?.toFixed(2) ?? '0.00'}
              </Text>
            </View>
            <View style={styles.keyInfoDivider} />
            <View style={styles.keyInfoItem}>
              <Text style={styles.keyInfoLabel}>Auto Renew</Text>
              <Text
                style={[
                  styles.keyInfoValue,
                  getAutoRenewStatus !== "N/A" && styles.autoRenewActive,
                ]}
              >
                {getAutoRenewStatus}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Timeline Graph */}
      <View style={styles.timelineGraph}>
        <View style={styles.timelineLine}>
          <LinearGradient
            colors={timelineColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.timelineProgress,
              { width: `${calculateProgress}%` },
            ]}
          />
          <View
            style={[
              styles.currentDateMarker,
              { left: `${calculateProgress}%` },
            ]}
          >
            <View style={styles.markerDot} />
            <View style={styles.markerLine} />
            <Text style={styles.markerLabel}>Today</Text>
          </View>
        </View>

        {/* Month Labels */}
        <View style={styles.monthLabels}>
          {generateMonthLabels.map((label, index) => (
            <Text key={index} style={styles.monthLabel}>
              {label}
            </Text>
          ))}
        </View>
      </View>

      {/* Contract Duration Info */}
      <View style={styles.durationCard}>
        <View style={styles.durationRow}>
          <View style={styles.durationItem}>
            <Ionicons name="time-outline" size={20} color="#6B7280" />
            <View style={styles.durationTextContainer}>
              <Text style={styles.durationLabel}>Contract Duration</Text>
              <Text style={styles.durationValue}>
                {(() => {
                  const inception = new Date(contract.started_at);
                  const expiration = new Date(contract.expired_at);
                  const years = Math.floor(
                    (expiration.getTime() - inception.getTime()) /
                    (1000 * 60 * 60 * 24 * 365)
                  );
                  const months = Math.floor(
                    ((expiration.getTime() - inception.getTime()) %
                      (1000 * 60 * 60 * 24 * 365)) /
                    (1000 * 60 * 60 * 24 * 30)
                  );

                  if (years > 0 && months > 0)
                    return `${years} year${years > 1 ? "s" : ""
                      }, ${months} month${months > 1 ? "s" : ""}`;
                  if (years > 0) return `${years} year${years > 1 ? "s" : ""}`;
                  return `${months} month${months > 1 ? "s" : ""}`;
                })()}
              </Text>
            </View>
          </View>

          <View style={styles.durationItem}>
            <Ionicons name="hourglass-outline" size={20} color="#6B7280" />
            <View style={styles.durationTextContainer}>
              <Text style={styles.durationLabel}>Days Remaining</Text>
              <Text
                style={[
                  styles.durationValue,
                  daysLeft < 0 && styles.expiredText,
                  daysLeft >= 0 && daysLeft < 30 && styles.urgentText,
                ]}
              >
                {daysLeft < 0
                  ? `Expired ${Math.abs(daysLeft)} days ago`
                  : `${daysLeft} days`}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Contract Info Banner */}
      <View
        style={[
          styles.infoBanner,
          daysLeft < 0 && styles.expiredBanner,
          daysLeft >= 0 && daysLeft < 30 && styles.urgentBanner,
        ]}
      >
        <View style={styles.infoBannerHeader}>
          <Ionicons
            name={
              daysLeft < 0
                ? "close-circle"
                : daysLeft < 30
                  ? "warning"
                  : "information-circle"
            }
            size={20}
            color={
              daysLeft < 0 ? "#EF4444" : daysLeft < 30 ? "#F59E0B" : "#3B82F6"
            }
          />
          <Text style={styles.infoBannerTitle}>Contract Information</Text>
        </View>
        <Text style={styles.infoBannerText}>
          {daysLeft < 0
            ? `This contract expired ${Math.abs(
              daysLeft
            )} days ago on ${formatDate(contract.expired_at)}.`
            : daysLeft < 30
              ? `⚠️ This contract is expiring soon! Only ${daysLeft} days remaining until ${formatDate(
                contract.expired_at
              )}.`
              : `This contract is currently active and set to expire in ${daysLeft} days on ${formatDate(
                contract.expired_at
              )}.`}
          {contract.interval &&
            ` Payment is ${contract.interval.toLowerCase()} at $${contract.amount.toFixed(
              2
            )}.`}
        </Text>
      </View>
    </ScrollView >
  );
};

const styles = StyleSheet.create({
  timelineContainer: {
    padding: 20,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  timelineHeader: {
    marginBottom: 24,
  },
  reminderName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 8,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 4,
  },
  keyInfoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 0,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  keyInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#F9FAFB",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  keyInfoHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  keyInfoContent: {
    padding: 20,
  },
  keyInfoRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  keyInfoItem: {
    flex: 1,
    paddingVertical: 12,
  },
  keyInfoDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
  },
  keyInfoLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 8,
    textTransform: "capitalize",
  },
  keyInfoValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  keyInfoSeparator: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  autoRenewActive: {
    color: "#10B981",
  },
  timelineGraph: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  timelineLine: {
    height: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    position: "relative",
    marginBottom: 24,
  },
  timelineProgress: {
    height: 8,
    borderRadius: 4,
  },
  currentDateMarker: {
    position: "absolute",
    top: -4,
    alignItems: "center",
    transform: [{ translateX: -8 }],
  },
  markerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#3B82F6",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  markerLine: {
    width: 2,
    height: 24,
    backgroundColor: "#3B82F6",
  },
  markerLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#3B82F6",
    marginTop: 4,
  },
  monthLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  monthLabel: {
    fontSize: 11,
    color: "#6B7280",
  },
  durationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  durationRow: {
    gap: 16,
  },
  durationItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  durationTextContainer: {
    flex: 1,
  },
  durationLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  durationValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  expiredText: {
    color: "#EF4444",
  },
  urgentText: {
    color: "#F59E0B",
  },
  infoBanner: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#3B82F6",
    marginBottom: 60
  },
  expiredBanner: {
    backgroundColor: "#FEF2F2",
    borderLeftColor: "#EF4444",
  },
  urgentBanner: {
    backgroundColor: "#FFFBEB",
    borderLeftColor: "#F59E0B",
  },
  infoBannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoBannerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  infoBannerText: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 20,
  },

  // if no timeline rows styles
  emptyTimelineBox: {
    margin: 30,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTimelineText: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  addReminderButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#9A1B2B",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  addReminderButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default TimelineTab;
