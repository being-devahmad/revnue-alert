import { useRegister } from "@/api/auth/useRegister";
import { TabHeader } from "@/components/TabHeader";
import { Industry } from "@/components/ui/IndustryDropdown";
import { Ionicons } from "@expo/vector-icons";
import { CardField, useStripe } from "@stripe/stripe-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

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

interface PaymentData {
    planName: string;
    planId: string;
    price: string;
    billingCycle: "month" | "year";
    priceId: string;
    productId: string;
}

const PaymentScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { register, isLoading: isRegistering, error: registerError } = useRegister();

    // Get plan data from route params
    const paymentData: PaymentData = {
        planName: params.planName as string,
        planId: params.planId as string,
        price: params.price as string,
        billingCycle: (params.billingCycle as "month" | "year") || "month",
        priceId: params.priceId as string,
        productId: params.productId as string,
    };

    // Parse user form data from params
    const [userFormData, setUserFormData] = useState<UserFormData | null>(() => {
        try {
            const userDataParam = params.userFormData as string;
            if (userDataParam) {
                console.log("\n📦 ===== PAYMENT SCREEN MOUNTED =====");
                console.log("✅ User form data received from signup screen");
                const parsed = JSON.parse(userDataParam);
                console.log("📋 User data:", {
                    firstName: parsed.firstName,
                    lastName: parsed.lastName,
                    email: parsed.email,
                    industryId: parsed.industry.id,
                });
                return parsed;
            }
        } catch (error) {
            console.error("❌ Error parsing user form data:", error);
        }
        return null;
    });

    // State
    const [isProcessing, setIsProcessing] = useState(false);
    const [stripeError, setStripeError] = useState<string | null>(null);

    // ✅ Get Stripe methods
    const { createToken } = useStripe();
    const cardFormRef = useRef(null);

    // ============ CARD FORMATTING FUNCTIONS ============

    const formatCardNumber = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        const limited = cleaned.slice(0, 16);
        const formatted = limited.match(/.{1,4}/g)?.join(' ') || limited;
        return formatted;
    };

    const formatExpiryDate = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        const limited = cleaned.slice(0, 4);
        if (limited.length >= 2) {
            return limited.slice(0, 2) + '/' + limited.slice(2);
        }
        return limited;
    };

    const formatCVV = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        return cleaned.slice(0, 3);
    };

    const formatPostalCode = (text: string) => {
        return text.slice(0, 10);
    };

    // ============ CREATE STRIPE TOKEN ============

    const createStripeToken = async (): Promise<string | null> => {
        try {
            console.log("\n💳 ===== CREATING STRIPE TOKEN =====");

            // Validate inputs
            // Note: createToken will return an error if the card is incomplete, 
            // so we rely on Stripe's internal state.

            // ✅ Use Stripe's createToken method
            const { token, error } = await createToken({
                type: 'Card',
            });

            if (error) {
                console.error("❌ Stripe tokenization error:", error.message);
                setStripeError(error.message);
                Alert.alert("Tokenization Error", error.message || "Failed to tokenize card");
                return null;
            }

            if (token) {
                console.log("✅ Stripe token created:", token.id);
                setStripeError(null);
                return token.id;
            }
            console.error("❌ No token received from Stripe");
            return null;
        } catch (error: any) {
            console.error("❌ Unexpected error creating token:", error);
            setStripeError(error.message);
            Alert.alert("Error", "Failed to process card");
            return null;
        }
    };

    // ============ HANDLE PAYMENT SUBMISSION & REGISTRATION ============

    const handlePayment = async () => {
        if (!userFormData) {
            Alert.alert("Error", "User data not found. Please go back to signup.");
            return;
        }

        setIsProcessing(true);

        try {
            console.log("\n💳 ===== PROCESSING PAYMENT & REGISTRATION =====");

            // ✅ Step 1: Create Stripe token from CardForm
            const token = await createStripeToken();

            if (!token) {
                setIsProcessing(false);
                return;
            }

            console.log("Plan:", paymentData.planName);
            console.log("Price ID:", paymentData.priceId);
            console.log("Product ID:", paymentData.productId);

            // ✅ Step 2: Call registration API with REAL Stripe token
            const registrationData = {
                first_name: userFormData.firstName,
                middle_name: userFormData.middleName || undefined,
                last_name: userFormData.lastName,
                company: userFormData.companyName || undefined,
                industry_id: userFormData.industry.id,
                email: userFormData.email,
                password: userFormData.password,
                password_confirmation: userFormData.confirmPassword,
                product_id: paymentData.productId,
                price_id: paymentData.priceId,
                card_token: token, // ✅ Use REAL Stripe token
                coupon_code: userFormData.couponCode || undefined,
            };

            console.log("📋 Registration payload:", registrationData);

            // Call register from the hook
            register(registrationData, {
                onSuccess: (data) => {
                    console.log("✅ Registration & Payment SUCCESSFUL!");
                    setIsProcessing(false);

                    Alert.alert("Success", data.message ||
                        "Account created successfully! Please verify your email first before login", [
                        {
                            text: "Continue",
                            onPress: () => {
                                console.log("📤 Navigating to Login...");
                                router.replace("/(auth)/login");
                            },
                        },
                    ]);
                },
                onError: (error: any) => {
                    console.error("❌ Registration & Payment FAILED!", error);
                    setIsProcessing(false);
                    Alert.alert(
                        "Payment Failed",
                        error.message || "Registration failed. Please try again."
                    );
                },
            });
        } catch (error: any) {
            console.error("❌ Unexpected error during payment:", error);
            setIsProcessing(false);
            Alert.alert("Error", "An unexpected error occurred");
        }
    };

    // ============ RENDER ============

    return (
        <View style={styles.container}>
            <TabHeader title="Payment Information" isChild={true} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Order Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <Ionicons name="receipt-outline" size={24} color="#800000" />
                        <Text style={styles.summaryTitle}>Order Summary</Text>
                    </View>

                    <View style={styles.summaryDivider} />

                    {/* Plan Details */}
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Plan:</Text>
                        <Text style={styles.summaryValue}>{paymentData.planName}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Billing Cycle:</Text>
                        <Text style={styles.summaryValue}>
                            {paymentData.billingCycle === "month" ? "Monthly" : "Annual"}
                        </Text>
                    </View>

                    {/* Pricing */}
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Price:</Text>
                        <Text style={styles.summaryPrice}>
                            ${parseFloat(paymentData.price).toFixed(2)}
                        </Text>
                    </View>

                    {/* Free Trial Note */}
                    <View style={styles.freeTrialNote}>
                        <Ionicons name="gift" size={16} color="#10B981" />
                        <Text style={styles.freeTrialText}>
                            First 30 days are free. Cancel anytime.
                        </Text>
                    </View>
                </View>

                {/* User Information Summary */}
                {userFormData && (
                    <View style={styles.userSummaryCard}>
                        <View style={styles.userSummaryHeader}>
                            <Ionicons name="person-circle-outline" size={24} color="#800000" />
                            <Text style={styles.userSummaryTitle}>Account Information</Text>
                        </View>

                        <View style={styles.summaryDivider} />

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Name:</Text>
                            <Text style={styles.summaryValue}>
                                {userFormData.firstName} {userFormData.lastName}
                            </Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Email:</Text>
                            <Text style={[styles.summaryValue, { fontSize: 12 }]}>
                                {userFormData.email}
                            </Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Industry:</Text>
                            <Text style={[styles.summaryValue, { width: "39%" }]}>{userFormData.industry.name}</Text>
                        </View>
                    </View>
                )}

                {/* Payment Information Section - Stripe CardForm */}
                <View style={styles.paymentSection}>
                    <View style={styles.paymentHeader}>
                        <Ionicons name="card" size={24} color="#800000" />
                        <Text style={styles.paymentTitle}>
                            Payment Information
                            <Text style={styles.requiredStar}>*</Text>
                        </Text>
                    </View>

                    {/* ✅ Stripe CardField for legacy token support */}
                    <CardField
                        postalCodeEnabled={true}
                        style={styles.cardFormStyle}
                        cardStyle={{
                            backgroundColor: "#FFFFFF",
                            textColor: "#1F2937",
                            placeholderColor: "#6B7280",
                            borderColor: "#E5E7EB",
                            borderWidth: 1,
                            borderRadius: 12,
                            fontSize: 16,
                            textErrorColor: "#EF4444",
                        }}
                        onCardChange={(cardDetails) => {
                            console.log("✅ Card field changed:", cardDetails);
                        }}
                    />
                </View>

                {/* Error Display */}
                {/* {(registerError || stripeError) && (
                    <View style={styles.errorBanner}>
                        <Ionicons name="alert-circle" size={18} color="#EF4444" />
                        <Text style={styles.errorBannerText}>
                            {stripeError || (registerError instanceof Error
                                ? registerError.message
                                : "Payment failed. Please try again.")}
                        </Text>
                    </View>
                )} */}

                {/* Security Note */}
                <View style={styles.securityNote}>
                    <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                    <Text style={styles.securityText}>
                        Your payment information is secure and encrypted by Stripe.
                    </Text>
                </View>

                {/* Payment Button */}
                <TouchableOpacity
                    style={[
                        styles.paymentButton,
                        isProcessing && styles.paymentButtonDisabled,
                    ]}
                    onPress={handlePayment}
                    disabled={isProcessing}
                >
                    {isProcessing ? (
                        <>
                            <ActivityIndicator size="small" color="#FFF" />
                            <Text style={styles.paymentButtonText}>Processing...</Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.paymentButtonText}>
                                Complete Payment & Sign Up
                            </Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFF" />
                        </>
                    )}
                </TouchableOpacity>

                <View style={styles.bottomSpacing} />
            </ScrollView>
        </View>
    );
};

export default PaymentScreen;

// ============ STYLES ============

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingVertical: 24,
    },

    // ============ SUMMARY CARD ============
    summaryCard: {
        backgroundColor: "#FFF",
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    summaryHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        gap: 8,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1F2937",
    },
    summaryDivider: {
        height: 1,
        backgroundColor: "#E5E7EB",
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 14,
        color: "#6B7280",
        fontWeight: "500",
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1F2937",
    },
    summaryPrice: {
        fontSize: 18,
        fontWeight: "800",
        color: "#800000",
    },
    freeTrialNote: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#D1FAE5",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        gap: 8,
        marginTop: 12,
        borderWidth: 1,
        borderColor: "#10B981",
    },
    freeTrialText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#059669",
        flex: 1,
    },

    // ============ USER SUMMARY CARD ============
    userSummaryCard: {
        backgroundColor: "#FFF",
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    userSummaryHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        gap: 8,
    },
    userSummaryTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1F2937",
    },

    // ============ PAYMENT SECTION ============
    paymentSection: {
        backgroundColor: "#FFF",
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    paymentHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
        gap: 8,
    },
    paymentTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1F2937",
    },
    requiredStar: {
        fontSize: 16,
        color: "#DC2626",
        marginLeft: 4,
    },

    // ============ CARD INPUTS ============
    cardInputContainer: {
        gap: 12,
    },
    cardRowContainer: {
        flexDirection: "row",
        gap: 12,
    },
    cardInputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F9FAFB",
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1.5,
        borderColor: "#E5E7EB",
    },
    cardInputFocused: {
        borderColor: "#800000",
        backgroundColor: "#FFF",
    },
    cardInputHalf: {
        flex: 1,
    },
    cardInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: "#1F2937",
        fontWeight: "500",
        letterSpacing: 1,
    },

    // ============ STRIPE CARD FORM ============
    cardFormStyle: {
        height: 150,
        borderRadius: 12,
    },
    errorBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FEE2E2",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        marginBottom: 20,
        gap: 8,
        borderWidth: 1,
        borderColor: "#FECACA",
    },
    errorBannerText: {
        fontSize: 13,
        fontWeight: "500",
        color: "#DC2626",
        flex: 1,
    },

    // ============ SECURITY NOTE ============
    securityNote: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#D1FAE5",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        gap: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#10B981",
    },
    securityText: {
        fontSize: 13,
        color: "#059669",
        fontWeight: "500",
        flex: 1,
    },

    // ============ PAYMENT BUTTON ============
    paymentButton: {
        backgroundColor: "#800000",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        borderRadius: 14,
        gap: 8,
        shadowColor: "#800000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 16,
    },
    paymentButtonDisabled: {
        backgroundColor: "#D1D5DB",
        opacity: 0.6,
    },
    paymentButtonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "700",
    },

    // ============ BOTTOM SPACING ============
    bottomSpacing: {
        height: 40,
    },
});