import { RegisterRequest, useRegister } from "@/api/auth/useRegister";
import { useGetAllIndustries } from "@/api/settings/useGetIndustries";
import { Industry, SearchableIndustryDropdown } from "@/components/ui/IndustryDropdown";
import { useAuthStore } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import Purchases from "react-native-purchases";


import { PromoData, useVerifyPromo } from "@/api/auth/useVerifyPromo";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


const SignupScreen = () => {
  const router = useRouter();
  const { login: storeLogin } = useAuthStore();
  const params = useLocalSearchParams();

  // Plan data from route params
  const planId = params.planId as string;
  const planName = params.planName as string;
  const planCode = params.planCode as string; // home_family, standard, enterprise
  const billingCycle = params.billingCycle as string;
  const price = params.price as string;
  const storeProductId = params.storeProductId as string;
  const trialDays = params.trialDays ? parseInt(params.trialDays as string, 10) : 30;


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

  // Promo verification state
  const { verifyPromo, isVerifying: isVerifyingPromo } = useVerifyPromo();
  const [isPromoVerified, setIsPromoVerified] = useState(false);
  const [promoData, setPromoData] = useState<PromoData | null>(null);

  // Registration state
  const { register, registerAsync, isLoading: isRegistering } = useRegister();

  // Industries list - from params, NOT hardcoded
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [isLoadingIndustries, setIsLoadingIndustries] = useState(true);

  // Track if industry is locked (for Home & Family)
  const [isIndustryLocked, setIsIndustryLocked] = useState(false);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);

  // Terms & Privacy checkbox state
  const [termsAccepted, setTermsAccepted] = useState(false);

  // RevenueCat Package for display
  const [rcPackage, setRcPackage] = useState<any | null>(null);

  // ============ FETCH REVENUECAT DATA ============
  useEffect(() => {
    const fetchOfferingDetails = async () => {
      if (!storeProductId) return;
      try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current) {
          const pkg = offerings.current.availablePackages.find(
            (p) => p.product.identifier === storeProductId
          );
          if (pkg) {
            setRcPackage(pkg);
          }
        }
      } catch (error) {
        console.warn("⚠️ Error fetching offerings for display:", error);
      }
    };
    fetchOfferingDetails();
  }, [storeProductId]);

  // ============ FETCH INDUSTRIES IF MISSING FROM PARAMS ============
  // Only enable if industries are NOT in params
  const {
    data: allIndustries,
    isLoading: isFetchingIndustries
  } = useGetAllIndustries(!params.industries);

  // ============ INITIALIZE INDUSTRIES FROM PARAMS OR FETCHED DATA ============
  useEffect(() => {
    console.log("\n🔄 ===== SIGNUP SCREEN MOUNTED =====");
    console.log("📦 Received params from PlanSelection:");
    console.log("  - planName:", planName);
    console.log("  - planId:", planId);
    console.log("  - industries in params:", params.industries ? "✅ YES" : "❌ NO");

    const industriesParam = params.industries as string;

    // Helper function to handle industry selection logic
    const handleIndustrySelection = (industryList: Industry[]) => {
      setIndustries(industryList);

      // ============ AUTO-SELECT LOGIC FOR "Home & Family" ============
      if (planName === "Home & Family") {
        console.log("\n🏠 ===== HOME & FAMILY PLAN DETECTED =====");

        // Priority 1: Use specific homeAndFamilyIndustry param if passed
        let targetIndustry: Industry | undefined;

        if (params.homeAndFamilyIndustry) {
          try {
            targetIndustry = JSON.parse(params.homeAndFamilyIndustry as string);
            console.log("🎯 Using homeAndFamilyIndustry from navigation params");
          } catch (e) {
            console.error("❌ Error parsing homeAndFamilyIndustry param:", e);
          }
        }

        // Priority 2: Find by name in the list
        if (!targetIndustry) {
          console.log("🔍 Looking for 'Home & Family' industry by name in list...");
          targetIndustry = industryList.find(
            (ind: Industry) => {
              const normalizedName = ind.name.toLowerCase().trim();
              const targetName = "home & family".toLowerCase().trim();
              return normalizedName === targetName;
            }
          );
        }

        if (targetIndustry) {
          console.log("✅ Home & Family industry FOUND and auto-selected!");
          setIndustry(targetIndustry);
          setIsIndustryLocked(true);
        } else {
          console.warn("⚠️ Home & Family industry NOT FOUND in list");
          setIsIndustryLocked(false);
        }
      } else {
        setIsIndustryLocked(false);
      }
    };


    try {
      if (industriesParam) {
        console.log("✅ Industries found in params, parsing...");
        const parsedIndustries = JSON.parse(industriesParam);
        handleIndustrySelection(parsedIndustries);
        setIsLoadingIndustries(false);
      } else if (allIndustries && allIndustries.length > 0) {
        console.log("✅ Industries fetched from API successfully!");
        handleIndustrySelection(allIndustries);
        setIsLoadingIndustries(false);
      } else if (!isFetchingIndustries) {
        // Done fetching (either successfully empty or failed)
        console.log("ℹ️ Industry fetch finished, but No industries available.");
        setIndustries(allIndustries || []);
        setIsLoadingIndustries(false);
      } else {
        // We don't have industries yet and we are currently fetching them
        console.log("⏳ Waiting for industries to be fetched...");
        setIsLoadingIndustries(true);
      }
    } catch (error) {
      console.error("❌ Error handling industries:", error);
      setIndustries([]);
      setIsLoadingIndustries(false);
    }
  }, [params.industries, allIndustries, planName, isFetchingIndustries]);


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

    if (!termsAccepted) {
      Alert.alert("Validation Error", "Please accept the Terms of Use and Privacy Policy to continue");
      return false;
    }

    return true;
  };

  // ============ HANDLE PROMO VERIFICATION ============
  const handleVerifyPromo = () => {
    if (!couponCode.trim()) {
      Alert.alert("Error", "Please enter a promo code");
      return;
    }

    Keyboard.dismiss();

    verifyPromo(
      { code: couponCode.trim() },
      {
        onSuccess: (response) => {
          if (response.valid) {
            setIsPromoVerified(true);
            setPromoData(response.data);
            Alert.alert("Success", "Promo code verified successfully!");
          } else {
            setIsPromoVerified(false);
            setPromoData(null);
            Alert.alert("Invalid Code", "The promo code entered is invalid or expired.");
          }
        },
        onError: (error) => {
          setIsPromoVerified(false);
          setPromoData(null);
          Alert.alert("Error", error.message || "Failed to verify promo code");
        },
      }
    );
  };

  // Reset verification when code changes
  useEffect(() => {
    if (isPromoVerified) {
      setIsPromoVerified(false);
      setPromoData(null);
    }
  }, [couponCode]);

  // ============ HANDLE REVENUECAT PURCHASE ============
  const performPurchase = async (): Promise<boolean> => {
    try {
      console.log("💰 Starting RevenueCat purchase flow for:", storeProductId);

      const offerings = await Purchases.getOfferings();
      console.log("🎁 Offerings received:", offerings.current?.availablePackages.map(p => p.product.identifier));

      if (!offerings.current) {
        throw new Error("No offerings available");
      }

      // Find the package matching our storeProductId
      const pkg = offerings.current.availablePackages.find(
        (p) => p.product.identifier === storeProductId
      );

      if (!pkg) {
        console.error("❌ Package not found for ID:", storeProductId);
        throw new Error(`Package for ${planName} not found in store.`);
      }

      console.log("🛒 Purchasing package:", pkg.product.identifier);
      const purchaseResult = await Purchases.purchasePackage(pkg);

      // Handle both older (purchaserInfo) and newer (customerInfo) SDK versions
      const customerInfo = (purchaseResult as any).customerInfo || (purchaseResult as any).purchaserInfo;

      // Check if user has active entitlement
      if (customerInfo && typeof customerInfo.entitlements.active[planCode] !== "undefined") {
        console.log("✅ Purchase successful!");
        return true;
      }

      // Some apps might use a single "premium" entitlement for all plans
      if (customerInfo && Object.keys(customerInfo.entitlements.active).length > 0) {
        console.log("✅ Purchase successful (any entitlement)!");
        return true;
      }


      console.warn("⚠️ Purchase completed but no active entitlement found.");
      return true; // We'll let the server verify the receipt if needed
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error("❌ Purchase error:", e);
        Alert.alert("Purchase Failed", e.message || "Could not complete purchase");
      }
      return false;
    }
  };


  // ============ HANDLE SIGNUP & PAYMENT ============
  const handleSignup = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);

    try {
      // 1. Prepare registration data
      const registrationData: RegisterRequest = {
        first_name: firstName.trim(),
        middle_name: middleName.trim() || undefined,
        last_name: lastName.trim(),
        company: companyName.trim() || undefined,
        industry_id: industry!.id,
        email: email.trim().toLowerCase(),
        password,
        password_confirmation: confirmPassword,
        enterprise: planCode === "enterprise",
        platform: Platform.OS as 'ios' | 'android',
        promo_code: isPromoVerified ? couponCode.trim() : undefined,
        app_plan_id: isPromoVerified ? 1 : undefined, // Currently hardcoded to 1 as per instruction
      };

      console.log("📤 Sending registration to backend:", {
        email: registrationData.email,
        promo: registrationData.promo_code,
        enterprise: registrationData.enterprise
      });

      // 2. Register user FIRST & await result
      const registerResponse = await registerAsync(registrationData);

      const userId = registerResponse.user.id;
      const rcUserId = registerResponse.rc_app_user_id;
      const token = registerResponse.token;

      console.log(`rcUserId: ${rcUserId}`);
      console.log(`✅ User registered successfully. ID: ${userId}, RC ID: ${rcUserId}`);

      // 3. Identify user in RevenueCat
      const identifyId = rcUserId ? rcUserId : userId.toString();
      console.log(`👤 Identifying user in RevenueCat: ${identifyId}`);
      await Purchases.logIn(identifyId);
      console.log("✅ RevenueCat identification successful");

      // 4. Check if we can bypass IAP with promo code
      const canBypassIAP = isPromoVerified && promoData && !promoData.iap_required;

      let purchaseErrorOccurred = false;
      if (!canBypassIAP) {
        // 5. Trigger RevenueCat Purchase (now associated with the correct user ID)
        const purchaseSuccess = await performPurchase();
        if (!purchaseSuccess) {
          purchaseErrorOccurred = true;
          // If we don't have a token, we must go to login
          if (!token) {
            setIsProcessing(false);
            Alert.alert(
              "Purchase Incomplete",
              "Your account has been created, but the subscription purchase was not completed. Please login and retry.",
              [{ text: "Login", onPress: () => router.replace("/(auth)/login") }]
            );
            return;
          }
          // If we HAVE a token, we'll show an alert but still try to navigate to dashboard
          console.warn("⚠️ Purchase failed but user has session token. Allowing entry to dashboard.");
        }
      }

      // 6. Success / Authentication - Navigate to Dashboard
      setIsProcessing(false);

      if (token) {
        console.log("🔑 Session token found, authenticating...");
        await storeLogin(token, registerResponse.user, registerResponse.account_type);

        if (purchaseErrorOccurred) {
          Alert.alert(
            "Account Created",
            "Your account was created successfully, but there was an issue with the subscription purchase. You can try subscribing again from the settings.",
            [{ text: "Go to Dashboard", onPress: () => router.replace("/(tabs)") }]
          );
        } else {
          Alert.alert(
            "Welcome!",
            "Account created successfully.",
            [{ text: "Go to Dashboard", onPress: () => router.replace("/(tabs)") }]
          );
        }
      } else {
        Alert.alert(
          "Welcome!",
          "Account created successfully. Please verify from email and login to get started.",
          [{ text: "Login", onPress: () => router.replace("/(auth)/login") }]
        );
      }

    } catch (error: any) {
      console.error("❌ Signup Flow Error:", error);
      setIsProcessing(false);

      // If error came from registration, show that message
      const errorMessage = error.message || "An unexpected error occurred. Please try again.";
      Alert.alert("Registration Error", errorMessage);
    }
  };


  // ============ RENDER ============

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.container} edges={["top"]}>
          {/* ===== Fixed Header ===== */}
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={isProcessing}
            >
              <Ionicons name="arrow-back" size={28} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Image
                source={require("../../assets/icons/logo_transparent.png")}
                style={styles.logo}
                contentFit="contain"
                transition={200}
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
                  <Text style={styles.sectionTitle}>Profile Details</Text>

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

                  {/* Company Name / Family Name */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Company Name / Family Name</Text>
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
                        placeholder="Enter company / family name (optional)"
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
                  {/* TEMPORARILY HIDDEN - Apple Rejection Prevention */}
                  {/* <View style={styles.sectionDivider} /> */}
                  {/* <View style={styles.inputGroup}>
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
                        editable={!isProcessing && !isVerifyingPromo}
                      />
                      {couponCode.length > 0 && !isPromoVerified && (
                        <TouchableOpacity
                          onPress={handleVerifyPromo}
                          disabled={isVerifyingPromo}
                          style={styles.verifyButton}
                        >
                          {isVerifyingPromo ? (
                            <ActivityIndicator size="small" color="#800000" />
                          ) : (
                            <Text style={styles.verifyButtonText}>Verify</Text>
                          )}
                        </TouchableOpacity>
                      )}
                      {isPromoVerified && (
                        <View style={styles.verifiedBadge}>
                          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        </View>
                      )}
                    </View>
                  </View> */}

                  {/* ===== PLAN DETAILS STRUCTURE (BEFORE PURCHASE BUTTON) ===== */}
                  <View style={styles.sectionDivider} />
                  <View style={styles.planDetailsContainer}>
                    <Text style={styles.planDetailsTitle}>Plan Details</Text>
                    <View style={styles.planDetailsRow}>
                      <Text style={styles.planDetailsLabel}>Plan Name:</Text>
                      <Text style={styles.planDetailsValue}>
                        {(() => {
                          const baseName = rcPackage ? rcPackage.product.title : planName;
                          console.log("rcPackage", rcPackage);
                          console.log("planName", planName);
                          const isMonthly = billingCycle === "month" || billingCycle === "monthly";
                          const isYearly = billingCycle === "year" || billingCycle === "yearly";

                          // Trust the planName from params and append cycle
                          return `${planName} ${isMonthly ? "Monthly" : isYearly ? "Yearly" : ""}`;
                        })()}
                      </Text>
                    </View>
                    <View style={styles.planDetailsRow}>
                      <Text style={styles.planDetailsLabel}>Billing:</Text>
                      <Text style={styles.planDetailsValue}>
                        {(() => {
                          const isMonthly = billingCycle === "month" || billingCycle === "monthly";
                          const isYearly = billingCycle === "year" || billingCycle === "yearly";
                          if (isMonthly) return "Monthly";
                          if (isYearly) return "Yearly";
                          return billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1);
                        })()}
                      </Text>
                    </View>
                    <View style={styles.planDetailsRow}>
                      <Text style={styles.planDetailsLabel}>Price:</Text>
                      <Text style={styles.planDetailsValue}>
                        {rcPackage ? rcPackage.product.priceString : `$${price}`} / {(billingCycle === "month" || billingCycle === "monthly") ? "month" : "year"}
                      </Text>
                    </View>
                    <View style={styles.planDetailsRow}>
                      <Text style={styles.planDetailsLabel}>Free Trial:</Text>
                      <Text style={styles.planDetailsValue}>{trialDays} Days</Text>
                    </View>
                    <View style={styles.planDetailsRow}>
                      <Text style={styles.planDetailsLabel}>Subscription:</Text>
                      <Text style={styles.planDetailsValue}>Auto-renewable Subscription</Text>
                    </View>
                  </View>

                  {/* ===== PURCHASE SUMMARY (BEFORE BUTTON) ===== */}
                  {/* <View style={styles.purchaseSummaryContainer}>
                    <Text style={styles.purchaseSummaryTitle}>You are purchasing:</Text>
                    <Text style={styles.purchaseSummaryText}>
                      {rcPackage ? rcPackage.product.title : planName}
                      {billingCycle === "month" ? " Monthly" : billingCycle === "year" ? " Yearly" : ""}
                    </Text>
                    <Text style={styles.purchaseSummaryText}>
                      {rcPackage ? rcPackage.product.priceString : `$${price}`} per {billingCycle === "month" ? "month" : "year"}
                    </Text>
                    <Text style={styles.purchaseSummaryText}>
                      {trialDays}-day free trial
                    </Text>
                    <Text style={styles.purchaseSummaryText}>
                      Auto-renews {billingCycle === "month" ? "monthly" : "yearly"} unless canceled
                    </Text>
                  </View> */}

                  {/* ===== TERMS & PRIVACY CHECKBOX (REQUIRED) ===== */}
                  <View style={styles.termsContainer}>
                    <TouchableOpacity
                      style={styles.checkboxContainer}
                      onPress={() => setTermsAccepted(!termsAccepted)}
                      disabled={isProcessing}
                    >
                      <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                        {termsAccepted && (
                          <Ionicons name="checkmark" size={16} color="#FFF" />
                        )}
                      </View>
                      <Text style={styles.termsText}>
                        By signing up, you agree to our{" "}
                        <Text
                          style={styles.termsLink}
                          onPress={() => Linking.openURL("https://www.apple.com/legal/internet-services/itunes/dev/stdeula/")}
                        >
                          Terms of Use (EULA)
                        </Text>
                        {" "}and acknowledge that you have read our{" "}
                        <Text
                          style={styles.termsLink}
                          onPress={() => Linking.openURL("https://renewalert.net/privacy-policy")}
                        >
                          Privacy Policy
                        </Text>
                        .
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Create Account Button */}
                  <TouchableOpacity
                    style={[
                      styles.createAccountButton,
                      (isProcessing || isRegistering || !termsAccepted) && styles.createAccountButtonDisabled,
                    ]}
                    onPress={handleSignup}
                    disabled={isProcessing || isRegistering || !termsAccepted}
                  >
                    {isProcessing || isRegistering ? (
                      <>
                        <ActivityIndicator size="small" color="#FFF" />
                        <Text style={styles.createAccountButtonText}>
                          {isRegistering ? "Creating Account..." : "Processing..."}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.createAccountButtonText}>
                          {isPromoVerified && promoData && !promoData.iap_required
                            ? "Complete Registration"
                            : "Continue to Purchase"}
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
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
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
    position: "relative",
  },
  backButton: {
    position: "absolute",
    top: 12,
    left: 16,
    zIndex: 20,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
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
    height: "100%",
  },

  verifyButton: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  verifyButtonText: {
    color: "#800000",
    fontSize: 12,
    fontWeight: "700",
  },
  verifiedBadge: {
    marginLeft: 8,
  },
  createAccountButton: {
    backgroundColor: "#800000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 12,
    gap: 10,
    marginTop: 12,
    shadowColor: "#800000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createAccountButtonDisabled: {
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
  },
  createAccountButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
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
  planDetailsContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  planDetailsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
  },
  planDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  planDetailsLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  planDetailsValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "700",
  },
  purchaseSummaryContainer: {
    backgroundColor: "#FFF8F5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "#800000",
  },
  purchaseSummaryTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 12,
  },
  purchaseSummaryText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
    marginBottom: 6,
    lineHeight: 20,
  },
  termsContainer: {
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: "#800000",
    borderColor: "#800000",
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: "#374151",
    lineHeight: 20,
  },
  termsLink: {
    color: "#800000",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  loginContainer: {

    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 20,
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