import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

export const TabHeader = ({ title, subtitle, isChild }: { title: string, subtitle?: string, isChild?: boolean }) => {
    const router = useRouter();

    return (
        <View style={styles.headerContainer}>
            <LinearGradient
                colors={['#9A1B2B', '#6B1420']}
                style={styles.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={[
                    styles.headerContent,
                    !isChild && { justifyContent: "flex-start" } // <-- shift left when no button
                ]}>

                    {/* Back Button */}
                    {isChild && (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            activeOpacity={0.7}
                            style={styles.backButton}
                        >
                            <Ionicons name="chevron-back" size={26} color="#fff" />
                        </TouchableOpacity>
                    )}

                    {/* TITLE GROUP */}
                    <View style={[
                        styles.titleWrapper,
                        !isChild && { alignItems: "flex-start", marginLeft: 0 } // <-- left align content
                    ]}>
                        <Text style={styles.headerTitle}>{title}</Text>
                        {subtitle && (
                            <Text style={styles.headerSubtitle}>{subtitle}</Text>
                        )}
                    </View>

                    {/* Placeholder ONLY if child */}
                    {isChild ? <View style={{ width: 40 }} /> : null}
                </View>
            </LinearGradient>
        </View>
    )
}

const styles = StyleSheet.create({
    headerContainer: {
        overflow: 'hidden',
    },
    headerGradient: {
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.15)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.25)",
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },

    titleWrapper: {
        flex: 1,
        marginLeft: 6,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: "800",
        color: "#FFFFFF",
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 15,
        color: "rgba(255, 255, 255, 0.8)",
        marginTop: 4,
        textAlign:'left',
    },
})
