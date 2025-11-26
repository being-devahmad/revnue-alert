import { useAddContract } from "@/api/addReminder/useAddContract";
import { useAddReminder } from "@/api/addReminder/useAddReminder";
import { ContractDetails } from "@/components/AddReminderTabs/ContractDetailsTab";
import { ReminderDetails } from "@/components/AddReminderTabs/ReminderDetailsTab";
import { TabHeader } from "@/components/TabHeader";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type TabType = "details" | "reminder";

const AddReminderScreen = () => {
  const router = useRouter();

  const params = useLocalSearchParams();
  console.log('params-->', params)

  const initialTab: TabType =
    params?.defaultTab === "reminder" ? "reminder" : "details";

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);


  // API Mutations
  const { mutate: addContract, isPending: isAddingContract } = useAddContract();
  const { mutate: addReminder, isPending: isAddingReminder } = useAddReminder();

  // Store contract ID after creation
  const [createdContractId, setCreatedContractId] = useState<number | null>(null);

  // Step 1: Contract Details
  const [contractForm, setContractForm] = useState({
    reminderTo: "",
    reminderName: "",
    description: "",
    category: "",
    deposits: "0.00",
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
    supplierNotes: "",
    notes: "",
    enabled: true,
  });

  // Step 2: Reminder Details
  const [reminderForm, setReminderForm] = useState({
    reminderPeriod: "",
    remindersToSend: "1 - Send single reminder",
    notes: "",
    resendICal: true,
  });

  const [contactInputs, setContactInputs] = useState([""]);

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

  const periodMap: Record<string, string> = {
    "30 days": "P30D",
    "60 days": "P60D",
    "90 days": "P90D",
    "1 Month": "P1M",
    "3 Months": "P3M",
    "6 Months": "P6M",
    "1 Year": "P1Y",
    "18 Months": "P18M",
    "2 Years": "P2Y",
    "3 Years": "P3Y",
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
    if (!createdContractId) {
      Alert.alert("Error", "Contract must be created first");
      return false;
    }

    if (!reminderForm.reminderPeriod) {
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

  // ============ ADD CONTRACT ============
  const handleSaveContract = () => {
    console.log("💾 Saving contract...");

    // Validate
    if (!validateContractForm()) {
      return;
    }

    // Build payload
    const contractPayload = {
      name: contractForm.reminderName,
      description: contractForm.description,
      category_id: categoryMap[contractForm.category] || 1,
      started_at: contractForm.inceptionDate
        ?.toISOString()
        .split("T")[0] || "",
      expired_at: contractForm.expirationDate
        ?.toISOString()
        .split("T")[0] || "",
      account_number: contractForm.accountNumber,
      amount: parseFloat(contractForm.paymentAmount) || 0,
      interval: contractForm.paymentInterval,
      payments: 0,
      auto_renew: contractForm.renewal ? 1 : 0,
      auto_renew_period: contractForm.renewal ? "P1Y" : null,
      supplier_rating: contractForm.supplierRating,
      last_payment_amount: parseFloat(contractForm.lastPaymentAmount) || 0,
      last_payment_at: contractForm.lastPaymentDate
        ?.toISOString()
        .split("T")[0] || "",
      last_payment_notes: "",
      website_email: contractForm.emailWebsite,
      phone_number: contractForm.phone,
      non_renew_sent_at: contractForm.nonRenewDate
        ?.toISOString()
        .split("T")[0] || null,
      notes: contractForm.notes,
    };

    console.log("📦 Contract payload:", contractPayload);

    // Call API
    addContract(contractPayload as any, {
      onSuccess: (data) => {
        console.log("✅ Contract created successfully!");
        console.log("📋 Contract ID:", data.data.contract_id);

        // Store contract ID
        setCreatedContractId(data.data.contract_id);

        // Show success alert
        Alert.alert("Success", "Contract added successfully!", [
          {
            text: "Next",
            onPress: () => {
              setActiveTab("reminder");
            },
          },
        ]);
      },
      onError: (error: any) => {
        console.error("❌ Error adding contract:", error.message);
        Alert.alert("Error", error.message || "Failed to add contract");
      },
    });
  };

  // ============ ADD REMINDER ============
  const handleSaveReminder = () => {
    console.log("💾 Saving reminder...");

    // Validate
    if (!validateReminderForm()) {
      return;
    }

    // Filter valid contacts
    const validContacts = contactInputs.filter((c) => c.trim());

    // Build payload
    const reminderPayload = {
      contract_id: createdContractId!,
      name: contractForm.reminderName,
      quantity: quantityMap[reminderForm.remindersToSend] || 1,
      period: periodMap[reminderForm.reminderPeriod] || "P30D",
      contacts: validContacts,
      active: true,
      ical: reminderForm.resendICal,
      notes: reminderForm.notes,
    };

    console.log("📦 Reminder payload:", reminderPayload);

    // Call API
    addReminder(reminderPayload as any, {
      onSuccess: (data) => {
        console.log("✅ Reminder created successfully!");
        console.log("📋 Reminder ID:", data.data.id);

        // Show success alert and navigate
        Alert.alert("Success", "Reminder added successfully!", [
          {
            text: "Go to Reminders",
            onPress: () => {
              router.push('/(tabs)/reminder');
            },
          },
        ]);
      },
      onError: (error: any) => {
        console.error("❌ Error adding reminder:", error.message);
        Alert.alert("Error", error.message || "Failed to add reminder");
      },
    });
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <TabHeader title="Add Reminder" subtitle="Create a reminder" />

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "details" && styles.tabActive]}
          onPress={() => setActiveTab("details")}
          disabled={isAddingContract || isAddingReminder}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "details" && styles.tabTextActive,
            ]}
          >
            Step 1: Contract Details
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "reminder" && styles.tabActive]}
          onPress={() => {
            if (!createdContractId) {
              Alert.alert(
                "Required",
                "Please create contract first before adding reminder"
              );
              return;
            }
            setActiveTab("reminder");
          }}
          disabled={isAddingContract || isAddingReminder}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "reminder" && styles.tabTextActive,
            ]}
          >
            Step 2: Reminder Details
          </Text>
        </TouchableOpacity>
      </View>

      {/* STEP 1: CONTRACT DETAILS */}
      {activeTab === "details" && (
        <ContractDetails
          contractForm={contractForm}
          setContractForm={setContractForm}
          onContractChange={handleContractChange}
          onProceed={handleSaveContract}
          onCancel={handleCancel}
          isLoading={isAddingContract}
        />
      )}

      {/* STEP 2: REMINDER DETAILS */}
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
          isLoading={isAddingReminder}
        />
      )}

      {/* Loading Overlay */}
      {(isAddingContract || isAddingReminder) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#9A1B2B" />
          <Text style={styles.loadingText}>
            {isAddingContract ? "Creating contract..." : "Creating reminder..."}
          </Text>
        </View>
      )}
    </View>
  );
};

export default AddReminderScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "white",
    fontWeight: "600",
  },
});