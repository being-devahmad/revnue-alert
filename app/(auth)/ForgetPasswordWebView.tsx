import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

export default function ForgotPasswordWebview() {
  const url = "https://development.renewalert.com/password/email";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Failed to load the page. Please check your connection or try again
            later.
          </Text>
        </View>
      ) : (
        <WebView
          source={{ uri: url }}
          onLoadStart={() => {
            setLoading(true);
            setError(false);
          }}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator size="large" color="#800000" />
            </View>
          )}
          originWhitelist={["*"]}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    textAlign: "center",
    color: "#EF4444",
    fontSize: 16,
  },
});
