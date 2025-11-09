
import { useLoginMutation } from "@/api/auth/useLogin";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Alert,
    Image,
    Keyboard,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";

interface LoginScreenProps {
  onLogin: () => void;
  onNavigateToSignup?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onNavigateToSignup }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Use the login mutation hook
  const { mutate: loginMutate, isPending, error } = useLoginMutation();

  const handleLogin = async () => {
    // Basic validation
    if (!email || !password) {
      Alert.alert("Validation Error", "Please enter both email and password");
      return;
    }

    if (!email.includes("@")) {
      Alert.alert("Validation Error", "Please enter a valid email address");
      return;
    }

    // Call the mutation
    loginMutate(
      { email, password },
      {
        onSuccess: (data) => {
          // Handle successful login
          Alert.alert("Success", data.message || "Login successful");
          // Clear form
          setEmail("");
          setPassword("");
          // Navigate to next screen
          onLogin();
        },
        onError: (error: any) => {
          // Handle login error
          const errorMessage =
            error.response?.data?.message || "Login failed. Please try again.";
          Alert.alert("Login Failed", errorMessage);
        },
      }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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
      <View style={styles.formWrapper}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={true}
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

              {/* Remember & Forgot */}
              <View style={styles.rowBetween}>
                <View />
                <TouchableOpacity disabled={isPending}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  isPending && { opacity: 0.7 },
                ]}
                onPress={handleLogin}
                disabled={isPending}
              >
                <Text style={styles.loginButtonText}>
                  {isPending ? "Logging in..." : "Login"}
                </Text>
              </TouchableOpacity>

              {/* Signup Link */}
              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Don&apos;t have an account?</Text>
                <TouchableOpacity onPress={onNavigateToSignup} disabled={isPending}>
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
  container: {
    flex: 1,
    backgroundColor: "#800000",
  },
  headerContainer: {
    backgroundColor: "#800000",
    height: 280,
    justifyContent: "center",
    alignItems: "center",
  },
  waveBackground: {
    position: "relative",
    width: "100%",
    height: "100%",
  },
  waveSvg: {
    position: "absolute",
    bottom: 0,
  },
  logoContainer: {
    marginTop: 40,
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
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
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
    flex: 1,
    backgroundColor: "#FFF",
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  signInText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 24,
    textDecorationColor: "#800000",
  },
  inputGroup: {
    marginBottom: 20,
  },
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
  inputFocused: {
    borderColor: "#800000",
    backgroundColor: "#FFF",
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#1F2937",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  rememberText: {
    color: "#800000",
    fontSize: 14,
  },
  forgotText: {
    color: "#800000",
    fontWeight: "600",
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: "#800000",
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  loginButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  signupText: {
    color: "#6B7280",
    fontSize: 14,
  },
  signupLink: {
    color: "#800000",
    fontSize: 14,
    fontWeight: "700",
  },
  bottomSpacing: {
    height: 40,
  },
});