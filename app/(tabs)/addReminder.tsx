import { useAddContract } from "@/api/addReminder/useAddContract";
import { useAddReminder } from "@/api/addReminder/useAddReminder";
import { useGetEnterpriseAccounts } from "@/api/reminders/timeline-details/useGetEnterpriseAccounts";
import { ContractDetails } from "@/components/AddReminderTabs/ContractDetailsTab";
import { ReminderDetails } from "@/components/AddReminderTabs/ReminderDetailsTab";
import { TabHeader } from "@/components/TabHeader";
import { useAuthStore } from "@/store/authStore";
import { formatLocalDate } from "@/utils";
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

const AddReminderScreen = () => {
  const router = useRouter();
  const { accountType, user } = useAuthStore();

  console.log("user-->", user);

  const isEnterprise = accountType === "enterprise";

  const params = useLocalSearchParams();
  console.log("params-->", params);

  const initialTab: TabType =
    params?.defaultTab === "reminder" ? "reminder" : "details";

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // API Mutations
  const { mutate: addContract, isPending: isAddingContract } = useAddContract();
  const { mutate: addReminder, isPending: isAddingReminder } = useAddReminder();

  const { data: accounts } = useGetEnterpriseAccounts();
  console.log('accounts==>', accounts)

  // Store contract ID after creation (or from params if adding to existing)
  const [createdContractId, setCreatedContractId] = useState<number | null>(() => {
    if (params.contractId) {
      const id = Number(Array.isArray(params.contractId) ? params.contractId[0] : params.contractId);
      return isNaN(id) ? null : id;
    }
    return null;
  });

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

  // const handleContractChange = (
  //   field: string,
  //   value: string | boolean | Date | number | null
  // ) => {
  //   setContractForm((prev) => ({ ...prev, [field]: value }));
  // };

  const handleContractChange = <K extends keyof typeof contractForm>(
    field: K,
    value: (typeof contractForm)[K]
  ) => {
    const moneyFields: (keyof typeof contractForm)[] = [
      "payments",
      "paymentAmount",
      "lastPaymentAmount",
    ];

    // MONEY FIELDS SPECIAL LOGIC
    if (moneyFields.includes(field) && typeof value === "string") {
      let clean = value.replace(/[^0-9]/g, "");

      // If empty -> reset to 0.00
      if (clean.length === 0) {
        return setContractForm((prev) => ({ ...prev, [field]: "0.00" }));
      }

      // Always ensure at least 2 digits for decimals
      if (clean.length === 1) clean = "0" + clean;

      const formatted =
        clean.substring(0, clean.length - 2) +
        "." +
        clean.substring(clean.length - 2);

      return setContractForm((prev) => ({
        ...prev,
        [field]: formatted,
      }));
    }

    // DEFAULT HANDLER FOR NON-MONEY FIELDS
    setContractForm((prev) => ({
      ...prev,
      [field]: value,
    }));
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


  const resetForms = () => {
    setContractForm({
      reminderTo: "",
      reminderName: "",
      description: "",
      category: "",
      payments: 0,
      paymentAmount: "0.00",
      paymentInterval: "",
      lastPaymentAmount: "0.00",
      lastPaymentDate: null,
      accountNumber: "",
      inceptionDate: null,
      expirationDate: null,
      nonRenewDate: null,
      renewal: false,
      renewalPeriod: "",
      supplierRating: 0,
      emailWebsite: "",
      phone: "",
      lastPaymentNotes: "",
      notes: "",
      enabled: true,
    });

    setReminderForm({
      period: "",
      quantity: "1 - Send single reminder",
      notes: "",
      resendICal: true,
    });

    setContactInputs([""]);
    setCreatedContractId(null);
    setActiveTab("details"); // Optional: go back to Step 1
  };


  // ============ ADD CONTRACT ============
  const handleSaveContract = () => {
    console.log("💾 Saving contract...");

    // Validate
    if (!validateContractForm()) {
      return;
    }

    console.log('category-->', contractForm?.category)

    // Build payload
    const contractPayload = {
      name: contractForm.reminderName,
      description: contractForm.description,
      category_id: contractForm?.category,
      started_at: formatLocalDate(contractForm.inceptionDate) || "",
      expired_at:
        formatLocalDate(contractForm.expirationDate) || "",
      account_number: contractForm.accountNumber,
      amount: parseFloat(contractForm.paymentAmount) || 0,
      interval: contractForm.paymentInterval,
      payments: contractForm?.payments,
      auto_renew: contractForm.renewal ? 1 : 0,
      auto_renew_period: contractForm.renewal ? "P2Y" : null,
      supplier_rating: contractForm.supplierRating || "",
      last_payment_amount: parseFloat(contractForm.lastPaymentAmount) || 0,
      last_payment_at:
        formatLocalDate(contractForm.lastPaymentDate) || null,
      last_payment_notes: contractForm.lastPaymentNotes || '',
      website_email: contractForm.emailWebsite,
      phone_number: contractForm.phone,
      non_renew_sent_at:
        formatLocalDate(contractForm.nonRenewDate) || null,
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

  useEffect(() => {
    console.log('createdContractId-->', createdContractId)
  }, [createdContractId])

  // ============ ADD REMINDER ============
  const handleSaveReminder = () => {
    console.log("🧩 Saving reminder, contractId =>", createdContractId);

    if (!createdContractId) {
      Alert.alert("Error", "Contract ID missing. Please re-create contract.");
      return;
    }

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
      quantity: quantityMap[reminderForm.quantity] || 1,
      period: reminderForm.period || '',
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

        // Clear all fields
        resetForms();

        // Show success alert and navigate
        Alert.alert("Success", "Reminder added successfully!", [
          {
            text: "Go to Reminders",
            onPress: () => {
              router.push("/(tabs)/reminder");
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
          isEnterprise={isEnterprise}
          user={user}
          accounts={accounts}
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
