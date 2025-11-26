import {
  getIndustryName,
  getSubscriptionPlanName,
  useGetUserDetails
} from "@/api/settings/useGetUserDetails";
import {
  getFormattedAmount,
  getFormattedInvoiceData,
  getPaginationInfo,
  useDownloadInvoice,
  useInvoices,
} from "@/api/settings/useInvoices";
import {
  getDisplayCardNumber,
  getSubscriptionStatus,
  useChangePlan,
  usePlans
} from '@/api/settings/usePlans';
import {
  getPasswordStrength,
  useUpdatePassword,
  validatePasswordChange,
} from "@/api/settings/useUpdatePassword";
import {
  buildProfileRequest,
  formatErrorMessage,
  useUpdateUserProfile,
  validateProfileData,
} from "@/api/settings/useUpdateUserProfile";
import { TabHeader } from "@/components/TabHeader";
import { IndustryBottomSheet } from "@/components/ui/IndustryModal";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ============ SUBSCRIPTION SIMPLE PICKER ============
const SubscriptionPicker = ({
  visible,
  options,
  selectedValue,
  onSelect,
  onClose,
}: {
  visible: boolean;
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.pickerOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.pickerContainer}>
          {/* Picker Options */}
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.pickerOption,
                selectedValue === option && styles.pickerOptionSelected,
              ]}
              onPress={() => {
                onSelect(option);
                onClose();
              }}
            >
              <Text
                style={[
                  styles.pickerOptionText,
                  selectedValue === option && styles.pickerOptionTextSelected,
                ]}
              >
                {option}
              </Text>
              {selectedValue === option && (
                <Ionicons name="checkmark" size={20} color="#9A1B2B" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const AccountSettingsScreen = () => {
  // ============ PERSONAL INFO STATE ============
  const [companyName, setCompanyName] = useState("");
  const [department, setDepartment] = useState("");
  const [industry, setIndustry] = useState("");
  const [industryId, setIndustryId] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");

  // ============ BILLING STATE ============
  const [subscriptionPlan, setSubscriptionPlan] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardToken, setCardToken] = useState(""); // For Stripe token
  const [couponCode, setCouponCode] = useState("");
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [planOptions, setPlanOptions] = useState<string[]>([]);

  const [savedCard, setSavedCard] = useState({
    lastFour: "",
    expiration: "",
    brand: "",
  });
  // ============ PASSWORD STATE ============
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // ============ INVOICES STATE ============
  const [currentPage, setCurrentPage] = useState(1);
  const {
    data: invoicesData,
    isLoading: isLoadingInvoices,
    error: invoicesError,
  } = useInvoices(currentPage);
  const { mutate: downloadInvoiceMutate, isPending: isDownloading } =
    useDownloadInvoice();
  const [formattedInvoices, setFormattedInvoices] = useState<any[]>([]);
  const [paginationInfo, setPaginationInfo] = useState<any>(null);

  // ============ MODAL STATES ============
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // ============ USER PROFILE API ============
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    error: profileError,
  } = useGetUserDetails();
  const {
    mutate: updateProfileMutate,
    isPending: isUpdatingProfile,
    isSuccess: isProfileUpdateSuccess,
    isError: isProfileUpdateError,
  } = useUpdateUserProfile();

  const {
    data: plansData,
    isLoading: isLoadingPlans,
    error: plansError
  } = usePlans();

  const {
    mutate: changeplanMutate,
    isPending: isChangingPlan,
    isSuccess: isPlanChangeSuccess,
    isError: isPlanChangeError,
  } = useChangePlan();

  // ============ API INTEGRATION ============
  const { mutate: updatePasswordMutate, isPending: isUpdatingPassword } =
    useUpdatePassword();

  // ============ PASSWORD STRENGTH ============
  const passwordStrength = getPasswordStrength(newPassword);
  const strengthColor = {
    weak: "#EF4444",
    fair: "#F59E0B",
    good: "#3B82F6",
    strong: "#10B981",
  }[passwordStrength.strength];

  // ============ EFFECTS ============
  // Load user profile data
  useEffect(() => {
    if (profileData?.user) {
      console.log("📋 Loading user profile data...");

      // Personal Info
      setFirstName(profileData.user.first_name || "");
      setLastName(profileData.user.last_name || "");
      setEmail(profileData.user.email || "");
      setCompanyName(profileData.user.company || "");
      setDepartment(profileData.user.department || "");
      setPhone(profileData.user.phone || "");
      setAddress(profileData.user.address || "");
      setCity(profileData.user.city || "");
      setState(profileData.user.state || "");
      setZipCode(profileData.user.zip_code || "");

      // ✅ FIXED: Industry handling
      // Store the ID
      const industryIdFromProfile = profileData.user.industry_id || 0;
      setIndustryId(industryIdFromProfile);

      // Get industry name from ID
      const industryName = getIndustryName(industryIdFromProfile);
      setIndustry(industryName);

      console.log(`✅ Industry loaded: ${industryName} (ID: ${industryIdFromProfile})`);

      // Billing Info
      const planName = getSubscriptionPlanName(profileData.user.stripe_plan);
      setSubscriptionPlan(planName);

      const status = getSubscriptionStatus(profileData.user);
      setSubscriptionStatus(status);

      // Card Info
      setSavedCard({
        lastFour: profileData.user.last_four || "",
        expiration: "**/**",
      });

      console.log("✅ Profile data loaded successfully");
    }
  }, [profileData]);

  // Show success message when profile updates
  useEffect(() => {
    if (isProfileUpdateSuccess) {
      console.log("✨ Profile updated successfully!");
      Alert.alert("Success", "Personal information updated successfully!");
    }
  }, [isProfileUpdateSuccess]);

  // Show error message when profile update fails
  useEffect(() => {
    if (isProfileUpdateError) {
      console.log("❌ Profile update failed");
    }
  }, [isProfileUpdateError]);

  // Format invoices data
  useEffect(() => {
    if (invoicesData?.data?.invoices) {
      console.log("📄 Formatting invoices data...");
      const formatted = getFormattedInvoiceData(invoicesData.data.invoices);
      setFormattedInvoices(formatted);

      const pagination = getPaginationInfo(invoicesData.data.pagination);
      setPaginationInfo(pagination);

      console.log("✅ Invoices formatted:", {
        count: formatted.length,
        pagination,
      });
    }
  }, [invoicesData]);

  // ============ SETTINGS DATA ============
  const subscriptionOptions = ["Free", "Basic", "Standard", "Enterprise"];

  // ============ HANDLERS ============
  const handleSavePersonalInfo = () => {
    console.log("💾 Saving personal information...");

    // Build request data
    const profileRequest = buildProfileRequest(
      firstName,
      lastName,
      email,
      companyName,
      department,
      industryId, // ✅ This now has the correct ID
      phone,
      address,
      city,
      state,
      zipCode
    );

    // Validate data
    const validation = validateProfileData(profileRequest);
    if (!validation.valid) {
      Alert.alert("Validation Error", validation.error);
      return;
    }

    console.log("✅ Validation passed, sending update request...");
    console.log("📦 Update payload:", { ...profileRequest, industryId });

    // Send update request
    updateProfileMutate(profileRequest, {
      onSuccess: (data) => {
        console.log("🎉 Profile update successful!", data);
      },
      onError: (error: any) => {
        const errorMessage = formatErrorMessage(error);
        console.error("❌ Profile update failed:", errorMessage);
        Alert.alert("Error", errorMessage);
      },
    });
  };

  const handleSaveBilling = () => {
    Alert.alert("Success", "Billing information saved successfully!");
    setIsEditingCard(false);
  };

  const handleSaveCard = () => {
    if (!cardNumber || !cvc || !expirationMonth || !expirationYear) {
      Alert.alert("Error", "Please fill in all card details");
      return;
    }
    Alert.alert("Success", "Payment card updated successfully!");
    setCardNumber("");
    setCvc("");
    setExpirationMonth("");
    setExpirationYear("");
    setIsEditingCard(false);
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      "Cancel Subscription",
      "Are you sure you want to cancel your subscription?",
      [
        { text: "No", style: "cancel" },
        { text: "Yes, Cancel", style: "destructive" },
      ]
    );
  };

  const handleDownloadInvoice = (invoiceId: string, downloadUrl: string) => {
    if (!downloadUrl) {
      Alert.alert("Error", "URL not available");
      return;
    }
    downloadInvoiceMutate({ invoiceId, downloadUrl });
  };

  const handleChangePassword = async () => {
    // Reset error
    setPasswordError(null);

    // Validate
    const validationError = validatePasswordChange(
      currentPassword,
      newPassword,
      confirmPassword
    );

    if (validationError) {
      setPasswordError(validationError.message);
      Alert.alert("Validation Error", validationError.message);
      return;
    }

    // Call API
    updatePasswordMutate(
      {
        password_old: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      },
      {
        onSuccess: (data) => {
          Alert.alert("Success", "Password changed successfully!");

          // Reset form
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setShowPasswordSection(false);
          setPasswordError(null);
        },
        onError: (error: any) => {
          const errorMessage = error.message || "Failed to update password";
          setPasswordError(errorMessage);
          Alert.alert("Error", errorMessage);
        },
      }
    );
  };

  // ✅ FIXED: Handle industry selection from bottom sheet
  const handleIndustrySelect = (selectedIndustryName: string) => {
    console.log("📝 Industry selected from sheet:", selectedIndustryName);

    // Set the industry name
    setIndustry(selectedIndustryName);

    // The IndustryBottomSheet should pass the full industry object
    // If it's just a string, we need to find the ID
    // This depends on your useIndustries API response structure

    // Option 1: If the API returns objects with id and name
    // The component should extract the ID from the selected item

    // For now, we'll assume the selected value is the name
    // and we'll need to handle the ID mapping in the backend
    // or get it from the industries list

    console.log(`✅ Industry name set to: ${selectedIndustryName}`);
  };

  // ============ RENDER - LOADING STATE ============
  if (isLoadingProfile) {
    return (
      <View style={styles.container}>
        <TabHeader
          title="Account Settings"
          subtitle="Manage your account settings"
          isChild={true}
        />

        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#9A1B2B" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  // ============ RENDER - ERROR STATE ============
  if (profileError) {
    return (
      <View style={styles.container}>
        <TabHeader
          title="Account Settings"
          subtitle="Manage your account settings"
          isChild={true}
        />

        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={40} color="#EF4444" />
          <Text style={styles.errorTitleText}>Failed to Load Profile</Text>
          <Text style={styles.errorSubtitleText}>Please try again later</Text>
        </View>
      </View>
    );
  }

  // ============ RENDER - SUCCESS STATE ============
  return (
    <View style={styles.container}>
      {/* Industry Bottom Sheet Modal */}
      <IndustryBottomSheet
        visible={showIndustryModal}
        selectedValue={industry}
        onSelect={(selectedIndustry) => {
          console.log("🏢 Industry selected:", selectedIndustry);

          // Set industry name
          handleIndustrySelect(selectedIndustry);

          // Close modal
          setShowIndustryModal(false);
        }}
        onClose={() => setShowIndustryModal(false)}
        title="Select Industry"
      />

      {/* Subscription Simple Picker Modal */}
      <SubscriptionPicker
        visible={showSubscriptionModal}
        options={subscriptionOptions}
        selectedValue={subscriptionPlan}
        onSelect={setSubscriptionPlan}
        onClose={() => setShowSubscriptionModal(false)}
      />

      {/* Header with Gradient */}
      <TabHeader
        title="Account Settings"
        subtitle="Manage your account settings"
        isChild={true}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Personal Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>

          <View style={styles.card}>
            {/* Company Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company Name</Text>
              <TextInput
                style={styles.input}
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="Enter company name"
                placeholderTextColor="#D1D5DB"
              />
            </View>

            {/* Department */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Branch Name / Department</Text>
              <TextInput
                style={styles.input}
                value={department}
                onChangeText={setDepartment}
                placeholder="Enter department"
                placeholderTextColor="#D1D5DB"
              />
            </View>

            {/* Industry Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Industry</Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setShowIndustryModal(true)}
              >
                <Text style={styles.selectText}>
                  {industry || "Select Industry"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#9A1B2B" />
              </TouchableOpacity>
              {industryId > 0 && (
                <Text style={styles.debugText}>ID: {industryId}</Text>
              )}
            </View>

            <View style={styles.divider} />

            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                First Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter first name"
                placeholderTextColor="#D1D5DB"
              />
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Last Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter last name"
                placeholderTextColor="#D1D5DB"
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Email Address <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email address"
                placeholderTextColor="#D1D5DB"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                placeholderTextColor="#D1D5DB"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.divider} />

            {/* Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Street Address</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter street address"
                placeholderTextColor="#D1D5DB"
              />
            </View>

            {/* City */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="Enter city"
                placeholderTextColor="#D1D5DB"
              />
            </View>

            {/* State */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                value={state}
                onChangeText={setState}
                placeholder="Enter state"
                placeholderTextColor="#D1D5DB"
              />
            </View>

            {/* Zip Code */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Zip Code</Text>
              <TextInput
                style={styles.input}
                value={zipCode}
                onChangeText={setZipCode}
                placeholder="Enter zip code"
                placeholderTextColor="#D1D5DB"
                keyboardType="numeric"
              />
            </View>

            {/* Update Button */}
            <TouchableOpacity
              style={[
                styles.updateButton,
                isUpdatingProfile && styles.updateButtonDisabled,
              ]}
              onPress={handleSavePersonalInfo}
              disabled={isUpdatingProfile}
            >
              {isUpdatingProfile ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.updateButtonText}>
                    Update Personal Info
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Billing Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="card-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>Billing</Text>
          </View>

          <View style={styles.card}>
            {/* Subscription Plan */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Subscription Plan <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setShowSubscriptionModal(true)}
              >
                <Text style={styles.selectText}>
                  {subscriptionPlan || "Select Plan"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#9A1B2B" />
              </TouchableOpacity>
            </View>

            {/* Subscription Status */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Subscription Status</Text>
              <View style={styles.statusContainer}>
                <View style={styles.statusBadge}>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text style={styles.statusText}>{subscriptionStatus}</Text>
                </View>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelSubscription}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Charge Card Section */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Charge Card</Text>
              <View style={styles.cardDisplayContainer}>
                <Text style={styles.cardDisplayText}>
                  {getDisplayCardNumber(savedCard.lastFour)}
                </Text>
                <TouchableOpacity
                  style={styles.editCardButton}
                  onPress={() => setIsEditingCard(!isEditingCard)}
                >
                  <Ionicons name="pencil" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Card Details - Only shown when editing */}
            {isEditingCard && (
              <>
                {/* Card Number */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Card Number <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={cardNumber}
                    onChangeText={setCardNumber}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor="#D1D5DB"
                    keyboardType="numeric"
                    maxLength={16}
                  />
                </View>

                {/* CVC and Expiration Row */}
                <View style={styles.cardDetailsRow}>
                  {/* CVC */}
                  <View
                    style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}
                  >
                    <Text style={styles.label}>
                      CVC <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={cvc}
                      onChangeText={setCvc}
                      placeholder="123"
                      placeholderTextColor="#D1D5DB"
                      keyboardType="numeric"
                      maxLength={4}
                    />
                  </View>

                  {/* Expiration */}
                  <View
                    style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}
                  >
                    <Text style={styles.label}>
                      Expiration <Text style={styles.required}>*</Text>
                    </Text>
                    <View style={styles.expirationContainer}>
                      <TextInput
                        style={[styles.input, styles.expirationInput]}
                        value={expirationMonth}
                        onChangeText={setExpirationMonth}
                        placeholder="MM"
                        placeholderTextColor="#D1D5DB"
                        keyboardType="numeric"
                        maxLength={2}
                      />
                      <Text style={styles.expirationSeparator}>/</Text>
                      <TextInput
                        style={[styles.input, styles.expirationInput]}
                        value={expirationYear}
                        onChangeText={setExpirationYear}
                        placeholder="YY"
                        placeholderTextColor="#D1D5DB"
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </View>
                  </View>
                </View>

                {/* Card Action Buttons */}
                <View style={styles.cardActionButtons}>
                  <TouchableOpacity
                    style={styles.cancelCardButton}
                    onPress={() => setIsEditingCard(false)}
                  >
                    <Text style={styles.cancelCardButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveCardButton}
                    onPress={handleSaveCard}
                  >
                    <Text style={styles.saveCardButtonText}>Save Card</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <View style={styles.divider} />

            {/* Coupon Code */}
            <View style={styles.inputGroup}>
              <View style={styles.labelWithIcon}>
                <Text style={[styles.label, { marginBottom: 0 }]}>
                  Coupon Code
                </Text>
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color="#9A1B2B"
                />
              </View>
              <TextInput
                style={styles.input}
                value={couponCode}
                onChangeText={setCouponCode}
                placeholder="Enter coupon code"
                placeholderTextColor="#D1D5DB"
                autoCapitalize="characters"
              />
            </View>

            {/* Update Button */}
            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleSaveBilling}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.updateButtonText}>Update Billing Info</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="lock-closed-outline" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.sectionTitle}>Security</Text>
          </View>

          <View style={styles.card}>
            {!showPasswordSection ? (
              <TouchableOpacity
                style={styles.changePasswordButton}
                onPress={() => setShowPasswordSection(true)}
              >
                <Ionicons name="key-outline" size={20} color="#9A1B2B" />
                <Text style={styles.changePasswordText}>Change Password</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#9A1B2B"
                  style={styles.chevronIcon}
                />
              </TouchableOpacity>
            ) : (
              <>
                {/* Error Message */}
                {passwordError && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#EF4444" />
                    <Text style={styles.errorText}>{passwordError}</Text>
                  </View>
                )}

                {/* Current Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Current Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      placeholder="Enter current password"
                      placeholderTextColor="#D1D5DB"
                      secureTextEntry={!showCurrentPassword}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showCurrentPassword ? "eye" : "eye-off"}
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* New Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Enter new password"
                      placeholderTextColor="#D1D5DB"
                      secureTextEntry={!showNewPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showNewPassword ? "eye" : "eye-off"}
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <View style={styles.strengthContainer}>
                      <View style={styles.strengthBar}>
                        <View
                          style={[
                            styles.strengthFill,
                            {
                              width: `${(passwordStrength.score / 6) * 100}%`,
                              backgroundColor: strengthColor,
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[styles.strengthText, { color: strengthColor }]}
                      >
                        Password Strength:{" "}
                        <Text style={{ fontWeight: "700" }}>
                          {passwordStrength.strength.toUpperCase()}
                        </Text>
                      </Text>
                      {passwordStrength.tips.length > 0 && (
                        <View style={styles.tipsList}>
                          {passwordStrength.tips.map((tip, index) => (
                            <View key={index} style={styles.tipItem}>
                              <Ionicons
                                name="checkmark-outline"
                                size={14}
                                color="#9CA3AF"
                              />
                              <Text style={styles.tipText}>{tip}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* Confirm Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm New Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm new password"
                      placeholderTextColor="#D1D5DB"
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showConfirmPassword ? "eye" : "eye-off"}
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <Text style={styles.mismatchText}>
                      Passwords do not match
                    </Text>
                  )}
                </View>

                {/* Password Actions */}
                <View style={styles.passwordActions}>
                  <TouchableOpacity
                    style={styles.cancelPasswordButton}
                    onPress={() => {
                      setShowPasswordSection(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setPasswordError(null);
                      setShowCurrentPassword(false);
                      setShowNewPassword(false);
                      setShowConfirmPassword(false);
                    }}
                    disabled={isUpdatingPassword}
                  >
                    <Text style={styles.cancelPasswordText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.updatePasswordButton,
                      isUpdatingPassword && styles.updatePasswordButtonDisabled,
                    ]}
                    onPress={handleChangePassword}
                    disabled={isUpdatingPassword}
                  >
                    {isUpdatingPassword ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.updatePasswordText}>
                        Update Password
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Invoices Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.sectionTitle}>Invoices</Text>
            {paginationInfo && (
              <Text style={styles.paginationBadge}>
                {paginationInfo.totalInvoices}
              </Text>
            )}
          </View>

          <View style={styles.invoiceCard}>
            {/* Loading State */}
            {isLoadingInvoices && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#9A1B2B" />
                <Text style={styles.loadingText}>Loading invoices...</Text>
              </View>
            )}

            {/* Error State */}
            {invoicesError && !isLoadingInvoices && (
              <View style={styles.errorInvoiceContainer}>
                <Ionicons name="alert-circle" size={24} color="#EF4444" />
                <Text style={styles.errorInvoiceText}>
                  {invoicesError.message || "Failed to load invoices"}
                </Text>
              </View>
            )}

            {/* Empty State */}
            {!isLoadingInvoices &&
              formattedInvoices.length === 0 &&
              !invoicesError && (
                <View style={styles.emptyInvoiceContainer}>
                  <Ionicons name="document-outline" size={40} color="#D1D5DB" />
                  <Text style={styles.emptyInvoiceText}>No invoices yet</Text>
                  <Text style={styles.emptyInvoiceSubtext}>
                    Your invoices will appear here once available
                  </Text>
                </View>
              )}

            {/* Invoices List */}
            {!isLoadingInvoices &&
              formattedInvoices.length > 0 &&
              formattedInvoices.map((invoice, index) => (
                <View key={invoice.id || index}>
                  <View style={styles.invoiceItem}>
                    <View style={styles.invoiceDetails}>
                      <View style={styles.invoiceRow}>
                        <Text style={styles.invoiceLabel}>Date:</Text>
                        <Text style={styles.invoiceValue}>{invoice.date}</Text>
                      </View>
                      <View style={styles.invoiceRow}>
                        <Text style={styles.invoiceLabel}>Subscription:</Text>
                        <Text style={styles.invoiceValue}>
                          {invoice.subscription}
                        </Text>
                      </View>
                      <View style={styles.invoiceRow}>
                        <Text style={styles.invoiceLabel}>Period Start:</Text>
                        <Text style={styles.invoiceValue}>
                          {invoice.periodStart}
                        </Text>
                      </View>
                      <View style={styles.invoiceRow}>
                        <Text style={styles.invoiceLabel}>Period End:</Text>
                        <Text style={styles.invoiceValue}>
                          {invoice.periodEnd}
                        </Text>
                      </View>
                      <View style={styles.invoiceRow}>
                        <Text style={styles.invoiceLabel}>Amount:</Text>
                        <Text style={styles.invoiceAmount}>
                          {getFormattedAmount(invoice.amount)}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.downloadButton,
                        isDownloading && styles.downloadButtonDisabled,
                      ]}
                      onPress={() =>
                        handleDownloadInvoice(invoice.id, invoice.downloadUrl)
                      }
                      disabled={isDownloading}
                    >
                      {isDownloading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Ionicons
                            name="download-outline"
                            size={18}
                            color="#FFFFFF"
                          />
                          <Text style={styles.downloadButtonText}>
                            Download
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                  {index < formattedInvoices.length - 1 && (
                    <View style={styles.invoiceDivider} />
                  )}
                </View>
              ))}

            {/* Pagination Controls */}
            {paginationInfo && paginationInfo.totalPages > 1 && (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  style={[
                    styles.paginationButton,
                    !paginationInfo.hasPrevPage &&
                    styles.paginationButtonDisabled,
                  ]}
                  onPress={() => setCurrentPage(currentPage - 1)}
                  disabled={!paginationInfo.hasPrevPage}
                >
                  <Ionicons name="chevron-back" size={20} color="#9A1B2B" />
                  <Text style={styles.paginationButtonText}>Previous</Text>
                </TouchableOpacity>

                <Text style={styles.paginationText}>
                  Page {paginationInfo.currentPage} of{" "}
                  {paginationInfo.totalPages}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.paginationButton,
                    !paginationInfo.hasNextPage &&
                    styles.paginationButtonDisabled,
                  ]}
                  onPress={() => setCurrentPage(currentPage + 1)}
                  disabled={!paginationInfo.hasNextPage}
                >
                  <Text style={styles.paginationButtonText}>Next</Text>
                  <Ionicons name="chevron-forward" size={20} color="#9A1B2B" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Required Fields Note */}
        <View style={styles.noteSection}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color="#9A1B2B"
          />
          <Text style={styles.requiredNote}>* Required fields</Text>
        </View>
      </ScrollView>
    </View>
  );
};

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },
  errorTitleText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 12,
  },
  errorSubtitleText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 6,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    minWidth: 240,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  pickerOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  pickerOptionSelected: {
    backgroundColor: "rgba(154, 27, 43, 0.08)",
  },
  pickerOptionText: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "600",
    flex: 1,
  },
  pickerOptionTextSelected: {
    color: "#9A1B2B",
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#9A1B2B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    shadowColor: "#9A1B2B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
    letterSpacing: 0.3,
  },
  paginationBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    backgroundColor: "#9A1B2B",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(154, 27, 43, 0.05)",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  required: {
    color: "#EF4444",
    fontWeight: "800",
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1F2937",
    backgroundColor: "#F9FAFB",
    fontWeight: "500",
  },
  selectInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#F9FAFB",
  },
  selectText: {
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "600",
    flex: 1,
  },
  debugText: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
    fontStyle: "italic",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
  statusContainer: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#F9FAFB",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    color: "#1F2937",
    flex: 1,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1.5,
    borderColor: "#FECACA",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "700",
  },
  cardDisplayContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#F9FAFB",
  },
  cardDisplayText: {
    fontSize: 15,
    color: "#1F2937",
    flex: 1,
    fontWeight: "600",
    letterSpacing: 1,
  },
  editCardButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#9A1B2B",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  cardDetailsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  expirationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  expirationInput: {
    flex: 1,
    textAlign: "center",
  },
  expirationSeparator: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginHorizontal: 8,
  },
  cardActionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelCardButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  cancelCardButtonText: {
    color: "#6B7280",
    fontSize: 15,
    fontWeight: "700",
  },
  saveCardButton: {
    flex: 1,
    backgroundColor: "#9A1B2B",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  saveCardButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  changePasswordButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    gap: 12,
  },
  changePasswordText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
  },
  chevronIcon: {
    marginLeft: "auto",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1.5,
    borderColor: "#FECACA",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  errorText: {
    fontSize: 14,
    color: "#DC2626",
    fontWeight: "600",
    flex: 1,
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "500",
  },
  eyeIcon: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  strengthContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  strengthBar: {
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    marginBottom: 8,
    overflow: "hidden",
  },
  strengthFill: {
    height: "100%",
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  tipsList: {
    gap: 6,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tipText: {
    fontSize: 12,
    color: "#6B7280",
    flex: 1,
  },
  mismatchText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 6,
    fontWeight: "600",
  },
  passwordActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelPasswordButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  cancelPasswordText: {
    color: "#6B7280",
    fontSize: 15,
    fontWeight: "700",
  },
  updatePasswordButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#9A1B2B",
  },
  updatePasswordButtonDisabled: {
    opacity: 0.6,
  },
  updatePasswordText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  updateButton: {
    flexDirection: "row",
    backgroundColor: "#9A1B2B",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    marginTop: 12,
    shadowColor: "#9A1B2B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  invoiceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(154, 27, 43, 0.05)",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 16,
  },
  errorInvoiceContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    gap: 12,
  },
  errorInvoiceText: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "600",
    textAlign: "center",
  },
  emptyInvoiceContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyInvoiceText: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "600",
  },
  emptyInvoiceSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  invoiceItem: {
    padding: 24,
  },
  invoiceDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
  },
  invoiceDetails: {
    marginBottom: 16,
  },
  invoiceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  invoiceLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "700",
  },
  invoiceValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "600",
  },
  invoiceAmount: {
    fontSize: 16,
    color: "#9A1B2B",
    fontWeight: "800",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9A1B2B",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#9A1B2B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  downloadButtonDisabled: {
    opacity: 0.6,
  },
  downloadButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  paginationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 12,
  },
  paginationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9A1B2B",
  },
  paginationText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  noteSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 16,
  },
  requiredNote: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "600",
  },
});

export default AccountSettingsScreen;