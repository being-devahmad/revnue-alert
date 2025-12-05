import { useIndustries } from "@/api/settings/useGetIndustries";
import {
  getIndustryName,
  getSubscriptionPlanName,
  useGetUserDetails,
} from "@/api/settings/useGetUserDetails";
import {
  getSubscriptionStatus,
  useChangePlan,
  usePlans,
} from "@/api/settings/usePlans";
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
import { InvoicesSection } from "@/components/InvoiceSection";
import { SubscriptionPicker } from "@/components/SubscriptionPicker";
import { TabHeader } from "@/components/TabHeader";
import { IndustryBottomSheet } from "@/components/ui/IndustryModal";
import { Ionicons } from "@expo/vector-icons";
import { CardField, createToken } from "@stripe/stripe-react-native";
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

const AccountSettingsScreen = () => {
  // ============ PERSONAL INFO STATE ============
  const [companyName, setCompanyName] = useState("");
  const [department, setDepartment] = useState("");
  const [industry, setIndustry] = useState(""); // ← display name
  const [industryId, setIndustryId] = useState(0); // ← saved ID
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
  const [cvc, setCvc] = useState("");
  const [cardToken, setCardToken] = useState(""); // For Stripe token
  const [couponCode, setCouponCode] = useState("");
  const [isEditingCard, setIsEditingCard] = useState(false);
  // Add these with your other useState at the top
  const [isTokenizingCard, setIsTokenizingCard] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showPlanConfirm, setShowPlanConfirm] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardDetails, setCardDetails] = useState<any>(null);

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

  // ============ MODAL STATES ============
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // ============ USER PROFILE API ============
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    error: profileError,
  } = useGetUserDetails();

  useIndustries(); // ← populates industriesMapCache automatically

  const {
    mutate: updateProfileMutate,
    isPending: isUpdatingProfile,
    isSuccess: isProfileUpdateSuccess,
    isError: isProfileUpdateError,
  } = useUpdateUserProfile();

  const { data: plansData, isLoading: isLoadingPlans } = usePlans();

  console.log("plans-data-->", plansData);

  const { mutate: changeplanMutate, isPending: isChangingPlan } =
    useChangePlan();

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

      console.log(
        `✅ Industry loaded: ${industryName} (ID: ${industryIdFromProfile})`
      );

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

  // ============ SETTINGS DATA ============
  const subscriptionOptions = ["Free", "Basic", "Standard", "Enterprise"];

  // ============ HANDLERS ============
  const handleSavePersonalInfo = () => {
    const payload = buildProfileRequest(
      firstName,
      lastName,
      email,
      companyName,
      department,
      industryId, // ← correct ID is sent
      phone,
      address,
      city,
      state,
      zipCode
    );

    const validation = validateProfileData(payload);
    if (!validation.valid) {
      Alert.alert("Validation Error", validation.error);
      return;
    }

    updateProfileMutate(payload, {
      onSuccess: () => Alert.alert("Success", "Personal information updated!"),
      onError: (err: any) => Alert.alert("Error", formatErrorMessage(err)),
    });
  };

  // const handleSaveBilling = () => {
  //   Alert.alert("Success", "Billing information saved successfully!");
  //   setIsEditingCard(false);
  // };

  // const handleSaveCard = () => {
  //   if (!cardNumber || !cvc || !expirationMonth || !expirationYear) {
  //     Alert.alert("Error", "Please fill in all card details");
  //     return;
  //   }
  //   Alert.alert("Success", "Payment card updated successfully!");
  //   setCardNumber("");
  //   setCvc("");
  //   setExpirationMonth("");
  //   setExpirationYear("");
  //   setIsEditingCard(false);
  // };

  // const handleCancelSubscription = () => {
  //   Alert.alert(
  //     "Cancel Subscription",
  //     "Are you sure you want to cancel your subscription?",
  //     [
  //       { text: "No", style: "cancel" },
  //       { text: "Yes, Cancel", style: "destructive" },
  //     ]
  //   );
  // };

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
  const handleIndustrySelect = (selectedIndustry: {
    id: number;
    name: string;
  }) => {
    console.log("📝 Industry selected from sheet:", selectedIndustry);

    // Set both the industry name and ID
    setIndustry(selectedIndustry.name);
    setIndustryId(selectedIndustry.id);

    console.log(
      `✅ Industry updated: ${selectedIndustry.name} (ID: ${selectedIndustry.id})`
    );
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
            {/* Plans List from API */}
            {isLoadingPlans ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator color="#9A1B2B" />
              </View>
            ) : (
              <>
                {plansData?.data?.plans?.map((plan: any) => {
                  const isCurrent = plan.id === profileData?.user?.stripe_plan;
                  const amount = (plan.amount / 100).toFixed(2);

                  let displayName = `${plan.name} - ${amount} $`;

                  // Discount Logic
                  if (plan.on_full_discount) {
                    displayName += " — 100% off (Forever)";
                  } else if (plan.discount_ends_at) {
                    const date = new Date(
                      plan.discount_ends_at
                    ).toLocaleDateString();
                    displayName += ` — ${
                      plan.discount_description || "Discount"
                    } (Expires: ${date})`;
                  }

                  return (
                    <TouchableOpacity
                      key={plan.id}
                      style={[
                        styles.planOption,
                        isCurrent && styles.planOptionSelected,
                      ]}
                      onPress={() => {
                        if (!isCurrent) {
                          setSelectedPlanId(plan.id);
                          setShowPlanConfirm(true);
                        }
                      }}
                    >
                      <View>
                        <Text style={styles.planName}>{displayName}</Text>
                        {isCurrent && (
                          <Text style={styles.currentPlanText}>
                            Current Plan
                          </Text>
                        )}
                      </View>
                      {isCurrent && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color="#10B981"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            <View style={styles.divider} />

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
                  onPress={() => {
                    Alert.alert(
                      "Cancel Subscription",
                      "This feature is not available in the mobile app. To cancel your subscription, please log in through the web portal",
                      [{ text: "OK", style: "default" }]
                    );
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Payment Method */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Payment Method</Text>
              <View style={styles.cardDisplayContainer}>
                <Text style={styles.cardDisplayText}>
                  {savedCard.lastFour
                    ? `•••• •••• •••• ${savedCard.lastFour}`
                    : "No card on file"}
                </Text>
                <TouchableOpacity
                  style={styles.editCardButton}
                  // onPress={() => setIsEditingCard(true)}
                  onPress={()=> Alert.alert("This feature is currently not available in the mobile app. To change your subscription, please log in through the web portal.")}
                >
                  <Ionicons name="pencil" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Stripe Card Input Modal */}
            <Modal visible={isEditingCard} transparent animationType="slide">
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Update Payment Method</Text>

                  <CardField
                    postalCodeEnabled={false}
                    placeholders={{ number: "4242 4242 4242 4242" }}
                    cardStyle={{
                      backgroundColor: "#333333",
                      borderColor: "#E5E7EB",
                      borderWidth: 1.5,
                      borderRadius: 12,
                    }}
                    style={{
                      width: "100%",
                      height: 50,
                      marginVertical: 20,
                    }}
                    onCardChange={(cardDetails) => {
                      setCardComplete(cardDetails.complete);
                      setCardDetails(cardDetails);
                    }}
                  />

                  <View style={styles.cardActionButtons}>
                    <TouchableOpacity
                      style={styles.cancelCardButton}
                      onPress={() => {
                        setIsEditingCard(false);
                        setCardComplete(false);
                      }}
                    >
                      <Text style={styles.cancelCardButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.saveCardButton,
                        !cardComplete && { opacity: 0.6 },
                      ]}
                      disabled={!cardComplete || isChangingPlan}
                      onPress={async () => {
                        if (!cardComplete || !cardDetails) return;

                        setIsTokenizingCard(true);
                        try {
                          const { token, error } = await createToken({
                            ...cardDetails,
                            type: "card",
                          });

                          if (error) throw error;

                          // Call your update card API
                          // await updateCard(token.id);

                          Alert.alert("Success", "Card updated successfully!");
                          setIsEditingCard(false);
                          // Refresh user data if needed
                        } catch (err: any) {
                          Alert.alert(
                            "Error",
                            err.message || "Failed to update card"
                          );
                        } finally {
                          setIsTokenizingCard(false);
                        }
                      }}
                    >
                      {isChangingPlan ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <Text style={styles.saveCardButtonText}>Save Card</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            <View style={styles.divider} />

            {/* Coupon Code */}
            {/* <View style={styles.inputGroup}>
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
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={couponCode}
                  onChangeText={setCouponCode}
                  placeholder="e.g. DIRECT-BILL-100"
                  placeholderTextColor="#D1D5DB"
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={styles.applyCouponButton}
                  onPress={async () => {
                    if (!couponCode) return;
                    // Simulate applying coupon (your backend should validate)
                    Alert.alert("Success", `Coupon "${couponCode}" applied!`);
                    // Refresh plans to show discount
                    // refetchPlans();
                  }}
                >
                  <Text style={styles.applyCouponText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View> */}

            {/* Confirm Plan Change Modal */}
            <Modal visible={showPlanConfirm} transparent>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Confirm Plan Change</Text>
                  <Text style={{ marginVertical: 20, textAlign: "center" }}>
                    Switch to this plan now?
                  </Text>
                  <View style={styles.cardActionButtons}>
                    <TouchableOpacity
                      style={styles.cancelCardButton}
                      onPress={() => setShowPlanConfirm(false)}
                    >
                      <Text style={styles.cancelCardButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveCardButton}
                      onPress={async () => {
                        setShowPlanConfirm(false);
                        changeplanMutate(
                          {
                            plan_id: selectedPlanId,
                            payment_method_token: cardToken || undefined, // reuse saved or new
                            coupon: couponCode || undefined,
                          },
                          {
                            onSuccess: () => {
                              Alert.alert(
                                "Success",
                                "Plan updated successfully!"
                              );
                            },
                            onError: (err: any) => {
                              Alert.alert(
                                "Error",
                                err.message || "Failed to change plan"
                              );
                            },
                          }
                        );
                      }}
                    >
                      <Text style={styles.saveCardButtonText}>Confirm</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
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
        <InvoicesSection
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />

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

  // notes section
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

  // billing styles
  planOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  planOptionSelected: {
    backgroundColor: "rgba(154, 27, 43, 0.08)",
  },
  planName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  currentPlanText: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "700",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    color: "#1F2937",
  },
  applyCouponButton: {
    backgroundColor: "#9A1B2B",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  applyCouponText: {
    color: "#FFF",
    fontWeight: "700",
  },
});

export default AccountSettingsScreen;
