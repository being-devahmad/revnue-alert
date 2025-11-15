import { useLoginMutation } from "@/api/auth/useLogin";
import { useAuthStore } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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

const LoginScreen = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);

    const { login: storeLogin } = useAuthStore();
    const { mutate: loginMutate, isPending } = useLoginMutation();

    const handleLogin = () => {
        if (!email || !password) {
            Alert.alert("Validation Error", "Please enter both email and password");
            return;
        }
        if (!email.includes("@")) {
            Alert.alert("Validation Error", "Please enter a valid email");
            return;
        }

        loginMutate(
            { email, password },
            {
                onSuccess: (data: any) => {
                    const token = data?.token;
                    console.log("Login successful, token:", token);

                    if (!token) {
                        Alert.alert("Error", "Invalid token received from server");
                        return;
                    }

                    storeLogin(token , data?.user); // Save token in Zustand

                    Alert.alert("Success", "Logged in successfully!");

                    // Navigate to tabs (dashboard)
                    router.replace("/(tabs)");
                },
                onError: (err: any) => {
                    const msg =
                        err.response?.data?.message ||
                        "Login failed. Please try again.";

                    Alert.alert("Login Failed", msg);
                },
            }
        );
    };

    return (
        <SafeAreaView style={[styles.container]} edges={['top']}>
            {/* Header */}
            <View style={styles.headerContainer}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require("../../assets/icons/logo_transparent.png")}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
            </View>

            {/* Form */}
            <View style={styles.formWrapper}>
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.formContainer}>
                            <Text style={styles.signInText}>Welcome Back,</Text>

                            {/* Email */}
                            <View style={styles.inputGroup}>
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
                                        placeholder="demo@email.com"
                                        placeholderTextColor="#9CA3AF"
                                        value={email}
                                        onChangeText={setEmail}
                                        onFocus={() => setFocusedInput("email")}
                                        onBlur={() => setFocusedInput(null)}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        editable={!isPending}
                                    />
                                </View>
                            </View>

                            {/* Password */}
                            <View style={styles.inputGroup}>
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
                                        placeholder="Enter your password"
                                        placeholderTextColor="#9CA3AF"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        onFocus={() => setFocusedInput("password")}
                                        onBlur={() => setFocusedInput(null)}
                                        editable={!isPending}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        disabled={isPending}
                                    >
                                        <Ionicons
                                            name={showPassword ? "eye-outline" : "eye-off-outline"}
                                            size={20}
                                            color="#9CA3AF"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Forgot */}
                            <View style={styles.rowBetween}>
                                <View />
                                <TouchableOpacity disabled={isPending}>
                                    <Text style={styles.forgotText}>Forgot Password?</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Login */}
                            <TouchableOpacity
                                style={[styles.loginButton, isPending && { opacity: 0.7 }]}
                                onPress={handleLogin}
                                disabled={isPending}
                            >
                                <Text style={styles.loginButtonText}>
                                    {isPending ? "Logging in..." : "Login"}
                                </Text>
                            </TouchableOpacity>

                            {/* Signup */}
                            <View style={styles.signupContainer}>
                                <Text style={styles.signupText}>
                                    Don’t have an account?
                                </Text>
                                <TouchableOpacity
                                    onPress={() => router.push("/(auth)/planSelection")}
                                    disabled={isPending}
                                >
                                    <Text style={styles.signupLink}> Sign up</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.bottomSpacing} />
                        </View>
                    </TouchableWithoutFeedback>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

export default LoginScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#800000" },
    headerContainer: {
        backgroundColor: "#800000",
        height: 280,
        justifyContent: "center",
        alignItems: "center",
    },
    logoContainer: { marginTop: 40 },
    logo: { width: 350, height: 350 },
    formWrapper: {
        flex: 1,
        backgroundColor: "#FFF",
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
    },
    scrollContainer: { flexGrow: 1, paddingBottom: 20 },
    formContainer: { paddingHorizontal: 24, paddingTop: 40 },
    signInText: {
        fontSize: 28,
        fontWeight: "800",
        color: "#1F2937",
        marginBottom: 24,
    },
    inputGroup: { marginBottom: 20 },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F9FAFB",
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 52,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    inputFocused: { borderColor: "#800000", backgroundColor: "#FFF" },
    input: { flex: 1, marginLeft: 10, fontSize: 15 },
    rowBetween: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 30,
    },
    forgotText: { color: "#800000", fontWeight: "600" },
    loginButton: {
        backgroundColor: "#800000",
        borderRadius: 12,
        height: 52,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
    },
    loginButtonText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
    signupContainer: { flexDirection: "row", justifyContent: "center" },
    signupText: { color: "#6B7280" },
    signupLink: { color: "#800000", fontWeight: "700" },
    bottomSpacing: { height: 40 },
});
