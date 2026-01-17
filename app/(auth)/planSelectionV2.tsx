// ============ PLAN SELECTION SCREEN V2 (UPDATED API) ============
// planSelectionV2.tsx - Uses new /app/plans API structure

import {
    formatPrice,
    getMonthlyProduct,
    getYearlyProduct,
    sortPlansByTier,
    useGetPlansV2
} from '@/api/settings/useGetPlansv2';
import { TabHeader } from '@/components/TabHeader';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface SelectedPlanData {
    planId: number;
    planCode: string;
    planName: string;
    billingCycle: 'monthly' | 'yearly';
    price: string;
    currency: string;
    storeProductId: string;
    trialDays: number;
}

const PlanSelectionV2Screen = () => {
    const router = useRouter();
    const { data: plansData, isLoading, error, refetch, isFetching } = useGetPlansV2();

    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [selectedPlanCode, setSelectedPlanCode] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Get sorted plans
    const plans = plansData?.data ? sortPlansByTier(plansData.data) : [];

    // Get plan features based on tier
    const getPlanFeatures = (code: string): { included: string[]; notIncluded: string[] } => {
        switch (code) {
            case 'home_family':
                return {
                    included: [
                        'Personal and household reminder management',
                        'Track home-related subscriptions (streaming, utilities, memberships)',
                        'Bill and renewal reminders',
                        'Simple, family-friendly usage',
                        'Individual reminder control',
                    ],
                    notIncluded: [],
                };
            case 'standard':
                return {
                    included: [
                        'Supports all industries',
                        'Full core reminder & tracking access',
                        'Unlimited reminders',
                        'Track business deadlines',
                        'Custom notification schedules',
                    ],
                    notIncluded: [],
                };
            case 'enterprise':
                return {
                    included: [
                        'All core app features',
                        'Across all industries',
                        'Centralized reminder management',
                    ],
                    notIncluded: [],
                };
            default:
                return { included: [], notIncluded: [] };
        }
    };

    // Get plan description based on code
    const getPlanDescription = (code: string): string => {
        switch (code) {
            case 'home_family':
                return 'Best for personal and household use';
            case 'standard':
                return 'Best for individual professionals and business owners';
            case 'enterprise':
                return 'Best for organizations and teams';
            default:
                return '';
        }
    };
    // ============ HANDLE CONTINUE ============
    const handleContinue = () => {
        if (!selectedPlanCode) {
            Alert.alert('Select a Plan', 'Please select a plan to continue');
            return;
        }

        if (!plansData || !plansData.data) {
            Alert.alert('Error', 'Plans data not available');
            return;
        }

        setIsProcessing(true);

        // Get the selected plan from API data
        const selectedPlan = plans.find((plan) => plan.code === selectedPlanCode);

        if (!selectedPlan) {
            Alert.alert('Error', 'Selected plan not found');
            setIsProcessing(false);
            return;
        }

        // Get the product based on billing cycle
        const selectedProduct =
            billingCycle === 'monthly'
                ? getMonthlyProduct(selectedPlan)
                : getYearlyProduct(selectedPlan);

        if (!selectedProduct) {
            Alert.alert('Error', 'Product not available for selected billing cycle');
            setIsProcessing(false);
            return;
        }

        // Prepare plan data to pass to signup
        const planData: SelectedPlanData = {
            planId: selectedPlan.id,
            planCode: selectedPlan.code,
            planName: selectedPlan.name,
            billingCycle: billingCycle,
            price: selectedProduct.price,
            currency: selectedProduct.currency,
            storeProductId: selectedProduct.store_product_id,
            trialDays: selectedProduct.trial_days,
        };

        setTimeout(() => {
            setIsProcessing(false);

            console.log('📤 Navigating to signup with plan data V2:', {
                planName: planData.planName,
                planCode: planData.planCode,
                storeProductId: planData.storeProductId,
                billingCycle: planData.billingCycle,
            });

            // Navigate to signup screen with plan data
            router.push({
                pathname: '/(auth)/signup',
                params: {
                    planId: planData.planId.toString(),
                    planCode: planData.planCode,
                    planName: planData.planName,
                    billingCycle: planData.billingCycle,
                    price: planData.price,
                    currency: planData.currency,
                    storeProductId: planData.storeProductId,
                    trialDays: planData.trialDays.toString(),
                    industries: plansData.industries ? JSON.stringify(plansData.industries) : undefined,
                    homeAndFamilyIndustry: plansData.homeAndFamilyIndustry ? JSON.stringify(plansData.homeAndFamilyIndustry) : undefined,
                },
            });

        }, 800);
    };

    // ============ LOADING STATE ============
    if (isLoading && !plansData) {
        return (
            <View style={styles.container}>
                <TabHeader
                    title="Choose Your Plan"
                    subtitle="Select the perfect plan for your needs"
                    isChild={true}
                />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#9A1B2B" />
                    <Text style={styles.loadingText}>Loading plans...</Text>
                </View>
            </View>
        );
    }

    // ============ ERROR STATE ============
    if (error && !plansData) {
        return (
            <View style={styles.container}>
                <TabHeader
                    title="Choose Your Plan"
                    subtitle="Select the perfect plan for your needs"
                    isChild={true}
                />
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                    <Text style={styles.errorText}>Failed to load plans</Text>
                    <Text style={styles.errorSubtext}>
                        {error instanceof Error ? error.message : 'Please try again'}
                    </Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
                        <Ionicons name="refresh" size={18} color="#FFF" />
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ============ NULL CHECK ============
    if (!plansData || !plansData.data || plans.length === 0) {
        return (
            <View style={styles.container}>
                <TabHeader
                    title="Choose Your Plan"
                    subtitle="Select the perfect plan for your needs"
                    isChild={true}
                />
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                    <Text style={styles.errorText}>Plans data unavailable</Text>
                    <Text style={styles.errorSubtext}>Please try refreshing the page</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
                        <Ionicons name="refresh" size={18} color="#FFF" />
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ============ SUCCESS STATE ============
    return (
        <View style={{ flex: 1 }}>
            <TabHeader
                title="Choose Your Plan"
                subtitle="Select the perfect plan for your needs"
                isChild={true}
            />

            {isFetching && (
                <View style={styles.fetchingIndicator}>
                    <Ionicons name="refresh" size={14} color="#9A1B2B" />
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
                            billingCycle === 'monthly' && styles.billingOptionActive,
                        ]}
                        onPress={() => {
                            setBillingCycle('monthly');
                            setSelectedPlanCode(null);
                        }}
                        disabled={isProcessing}
                    >
                        <Text
                            style={[
                                styles.billingOptionText,
                                billingCycle === 'monthly' && styles.billingOptionTextActive,
                            ]}
                        >
                            Monthly
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.billingOption,
                            billingCycle === 'yearly' && styles.billingOptionActive,
                        ]}
                        onPress={() => {
                            setBillingCycle('yearly');
                            setSelectedPlanCode(null);
                        }}
                        disabled={isProcessing}
                    >
                        <Text
                            style={[
                                styles.billingOptionText,
                                billingCycle === 'yearly' && styles.billingOptionTextActive,
                            ]}
                        >
                            Annual
                        </Text>
                        <View style={styles.saveBadge}>
                            <Text style={styles.saveBadgeText}>Save 17%</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Plans Grid */}
                <View style={styles.plansContainer}>
                    {plans.map((plan) => {
                        const product =
                            billingCycle === 'monthly'
                                ? getMonthlyProduct(plan)
                                : getYearlyProduct(plan);

                        if (!product) return null;

                        const isRecommended = plan.tier_rank === 2; // Standard plan
                        const isSelected = selectedPlanCode === plan.code;
                        const description = getPlanDescription(plan.code);

                        return (
                            <TouchableOpacity
                                key={plan.id}
                                style={[
                                    styles.planCard,
                                    isSelected && styles.planCardSelected,
                                    isRecommended && styles.planCardRecommended,
                                ]}
                                onPress={() => setSelectedPlanCode(plan.code)}
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
                                            {isSelected && <View style={styles.radioInner} />}
                                        </View>
                                    </View>

                                    <View style={styles.planHeaderText}>
                                        <Text style={styles.planName}>{plan.name}</Text>
                                        <Text style={styles.planDescription}>{description}</Text>
                                    </View>
                                </View>

                                <View style={styles.freeTrialBadge}>
                                    <Ionicons name="gift" size={16} color="#10B981" />
                                    <Text style={styles.freeTrialText}>
                                        {product.trial_days} Days Free Trial
                                    </Text>
                                </View>

                                {/* Features List */}
                                <View style={styles.featuresContainer}>
                                    <Text style={styles.featureSectionTitle}>What's Included</Text>
                                    {getPlanFeatures(plan.code).included.map((feature, idx) => (
                                        <View key={`inc-${idx}`} style={styles.featureRow}>
                                            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                                            <Text style={styles.featureText}>{feature}</Text>
                                        </View>
                                    ))}

                                    {(plan.code === 'standard' || plan.code === 'home_family') && (
                                        <View style={styles.autoRenewNote}>
                                            <Ionicons name="information-circle-outline" size={14} color="#6B7280" />
                                            <Text style={styles.autoRenewText}>
                                                Auto-renewable subscription. Cancel anytime in App Store settings.
                                            </Text>
                                        </View>
                                    )}

                                    {getPlanFeatures(plan.code).notIncluded.length > 0 && (
                                        <>
                                            <Text style={styles.featureSectionTitle}>What's Not Included</Text>
                                            {getPlanFeatures(plan.code).notIncluded.map((feature, idx) => (
                                                <View key={`ni-${idx}`} style={styles.featureRow}>
                                                    <Ionicons name="close-circle" size={14} color="#9CA3AF" />
                                                    <Text style={styles.notIncludedText}>{feature}</Text>
                                                </View>
                                            ))}
                                        </>
                                    )}

                                    {plan.code === 'enterprise' && (
                                        <Text style={styles.enterpriseNote}>
                                            Note: Multi-user features may require admin approval.
                                        </Text>
                                    )}
                                </View>

                                <View style={styles.priceContainer}>
                                    <View>
                                        <Text style={styles.priceAmount}>
                                            {formatPrice(product.price, product.currency)}
                                            <Text style={styles.pricePeriod}>
                                                {billingCycle === 'monthly' ? '/ month' : '/ year'}
                                            </Text>
                                        </Text>
                                        <Text style={styles.validityInfo}>
                                            Valid till {billingCycle === 'monthly' ? '30 Days' : '12 Months'}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Continue Button */}
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        (!selectedPlanCode || isProcessing) && styles.continueButtonDisabled,
                    ]}
                    onPress={handleContinue}
                    disabled={!selectedPlanCode || isProcessing}
                >
                    <Text style={styles.continueButtonText}>
                        {isProcessing ? 'Processing...' : 'Continue to Signup'}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </TouchableOpacity>

                {/* Trial Note */}
                <Text style={styles.trialNote}>
                    You won't be charged until your free trial ends.{'\n'}
                    Cancel anytime before then at no cost.
                </Text>

                {/* Apple Review Compliance Footer */}
                <View style={styles.complianceFooter}>
                    <View style={styles.disclosureContainer}>
                        <Text style={styles.disclosureTitle}>Subscription Information:</Text>
                        <Text style={styles.disclosureText}>
                            • Payment will be charged to your iTunes Account at confirmation of purchase.{"\n"}
                            • Subscription automatically renews unless auto-renew is turned off at least 24-hours before the end of the current period.{"\n"}
                            • Your account will be charged for renewal within 24-hours prior to the end of the current period.{"\n"}
                            • You can manage or turn off auto-renew in your Apple ID Account Settings any time after purchase.{"\n"}
                            • Any unused portion of a free trial period, if offered, will be forfeited when the user purchases a subscription to that publication, where applicable.
                        </Text>
                    </View>

                    <View style={styles.legalLinksContainer}>
                        <TouchableOpacity onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
                            <Text style={styles.legalLinkText}>Terms of Use (EULA)</Text>
                        </TouchableOpacity>
                        <View style={styles.legalSeparator} />
                        <TouchableOpacity onPress={() => Linking.openURL('https://renewalert.net/privacy-policy')}>
                            <Text style={styles.legalLinkText}>Privacy Policy</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>
        </View>
    );
};

export default PlanSelectionV2Screen;

// ============ STYLES ============
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
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
        backgroundColor: '#FFF8F5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        gap: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    fetchingText: {
        fontSize: 12,
        color: '#9A1B2B',
        fontWeight: '600',
    },
    billingToggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 6,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    billingOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    billingOptionActive: {
        backgroundColor: '#9A1B2B',
    },
    billingOptionText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6B7280',
    },
    billingOptionTextActive: {
        color: '#FFF',
    },
    saveBadge: {
        backgroundColor: '#10B981',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    saveBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    plansContainer: {
        gap: 16,
        marginBottom: 24,
    },
    planCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 24,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    planCardSelected: {
        borderColor: '#9A1B2B',
        backgroundColor: '#FFF8F5',
    },
    planCardRecommended: {
        borderColor: '#F59E0B',
    },
    recommendedBadge: {
        position: 'absolute',
        top: -12,
        right: 24,
        backgroundColor: '#F59E0B',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    recommendedText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFF',
    },
    planHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
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
        borderColor: '#D1D5DB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioOuterSelected: {
        borderColor: '#9A1B2B',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#9A1B2B',
    },
    planHeaderText: {
        flex: 1,
    },
    planName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    planDescription: {
        fontSize: 14,
        color: '#6B7280',
    },
    freeTrialBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        marginBottom: 16,
        gap: 6,
        borderWidth: 1,
        borderColor: '#10B981',
    },
    freeTrialText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#059669',
    },
    featuresContainer: {
        marginTop: 12,
        marginBottom: 16,
        gap: 8,
    },
    featureSectionTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 8,
        marginBottom: 4,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    featureText: {
        fontSize: 13,
        color: '#4B5563',
        fontWeight: '500',
        flex: 1,
    },
    notIncludedText: {
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '400',
        flex: 1,
    },
    enterpriseNote: {
        fontSize: 11,
        color: '#6B7280',
        fontStyle: 'italic',
        marginTop: 8,
    },
    autoRenewNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginTop: 12,
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    autoRenewText: {
        flex: 1,
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
        lineHeight: 18,
    },
    priceContainer: {
        marginBottom: 0,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    priceAmount: {
        fontSize: 36,
        fontWeight: '800',
        color: '#9A1B2B',
    },
    pricePeriod: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    validityInfo: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '600',
        marginTop: 2,
    },
    continueButton: {
        backgroundColor: '#9A1B2B',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
        shadowColor: '#9A1B2B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    continueButtonDisabled: {
        backgroundColor: '#D1D5DB',
        opacity: 0.6,
    },
    continueButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFF',
    },
    trialNote: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '600',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    errorText: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        textAlign: 'center',
    },
    errorSubtext: {
        marginTop: 8,
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#9A1B2B',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
        gap: 8,
    },
    retryButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    bottomSpacing: {
        height: 40,
    },
    complianceFooter: {
        marginTop: 24,
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 24,
    },
    legalLinksContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    legalLinkText: {
        fontSize: 12,
        color: '#2563EB',
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    legalSeparator: {
        width: 3,
        height: 3,
        borderRadius: 2,
        backgroundColor: '#9CA3AF',
        marginHorizontal: 12,
    },
    disclosureContainer: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    disclosureTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    disclosureText: {
        fontSize: 11,
        color: '#6B7280',
        lineHeight: 16,
        fontWeight: '500',
    },
});
