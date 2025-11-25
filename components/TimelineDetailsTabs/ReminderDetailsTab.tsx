import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import HtmlRichTextNoteDisplay from "../RichTextNotes";

interface ReminderDetailsTabProps {
  contract?: any;
  isLoading?: boolean;
  onEdit?: () => void;
  onResendIcal?: (reminderId: number) => void;
  isResendingIcal?: boolean;
}

const ReminderDetailsTab: React.FC<ReminderDetailsTabProps> = ({
  contract,
  isLoading = false,
  onEdit,
  onResendIcal,
  isResendingIcal
}) => {
  console.log("🔍 ReminderDetailsTab contract received:", contract);

  // Parse ISO 8601 duration (P14D = 14 days)
  const parsePeriod = (period: string): string => {
    if (!period) return "N/A";

    const match = period.match(
      /P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
    );

    if (!match) return period;

    const [, years, months, weeks, days, hours, minutes, seconds] = match;
    const parts = [];

    if (years) parts.push(`${years}y`);
    if (months) parts.push(`${months}mo`);
    if (weeks) parts.push(`${weeks}w`);
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    if (seconds) parts.push(`${seconds}s`);

    return parts.join(" ") || period;
  };

  // Convert period to days
  const periodToDays = (period: string): number => {
    if (!period) return 0;

    const match = period.match(/P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?/);
    if (!match) return 0;

    const [, years, months, weeks, days] = match;
    let totalDays = 0;

    if (years) totalDays += parseInt(years) * 365;
    if (months) totalDays += parseInt(months) * 30;
    if (weeks) totalDays += parseInt(weeks) * 7;
    if (days) totalDays += parseInt(days);

    return totalDays;
  };

  const reminders = useMemo(() => {
    console.log("📋 Checking reminders array:", contract?.reminders);
    const reminderList = contract?.reminders || [];
    console.log("📋 Reminders count:", reminderList.length);
    return reminderList;
  }, [contract?.reminders]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading reminder details...</Text>
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.detailsContainer}>
        {/* Header */}
        <View style={styles.detailsHeader}>
          <View style={styles.headerLeft}>
            <Ionicons name="notifications" size={24} color="#9A1B2B" />
            <View>
              <Text style={styles.detailsTitle}>Reminders</Text>
              <Text style={styles.contractName}>{contract.name}</Text>
            </View>
          </View>
          {onResendIcal && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => onResendIcal(contract.id)}
            >
              <Ionicons name="send-outline" size={16} color="#fff" />
              <Text style={styles.editButtonText}>
                {isResendingIcal ? "Resending..." : "Resend iCal"}
              </Text>
            </TouchableOpacity>


          )}
        </View>

        {/* Reminders List or Empty State */}
        {reminders && reminders.length > 0 ? (
          <>
            {reminders.map((reminder, index) => (
              <View key={reminder.id || index} style={styles.reminderCard}>
                {/* Reminder Header */}
                <View style={styles.reminderHeader}>
                  <View style={styles.reminderHeaderLeft}>
                    <View
                      style={[
                        styles.reminderStatusIndicator,
                        reminder.active
                          ? styles.reminderStatusActive
                          : styles.reminderStatusInactive,
                      ]}
                    />
                    <Text style={styles.reminderTitle}>
                      Reminder #{index + 1}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.reminderBadge,
                      reminder.active
                        ? styles.reminderBadgeActive
                        : styles.reminderBadgeInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.reminderBadgeText,
                        reminder.active
                          ? styles.reminderBadgeTextActive
                          : styles.reminderBadgeTextInactive,
                      ]}
                    >
                      {reminder.active ? "Active" : "Inactive"}
                    </Text>
                  </View>
                </View>

                {/* Reminder Details */}
                <View style={styles.detailRow}>
                  <View style={styles.detailLabel}>
                    <Ionicons name="timer" size={16} color="#6B7280" />
                    <Text style={styles.detailLabelText}>Period</Text>
                  </View>
                  <View style={styles.periodValue}>
                    <Text style={styles.periodValueText}>
                      {parsePeriod(reminder.period)}
                    </Text>
                    <Text style={styles.periodDays}>
                      ({periodToDays(reminder.period)} days)
                    </Text>
                  </View>
                </View>

                {/* Quantity */}
                {reminder.quantity > 0 && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailLabel}>
                      <Ionicons name="list" size={16} color="#6B7280" />
                      <Text style={styles.detailLabelText}>Quantity</Text>
                    </View>
                    <Text style={styles.detailValue}>{reminder.quantity}</Text>
                  </View>
                )}

                {/* Contacts */}
                {reminder.contacts && reminder.contacts.length > 0 && (
                  <View style={styles.contactsSection}>
                    <View style={styles.detailLabel}>
                      <Ionicons name="people" size={16} color="#6B7280" />
                      <Text style={styles.detailLabelText}>
                        Contacts ({reminder.contacts.length})
                      </Text>
                    </View>
                    <View style={styles.contactsList}>
                      {reminder.contacts.map((contact, contactIndex) => (
                        <View key={contactIndex} style={styles.contactBadge}>
                          <Ionicons name="mail" size={12} color="#9A1B2B" />
                          <Text style={styles.contactText} numberOfLines={1}>
                            {contact}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Calendar Integration */}
                {reminder.ical > 0 && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailLabel}>
                      <Ionicons name="calendar" size={16} color="#6B7280" />
                      <Text style={styles.detailLabelText}>Calendar Sync</Text>
                    </View>
                    <View style={styles.badge}>
                      <Ionicons name="checkmark" size={14} color="#10B981" />
                      <Text style={styles.badgeText}>Enabled</Text>
                    </View>
                  </View>
                )}

                {/* Notes */}
                {/* {reminder.notes && (
                  <View style={styles.notesSection}>
                    <View style={styles.notesHeader}>
                      <Ionicons
                        name="document-text"
                        size={16}
                        color="#6B7280"
                      />
                      <Text style={styles.detailLabelText}>Notes</Text>
                    </View>
                    <View style={styles.notesBox}>
                      <Text style={styles.notesText}>{reminder.notes}</Text>
                    </View>
                  </View>
                )} */}

                {reminder.notes && (
                  <View style={styles.notesSection}>
                    <View style={styles.notesHeader}>
                      <Ionicons
                        name="document-text"
                        size={16}
                        color="#6B7280"
                      />
                      <Text style={styles.detailLabelText}>Notes</Text>
                    </View>
                    <HtmlRichTextNoteDisplay
                      content={reminder.notes}
                      maxHeight={600}
                    />
                  </View>
                )}

                {/* Timestamps */}
                <View style={styles.timestampContainer}>
                  <View style={styles.timestamp}>
                    <Ionicons name="create" size={14} color="#9CA3AF" />
                    <Text style={styles.timestampText}>
                      Created:{" "}
                      {new Date(reminder.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.timestamp}>
                    <Ionicons name="pencil" size={14} color="#9CA3AF" />
                    <Text style={styles.timestampText}>
                      Updated:{" "}
                      {new Date(reminder.updated_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.emptyRemindersContainer}>
            <Ionicons name="notifications-off" size={48} color="#D1D5DB" />
            <Text style={styles.emptyRemindersText}>
              No reminders configured
            </Text>
            <Text style={styles.emptyRemindersSubtext}>
              Set up reminders to get notified before contract expiration
            </Text>
            {onEdit && (
              <TouchableOpacity
                style={styles.createReminderButton}
                onPress={onEdit}
              >
                <Ionicons name="add-circle" size={18} color="white" />
                <Text style={styles.createReminderButtonText}>
                  Create Reminder
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
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
  detailsContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  detailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  detailsTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
  },
  contractName: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
    width: "80%",
    flexWrap: "wrap"
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
  editButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Contract Overview Card Styles
  contractOverviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  overviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  overviewItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  overviewLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  overviewValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "600",
    marginTop: 2,
  },
  descriptionRow: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  descriptionText: {
    flex: 1,
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },

  // Reminders List Header
  remindersListHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  remindersListTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },

  reminderCard: {
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reminderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  reminderHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  reminderStatusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  reminderStatusActive: {
    backgroundColor: "#10B981",
  },
  reminderStatusInactive: {
    backgroundColor: "#D1D5DB",
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  reminderBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reminderBadgeActive: {
    backgroundColor: "#D1FAE5",
  },
  reminderBadgeInactive: {
    backgroundColor: "#F3F4F6",
  },
  reminderBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  reminderBadgeTextActive: {
    color: "#10B981",
  },
  reminderBadgeTextInactive: {
    color: "#6B7280",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  detailLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  detailLabelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  detailValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
  },
  periodValue: {
    alignItems: "flex-end",
  },
  periodValueText: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "600",
  },
  periodDays: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  contactsSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  contactsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  contactBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: "#FCE7E7",
  },
  contactText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9A1B2B",
    maxWidth: 150,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10B981",
  },
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#1F2937" },
  notesSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  notesBox: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#9A1B2B",
  },
  notesText: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 20,
  },
  timestampContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  timestamp: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timestampText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  emptyRemindersContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyRemindersText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
  },
  emptyRemindersSubtext: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
    marginBottom: 24,
  },
  createReminderButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#9A1B2B",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createReminderButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default ReminderDetailsTab;
