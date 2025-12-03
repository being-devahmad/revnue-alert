import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

export default function ForgotPasswordWebview() {
  const url = "https://development.renewalert.com/password/email"; 

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WebView
        source={{ uri: url }}
        startInLoadingState
        renderLoading={() => (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="large" color="#800000" />
          </View>
        )}
      />
    </SafeAreaView>
  );
}
