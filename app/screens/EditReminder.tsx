import { useFetchContractById } from "@/api/reminders/timeline-details/useGetContractById";
import { useGetEnterpriseAccounts } from "@/api/reminders/timeline-details/useGetEnterpriseAccounts";
import { useFetchReminderById } from "@/api/reminders/timeline-details/useGetReminderById";
import { useUpdateContract } from "@/api/reminders/timeline-details/useUpdateContract";
import { useUpdateReminder } from "@/api/reminders/timeline-details/useUpdateReminder";
import { ContractDetails } from "@/components/AddReminderTabs/ContractDetailsTab";
import { ReminderDetails } from "@/components/AddReminderTabs/ReminderDetailsTab";
import { TabHeader } from "@/components/TabHeader";
import { useAuthStore } from "@/store/authStore";
import { formatISODuration, normalizeParam, stripHtml } from "@/utils";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type TabType = "details" | "reminder";


const getquantityLabel = (quantity: number): string => {
  const map: Record<number, string> = {
    0: "0 - Send no reminders",
    1: "1 - Send single reminder",
    2: "2 - Send reminders and final reminder",
    3: "3 - Send initial, secondary and final reminder",
  };
  return map[quantity] || "1 - Send single reminder";
};



const EditReminder = () => {
  const router = useRouter();
  const {
    contractId,
    reminderId,
    contractName,
    categoryId,
    categoryName,
  } = useLocalSearchParams();

  console.log('reminder-id---------------->', reminderId)

  const { accountType } = useAuthStore();
  const isEnterprise = accountType === "enterprise";

  const [activeTab, setActiveTab] = useState<TabType>("details");

  // Fetch contract and reminder data
  const { data: contractData, isLoading: isLoadingContract } = useFetchContractById(normalizeParam(contractId));
  console.log("📋 Fetched contract data:", contractData);
  const { data: reminderData, isLoading: isLoadingReminder } = useFetchReminderById(normalizeParam(reminderId));

  // API Mutations
  const { mutate: updateContract, isPending: isUpdatingContract } = useUpdateContract();
  const { mutate: updateReminder, isPending: isUpdatingReminder } = useUpdateReminder();

  const currentCategory = contractData?.category?.name

  // Step 1: Contract Details
  const [contractForm, setContractForm] = useState({
    reminderTo: "",
    reminderName: "",
    description: "",
    category: "",
    payments: 0,
    paymentAmount: "0.00",
    paymentInterval: "",
    lastPaymentAmount: "0.00",
    lastPaymentDate: null as Date | null,
    accountNumber: "",
    inceptionDate: null as Date | null,
    expirationDate: null as Date | null,
    nonRenewDate: null as Date | null,
    renewal: false,
    renewalPeriod: "",
    supplierRating: 0,
    emailWebsite: "",
    phone: "",
    lastPaymentNotes: "",
    notes: "",
    enabled: true,
  });

  // Step 2: Reminder Details
  const [reminderForm, setReminderForm] = useState({
    period: "",
    quantity: "1 - Send single reminder",
    notes: "",
    resendICal: true,
  });

  const [contactInputs, setContactInputs] = useState([""]);

  const { data: accounts } = useGetEnterpriseAccounts();
  console.log('accounts==>', accounts)

  const assignedUser = accounts?.find((account) => account?.id === contractData?.user_id)
  console.log('assigned-user-->', assignedUser)

  // Populate forms when contract data is loaded
  useEffect(() => {
    if (contractData) {
      console.log("Loading contract data for edit:", contractData);

      setContractForm({
        reminderTo: assignedUser?.department ? assignedUser?.department : assignedUser?.name,
        reminderName: contractData.name || "",
        description: contractData.description || "",
        category: String(contractData.category_id), // ← Store ID as string
        payments: contractData.payments || 0,
        paymentAmount: contractData.amount ? String(contractData.amount) : "0.00",
        paymentInterval: contractData.interval || "",
        lastPaymentAmount: contractData.last_payment_amount ? String(contractData.last_payment_amount) : "0.00",
        lastPaymentDate: contractData.last_payment_at ? new Date(contractData.last_payment_at) : null,
        accountNumber: contractData.account_number || "",
        inceptionDate: contractData.started_at ? new Date(contractData.started_at) : null,
        expirationDate: contractData.expired_at ? new Date(contractData.expired_at) : null,
        nonRenewDate: contractData.non_renew_sent_at ? new Date(contractData.non_renew_sent_at) : null,
        renewal: Boolean(contractData.auto_renew),
        renewalPeriod: contractData.auto_renew_period ? formatISODuration(contractData.auto_renew_period) : "",
        supplierRating: contractData.supplier_rating || 0,
        emailWebsite: contractData.website_email || "",
        phone: contractData.phone_number || "",
        lastPaymentNotes: contractData.last_payment_notes || "",
        notes: contractData.notes || "",
        enabled: true,
      });
    }

    if (reminderData) {
      setReminderForm({
        period: formatISODuration(reminderData.period) || "",
        quantity: getquantityLabel(reminderData.quantity),
        notes: reminderData.notes || "",
        resendICal: Boolean(reminderData.ical),
      });

      setContactInputs(reminderData.contacts && reminderData.contacts.length > 0
        ? reminderData.contacts
        : [""]
      );
    }
  }, [contractData, reminderData, assignedUser?.name]);

  useEffect(() => {
    if (reminderData) {
      setReminderForm({
        period: reminderData.period || "",
        quantity: getquantityLabel(reminderData.quantity),
        notes: reminderData.notes || "",
        resendICal: Boolean(reminderData.ical),
      });

      setContactInputs(reminderData.contacts && reminderData.contacts.length > 0 ? reminderData.contacts : [""]);
    }
  }, [reminderData]);


  const handleContractChange = (
    field: string,
    value: string | boolean | Date | number | null
  ) => {
    setContractForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleReminderChange = (
    field: string,
    value: string | boolean | string[]
  ) => {
    setReminderForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddContact = () => {
    setContactInputs([...contactInputs, ""]);
  };

  const handleRemoveContact = (index: number) => {
    const newContacts = contactInputs.filter((_, i) => i !== index);
    setContactInputs(newContacts);
  };

  const handleContactChange = (index: number, value: string) => {
    const newContacts = [...contactInputs];
    newContacts[index] = value;
    setContactInputs(newContacts);
  };

  // ============ CATEGORY & PERIOD MAPPING ============
  const categoryMap: Record<string, number> = {
    "Employee, Leave of Absence": 1,
    "Lease, Office Equipment": 2,
    "License, Liquor": 3,
    "Software License": 4,
  };

  const quantityMap: Record<string, number> = {
    "0 - Send no reminders": 0,
    "1 - Send single reminder": 1,
    "2 - Send reminders and final reminder": 2,
    "3 - Send initial, secondary and final reminder": 3,
  };

  // ============ VALIDATION HELPERS ============
  const validateContractForm = (): boolean => {
    if (!contractForm.reminderName.trim()) {
      Alert.alert("Validation Error", "Reminder name is required");
      return false;
    }
    if (!contractForm.category) {
      Alert.alert("Validation Error", "Category is required");
      return false;
    }
    if (!contractForm.inceptionDate) {
      Alert.alert("Validation Error", "Inception date is required");
      return false;
    }
    if (!contractForm.expirationDate) {
      Alert.alert("Validation Error", "Expiration date is required");
      return false;
    }
    return true;
  };

  const validateReminderForm = (): boolean => {
    if (!contractId) {
      Alert.alert("Error", "Contract ID is missing");
      return false;
    }

    if (!reminderForm.period) {
      Alert.alert("Validation Error", "Reminder period is required");
      return false;
    }

    const validContacts = contactInputs.filter((c) => c.trim());
    if (validContacts.length === 0) {
      Alert.alert("Validation Error", "At least one contact email is required");
      return false;
    }

    return true;
  };

  // ============ UPDATE CONTRACT ============
  const handleSaveContract = () => {
    console.log("💾 Updating contract...");

    if (!validateContractForm()) {
      return;
    }

    const contractPayload = {
      name: contractForm.reminderName,
      description: contractForm.description,
      category_id: parseInt(contractForm.category) || null,
      started_at: contractForm.inceptionDate
        ?.toISOString()
        .split("T")[0] || "",
      expired_at: contractForm.expirationDate
        ?.toISOString()
        .split("T")[0] || "",
      account_number: contractForm.accountNumber,
      amount: parseFloat(contractForm.paymentAmount) || 0,
      interval: contractForm.paymentInterval,
      payments: contractForm.payments || 0,
      auto_renew: contractForm.renewal ? 1 : 0,
      auto_renew_period: contractForm.renewal ? "P1Y" : null,
      supplier_rating: contractForm.supplierRating,
      last_payment_amount: parseFloat(contractForm.lastPaymentAmount) || 0,
      last_payment_at: contractForm.lastPaymentDate
        ?.toISOString()
        .split("T")[0] || "",
      last_payment_notes: contractForm?.lastPaymentNotes || "",
      website_email: contractForm.emailWebsite,
      phone_number: contractForm.phone,
      non_renew_sent_at: contractForm.nonRenewDate
        ?.toISOString()
        .split("T")[0] || null,
      notes: contractForm.notes,
    };

    console.log("📦 Contract payload:", contractPayload);

    updateContract(
      { contractId: parseInt(contractId as string), payload: contractPayload },
      {
        onSuccess: (data) => {
          console.log("✅ Contract updated successfully!");

          Alert.alert("Success", "Contract updated successfully!", [
            {
              text: "Next",
              onPress: () => {
                setActiveTab("reminder");
              },
            },
          ]);
        },
        onError: (error: any) => {
          console.error("❌ Error updating contract:", error.message);
          Alert.alert("Error", error.message || "Failed to update contract");
        },
      }
    );
  };




  // ============ UPDATE REMINDER ============
  const handleSaveReminder = () => {
    console.log("💾 Updating reminder...");

    if (!validateReminderForm()) {
      return;
    }

    const validContacts = contactInputs.filter((c) => c.trim());

    const reminderPayload = {
      contract_id: Number(contractId),
      name: contractForm.reminderName,
      quantity: quantityMap[reminderForm.quantity] || 1,
      period: reminderForm.period || '',
      contacts: validContacts,
      active: true,
      ical: reminderForm.resendICal,
      notes: stripHtml(reminderForm.notes),
    };


    console.log("📦 Reminder payload:", reminderPayload);

    updateReminder(
      { reminderId: parseInt(reminderId as string), payload: reminderPayload },
      {
        onSuccess: (data) => {
          console.log("✅ Reminder updated successfully!");

          Alert.alert("Success", "Reminder updated successfully!", [
            {
              text: "Go to Reminders",
              onPress: () => {
                router.push("/(tabs)/reminder");
              },
            },
          ]);
        },
        onError: (error: any) => {
          console.error("❌ Error updating reminder:", error.message);
          Alert.alert("Error", error.message || "Failed to update reminder");
        },
      }
    );
  };

  const handleCancel = () => {
    Alert.alert("Cancel", "Are you sure you want to cancel?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        onPress: () => router.back(),
        style: "destructive",
      },
    ]);
  };

  if (isLoadingContract || isLoadingReminder) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9A1B2B" />
        <Text style={styles.loadingText}>Loading reminder data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <TabHeader
        title="Edit Reminder"
        subtitle={contractName as string || ""}
        isChild={true}
        isDelete={true}
      />

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "details" && styles.tabActive]}
          onPress={() => setActiveTab("details")}
          disabled={isUpdatingContract || isUpdatingReminder}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "details" && styles.tabTextActive,
            ]}
          >
            Step 1: Edit Contract
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "reminder" && styles.tabActive]}
          onPress={() => setActiveTab("reminder")}
          disabled={isUpdatingContract || isUpdatingReminder}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "reminder" && styles.tabTextActive,
            ]}
          >
            Step 2: Edit Reminder
          </Text>
        </TouchableOpacity>
      </View>

      {/* STEP 1: EDIT CONTRACT DETAILS */}
      {activeTab === "details" && (
        <ContractDetails
          contractForm={contractForm}
          setContractForm={setContractForm}
          onContractChange={handleContractChange}
          onProceed={handleSaveContract}
          onCancel={handleCancel}
          isLoading={isUpdatingContract}
          isEnterprise={isEnterprise}
          accounts={accounts}
          currentCategory={currentCategory}
        />
      )}

      {/* STEP 2: EDIT REMINDER DETAILS */}
      {activeTab === "reminder" && (
        <ReminderDetails
          reminderForm={reminderForm}
          contactInputs={contactInputs}
          onReminderChange={handleReminderChange}
          onContactChange={handleContactChange}
          onAddContact={handleAddContact}
          onRemoveContact={handleRemoveContact}
          onSave={handleSaveReminder}
          onCancel={handleCancel}
          isLoading={isUpdatingReminder}
        />
      )}

      {/* Loading Overlay */}
      {(isUpdatingContract || isUpdatingReminder) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#9A1B2B" />
          <Text style={styles.loadingText}>
            {isUpdatingContract ? "Updating contract..." : "Updating reminder..."}
          </Text>
        </View>
      )}
    </View>
  );
};

export default EditReminder;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#000000",
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#9A1B2B",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
    textAlign: "center",
  },
  tabTextActive: {
    color: "#9A1B2B",
    fontWeight: "600",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
});