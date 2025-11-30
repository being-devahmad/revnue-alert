// ============ PLAN SELECTION SCREEN (UPDATED) ============
// planSelection.tsx - REMOVES payment form

import { clearPlansCache, usePlans } from "@/api/auth/useGetAllPlan";
import { TabHeader } from "@/components/TabHeader";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

interface SelectedPlanData {
    planId: string;
    planName: string;
    billingCycle: "month" | "year";
    price: string;
    priceId: string;
    productId: string;
}

const PlanSelectionScreen = () => {
    const router = useRouter();
    const { data: plansData, isLoading, error, refetch, isFetching } = usePlans();

    const [billingCycle, setBillingCycle] = useState<"month" | "year">("month");
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // ============ HANDLE CONTINUE ============
    const handleContinue = () => {
        if (!selectedPlan) {
            Alert.alert("Select a Plan", "Please select a plan to continue");
            return;
        }

        if (!plansData || !plansData.plans) {
            Alert.alert("Error", "Plans data not available");
            return;
        }

        setIsProcessing(true);

        // Get the selected plan from API data
        const plansArray = billingCycle === "month" ? plansData.plans.month : plansData.plans.year;
        const selectedPlanData = plansArray.find(plan => plan.name === selectedPlan);

        if (!selectedPlanData) {
            Alert.alert("Error", "Selected plan not found");
            return;
        }

        // Prepare plan data to pass to signup
        const planData: SelectedPlanData = {
            planId: selectedPlanData.product_id,
            planName: selectedPlanData.name,
            billingCycle: selectedPlanData.interval,
            price: selectedPlanData.amount,
            priceId: selectedPlanData.price_id,
            productId: selectedPlanData.product_id
        };

        setTimeout(() => {
            setIsProcessing(false);

            console.log("📤 Navigating to signup with plan data:", {
                planName: planData.planName,
                productId: planData.productId,
                priceId: planData.priceId,
            });

            // Navigate to signup screen with plan data
            router.push({
                pathname: "/(auth)/signup",
                params: {
                    planId: planData.planId,
                    planName: planData.planName,
                    billingCycle: planData.billingCycle,
                    price: planData.price,
                    priceId: planData.priceId,
                    productId: planData.productId,
                    industries: JSON.stringify(plansData.industries || []),
                    homeAndFamilyIndustry: plansData.homeAndFamilyIndustry
                        ? JSON.stringify(plansData.homeAndFamilyIndustry)
                        : undefined,
                }
            });
        }, 800);
    };

    // ============ CLEAR CACHE (FOR TESTING) ============
    const handleClearCache = async () => {
        Alert.alert(
            "Clear Cache",
            "This will clear cached plans. Fresh data will be fetched on next load.",
            [
                {
                    text: "Cancel",
                    onPress: () => { },
                    style: "cancel"
                },
                {
                    text: "Clear",
                    onPress: async () => {
                        await clearPlansCache();
                        await refetch();
                        Alert.alert("Success", "Cache cleared and data refreshed");
                    },
                    style: "destructive"
                }
            ]
        );
    };

    // ============ LOADING STATE ============
    if (isLoading && !plansData) {
        return (
            <View style={styles.container}>
                <TabHeader title="Choose Your Plan" subtitle="Select the perfect plan for your needs" isChild={true} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#800000" />
                    <Text style={styles.loadingText}>Loading plans...</Text>
                </View>
            </View>
        );
    }

    // ============ ERROR STATE ============
    if (error && !plansData) {
        return (
            <View style={styles.container}>
                <TabHeader title="Choose Your Plan" subtitle="Select the perfect plan for your needs" isChild={true} />
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                    <Text style={styles.errorText}>Failed to load plans</Text>
                    <Text style={styles.errorSubtext}>
                        {error instanceof Error ? error.message : 'Please try again'}
                    </Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => refetch()}
                    >
                        <Ionicons name="refresh" size={18} color="#FFF" />
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ============ NULL CHECK ============
    if (!plansData || !plansData.plans) {
        return (
            <View style={styles.container}>
                <TabHeader title="Choose Your Plan" subtitle="Select the perfect plan for your needs" isChild={true} />
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                    <Text style={styles.errorText}>Plans data unavailable</Text>
                    <Text style={styles.errorSubtext}>Please try refreshing the page</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => refetch()}
                    >
                        <Ionicons name="refresh" size={18} color="#FFF" />
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ============ SUCCESS STATE ============
    const currentPlans = billingCycle === "month" ? plansData.plans.month : plansData.plans.year;

    return (
        <>
            <View style={{ flex: 1 }}>
                <TabHeader title="Choose Your Plan" subtitle="Select the perfect plan for your needs" isChild={true} />

                {isFetching && (
                    <View style={styles.fetchingIndicator}>
                        <Ionicons name="refresh" size={14} color="#800000" />
                        <Text style={styles.fetchingText}>Updating plans...</Text>
                    </View>
                )}

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Billing Toggle */}
                    <View style={styles.billingToggleContainer}>
                        <TouchableOpacity
                            style={[
                                styles.billingOption,
                                billingCycle === "month" && styles.billingOptionActive,
                            ]}
                            onPress={() => {
                                setBillingCycle("month");
                                setSelectedPlan(null);
                            }}
                            disabled={isProcessing}
                        >
                            <Text
                                style={[
                                    styles.billingOptionText,
                                    billingCycle === "month" && styles.billingOptionTextActive,
                                ]}
                            >
                                Monthly
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.billingOption,
                                billingCycle === "year" && styles.billingOptionActive,
                            ]}
                            onPress={() => {
                                setBillingCycle("year");
                                setSelectedPlan(null);
                            }}
                            disabled={isProcessing}
                        >
                            <Text
                                style={[
                                    styles.billingOptionText,
                                    billingCycle === "year" && styles.billingOptionTextActive,
                                ]}
                            >
                                Annual
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Plans Grid */}
                    <View style={styles.plansContainer}>
                        {currentPlans.map((plan, index) => {
                            const isRecommended = plan.name === "Enterprise";
                            const isSelected = selectedPlan === plan.name;

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.planCard,
                                        isSelected && styles.planCardSelected,
                                        isRecommended && styles.planCardRecommended,
                                    ]}
                                    onPress={() => setSelectedPlan(plan.name)}
                                    disabled={isProcessing}
                                    activeOpacity={0.9}
                                >
                                    {isRecommended && (
                                        <View style={styles.recommendedBadge}>
                                            <Ionicons name="star" size={14} color="#FFF" />
                                            <Text style={styles.recommendedText}>Most Popular</Text>
                                        </View>
                                    )}

                                    <View style={styles.planHeader}>
                                        <View style={styles.radioContainer}>
                                            <View
                                                style={[
                                                    styles.radioOuter,
                                                    isSelected && styles.radioOuterSelected,
                                                ]}
                                            >
                                                {isSelected && (
                                                    <View style={styles.radioInner} />
                                                )}
                                            </View>
                                        </View>

                                        <View style={styles.planHeaderText}>
                                            <Text style={styles.planName}>{plan.name}</Text>
                                            <Text style={styles.planDescription}>{plan.description}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.freeTrialBadge}>
                                        <Ionicons name="gift" size={16} color="#10B981" />
                                        <Text style={styles.freeTrialText}>30 Days Free Trial</Text>
                                    </View>

                                    <View style={styles.priceContainer}>
                                        <Text style={styles.priceAmount}>
                                            ${parseFloat(plan.amount).toFixed(2)}
                                            <Text style={styles.pricePeriod}>
                                                {billingCycle === "month" ? "/ month" : "/ year"}
                                            </Text>
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Continue Button */}
                    <TouchableOpacity
                        style={[
                            styles.continueButton,
                            (!selectedPlan || isProcessing) && styles.continueButtonDisabled,
                        ]}
                        onPress={handleContinue}
                        disabled={!selectedPlan || isProcessing}
                    >
                        <Text style={styles.continueButtonText}>
                            {isProcessing ? "Processing..." : "Continue to Signup"}
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFF" />
                    </TouchableOpacity>

                    {/* Trial Note */}
                    <Text style={styles.trialNote}>
                        You won&apos;t be charged until your 30-day free trial ends.{"\n"}
                        Cancel anytime before then at no cost.
                    </Text>

                    {/* Clear Cache Button (Development) */}
                    {/* <TouchableOpacity
                        style={styles.debugButton}
                        onPress={handleClearCache}
                    >
                        <Ionicons name="trash-outline" size={16} color="#9CA3AF" />
                        <Text style={styles.debugButtonText}>Clear Cache</Text>
                    </TouchableOpacity> */}

                    <View style={styles.bottomSpacing} />
                </ScrollView>
            </View>
        </>
    );
};

export default PlanSelectionScreen;

// ============ STYLES ============
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    scrollView: {
        flex: 1,
        paddingVertical: 16,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 0,
    },
    fetchingIndicator: {
        backgroundColor: "#FFFBF5",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        gap: 6,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    fetchingText: {
        fontSize: 12,
        color: "#800000",
        fontWeight: "600",
    },
    billingToggleContainer: {
        flexDirection: "row",
        backgroundColor: "#FFF",
        borderRadius: 16,
        padding: 6,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    billingOption: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
        position: "relative",
    },
    billingOptionActive: {
        backgroundColor: "#800000",
    },
    billingOptionText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#6B7280",
    },
    billingOptionTextActive: {
        color: "#FFF",
    },
    plansContainer: {
        gap: 16,
        marginBottom: 24,
    },
    planCard: {
        backgroundColor: "#FFF",
        borderRadius: 20,
        padding: 24,
        borderWidth: 2,
        borderColor: "#E5E7EB",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    planCardSelected: {
        borderColor: "#800000",
        backgroundColor: "#FFFBF5",
    },
    planCardRecommended: {
        borderColor: "#F59E0B",
    },
    recommendedBadge: {
        position: "absolute",
        top: -12,
        right: 24,
        backgroundColor: "#F59E0B",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
        shadowColor: "#F59E0B",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    recommendedText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#FFF",
    },
    planHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 16,
    },
    radioContainer: {
        marginRight: 12,
        paddingTop: 2,
    },
    radioOuter: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#D1D5DB",
        alignItems: "center",
        justifyContent: "center",
    },
    radioOuterSelected: {
        borderColor: "#800000",
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#800000",
    },
    planHeaderText: {
        flex: 1,
    },
    planName: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1F2937",
        marginBottom: 4,
    },
    planDescription: {
        fontSize: 14,
        color: "#6B7280",
    },
    freeTrialBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#D1FAE5",
        alignSelf: "flex-start",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        marginBottom: 16,
        gap: 6,
        borderWidth: 1,
        borderColor: "#10B981",
    },
    freeTrialText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#059669",
    },
    priceContainer: {
        marginBottom: 0,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
    },
    priceAmount: {
        fontSize: 36,
        fontWeight: "800",
        color: "#800000",
    },
    pricePeriod: {
        fontSize: 16,
        fontWeight: "600",
        color: "#6B7280",
    },
    continueButton: {
        backgroundColor: "#800000",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
        shadowColor: "#800000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    continueButtonDisabled: {
        backgroundColor: "#D1D5DB",
        opacity: 0.6,
    },
    continueButtonText: {
        fontSize: 17,
        fontWeight: "700",
        color: "#FFF",
    },
    trialNote: {
        fontSize: 13,
        color: "#6B7280",
        textAlign: "center",
        marginTop: 16,
        marginBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: "#6B7280",
        fontWeight: "600",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    errorText: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: "600",
        color: "#1F2937",
        textAlign: "center",
    },
    errorSubtext: {
        marginTop: 8,
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
        marginBottom: 24,
    },
    retryButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#800000",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
        gap: 8,
    },
    retryButtonText: {
        color: "#FFF",
        fontSize: 14,
        fontWeight: "600",
    },
    debugButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        gap: 8,
        marginBottom: 16,
    },
    debugButtonText: {
        fontSize: 13,
        color: "#9CA3AF",
        fontWeight: "500",
    },
    bottomSpacing: {
        height: 40,
    },
});