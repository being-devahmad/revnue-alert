import {
    formatPrice,
    getMonthlyProduct,
    getYearlyProduct
} from '@/api/settings/useGetPlansv2';
import { useGetUserPlan } from '@/api/settings/useGetUserPlan';
import { TabHeader } from '@/components/TabHeader';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Purchases from 'react-native-purchases';



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
    const { data: userPlanResponse, isLoading, error, refetch: refetchUserPlan } = useGetUserPlan(user?.id);
    console.log("userPlanResponse", userPlanResponse);
    const [isProcessing, setIsProcessing] = useState(false);


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

    // Calculate trial remaining days
    const trialRemainingDays = useMemo(() => {
        if (!userPlanResponse?.message?.trial_ends_at) return null;
        const trialEnd = dayjs(userPlanResponse.message.trial_ends_at);
        const now = dayjs();
        const diffDays = Math.ceil(trialEnd.diff(now, 'day', true));
        return diffDays > 0 ? diffDays : null;
    }, [userPlanResponse]);

    // ============ HANDLE REVENUECAT PURCHASE ============
    const performPurchase = async (storeProductId: string, planCode: string): Promise<boolean> => {
        try {
            console.log("💰 Starting RevenueCat purchase flow for:", storeProductId);
            setIsProcessing(true);

            // ✅ Safety check: Ensure user is logged in to RevenueCat
            const currentUser = useAuthStore.getState().user;
            if (currentUser) {
                const userId = currentUser.rc_app_user_id ?? currentUser.id.toString();
                console.log(`👤 Identifying user in RevenueCat before purchase: ${userId}`);

                try {
                    const identifiesResult = await Purchases.logIn(userId);
                    console.log("✅ RevenueCat identification successful.");
                    console.log("   - User ID passed:", userId);
                    console.log("   - RC Original ID:", identifiesResult.customerInfo.originalAppUserId);
                    console.log("   - RC Current ID:", identifiesResult.customerInfo.managementURL); // managementURL often contains identifiers
                } catch (rcError) {
                    console.error("❌ RevenueCat logIn error during upgrade:", rcError);
                }
            } else {
                console.warn("⚠️ No user in store. Cannot identify in RevenueCat.");
            }

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
                throw new Error(`Package not found in store.`);
            }

            console.log("🛒 Purchasing package:", pkg.product.identifier);
            const purchaseResult = await Purchases.purchasePackage(pkg);

            // Handle both older (purchaserInfo) and newer (customerInfo) SDK versions
            const customerInfo = (purchaseResult as any).customerInfo || (purchaseResult as any).purchaserInfo;

            // Check if user has active entitlement
            if (customerInfo && (
                typeof customerInfo.entitlements.active[planCode] !== "undefined" ||
                Object.keys(customerInfo.entitlements.active).length > 0
            )) {
                console.log("✅ Purchase successful!");
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
        } finally {
            setIsProcessing(false);
        }
    };

    // ============ HANDLE RESTORE PURCHASES ============
    const handleRestorePurchases = async () => {
        try {
            setIsProcessing(true);
            console.log("🔄 Restoring purchases...");
            const restore = await Purchases.restorePurchases();
            console.log("✅ Restore result:", restore);

            // Check if any entitlements are active
            if (Object.keys(restore.entitlements.active).length > 0) {
                Alert.alert(
                    "Success",
                    "Your purchases have been restored successfully.",
                    [{ text: "OK", onPress: () => refetchUserPlan() }]
                );
            } else {
                Alert.alert("Restore", "No active subscriptions found for this account.");
            }
        } catch (e: any) {
            console.error("❌ Restore error:", e);
            Alert.alert("Restore Failed", e.message || "Could not restore purchases");
        } finally {
            setIsProcessing(false);
        }
    };

    // Legal link handlers
    const handleOpenTerms = () => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
    const handleOpenPrivacy = () => Linking.openURL('https://renewalert.net/privacy-policy');


    // Plan gradient colors based on tier
    const getPlanGradient = (tierRank: number): readonly [string, string, ...string[]] => {
        switch (tierRank) {
            case 1: // Home & Family
                return ['#3B82F6', '#1D4ED8']; // Vibrant Blue
            case 2: // Standard
                return ['#9A1B2B', '#7F1D1D']; // Deep Crimson
            case 3: // Enterprise
                return ['#8B5CF6', '#6D28D9']; // Modern Purple
            default:
                return ['#6B7280', '#4B5563'];
        }
    };


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
                        'Individual business use (single user)',
                        'Full core reminder & tracking access',
                        'Unlimited reminders',
                        'Track business deadlines',
                        'Custom notification schedules',
                        'Reliable delivery',
                    ],
                    notIncluded: [],
                };
            case 'enterprise':
                return {
                    included: [
                        'Individual business use (single user)',
                        'Full core reminder & tracking access',
                        'Unlimited reminders',
                        'Track business deadlines',
                        'Custom notification schedules',
                        'Reliable delivery',
                    ],
                    notIncluded: [],
                };
            default:
                return { included: [], notIncluded: [] };
        }
    };

    // Get plan description
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

    const handleSelectPlan = async (planCode: string) => {
        const isCurrentActive = planCode === currentPlanCode && selectedPeriod === currentPeriod;
        if (isCurrentActive) {
            Alert.alert('Current Plan', 'You are already on this plan and period.');
            return;
        }

        // 🚨 Safety Check: Prevent downgrade from yearly to monthly
        if (selectedPeriod === 'monthly' && currentPeriod === 'yearly') {
            Alert.alert(
                "Downgrade Restricted",
                "You are currently on a yearly plan. Downgrades to monthly plans are not supported inside the app."
            );
            return;
        }


        const plan = plans.find(p => p.code === planCode);
        if (!plan) return;

        const product = selectedPeriod === 'monthly'
            ? getMonthlyProduct(plan)
            : getYearlyProduct(plan);

        if (!product || !product.store_product_id) {
            Alert.alert('Error', 'This product is not available for purchase on this platform.');
            return;
        }

        Alert.alert(
            'Change Plan',
            `Would you like to switch to the ${plan.name} (${selectedPeriod}) plan?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        const success = await performPurchase(product.store_product_id, plan.code);
                        if (success) {
                            Alert.alert(
                                'Success',
                                'Your plan has been updated successfully! It may take a few moments for the changes to reflect.',
                                [{ text: 'OK', onPress: () => refetchUserPlan() }]
                            );
                        }
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
                    <View style={styles.periodToggleOuterContainer}>
                        <View style={styles.periodToggleContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.periodToggle,
                                    selectedPeriod === 'monthly' && styles.periodToggleActive,
                                    currentPeriod === 'yearly' && styles.periodToggleDisabled,
                                ]}
                                onPress={() => {
                                    if (currentPeriod === 'yearly') {
                                        Alert.alert(
                                            "Downgrade Restricted",
                                            "You are currently on a yearly plan. Downgrades to monthly plans are not supported inside the app."
                                        );
                                        return;
                                    }
                                    setSelectedPeriod('monthly');
                                }}
                            >
                                <Text
                                    style={[
                                        styles.periodToggleText,
                                        selectedPeriod === 'monthly' && styles.periodToggleTextActive,
                                        currentPeriod === 'yearly' && styles.periodToggleTextDisabled,
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
                                    <Text style={styles.saveBadgeText}>SAVE 17%</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
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
                                    Now enjoy a lifetime access!
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
                        console.log("isCurrentActive", isCurrentActive);
                        console.log("trialRemainingDays", trialRemainingDays);

                        return (
                            <View key={plan.id} style={styles.planCardWrapper}>
                                {/* Popular Badge */}
                                {isPopular && (
                                    <View style={styles.popularBadge}>
                                        <LinearGradient
                                            colors={['#F59E0B', '#FCD34D']}
                                            style={styles.popularBadgeGradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                                            <Text style={styles.popularBadgeText}>Best Value</Text>
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
                                        <Text style={styles.validityInfo}>
                                            Valid till {selectedPeriod === 'monthly' ? '30 Days' : '12 Months'}
                                        </Text>
                                        {isPromo ? (
                                            <Text style={styles.planLifetimeText}>Lifetime Access</Text>
                                        ) : (
                                            <Text style={styles.planDescription}>{description}</Text>
                                        )}
                                        {product.trial_days > 0 && (
                                            <View style={styles.trialBadge}>
                                                <Text style={styles.trialBadgeText}>
                                                    {product.trial_days}-day free trial
                                                </Text>
                                            </View>
                                        )}

                                        {/* Active Trial Info */}
                                        {isCurrentActive && trialRemainingDays !== null && (
                                            <View style={styles.activeTrialBadge}>
                                                <Text style={styles.activeTrialBadgeText}>
                                                    Trial active: {trialRemainingDays} {trialRemainingDays === 1 ? 'day' : 'days'} left
                                                </Text>
                                            </View>
                                        )}
                                    </LinearGradient>

                                    {/* Features List */}
                                    <View style={styles.featuresContainer}>
                                        <Text style={styles.sectionTitle}>What's Included</Text>
                                        {features.included.map((feature: string, index: number) => (
                                            <View key={`inc-${index}`} style={styles.featureRow}>
                                                <View style={styles.checkIconContainer}>
                                                    <Ionicons
                                                        name="checkmark-circle"
                                                        size={18}
                                                        color="#10B981"
                                                    />
                                                </View>
                                                <Text style={styles.featureText}>{feature}</Text>
                                            </View>
                                        ))}

                                        {(plan.code === 'standard' || plan.code === 'home_family') && (
                                            <View style={styles.autoRenewNote}>
                                                <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                                                <Text style={styles.autoRenewText}>
                                                    Auto-renewable subscription. Cancel anytime in App Store settings.
                                                </Text>
                                            </View>
                                        )}

                                        {plan.code === 'enterprise' && (
                                            <View style={styles.enterpriseNoteContainer}>
                                                <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                                                <Text style={styles.enterpriseNote}>
                                                    Note: Multi-user and sub-account management features may require admin approval and may be enabled progressively based on organization needs.
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Action Button */}
                                    <TouchableOpacity
                                        style={[
                                            styles.selectButton,
                                            (isCurrentActive || isPromo) && styles.selectButtonCurrent,
                                            isProcessing && styles.selectButtonDisabled,
                                        ]}
                                        onPress={() => !isPromo && !isProcessing && handleSelectPlan(plan.code)}
                                        activeOpacity={isPromo || isProcessing ? 1 : 0.8}
                                        disabled={isPromo || isProcessing}
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
                                            {isProcessing ? (
                                                <ActivityIndicator color="#FFFFFF" size="small" />
                                            ) : isPromo ? (
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
                        <TouchableOpacity onPress={handleOpenTerms}>
                            <Text style={styles.legalLinkText}>Terms </Text>
                        </TouchableOpacity>
                        <View style={styles.legalSeparator} />
                        <TouchableOpacity onPress={handleOpenPrivacy}>
                            <Text style={styles.legalLinkText}>Privacy</Text>
                        </TouchableOpacity>
                        <View style={styles.legalSeparator} />
                        <TouchableOpacity onPress={handleRestorePurchases}>
                            <Text style={styles.legalLinkText}>Restore Purchases</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView >
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#4B5563',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    errorText: {
        marginTop: 16,
        fontSize: 20,
        color: '#111827',
        fontWeight: '800',
    },
    errorSubtext: {
        marginTop: 6,
        fontSize: 15,
        color: '#6B7280',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 60,
    },
    periodToggleOuterContainer: {
        alignItems: 'center',
        marginBottom: 28,
        paddingHorizontal: 10,
    },
    periodToggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#E5E7EB',
        borderRadius: 20,
        padding: 6,
        width: '100%',
        maxWidth: 340,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    periodToggle: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 16,
        gap: 8,
    },
    periodToggleActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    periodToggleText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    periodToggleTextActive: {
        color: '#9A1B2B',
    },
    periodToggleDisabled: {
        opacity: 0.5,
    },
    periodToggleTextDisabled: {
        color: '#9CA3AF',
    },
    saveBadge: {
        backgroundColor: '#10B981',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    saveBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 20,
        marginBottom: 28,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    infoBannerText: {
        flex: 1,
        marginLeft: 14,
        fontSize: 14,
        color: '#4B5563',
        fontWeight: '600',
        lineHeight: 20,
    },
    promoBanner: {
        borderRadius: 20,
        marginBottom: 28,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    promoBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
    },
    promoTextContainer: {
        flex: 1,
        marginLeft: 18,
    },
    promoTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    promoSubtitle: {
        color: 'rgba(255, 255, 255, 0.95)',
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
    },
    plansContainer: {
        gap: 24,
    },
    planCardWrapper: {
        position: 'relative',
    },
    popularBadge: {
        position: 'absolute',
        top: -14,
        left: 0,
        right: 0,
        zIndex: 10,
        alignItems: 'center',
    },
    popularBadgeGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 25,
        gap: 8,
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    popularBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    planCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(229, 231, 235, 0.5)',
    },
    planCardPopular: {
        marginTop: 10,
        borderColor: '#F59E0B',
        borderWidth: 2,
    },
    planCardCurrent: {
        borderColor: '#10B981',
        borderWidth: 2,
    },
    planHeader: {
        padding: 32,
        alignItems: 'center',
    },
    planName: {
        fontSize: 26,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 12,
        letterSpacing: 0.5,
        textTransform: 'capitalize',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 12,
    },
    planPrice: {
        fontSize: 48,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    planPeriod: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.8)',
        marginLeft: 6,
        fontWeight: '600',
    },
    validityInfo: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.95)',
        fontWeight: '700',
        marginBottom: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
        overflow: 'hidden',
    },
    planDescription: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        fontWeight: '600',
        marginBottom: 12,
        paddingHorizontal: 10,
    },
    planLifetimeText: {
        fontSize: 18,
        color: '#FFFFFF',
        textAlign: 'center',
        fontWeight: '800',
        marginBottom: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 12,
        overflow: 'hidden',
    },
    trialBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 14,
        marginTop: 8,
    },
    trialBadgeText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    activeTrialBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 16,
        marginTop: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    activeTrialBadgeText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    featuresContainer: {
        padding: 32,
        gap: 18,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    checkIconContainer: {
        marginRight: 16,
        marginTop: 2,
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        padding: 4,
    },
    featureText: {
        flex: 1,
        fontSize: 15,
        color: '#374151',
        lineHeight: 22,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
    },
    notIncludedIconContainer: {
        marginRight: 16,
        marginTop: 2,
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        padding: 4,
    },
    notIncludedText: {
        flex: 1,
        fontSize: 15,
        color: '#6B7280',
        lineHeight: 22,
        fontWeight: '500',
    },
    enterpriseNoteContainer: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
        marginTop: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    enterpriseNote: {
        flex: 1,
        fontSize: 12,
        color: '#6B7280',
        lineHeight: 18,
        fontWeight: '500',
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
    selectButton: {
        margin: 24,
        marginTop: 0,
        borderRadius: 18,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    selectButtonCurrent: {
        shadowColor: '#10B981',
    },
    selectButtonDisabled: {
        opacity: 0.7,
    },
    selectButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 12,
    },
    selectButtonText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    complianceFooter: {
        marginTop: 48,
        paddingHorizontal: 12,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 32,
    },
    legalLinksContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 24,
    },
    legalLinkText: {
        fontSize: 14,
        color: '#2563EB',
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
    legalSeparator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#9CA3AF',
        marginHorizontal: 16,
    },
    disclosureContainer: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 3,
    },
    disclosureTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    disclosureText: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 20,
        fontWeight: '500',
    },
});

export default BillingScreen;
