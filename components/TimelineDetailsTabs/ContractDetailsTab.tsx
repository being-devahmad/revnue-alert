import { formatDate, getDaysLeft } from "@/api/reminders/useGetTimelineDetails";
import { useAuthStore } from "@/store/authStore";
import { formatISODuration } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import HtmlRichTextNoteDisplay from "../RichTextNotes";

interface ContractDetailsTabProps {
  contract?: any;
  isLoading?: boolean;
  onEdit: () => void;
  onCompleteTask: (contractId: number) => void;
  isCompletingTask: boolean;
  timelineEnabled: boolean;
  setTimelineEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  isTaskCompleted: boolean;
  onToggleContractStatus: (active: boolean) => void;
  isTogglingContract: boolean;
}

const ContractDetailsTab: React.FC<ContractDetailsTabProps> = ({
  contract,
  isLoading = false,
  onEdit,
  onCompleteTask,
  isCompletingTask,
  timelineEnabled,
  setTimelineEnabled,
  isTaskCompleted,
  onToggleContractStatus,
  isTogglingContract,
}) => {
  console.log("📄 ContractDetailsTab contract:", contract);

  const store = useAuthStore()
  const completedBy = store?.user?.id === contract?.completed_by && `${store?.user?.first_name} ${store?.user?.last_name}`

  // ✅ Get reminder active status - primary source of truth
  // const reminderActiveStatus = useMemo(() => {
  //   if (!contract?.reminders || contract.reminders.length === 0) {
  //     return true;
  //   }
  //   return contract.reminders[0]?.active ?? true;
  // }, [contract?.reminders]);

  const toggleTimeline = (value: boolean) => {
    onToggleContractStatus(value);
  };


  // Calculate days left
  const daysLeft = useMemo(() => {
    if (!contract) return 0;
    return getDaysLeft(contract.expired_at);
  }, [contract]);

  // Get status
  // const getStatus = (): string => {
  //   if (!timelineEnabled) return "Disabled";
  //   if (daysLeft < 0) return "Expired";
  //   if (daysLeft < 30) return "Expiring Soon";
  //   return "Active";
  // };

  // Get status color
  // const getStatusColor = (): string => {
  //   if (!timelineEnabled) return "#6B7280";
  //   if (daysLeft < 0) return "#EF4444";
  //   if (daysLeft < 30) return "#F59E0B";
  //   return "#10B981";
  // };

  // Handle Toggle

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading contract details...</Text>
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

  // const statusColor = getStatusColor();
  // const status = getStatus();

  const contractDetails = [
    {
      label: "Reminder Name",
      value: contract.name,
      icon: "document-text-outline" as const,
    },
    {
      label: "Account #",
      value: contract.account_number,
      icon: "card-outline" as const,
    },
    {
      label: "Inception Date",
      value: formatDate(contract.started_at),
      icon: "calendar-outline" as const,
    },
    {
      label: "Expiration Date",
      value: formatDate(contract.expired_at),
      icon: "calendar-outline" as const,
    },
    {
      label: "Payment",
      value: `$${contract?.amount?.toFixed(2)}`,
      icon: "cash-outline" as const,
    },
    {
      label: "Reminder Renew",
      value: contract.auto_renew ? `Yes` : "No",
      icon: "refresh-outline" as const,
    },
    {
      label: "Renewal Period",
      value: formatISODuration(contract.auto_renew_period),
      icon: "refresh-outline" as const,
    },
    {
      label: "Interval",
      value: contract.interval || "N/A",
      icon: "repeat-outline" as const,
    },
    {
      label: "Last Payment Amount",
      value: contract.last_payment_amount
        ? `$${contract?.last_payment_amount?.toFixed(2)}`
        : "N/A",
      icon: "cash-outline" as const,
    },
    {
      label: "Last Payment Date",
      value: contract.last_payment_at
        ? formatDate(contract.last_payment_at)
        : "N/A",
      icon: "checkmark-circle-outline" as const,
    },
    {
      label: "Deposits / Advance Pmnts",
      value: `$${contract?.payments?.toFixed(2)}`,
      icon: "checkmark-circle-outline" as const,
    },
    // {
    //   label: "Days Left",
    //   value:
    //     daysLeft < 0
    //       ? `Expired ${Math.abs(daysLeft)} days ago`
    //       : `${daysLeft} days`,
    //   icon: "hourglass-outline" as const,
    // },
    {
      label: "Category",
      value: contract.category?.name || "N/A",
      icon: "pricetag-outline" as const,
    },
    {
      label: "Description",
      value: contract.description,
      icon: "information-circle-outline" as const,
    },
    {
      label: "Supplier / Task Notes",
      value: contract?.last_payment_notes || "N/A",
      icon: "information-circle-outline" as const,
    },
    {
      label: "Website / Email",
      value: contract.website_email || "N/A",
      icon: "globe-outline" as const,
    },
    {
      label: "Phone",
      value: contract.phone_number || "N/A",
      icon: "call-outline" as const,
    },
    {
      label: "Non Renew Sent Date",
      value: contract.non_renew_sent_at
        ? formatDate(contract.non_renew_sent_at)
        : "N/A",
      icon: "calendar-outline" as const,
    },
    // {
    //   label: "Supplier Rating",
    //   value: contract.supplier_rating || "N/A",
    //   icon: "star-outline" as const,
    // },
  ];

  const renderStars = (rating: number | null | undefined) => {
    const totalStars = 5;
    const filled = rating ? Math.min(rating, 5) : 0;

    return (
      <View style={{ flexDirection: "row", marginLeft: 22 }}>
        {[...Array(totalStars)].map((_, index) => {
          const isFilled = index < filled;
          return (
            <Ionicons
              key={index}
              name={isFilled ? "star" : "star-outline"}
              size={18}
              color={isFilled ? "#FBBF24" : "#D1D5DB"} // Yellow / Gray
              style={{ marginRight: 4 }}
            />
          );
        })}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.detailsContainer}>
        {/* Header */}
        <View style={styles.detailsHeader}>
          <View style={styles.detailsHeaderTop}>
            <Text style={styles.detailsTitle}>Contract Details</Text>
            {/* <TouchableOpacity style={styles.editButton} onPress={onEdit}>
              <Ionicons name="pencil" size={20} color="#9A1B2B" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity> */}
            <TouchableOpacity style={styles.editButton} onPress={onEdit}>
              <Ionicons name="create-outline" size={18} color="white" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.detailsSubtitle}>{contract.name}</Text>
        </View>

        {/* STATUS ACTIONS CARD */}
        <View style={styles.statusActionsCard}>
          <View style={styles.statusToggleSection}>
            <View style={styles.statusToggleInfo}>
              <Ionicons
                name={timelineEnabled ? "checkmark-circle" : "close-circle"}
                size={24}
                color={timelineEnabled ? "#10B981" : "#EF4444"}
              />
              <View style={styles.statusToggleTextContainer}>
                <Text style={styles.statusToggleLabel}>Contract Status</Text>
                <Text
                  style={[
                    styles.statusToggleValue,
                    { color: timelineEnabled ? "#10B981" : "#EF4444" },
                  ]}
                >
                  {timelineEnabled ? "Enabled" : "Disabled"}
                </Text>
              </View>
            </View>
            <Switch
              value={timelineEnabled}
              onValueChange={toggleTimeline}
              disabled={isTogglingContract}
              trackColor={{ false: "#E5E7EB", true: "#D1FAE5" }}
              thumbColor={timelineEnabled ? "#10B981" : "#9CA3AF"}
              ios_backgroundColor="#E5E7EB"
            />

          </View>

          <View style={styles.statusActionsDivider} />

          <TouchableOpacity
            style={[
              styles.completeTaskButton,
              isCompletingTask && { opacity: 0.6 },
            ]}
            onPress={() => onCompleteTask(contract.id)}
            disabled={isCompletingTask}
          >
            {isCompletingTask ? (
              <Ionicons name="time-outline" size={20} color="white" />
            ) : (
              <Ionicons name="checkmark-done" size={20} color="white" />
            )}

            <Text style={styles.completeTaskText}>
              {isCompletingTask ? "Completing..." : "Complete Task"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Current Status Badge */}
        {/* <View style={styles.currentStatusCard}>
          <Text style={styles.currentStatusLabel}>Current Status</Text>
          <View
            style={[
              styles.currentStatusBadge,
              { backgroundColor: `${statusColor}15` },
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: statusColor }]}
            />
            <Text style={[styles.currentStatusText, { color: statusColor }]}>
              {status}
            </Text>
          </View>
        </View> */}

        {/* Reminder Status Info */}
        {/* {contract.reminders.length > 0 && (
          <View
            style={[
              styles.reminderStatusInfo,
              !reminderActiveStatus && styles.reminderStatusInfoInactive,
            ]}
          >
            <Ionicons
              name={reminderActiveStatus ? "checkmark-circle" : "close-circle"}
              size={16}
              color={reminderActiveStatus ? "#10B981" : "#EF4444"}
            />
            <Text style={styles.reminderStatusText}>
              {contract.reminders.length} reminder
              {contract.reminders.length > 1 ? "s" : ""}{" "}
              {reminderActiveStatus ? "active" : "inactive"}
            </Text>
          </View>
        )} */}

        {/* Contract Details Grid */}
        <View style={styles.detailsGrid}>
          {contractDetails.map((detail, index) => (
            <View key={index} style={styles.detailItem}>
              <View style={styles.detailLabelContainer}>
                <Ionicons name={detail.icon} size={16} color="#9CA3AF" />
                <Text style={styles.detailLabel}>{detail.label}</Text>
              </View>
              <Text
                style={[
                  styles.detailValue,
                  detail.value === "N/A" && styles.detailValueNA,
                  detail.label === "Days Left" &&
                  daysLeft < 0 &&
                  styles.expiredValue,
                  detail.label === "Days Left" &&
                  daysLeft >= 0 &&
                  daysLeft < 30 &&
                  styles.urgentValue,
                ]}
              >
                {detail.value}
              </Text>
            </View>
          ))}
          <View style={styles.detailItem}>
            <View style={styles.detailLabelContainer}>
              <Ionicons name="star-outline" size={16} color="#9CA3AF" />
              <Text style={styles.detailLabel}>Supplier Rating</Text>
            </View>

            {renderStars(contract.supplier_rating)}
          </View>

          {isTaskCompleted && (
            <>
              {/* Last Completed */}
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Last Completed</Text>
                <Text style={[styles.detailValue, { marginTop: 7 }]}>
                  {contract?.completed_at
                    ? dayjs(contract.completed_at).format("DD MMM YYYY")
                    : "—"}
                </Text>
              </View>

              {/* Last Completed By */}
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Last Completed By</Text>
                <Text style={[styles.detailValue, { marginTop: 7 }]}>
                  {completedBy ?? "—"}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="analytics-outline" size={20} color="#9A1B2B" />
            <Text style={styles.summaryTitle}>Contract Summary</Text>
          </View>
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Payments:</Text>
              <Text style={styles.summaryValue}>{contract.payments}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Time Remaining:</Text>
              <Text
                style={[
                  styles.summaryValue,
                  daysLeft < 0 && styles.expiredValue,
                  daysLeft >= 0 && daysLeft < 30 && styles.urgentValue,
                ]}
              >
                {daysLeft < 0 ? "Expired" : `${daysLeft} days`}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes Section */}
        {/* {contract.notes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={20} color="#9A1B2B" />
              <Text style={styles.sectionTitle}>Notes</Text>
            </View>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>
                {contract.notes.replace(/<[^>]*>/g, "")}
              </Text>
            </View>
          </View>
        )} */}

        {contract.notes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={16} color="#6B7280" />
              <Text style={styles.sectionTitle}>Notes</Text>
            </View>
            <HtmlRichTextNoteDisplay content={contract.notes} maxHeight={600} />
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: { fontSize: 16, color: "#6B7280", fontWeight: "600" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    minHeight: 300,
  },
  emptyText: { fontSize: 16, color: "#9CA3AF", fontWeight: "500" },
  detailsContainer: { padding: 20 },
  detailsHeader: { marginBottom: 20 },
  detailsHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#9A1B2B",
    gap: 6,
  },
  editButtonText: { fontSize: 14, fontWeight: "600", color: "white" },
  detailsTitle: { fontSize: 24, fontWeight: "700", color: "#1F2937" },
  detailsSubtitle: { fontSize: 16, color: "#6B7280", marginTop: 4 },
  statusActionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statusToggleSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusToggleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  statusToggleTextContainer: { flex: 1 },
  statusToggleLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 2,
    fontWeight: "600",
  },
  statusToggleValue: { fontSize: 16, fontWeight: "700" },
  statusActionsDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginBottom: 16,
  },
  completeTaskButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9A1B2B",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  completeTaskText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  currentStatusCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  currentStatusLabel: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  currentStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  currentStatusText: { fontSize: 13, fontWeight: "600" },
  reminderStatusInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  reminderStatusInfoInactive: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FECACA",
  },
  reminderStatusText: { fontSize: 13, fontWeight: "600", color: "#10B981" },
  detailsGrid: {
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
  detailItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  detailLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  detailLabel: { fontSize: 12, color: "#6B7280", fontWeight: "500" },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginLeft: 22,
  },
  detailValueNA: { color: "#9CA3AF", fontStyle: "italic" },
  expiredValue: { color: "#EF4444" },
  urgentValue: { color: "#F59E0B" },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#9A1B2B",
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  summaryTitle: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
  summaryContent: { gap: 12 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  summaryLabel: { fontSize: 13, color: "#6B7280", flex: 1 },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "right",
  },
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#1F2937" },
  notesCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  notesText: { fontSize: 13, color: "#4B5563", lineHeight: 20 },
});

export default ContractDetailsTab;
