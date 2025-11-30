import { Industry, SearchableIndustryDropdown } from "@/components/ui/IndustryDropdown";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface UserFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  industry: Industry;
  companyName: string;
  email: string;
  password: string;
  confirmPassword: string;
  couponCode: string;
}

const SignupScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Plan data from route params
  const planId = params.planId as string;
  const planName = params.planName as string;
  const billingCycle = params.billingCycle as string;
  const price = params.price as string;
  const priceId = params.priceId as string;
  const productId = params.productId as string;

  // Form state
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [industry, setIndustry] = useState<Industry | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Industries list - from params, NOT hardcoded
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [isLoadingIndustries, setIsLoadingIndustries] = useState(true);

  // Track if industry is locked (for Home & Family)
  const [isIndustryLocked, setIsIndustryLocked] = useState(false);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);

  // ============ INITIALIZE INDUSTRIES FROM PARAMS ============
  useEffect(() => {
    console.log("\n🔄 ===== SIGNUP SCREEN MOUNTED =====");
    console.log("📦 Received params from PlanSelection:");
    console.log("  - planName:", planName);
    console.log("  - planId:", planId);
    console.log("  - industries param:", params.industries ? "✅ EXISTS" : "❌ MISSING");

    try {
      setIsLoadingIndustries(true);

      // Parse industries from params (passed from PlanSelectionScreen)
      const industriesParam = params.industries as string;

      if (industriesParam) {
        console.log("✅ Industries param found, parsing...");
        const parsedIndustries = JSON.parse(industriesParam);

        console.log("✅ Industries successfully parsed!");
        console.log(`📊 Total industries: ${parsedIndustries.length}`);
        console.log("📋 Industry names:", parsedIndustries.map((ind: Industry) => ind.name).join(", "));

        setIndustries(parsedIndustries);

        // ============ AUTO-SELECT LOGIC FOR "Home & Family" ============
        if (planName === "Home & Family") {
          console.log("\n🏠 ===== HOME & FAMILY PLAN DETECTED =====");
          console.log("🔍 Looking for 'Home & Family' industry (with &) to auto-select & lock...");

          const homeAndFamilyIndustry = parsedIndustries.find(
            (ind: Industry) => {
              const normalizedName = ind.name.toLowerCase().trim();
              const targetName = "home & family".toLowerCase().trim();
              console.log(`  Checking: "${ind.name}" === "Home & Family" ? ${normalizedName === targetName}`);
              return normalizedName === targetName;
            }
          );

          if (homeAndFamilyIndustry) {
            console.log("✅ Home & Family industry FOUND!");
            console.log(`   ID: ${homeAndFamilyIndustry.id}, Name: ${homeAndFamilyIndustry.name}`);
            console.log("✅ AUTO-SELECTING & LOCKING Home & Family...\n");
            setIndustry(homeAndFamilyIndustry);
            setIsIndustryLocked(true);
          } else {
            console.warn("⚠️  Home & Family industry NOT FOUND");
            console.log("❌ Available industries:", parsedIndustries.map((ind: Industry) => ind.name));
          }
        } else {
          console.log(`ℹ️  Plan is: "${planName}" (not Home & Family), industries not locked\n`);
          setIsIndustryLocked(false);
        }
      } else {
        console.error("❌ No industries param received from PlanSelectionScreen!");
        setIndustries([]);
      }
    } catch (error) {
      console.error("❌ Error parsing industries:", error);
      setIndustries([]);
    } finally {
      setIsLoadingIndustries(false);
    }
  }, [params.industries, planName]);

  // ============ FORM VALIDATION ============
  const validateForm = (): boolean => {
    if (!firstName.trim()) {
      Alert.alert("Validation Error", "Please enter your first name");
      return false;
    }

    if (!lastName.trim()) {
      Alert.alert("Validation Error", "Please enter your last name");
      return false;
    }

    if (!email.trim()) {
      Alert.alert("Validation Error", "Please enter your email address");
      return false;
    }

    if (!email.includes("@")) {
      Alert.alert("Validation Error", "Please enter a valid email address");
      return false;
    }

    if (!password) {
      Alert.alert("Validation Error", "Please create a password");
      return false;
    }

    if (password.length < 8) {
      Alert.alert("Validation Error", "Password must be at least 8 characters");
      return false;
    }

    if (!confirmPassword) {
      Alert.alert("Validation Error", "Please confirm your password");
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match");
      return false;
    }

    if (!industry) {
      Alert.alert("Validation Error", "Please select an industry");
      return false;
    }

    return true;
  };

  // ============ HANDLE CONTINUE TO PAYMENT ============
  const handleContinueToPayment = async () => {
    if (!validateForm()) return;

    if (!industry) {
      Alert.alert("Error", "Industry not selected");
      return;
    }

    setIsProcessing(true);

    try {
      console.log("\n📋 ===== COLLECTING USER DATA =====");
      console.log("NO API CALL YET - Just collecting form data for payment screen");

      // Prepare user form data to pass to payment screen
      const userFormData: UserFormData = {
        firstName,
        middleName,
        lastName,
        industry,
        companyName,
        email: email.trim(),
        password,
        confirmPassword,
        couponCode,
      };

      console.log("✅ User data collected:", {
        firstName,
        lastName,
        email,
        industryId: industry.id,
        industryName: industry.name,
      });

      setTimeout(() => {
        setIsProcessing(false);

        console.log("📤 Navigating to payment screen with user data...");

        // Navigate to payment screen with BOTH plan data and user form data
        router.push({
          pathname: "/(auth)/paymentForm",
          params: {
            // Plan data
            planId,
            planName,
            billingCycle,
            price,
            priceId,
            productId,
            // User form data - pass as JSON string
            userFormData: JSON.stringify(userFormData),
          }
        });
      }, 500);
    } catch (error: any) {
      console.error("❌ Unexpected error:", error);
      Alert.alert("Error", "An unexpected error occurred");
      setIsProcessing(false);
    }
  };

  // ============ RENDER ============

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* ===== Fixed Header ===== */}
      <View style={styles.headerContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/icons/logo_transparent.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* ===== Scrollable Form Section ===== */}
      <SafeAreaView style={styles.formWrapper} edges={["bottom"]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={true}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.formContainer}>
              {/* Plan Summary Badge */}
              <View style={styles.planBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.planBadgeText}>
                  {planName} - ${price}/{billingCycle === "month" ? "mo" : "yr"}
                </Text>
              </View>

              {/* Form Title */}
              <Text style={styles.formTitle}>Complete Your Profile</Text>
              <Text style={styles.formSubtitle}>
                Create your RenewAlert account
              </Text>

              {/* ===== PERSONAL INFORMATION ===== */}
              <Text style={styles.sectionTitle}>Personal Information</Text>

              {/* First Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  First Name <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    focusedInput === "firstName" && styles.inputFocused,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={focusedInput === "firstName" ? "#800000" : "#9CA3AF"}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter first name"
                    placeholderTextColor="#9CA3AF"
                    value={firstName}
                    onChangeText={setFirstName}
                    onFocus={() => setFocusedInput("firstName")}
                    onBlur={() => setFocusedInput(null)}
                    editable={!isProcessing}
                  />
                </View>
              </View>

              {/* Middle Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Middle Name</Text>
                <View
                  style={[
                    styles.inputContainer,
                    focusedInput === "middleName" && styles.inputFocused,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={focusedInput === "middleName" ? "#800000" : "#9CA3AF"}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter middle name (optional)"
                    placeholderTextColor="#9CA3AF"
                    value={middleName}
                    onChangeText={setMiddleName}
                    onFocus={() => setFocusedInput("middleName")}
                    onBlur={() => setFocusedInput(null)}
                    editable={!isProcessing}
                  />
                </View>
              </View>

              {/* Last Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Last Name <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    focusedInput === "lastName" && styles.inputFocused,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={focusedInput === "lastName" ? "#800000" : "#9CA3AF"}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter last name"
                    placeholderTextColor="#9CA3AF"
                    value={lastName}
                    onChangeText={setLastName}
                    onFocus={() => setFocusedInput("lastName")}
                    onBlur={() => setFocusedInput(null)}
                    editable={!isProcessing}
                  />
                </View>
              </View>

              {/* ===== COMPANY INFORMATION ===== */}
              <View style={styles.sectionDivider} />
              <Text style={styles.sectionTitle}>Company Information</Text>

              {/* Industry Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Industry <Text style={styles.required}>*</Text>
                </Text>

                {isLoadingIndustries ? (
                  <View style={styles.loadingDropdown}>
                    <ActivityIndicator size="small" color="#800000" />
                    <Text style={styles.loadingDropdownText}>Loading industries...</Text>
                  </View>
                ) : industries.length > 0 ? (
                  <>
                    <SearchableIndustryDropdown
                      industries={industries}
                      selectedIndustry={industry}
                      onSelect={(selectedInd) => {
                        if (!isIndustryLocked) {
                          console.log("🎯 Industry selected:", selectedInd.name);
                          setIndustry(selectedInd);
                        }
                      }}
                      disabled={isProcessing}
                      isLocked={isIndustryLocked}
                    />
                  </>
                ) : (
                  <View style={styles.errorDropdown}>
                    <Ionicons name="alert-circle" size={18} color="#EF4444" />
                    <Text style={styles.errorDropdownText}>
                      No industries available. Please go back and select a plan.
                    </Text>
                  </View>
                )}
              </View>

              {/* Company Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Company Name</Text>
                <View
                  style={[
                    styles.inputContainer,
                    focusedInput === "companyName" && styles.inputFocused,
                  ]}
                >
                  <Ionicons
                    name="business-outline"
                    size={20}
                    color={focusedInput === "companyName" ? "#800000" : "#9CA3AF"}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter company name (optional)"
                    placeholderTextColor="#9CA3AF"
                    value={companyName}
                    onChangeText={setCompanyName}
                    onFocus={() => setFocusedInput("companyName")}
                    onBlur={() => setFocusedInput(null)}
                    editable={!isProcessing}
                  />
                </View>
              </View>

              {/* ===== ACCOUNT DETAILS ===== */}
              <View style={styles.sectionDivider} />
              <Text style={styles.sectionTitle}>Account Details</Text>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Email Address <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    focusedInput === "email" && styles.inputFocused,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={focusedInput === "email" ? "#800000" : "#9CA3AF"}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedInput("email")}
                    onBlur={() => setFocusedInput(null)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isProcessing}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Password <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    focusedInput === "password" && styles.inputFocused,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={focusedInput === "password" ? "#800000" : "#9CA3AF"}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Create a password (8+ characters)"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    onFocus={() => setFocusedInput("password")}
                    onBlur={() => setFocusedInput(null)}
                    editable={!isProcessing}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={isProcessing}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Confirm Password <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    focusedInput === "confirmPassword" && styles.inputFocused,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={focusedInput === "confirmPassword" ? "#800000" : "#9CA3AF"}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor="#9CA3AF"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    onFocus={() => setFocusedInput("confirmPassword")}
                    onBlur={() => setFocusedInput(null)}
                    editable={!isProcessing}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isProcessing}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ===== PROMO CODE ===== */}
              <View style={styles.sectionDivider} />

              {/* Coupon Code */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Promo or Coupon Code</Text>
                <View
                  style={[
                    styles.inputContainer,
                    focusedInput === "couponCode" && styles.inputFocused,
                  ]}
                >
                  <Ionicons
                    name="pricetag-outline"
                    size={20}
                    color={focusedInput === "couponCode" ? "#800000" : "#9CA3AF"}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter coupon code (optional)"
                    placeholderTextColor="#9CA3AF"
                    value={couponCode}
                    onChangeText={setCouponCode}
                    onFocus={() => setFocusedInput("couponCode")}
                    onBlur={() => setFocusedInput(null)}
                    autoCapitalize="characters"
                    editable={!isProcessing}
                  />
                </View>
              </View>

              {/* Terms & Conditions */}
              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  By continuing, you agree to our{" "}
                  <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </View>

              {/* Continue to Payment Button */}
              <TouchableOpacity
                style={[
                  styles.createAccountButton,
                  isProcessing && styles.createAccountButtonDisabled,
                ]}
                onPress={handleContinueToPayment}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <ActivityIndicator size="small" color="#FFF" />
                    <Text style={styles.createAccountButtonText}>
                      Continuing...
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.createAccountButtonText}>
                      Continue to Payment
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                  </>
                )}
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account?</Text>
                <TouchableOpacity
                  onPress={() => router.replace("/(auth)/login")}
                  disabled={isProcessing}
                >
                  <Text style={styles.loginLink}> Log in</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.bottomSpacing} />
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaView>
  );
};

export default SignupScreen;

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#800000",
  },
  headerContainer: {
    backgroundColor: "#800000",
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 350,
    height: 350,
  },
  formWrapper: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  formContainer: {
    backgroundColor: "#FFF",
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  planBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  planBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#059669",
  },
  formTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
    marginTop: 20,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 24,
  },
  inputGroup: {
    marginBottom: 20,
    position: "relative",
    zIndex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
  },
  required: {
    color: "#DC2626",
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  inputFocused: {
    borderColor: "#800000",
    backgroundColor: "#FFFBF5",
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "500",
  },
  loadingDropdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  loadingDropdownText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  errorDropdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1.5,
    borderColor: "#FECACA",
    gap: 8,
  },
  errorDropdownText: {
    fontSize: 13,
    color: "#DC2626",
    fontWeight: "500",
    flex: 1,
  },
  termsContainer: {
    paddingVertical: 16,
    marginBottom: 24,
  },
  termsText: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 20,
    textAlign: "center",
  },
  termsLink: {
    color: "#800000",
    fontWeight: "700",
  },
  createAccountButton: {
    backgroundColor: "#800000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginBottom: 20,
    shadowColor: "#800000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  createAccountButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  createAccountButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  loginText: {
    color: "#6B7280",
    fontSize: 14,
  },
  loginLink: {
    color: "#800000",
    fontSize: 14,
    fontWeight: "700",
  },
  bottomSpacing: {
    height: 40,
  },
});