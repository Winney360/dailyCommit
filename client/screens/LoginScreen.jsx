import React, { useState } from "react";
import { View, StyleSheet, Image, Pressable, Linking, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  FadeInUp,
} from "react-native-reanimated";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const baseUrl = getApiUrl();
      const authUrl = `${baseUrl}api/auth/github`;
      
      if (Platform.OS === "web") {
        window.location.href = authUrl;
      } else {
        const result = await WebBrowser.openAuthSessionAsync(
          authUrl,
          "dailycommit://auth/callback"
        );

        if (result.type === "success" && result.url) {
          const url = new URL(result.url);
          const userParam = url.searchParams.get("user");
          if (userParam) {
            const userData = JSON.parse(decodeURIComponent(userParam));
            await login(userData);
          }
        }
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const demoUser = {
      id: "demo-user-123",
      username: "developer",
      email: "developer@example.com",
      avatarUrl: null,
      createdAt: new Date().toISOString(),
    };
    
    await login(demoUser);
    setIsLoading(false);
  };

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

          <Pressable
            onPress={handleDemoLogin}
            style={({ pressed }) => [
              styles.demoButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <ThemedText type="body" style={{ color: theme.primary }}>
              Try Demo Mode
            </ThemedText>
          </Pressable>
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
    gap: Spacing.lg,
    alignItems: "center",
  },
  githubButton: {
    width: "100%",
  },
  demoButton: {
    paddingVertical: Spacing.md,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
  },
  footerText: {
    textAlign: "center",
    fontSize: 12,
  },
});
