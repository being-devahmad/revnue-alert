import {
    formatPrice,
    getMonthlyProduct,
    getYearlyProduct
} from '@/api/settings/useGetPlansv2';
import { useGetUserPlan } from '@/api/settings/useGetUserPlan';

import { TabHeader } from '@/components/TabHeader';
import { useAuthStore } from '@/store/authStore';

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';


import { useRouter } from 'expo-router';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';



const BillingScreen = () => {
    const { subscription, user } = useAuthStore();
    const router = useRouter();
    const isPromo = subscription?.source === 'promo';

    // 🚨 Web-purchased user restriction
    useEffect(() => {
        if (user && user.is_mobile_user === false && !isPromo) {
            Alert.alert(
                "",
                "You can't make changes to your subscription inside this app, because you purchased this subscription on another platform.",
                [{ text: "OK", onPress: () => router.back() }]
            );
            return;

        }
    }, [user, isPromo]);

    if (user && user.is_mobile_user === false && !isPromo) {
        return (
            <View style={styles.container}>
                <TabHeader title="Billing" isChild={true} />
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#9A1B2B" />
                </View>
            </View>
        );
    }


    // Determine current plan code from subscription or default
    // Mapping app_plan_id to code (1: home_family, 2: standard, 3: enterprise)
    const getPlanCodeFromId = (id: number | undefined) => {
        if (id === 1) return 'home_family';
        if (id === 2) return 'standard';
        if (id === 3) return 'enterprise';
        return 'home_family';
    };

    const initialPlanCode = subscription ? getPlanCodeFromId(subscription.app_plan_id) : 'home_family';
    const [currentPlanCode, setCurrentPlanCode] = useState(initialPlanCode);
    const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('monthly');
    const [currentPeriod, setCurrentPeriod] = useState<string | null>(null);


    // Sync currentPlanCode with subscription data
    useEffect(() => {
        if (subscription) {
            setCurrentPlanCode(getPlanCodeFromId(subscription.app_plan_id));
        }
    }, [subscription]);



    // Fetch user-specific plan from API
    const { data: userPlanResponse, isLoading, error } = useGetUserPlan(user?.id);

    // Get the current plan from the response
    const plans = useMemo(() => {
        if (!userPlanResponse?.message?.plan) return [];
        // The API returns the specific plan for the user
        const activePlan = userPlanResponse.message.plan;

        // Ensure products are filtered for the current platform
        const platform = Platform.OS === 'ios' ? 'ios' : 'android';
        const platformSpecificProducts = activePlan.products.filter(p => p.platform === platform);

        return [{
            ...activePlan,
            products: platformSpecificProducts
        }];
    }, [userPlanResponse]);

    // Update currentPlanCode and selectedPeriod when plan data loads
    useEffect(() => {
        if (userPlanResponse?.message) {
            const sub = userPlanResponse.message;
            if (sub.plan) {
                setCurrentPlanCode(sub.plan.code);
            }
            if (sub.period === 'monthly' || sub.period === 'yearly') {
                setSelectedPeriod(sub.period as 'monthly' | 'yearly');
                setCurrentPeriod(sub.period);
            } else {
                setCurrentPeriod(sub.period); // e.g., "forever"
            }
        }
    }, [userPlanResponse]);






    // Plan gradient colors based on tier
    const getPlanGradient = (tierRank: number): readonly [string, string, ...string[]] => {
        switch (tierRank) {
            case 1: // Home & Family
                return ['#3B82F6', '#2563EB'];
            case 2: // Standard
                return ['#9A1B2B', '#6B1420'];
            case 3: // Enterprise
                return ['#7C3AED', '#6D28D9'];
            default:
                return ['#6B7280', '#4B5563'];
        }
    };


    // Get plan features based on tier
    const getPlanFeatures = (code: string): string[] => {
        switch (code) {
            case 'home_family':
                return [
                    'Perfect for personal use',
                    'Unlimited reminders',
                    'Email notifications',
                    'Mobile app access',
                    'Basic analytics',
                    'Export data (CSV)',
                ];
            case 'standard':
                return [
                    'All Home & Family features',
                    'Advanced analytics dashboard',
                    'Priority support',
                    'Custom categories',
                    'Team collaboration (up to 3)',
                    'API access',
                    'White-label options',
                ];
            case 'enterprise':
                return [
                    'All Standard features',
                    'Unlimited team members',
                    'Custom SLA',
                    'Advanced security',
                    'SSO integration',
                    'Dedicated support team',
                    'Custom training',
                    'On-premise deployment',
                ];
            default:
                return [];
        }
    };

    // Get plan description
    const getPlanDescription = (code: string): string => {
        switch (code) {
            case 'home_family':
                return 'Great for individuals and families';
            case 'standard':
                return 'Best for professionals and small teams';
            case 'enterprise':
                return 'For large organizations';
            default:
                return '';
        }
    };

    const handleSelectPlan = (planCode: string) => {
        const isCurrentActive = planCode === currentPlanCode && selectedPeriod === currentPeriod;

        if (isCurrentActive) {
            Alert.alert('Current Plan', 'You are already on this plan and period.');
            return;
        }


        const plan = plans.find(p => p.code === planCode);
        Alert.alert(
            'Change Plan',
            `Would you like to switch to the ${plan?.name} plan?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: () => {
                        setCurrentPlanCode(planCode);
                        Alert.alert('Success', 'Your plan has been updated!');
                    },
                },
            ]
        );
    };

    // Render loading state
    if (isLoading) {
        return (
            <View style={styles.container}>
                <TabHeader
                    title="Billing & Subscription"
                    subtitle="Choose the plan that fits your needs"
                    isChild={true}
                />
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#9A1B2B" />
                    <Text style={styles.loadingText}>Loading plans...</Text>
                </View>
            </View>
        );
    }

    // Render error state
    if (error) {
        return (
            <View style={styles.container}>
                <TabHeader
                    title="Billing & Subscription"
                    subtitle="Choose the plan that fits your needs"
                    isChild={true}
                />
                <View style={styles.centerContainer}>
                    <Ionicons name="alert-circle" size={48} color="#EF4444" />
                    <Text style={styles.errorText}>Failed to load plans</Text>
                    <Text style={styles.errorSubtext}>Please try again later</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <TabHeader
                title="Billing & Subscription"
                subtitle="Choose the plan that fits your needs"
                isChild={true}
            />

            {/* Scroll Content */}
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Period Toggle - Hidden for Promo */}
                {!isPromo && (
                    <View style={styles.periodToggleContainer}>
                        <TouchableOpacity
                            style={[
                                styles.periodToggle,
                                selectedPeriod === 'monthly' && styles.periodToggleActive,
                            ]}
                            onPress={() => setSelectedPeriod('monthly')}
                        >
                            <Text
                                style={[
                                    styles.periodToggleText,
                                    selectedPeriod === 'monthly' && styles.periodToggleTextActive,
                                ]}
                            >
                                Monthly
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.periodToggle,
                                selectedPeriod === 'yearly' && styles.periodToggleActive,
                            ]}
                            onPress={() => setSelectedPeriod('yearly')}
                        >
                            <Text
                                style={[
                                    styles.periodToggleText,
                                    selectedPeriod === 'yearly' && styles.periodToggleTextActive,
                                ]}
                            >
                                Yearly
                            </Text>
                            <View style={styles.saveBadge}>
                                <Text style={styles.saveBadgeText}>Save 17%</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Promo Success Banner */}
                {isPromo && (
                    <LinearGradient
                        colors={['#10B981', '#059669']}
                        style={styles.promoBanner}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <View style={styles.promoBannerContent}>
                            <Ionicons name="gift" size={32} color="#FFFFFF" />
                            <View style={styles.promoTextContainer}>
                                <Text style={styles.promoTitle}>Premium Access Granted!</Text>
                                <Text style={styles.promoSubtitle}>
                                    You're enjoying full access for free via a promotional code.
                                    All premium features are unlocked for your account.
                                </Text>
                            </View>
                        </View>
                    </LinearGradient>
                )}

                {/* Info Banner - Only show if not promo */}
                {!isPromo && (
                    <View style={styles.infoBanner}>
                        <Ionicons name="information-circle" size={24} color="#3B82F6" />
                        <Text style={styles.infoBannerText}>
                            All plans include a 30-day free trial. Cancel anytime.
                        </Text>
                    </View>
                )}


                {/* Plans Grid */}
                <View style={styles.plansContainer}>
                    {plans.map((plan: any) => {
                        const product = selectedPeriod === 'monthly'
                            ? getMonthlyProduct(plan)
                            : getYearlyProduct(plan);

                        if (!product) return null;

                        const isPopular = plan.tier_rank === 2; // Standard plan
                        const features = getPlanFeatures(plan.code);
                        const description = getPlanDescription(plan.code);
                        const isCurrentActive = currentPlanCode === plan.code && selectedPeriod === currentPeriod;

                        return (
                            <View key={plan.id} style={styles.planCardWrapper}>
                                {/* Popular Badge */}
                                {isPopular && (
                                    <View style={styles.popularBadge}>
                                        <LinearGradient
                                            colors={['#F59E0B', '#D97706']}
                                            style={styles.popularBadgeGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            <Ionicons name="star" size={14} color="#FFFFFF" />
                                            <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                                        </LinearGradient>
                                    </View>
                                )}

                                {/* Plan Card */}
                                <View
                                    style={[
                                        styles.planCard,
                                        isPopular && styles.planCardPopular,
                                        isCurrentActive && styles.planCardCurrent,
                                    ]}
                                >
                                    {/* Header with Gradient */}
                                    <LinearGradient
                                        colors={getPlanGradient(plan.tier_rank)}
                                        style={styles.planHeader}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        <Text style={styles.planName}>{plan.name}</Text>
                                        <View style={styles.priceContainer}>
                                            <Text style={styles.planPrice}>
                                                {formatPrice(product.price, product.currency)}
                                            </Text>
                                            <Text style={styles.planPeriod}>
                                                /{selectedPeriod === 'monthly' ? 'mo' : 'yr'}
                                            </Text>
                                        </View>
                                        <Text style={styles.planDescription}>{description}</Text>
                                        {product.trial_days > 0 && (
                                            <View style={styles.trialBadge}>
                                                <Text style={styles.trialBadgeText}>
                                                    {product.trial_days}-day free trial
                                                </Text>
                                            </View>
                                        )}
                                    </LinearGradient>

                                    {/* Features List */}
                                    <View style={styles.featuresContainer}>
                                        {features.map((feature, index) => (
                                            <View key={index} style={styles.featureRow}>
                                                <View style={styles.checkIconContainer}>
                                                    <Ionicons
                                                        name="checkmark-circle"
                                                        size={20}
                                                        color="#10B981"
                                                    />
                                                </View>
                                                <Text style={styles.featureText}>{feature}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    {/* Action Button */}
                                    <TouchableOpacity
                                        style={[
                                            styles.selectButton,
                                            (isCurrentActive || isPromo) && styles.selectButtonCurrent,
                                        ]}
                                        onPress={() => !isPromo && handleSelectPlan(plan.code)}
                                        activeOpacity={isPromo ? 1 : 0.8}
                                        disabled={isPromo}
                                    >
                                        <LinearGradient
                                            colors={
                                                (isCurrentActive || isPromo)
                                                    ? ['#10B981', '#059669']
                                                    : getPlanGradient(plan.tier_rank)
                                            }
                                            style={styles.selectButtonGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            {isPromo ? (
                                                <>
                                                    <Ionicons name="ribbon" size={20} color="#FFFFFF" />
                                                    <Text style={styles.selectButtonText}>Active Promo Plan</Text>
                                                </>
                                            ) : isCurrentActive ? (
                                                <>
                                                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                                                    <Text style={styles.selectButtonText}>Current Plan</Text>
                                                </>
                                            ) : (
                                                <>
                                                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                                                    <Text style={styles.selectButtonText}>Select Plan</Text>
                                                </>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}
                </View>


                {/* Footer Info */}
                <View style={styles.footerInfo}>
                    <Ionicons name="shield-checkmark" size={24} color="#9A1B2B" />
                    <Text style={styles.footerText}>
                        Secure payment processing with 256-bit SSL encryption
                    </Text>
                </View>

                {/* Contact Support */}
                <TouchableOpacity
                    style={styles.supportButton}
                    onPress={() =>
                        Alert.alert(
                            'Contact Support',
                            'Need help choosing a plan? Contact our support team at support@renewalert.com'
                        )
                    }
                >
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color="#9A1B2B" />
                    <Text style={styles.supportButtonText}>Need help? Contact Support</Text>
                </TouchableOpacity>
            </ScrollView >
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    errorText: {
        marginTop: 12,
        fontSize: 18,
        color: '#1F2937',
        fontWeight: '700',
    },
    errorSubtext: {
        marginTop: 4,
        fontSize: 14,
        color: '#6B7280',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    periodToggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    periodToggle: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 6,
    },
    periodToggleActive: {
        backgroundColor: '#9A1B2B',
    },
    periodToggleText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6B7280',
    },
    periodToggleTextActive: {
        color: '#FFFFFF',
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
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    infoBannerText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: '#1E40AF',
        fontWeight: '500',
    },
    promoBanner: {
        borderRadius: 16,
        marginBottom: 24,
        padding: 2, // For the gradient border feel if nested, but here it's the background
    },
    promoBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'transparent',
    },
    promoTextContainer: {
        flex: 1,
        marginLeft: 16,
    },
    promoTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
    },
    promoSubtitle: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '500',
    },

    plansContainer: {
        gap: 20,
    },
    planCardWrapper: {
        position: 'relative',
    },
    popularBadge: {
        position: 'absolute',
        top: -10,
        left: 0,
        right: 0,
        zIndex: 10,
        alignItems: 'center',
    },
    popularBadgeGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    popularBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    planCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    planCardPopular: {
        marginTop: 10,
        borderColor: '#F59E0B',
        shadowOpacity: 0.15,
        shadowRadius: 16,
    },
    planCardCurrent: {
        borderColor: '#10B981',
        borderWidth: 2,
    },
    planHeader: {
        padding: 24,
        alignItems: 'center',
    },
    planName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    planPrice: {
        fontSize: 40,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    planPeriod: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        marginLeft: 4,
        fontWeight: '500',
    },
    planDescription: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.95)',
        textAlign: 'center',
        fontWeight: '500',
        marginBottom: 8,
    },
    trialBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginTop: 4,
    },
    trialBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    featuresContainer: {
        padding: 24,
        gap: 14,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    checkIconContainer: {
        marginRight: 12,
        marginTop: 2,
    },
    featureText: {
        flex: 1,
        fontSize: 15,
        color: '#374151',
        lineHeight: 22,
        fontWeight: '500',
    },
    selectButton: {
        margin: 16,
        marginTop: 8,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    selectButtonCurrent: {
        shadowOpacity: 0.15,
    },
    selectButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    selectButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
    footerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 32,
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    footerText: {
        marginLeft: 10,
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        flex: 1,
    },
    supportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        gap: 8,
    },
    supportButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#9A1B2B',
    },
});

export default BillingScreen;
