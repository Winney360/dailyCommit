import React, { useState, useEffect } from "react"; // ← Added useEffect import
import { View, StyleSheet, Image, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  FadeInUp,
} from "react-native-reanimated";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Add this useEffect to handle web callback
  useEffect(() => {
    if (Platform.OS === "web") {
      // Check if we're on the callback page
      const urlParams = new URLSearchParams(window.location.search);
      const userParam = urlParams.get('user');
      const tokenParam = urlParams.get('token');
      
      if (userParam) {
        // We're on the callback page with user data
        const handleCallback = async () => {
          setIsLoading(true);
          try {
            console.log("=== WEB CALLBACK HANDLER ===");
            console.log("User param found, processing...");
            
            const userData = JSON.parse(decodeURIComponent(userParam));
            console.log("User data:", userData);
            
            if (tokenParam) {
              userData.accessToken = decodeURIComponent(tokenParam);
            }
            
            await login(userData);
            
            // Clear the URL parameters (clean up the URL)
            window.history.replaceState({}, document.title, window.location.pathname);
            
            console.log("Web callback successful, user logged in");
          } catch (error) {
            console.error("Callback error:", error);
            setError(error.message);
            Alert.alert("Login Error", error.message);
          } finally {
            setIsLoading(false);
          }
        };
        
        handleCallback();
      }
    }
  }, [login]);

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const baseUrl = getApiUrl();
      
      // Don't pass custom redirect_uri - let backend use GITHUB_REDIRECT_URI
      const authUrl = `${baseUrl}api/auth/github`;
      
      console.log("=== GITHUB LOGIN DEBUG ===");
      console.log("Platform:", Platform.OS);
      console.log("Auth URL:", authUrl);
      
      if (Platform.OS === "web") {
        // For web - redirect to OAuth flow
        window.location.href = authUrl;
      } else {
        // For mobile - use WebBrowser
        console.log("Opening WebBrowser session...");
        const result = await WebBrowser.openAuthSessionAsync(
          authUrl,
          "dailycommit://auth/callback"
        );

        console.log("WebBrowser result:", result);

        if (result.type === "success" && result.url) {
          console.log("Success! Result URL:", result.url);
          
          // Parse the response URL
          let url;
          try {
            // Create URL object - handle both http:// and custom scheme URLs
            if (result.url.startsWith('dailycommit://')) {
              // For custom scheme, we need to parse manually
              const urlParts = result.url.replace('dailycommit://', 'http://placeholder/');
              url = new URL(urlParts);
            } else {
              url = new URL(result.url);
            }
          } catch (urlError) {
            console.error("Error parsing URL:", urlError);
            // Try manual parsing as fallback
            const queryString = result.url.split('?')[1] || '';
            const params = new URLSearchParams(queryString);
            const userParam = params.get('user');
            const tokenParam = params.get('token');
            
            if (userParam) {
              const userData = JSON.parse(decodeURIComponent(userParam));
              if (tokenParam) {
                userData.accessToken = decodeURIComponent(tokenParam);
              }
              await login(userData);
              return;
            }
            throw new Error("Failed to parse authentication response");
          }
          
          const userParam = url.searchParams.get("user");
          const tokenParam = url.searchParams.get("token");
          
          if (!userParam) {
            throw new Error("No user data received from authentication");
          }

          const userData = JSON.parse(decodeURIComponent(userParam));
          
          if (!userData.id || !userData.username) {
            throw new Error("Invalid user data: missing required fields");
          }

          if (tokenParam) {
            userData.accessToken = decodeURIComponent(tokenParam);
          }

          console.log("Login successful for user:", userData.username);
          await login(userData);
        } else if (result.type === "cancel") {
          console.log("Authentication cancelled by user");
          setError("Authentication cancelled");
        } else {
          console.log("Authentication failed with type:", result.type);
          setError(`Authentication failed: ${result.type}`);
          Alert.alert("Authentication Failed", `Authentication failed: ${result.type}`);
        }
      }
    } catch (error) {
      console.error("GitHub login error:", error);
      setError(error.message || "Failed to login with GitHub. Please try again.");
      Alert.alert("Login Error", error.message || "An error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state if processing callback
  if (isLoading && Platform.OS === "web") {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.content, { 
          paddingTop: insets.top + 80, 
          paddingBottom: insets.bottom + 40 
        }]}>
          <ThemedText type="h2">Completing login...</ThemedText>
          <ThemedText type="body" style={{ marginTop: 20, color: theme.textSecondary }}>
            Please wait while we complete your authentication.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.content,
          { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 40 },
        ]}
      >
        <Animated.View
          entering={FadeInUp.delay(100).duration(600)}
          style={styles.logoContainer}
        >
          <Image
            source={require("../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(200).duration(600)}
          style={styles.textContainer}
        >
          <ThemedText type="h1" style={styles.title}>
            DailyCommit
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.tagline, { color: theme.textSecondary }]}
          >
            Build your coding streak
          </ThemedText>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(300).duration(600)}
          style={styles.featuresContainer}
        >
          <FeatureItem
            icon="git-commit"
            text="Track your GitHub commits"
            theme={theme}
          />
          <FeatureItem
            icon="zap"
            text="Maintain daily streaks"
            theme={theme}
          />
          <FeatureItem
            icon="bar-chart-2"
            text="Visualize your progress"
            theme={theme}
          />
        </Animated.View>

        {error && (
          <Animated.View
            entering={FadeInUp.delay(350).duration(400)}
            style={[
              styles.errorContainer,
              { backgroundColor: theme.error + "20", borderColor: theme.error },
            ]}
          >
            <ThemedText type="small" style={{ color: theme.error }}>
              {error}
            </ThemedText>
          </Animated.View>
        )}

        <Animated.View
          entering={FadeInUp.delay(400).duration(600)}
          style={styles.buttonContainer}
        >
          <Button
            onPress={handleGitHubLogin}
            disabled={isLoading}
            icon={<Feather name="github" size={20} color={theme.buttonText} />}
            style={styles.githubButton}
          >
            Continue with GitHub
          </Button>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(500).duration(600)}
          style={styles.footer}
        >
          <ThemedText
            type="caption"
            style={[styles.footerText, { color: theme.textSecondary }]}
          >
            By continuing, you agree to our Terms of Service and Privacy Policy
          </ThemedText>
        </Animated.View>
      </View>
    </ThemedView>
  );
}

function FeatureItem({ icon, text, theme }) {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIcon, { backgroundColor: theme.primary + "15" }]}>
        <Feather name={icon} size={18} color={theme.primary} />
      </View>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing["2xl"],
  },
  logoContainer: {
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.xl,
  },
  textContainer: {
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  tagline: {
    textAlign: "center",
  },
  featuresContainer: {
    width: "100%",
    maxWidth: 300,
    gap: Spacing.md,
  },
  errorContainer: {
    width: "100%",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginVertical: Spacing.lg,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  githubButton: {
    width: "100%",
  },
  footer: {
    paddingHorizontal: Spacing.xl,
  },
  footerText: {
    textAlign: "center",
    fontSize: 12,
  },
});