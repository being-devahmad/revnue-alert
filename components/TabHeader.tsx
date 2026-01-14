import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export const TabHeader = ({
    title,
    subtitle,
    isChild,
    isDelete,
    rightElement,
}: {
    title: string;
    subtitle?: string;
    isChild?: boolean;
    isDelete?: boolean;
    rightElement?: React.ReactNode;
}) => {
    const router = useRouter();

    return (
        <View style={styles.headerContainer}>
            <LinearGradient
                colors={["#9A1B2B", "#6B1420"]}
                style={styles.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View
                    style={[
                        styles.headerContent,
                        !isChild && { justifyContent: "flex-start" }, // <-- shift left when no button
                    ]}
                >
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
                    <View
                        style={[
                            styles.titleWrapper,
                            !isChild && {
                                alignItems: "flex-start",
                                marginLeft: 0,
                                marginRight: 0,
                            },
                        ]}
                    >
                        <Text style={styles.headerTitle}>{title}</Text>
                        {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
                    </View>

                    {/* RIGHT ELEMENT (RESTORE, ETC) */}
                    {rightElement && (
                        <View style={styles.rightElementContainer}>
                            {rightElement}
                        </View>
                    )}

                    {/* DELETE BUTTON */}
                    {isDelete && (
                        <TouchableOpacity
                            onPress={() => Alert.alert(
                                "Not available on mobile",
                                "This feature isn’t available in the mobile app yet.\nTo delete your reminder, please log in to the web portal."
                            )}
                            activeOpacity={0.7}
                            style={styles.deleteButton}
                        >
                            <Ionicons name="trash-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        overflow: "hidden",
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        backgroundColor: "#F3F4F6",
    },
    headerGradient: {
        paddingTop: 64,
        paddingBottom: 32,
        paddingHorizontal: 24,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.3)",
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
    },

    titleWrapper: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "900",
        color: "#FFFFFF",
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: "rgba(255, 255, 255, 0.85)",
        marginTop: 4,
        fontWeight: "500",
        textAlign: "left",
    },
    deleteButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.3)",
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
    },
    rightElementContainer: {
        marginLeft: 12,
    },
});
