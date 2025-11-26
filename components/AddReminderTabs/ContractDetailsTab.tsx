"use client";

import { useGetEnterpriseAccounts } from "@/api/reminders/timeline-details/useGetEnterpriseAccounts";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { RichTextEditor } from "../RichTextEditor";
import { CategoryBottomSheet } from "../ui/CategoryBottomsheet";
import { DropdownField } from "../ui/DropdownField";
import { StarRating } from "../ui/StarRating";

interface ContractDetailsProps {
  contractForm: {
    reminderTo: string;
    reminderName: string;
    description: string;
    category: string;
    deposits: string;
    paymentAmount: string;
    paymentInterval: string;
    lastPaymentAmount: string;
    lastPaymentDate: Date | null;
    accountNumber: string;
    inceptionDate: Date;
    expirationDate: Date;
    nonRenewDate: Date | null;
    renewal: boolean;
    renewalPeriod: string;
    supplierRating: number;
    emailWebsite: string;
    phone: string;
    supplierNotes: string;
    notes: string;
    enabled: boolean;
  };
  setContractForm: React.Dispatch<
    React.SetStateAction<{
      reminderTo: string;
      reminderName: string;
      description: string;
      category: string;
      deposits: string;
      paymentAmount: string;
      paymentInterval: string;
      lastPaymentAmount: string;
      lastPaymentDate: Date | null;
      accountNumber: string;
      inceptionDate: Date;
      expirationDate: Date;
      nonRenewDate: Date | null;
      renewal: boolean;
      renewalPeriod: string;
      supplierRating: number;
      emailWebsite: string;
      phone: string;
      supplierNotes: string;
      notes: string;
      enabled: boolean;
    }>
  >;
  onContractChange: (
    field: string,
    value: string | boolean | Date | number | null
  ) => void;
  onProceed: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  isEnterprise: boolean;
}

export const ContractDetails: React.FC<ContractDetailsProps> = ({
  contractForm,
  setContractForm,
  onContractChange,
  onProceed,
  onCancel,
  isLoading,
  isEnterprise,
}) => {

  const richTextRef = useRef<any>(null);

  const [showDatePickers, setShowDatePickers] = useState({
    inception: false,
    expiration: false,
    nonRenew: false,
    lastPayment: false,
  });

  const [showDropdowns, setShowDropdowns] = useState({
    reminderTo: false,
    paymentInterval: false,
    renewalPeriod: false,
  });

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);


  // API HOOks
  const { data: accounts } = useGetEnterpriseAccounts();
  console.log('accounts =====>', accounts)

  const paymentIntervalOptions = ["Monthly", "Quarterly", "Annual"];
  const renewalPeriodOptions = ["1 Month", "6 Months", "1 Year"];

  const toggleDatePicker = (picker: keyof typeof showDatePickers) => {
    setShowDatePickers((prev) => ({ ...prev, [picker]: !prev[picker] }));
  };
  const closeAllDropdowns = () => {
    setShowDropdowns({
      reminderTo: false,
      paymentInterval: false,
      renewalPeriod: false,
    });
  };

  const toggleDropdown = (dropdown: keyof typeof showDropdowns) => {
    setShowDropdowns((prev) => ({ ...prev, [dropdown]: !prev[dropdown] }));
  };

  // Format date helper that handles null dates
  const formatDate = (date: Date | null) => {
    if (!date) return "YYYY-MM-DD";
    return date?.toISOString()?.split("T")[0];
  };

  // Clear date handler
  const clearDate = (field: string) => {
    onContractChange(field, null);
  };

  const handleAddReminderTemplate = () => {
    const generatedNote = `<b>Reminder Name:</b> ${contractForm.reminderName
      }<br><b>Account Number:</b> ${contractForm.accountNumber
      }<br><b>Payment Amount:</b> ${contractForm.paymentAmount
      }<br><b>Payment Interval:</b> ${contractForm.paymentInterval || ""
      }<br><b>Expiration Date:</b> ${contractForm.expirationDate
        ? contractForm.expirationDate.toISOString().split("T")[0]
        : ""
      }<br><b>Category:</b> ${contractForm.category}<br><b>Description:</b> ${contractForm.description
      }<br><b>Website / Email:</b> ${contractForm.emailWebsite
      }<br><b>Phone Number:</b> ${contractForm.phone
      }<br><b>Non-Renew Sent Date:</b> ${contractForm.nonRenewDate
        ? contractForm.nonRenewDate.toISOString().split("T")[0]
        : ""
      }<br>`;

    const templatePattern = /<b>Reminder Name:<\/b>[\s\S]*?(<br><br>|$)/;
    const hasExistingTemplate = templatePattern.test(contractForm.notes);

    const updatedNotes = hasExistingTemplate
      ? contractForm.notes.replace(templatePattern, generatedNote)
      : contractForm.notes
        ? generatedNote + "<br><br>" + contractForm.notes
        : generatedNote;

    setContractForm((prev) => ({ ...prev, notes: updatedNotes }));

    if (richTextRef.current) {
      richTextRef.current.setContentHTML(updatedNotes);
    }
  };

  return (
    <>
      {/* Category Bottom Sheet Modal */}
      <CategoryBottomSheet
        visible={showCategoryModal}
        selectedValue={contractForm.category}
        onSelect={(selectedCategory) => {
          console.log("📁 Category selected:", selectedCategory);
          onContractChange("category", selectedCategory);
          setShowCategoryModal(false);
        }}
        onClose={() => setShowCategoryModal(false)}
        title="Select Category"
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View
          style={[styles.card, showDropdowns.reminderTo && styles.cardActive]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={20} color="#9A1B2B" />
            <Text style={styles.cardTitle}>Basic Information</Text>
          </View>

          <View style={styles.section}>
            {/* <DropdownField
              label="Assign Reminder To"
              value={contractForm.reminderTo}
              options={reminderToOptions}
              showDropdown={showDropdowns.reminderTo}
              onToggle={() => {
                if (!showDropdowns.reminderTo) {
                  closeAllDropdowns();
                }
                toggleDropdown("reminderTo");
              }}
              onSelect={(value) => {
                onContractChange("reminderTo", value);
                toggleDropdown("reminderTo");
              }}
              placeholder="Select an account"
            /> */}
            {
              isEnterprise && (
                <DropdownField
                  label="Assign Reminder To"
                  value={contractForm.reminderTo}
                  options={accounts && accounts?.map((acc: any) => `${acc.department}`)}
                  showDropdown={showDropdowns.reminderTo}
                  onToggle={() => toggleDropdown("reminderTo")}
                  onSelect={(value) => {
                    onContractChange("reminderTo", value);
                    toggleDropdown("reminderTo");
                  }}
                  placeholder="Select an account"
                />
              )
            }
            <FormField
              label="Reminder Name"
              value={contractForm.reminderName}
              onChangeText={(text) => onContractChange("reminderName", text)}
              placeholder="Enter reminder name"
              required={true}
            />
            <FormField
              label="Description"
              value={contractForm.description}
              onChangeText={(text) => onContractChange("description", text)}
              placeholder="Enter description"
            />

            {/* Category Selection with Bottom Sheet Modal */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Category <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setShowCategoryModal(true)}
              >
                <Text style={styles.selectText}>
                  {contractForm.category || "Select Category"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#9A1B2B" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Payment Information */}
        <View
          style={[
            styles.card,
            showDropdowns.paymentInterval && styles.cardActive,
          ]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="cash" size={20} color="#9A1B2B" />
            <Text style={styles.cardTitle}>Payment Information</Text>
          </View>
          <View style={styles.section}>
            <FormField
              label="Deposits/Advance Pmts ($)"
              value={contractForm.deposits}
              onChangeText={(text) => onContractChange("deposits", text)}
              placeholder="Enter deposits/advance payments"
            />
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <FormField
                  label="Payment Amount ($)"
                  value={contractForm.paymentAmount}
                  onChangeText={(text) =>
                    onContractChange("paymentAmount", text)
                  }
                  placeholder="Enter payment amount"
                />
              </View>
              <View style={styles.halfWidth}>
                <DropdownField
                  label="Payment Interval"
                  value={contractForm.paymentInterval}
                  options={paymentIntervalOptions}
                  showDropdown={showDropdowns.paymentInterval}
                  onToggle={() => {
                    if (!showDropdowns.paymentInterval) {
                      closeAllDropdowns();
                    }
                    toggleDropdown("paymentInterval");
                  }}
                  onSelect={(value) => {
                    onContractChange("paymentInterval", value);
                    toggleDropdown("paymentInterval");
                  }}
                  placeholder="Select an interval"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <FormField
                  label="Last Payment Amount ($)"
                  value={contractForm.lastPaymentAmount}
                  onChangeText={(text) =>
                    onContractChange("lastPaymentAmount", text)
                  }
                  placeholder="Enter last payment amount"
                />
              </View>
              <View style={styles.halfWidth}>
                <FormField
                  label="Account Number"
                  value={contractForm.accountNumber}
                  onChangeText={(text) =>
                    onContractChange("accountNumber", text)
                  }
                  placeholder="Enter account number"
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Last Payment Date</Text>
                <View style={styles.datePickerRow}>
                  <TouchableOpacity
                    style={[styles.datePickerButton, { flex: 1 }]}
                    onPress={() => toggleDatePicker("lastPayment")}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color="#9A1B2B"
                    />
                    <Text
                      style={[
                        styles.dateText,
                        !contractForm.lastPaymentDate && styles.dateTextEmpty,
                      ]}
                    >
                      {formatDate(contractForm.lastPaymentDate)}
                    </Text>
                  </TouchableOpacity>
                  {contractForm.lastPaymentDate && (
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={() => clearDate("lastPaymentDate")}
                    >
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>

                {showDatePickers.lastPayment && (
                  <DateTimePicker
                    value={contractForm.lastPaymentDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      toggleDatePicker("lastPayment");
                      if (selectedDate)
                        onContractChange("lastPaymentDate", selectedDate);
                    }}
                  />
                )}
              </View>
              <View style={styles.inputGroup} />
            </View>
          </View>
        </View>

        {/* Important Dates */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={20} color="#9A1B2B" />
            <Text style={styles.cardTitle}>Important Dates</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Inception Date <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.datePickerRow}>
                  <TouchableOpacity
                    style={[styles.datePickerButton, { flex: 1 }]}
                    onPress={() => toggleDatePicker("inception")}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color="#9A1B2B"
                    />
                    <Text
                      style={[
                        styles.dateText,
                        !contractForm.inceptionDate && styles.dateTextEmpty,
                      ]}
                    >
                      {formatDate(contractForm.inceptionDate)}
                    </Text>
                  </TouchableOpacity>
                  {contractForm.inceptionDate && (
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={() => clearDate("inceptionDate")}
                    >
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>

                {showDatePickers.inception && (
                  <DateTimePicker
                    value={contractForm.inceptionDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      toggleDatePicker("inception");
                      if (selectedDate)
                        onContractChange("inceptionDate", selectedDate);
                    }}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Expiration Date
                  <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.datePickerRow}>
                  <TouchableOpacity
                    style={[styles.datePickerButton, { flex: 1 }]}
                    onPress={() => toggleDatePicker("expiration")}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color="#9A1B2B"
                    />
                    <Text
                      style={[
                        styles.dateText,
                        !contractForm.expirationDate && styles.dateTextEmpty,
                      ]}
                    >
                      {formatDate(contractForm.expirationDate)}
                    </Text>
                  </TouchableOpacity>
                  {contractForm.expirationDate && (
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={() => clearDate("expirationDate")}
                    >
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>

                {showDatePickers.expiration && (
                  <DateTimePicker
                    value={contractForm.expirationDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      toggleDatePicker("expiration");
                      if (selectedDate)
                        onContractChange("expirationDate", selectedDate);
                    }}
                  />
                )}
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Non-Renew Sent Date</Text>
                <View style={styles.datePickerRow}>
                  <TouchableOpacity
                    style={[styles.datePickerButton, { flex: 1 }]}
                    onPress={() => toggleDatePicker("nonRenew")}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color="#9A1B2B"
                    />
                    <Text
                      style={[
                        styles.dateText,
                        !contractForm.nonRenewDate && styles.dateTextEmpty,
                      ]}
                    >
                      {formatDate(contractForm.nonRenewDate)}
                    </Text>
                  </TouchableOpacity>
                  {contractForm.nonRenewDate && (
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={() => clearDate("nonRenewDate")}
                    >
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>

                {showDatePickers.nonRenew && (
                  <DateTimePicker
                    value={contractForm.nonRenewDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      toggleDatePicker("nonRenew");
                      if (selectedDate)
                        onContractChange("nonRenewDate", selectedDate);
                    }}
                  />
                )}
              </View>
              <View style={styles.inputGroup} />
            </View>
          </View>
        </View>

        {/* Renewal Settings */}
        <View
          style={[
            styles.card,
            showDropdowns.renewalPeriod && styles.cardActive,
          ]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="refresh-circle" size={20} color="#9A1B2B" />
            <Text style={styles.cardTitle}>Renewal Settings</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.label}>Auto Renewal </Text>
                <Text style={styles.toggleDesc}>
                  Enable automatic renewal for this contract
                </Text>
              </View>
              <Switch
                value={contractForm.renewal}
                onValueChange={(v) => onContractChange("renewal", v)}
                thumbColor={contractForm.renewal ? "#9A1B2B" : "#ccc"}
                trackColor={{ false: "#E5E7EB", true: "#E8B4BB" }}
              />
            </View>
            {contractForm.renewal && (
              <DropdownField
                label="Renewal Period"
                value={contractForm.renewalPeriod}
                options={renewalPeriodOptions}
                showDropdown={showDropdowns.renewalPeriod}
                onToggle={() => {
                  if (!showDropdowns.renewalPeriod) {
                    closeAllDropdowns();
                  }
                  toggleDropdown("renewalPeriod");
                }}
                onSelect={(value) => {
                  onContractChange("renewalPeriod", value);
                  toggleDropdown("renewalPeriod");
                }}
                required={true}
                placeholder="Select an interval"
              />
            )}
          </View>
        </View>

        {/* Supplier Rating */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="star" size={20} color="#9A1B2B" />
            <Text style={styles.cardTitle}>Supplier Rating</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Rate this Supplier</Text>
            <View style={styles.ratingContainer}>
              <StarRating
                rating={contractForm.supplierRating}
                onRatingChange={(rating) =>
                  onContractChange("supplierRating", rating)
                }
                size={32}
                color="#9A1B2B"
              />
              <Text style={styles.ratingText}>
                {contractForm.supplierRating} out of 5
              </Text>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="call" size={20} color="#9A1B2B" />
            <Text style={styles.cardTitle}>Contact Information</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <FormField
                  label="Website "
                  value={contractForm.emailWebsite}
                  onChangeText={(text) =>
                    onContractChange("emailWebsite", text)
                  }
                  keyboardType="email-address"
                  placeholder="website "
                />
              </View>
              <View style={styles.inputGroup}>
                <FormField
                  label="Phone Number"
                  value={contractForm.phone}
                  onChangeText={(text) => onContractChange("phone", text)}
                  keyboardType="phone-pad"
                  placeholder="Enter phone number"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Additional Notes */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="pencil" size={20} color="#9A1B2B" />
            <Text style={styles.cardTitle}>Additional Notes</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Supplier/Task Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={3}
              value={contractForm.supplierNotes}
              onChangeText={(text) => onContractChange("supplierNotes", text)}
              placeholderTextColor="#9CA3AF"
              placeholder="notes"
            />

            <View style={styles.reminderNotesHeader}>
              <Text style={styles.label}>Reminder Notes</Text>
              <TouchableOpacity
                style={styles.templateButton}
                onPress={handleAddReminderTemplate}
              >
                <Ionicons name="document-text-outline" size={16} color="#9A1B2B" />
                <Text style={styles.templateButtonText}>Reminder Template</Text>
              </TouchableOpacity>
            </View>

            <RichTextEditor
              ref={richTextRef}
              value={contractForm.notes}
              onChangeText={(text) => onContractChange("notes", text)}
              placeholder="Enter notes"
              style={styles.richEditor}
            />
          </View>
        </View>

        {/* Attachments */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="attach" size={20} color="#9A1B2B" />
            <Text style={styles.cardTitle}>
              Add Attachments{" "}
              <Text style={{ fontSize: 10, color: "#6B7280" }}>
                (Max Upload: 16MB)
              </Text>
            </Text>
          </View>
          <View style={styles.section}>
            <TouchableOpacity style={styles.attachmentButton} disabled>
              <Ionicons name="cloud-upload-outline" size={24} color="#6B7280" />
              <Text style={styles.attachmentButtonText}>Choose Files</Text>
              <Text style={styles.attachmentNote}>
                Available from portal only
              </Text>
            </TouchableOpacity>
            <Text style={styles.attachmentWarning}>
              Note: Large attachments may be subject to size restrictions by
              your mail server or service provider. Please ensure your are not
              exceeding any such restrictions or you may not receive the email
              notifications.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onCancel}
            disabled={isLoading}
          >
            <Ionicons name="close" size={18} color="#6B7280" />
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, isLoading && styles.saveButtonDisabled]}
            onPress={onProceed}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="arrow-forward" size={18} color="white" />
                <Text style={styles.saveText}>Proceed To Email</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
};

// Helper Components
const FormField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  numberOfLines,
  required,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  multiline?: boolean;
  numberOfLines?: number;
  required?: boolean;
}) => (
  <View>
    <Text style={styles.label}>
      {label} {required && <Text style={styles.required}>*</Text>}
    </Text>
    <TextInput
      style={[styles.input, multiline && styles.textArea]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={numberOfLines}
    />
  </View>
);

const styles = StyleSheet.create({
  statusCard: {
    backgroundColor: "white",
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  statusButtonEnabled: {
    backgroundColor: "#F0FDF4",
    borderColor: "#DCFCE7",
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EF4444",
  },
  statusButtonTextEnabled: {
    color: "#10B981",
  },
  card: {
    backgroundColor: "white",
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardActive: {
    zIndex: 1000,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  attachmentButton: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#E5E7EB",
    gap: 8,
  },
  attachmentButtonText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  attachmentNote: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  attachmentWarning: {
    fontSize: 11,
    color: "#6B7280",
    lineHeight: 16,
    marginTop: 8,
  },
  section: {
    gap: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },

  inputGroup: {
    flex: 1,
    position: "relative",
    zIndex: 2,
  },
  label: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 6,
    fontWeight: "500",
  },
  required: {
    color: "#EF4444",
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontSize: 14,
    color: "#111827",
  },
  textArea: {
    textAlignVertical: "top",
    paddingTop: 11,
    minHeight: 80,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  toggleDesc: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 12,
  },
  ratingText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dropdownButtonText: {
    fontSize: 14,
    color: "#111827",
  },
  dropdownScroll: {
    maxHeight: 180,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemSelected: {
    backgroundColor: "#F9FAFB",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#111827",
  },
  dropdownItemTextSelected: {
    fontWeight: "600",
    color: "#9A1B2B",
  },
  datePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 11,
    paddingHorizontal: 12,
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: "#111827",
  },
  dateTextEmpty: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  clearButton: {
    padding: 4,
  },
  selectInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: "#F9FAFB",
  },
  selectText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
    flex: 1,
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 24,
    marginBottom: 40,
    marginHorizontal: 16,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 8,
    gap: 8,
  },
  cancelText: {
    color: "#6B7280",
    fontWeight: "600",
    fontSize: 14,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#9A1B2B",
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },

  reminderNotesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  templateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F9FAFB",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  templateButtonText: {
    fontSize: 12,
    color: "#9A1B2B",
    fontWeight: "600",
  },

  richEditorContainer: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
  },
  richToolbar: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    height: 50,
  },
  richEditor: {
    minHeight: 120,
    backgroundColor: "#F9FAFB",
  },
});
