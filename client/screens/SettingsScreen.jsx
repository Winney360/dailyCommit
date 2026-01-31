import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { SettingsItem, SettingsSection } from "@/components/SettingsItem";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { getSettings, setSettings, clearAllData } from "@/lib/storage";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  const [settings, setLocalSettings] = useState({
    reminderTime: "20:00",
    notificationsEnabled: true,
    darkModeAuto: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const savedSettings = await getSettings();
    setLocalSettings(savedSettings);
  };

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setLocalSettings(newSettings);
    await setSettings(newSettings);
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              // Add a small delay to ensure state updates
              setTimeout(() => {
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: "Login" }],
                  })
                );
              }, 100);
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Error", "Failed to log out. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Clear All Data",
      "This will delete all your streak data and settings. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Data",
          style: "destructive",
          onPress: async () => {
            await clearAllData();
            await logout();
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: "Login" }],
              })
            );
          },
        },
      ]
    );
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
        },
      ]}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <Animated.View entering={FadeInUp.delay(100).duration(500)}>
        <View
          style={[
            styles.profileCard,
            { backgroundColor: theme.backgroundDefault },
            Shadows.card,
          ]}
        >
          <View
            style={[styles.avatarContainer, { backgroundColor: theme.primary + "20" }]}
          >
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <Feather name="user" size={32} color={theme.primary} />
            )}
          </View>
          <View style={styles.profileInfo}>
            <ThemedText type="h4">{user?.username || "Developer"}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {user?.email || "developer@example.com"}
            </ThemedText>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(500)}>
        <SettingsSection title="Notifications">
          <SettingsItem
            icon="bell"
            title="Daily Reminders"
            subtitle="Get reminded to commit"
            isSwitch
            value={settings.notificationsEnabled}
            onValueChange={(value) => updateSetting("notificationsEnabled", value)}
          />
          <SettingsItem
            icon="clock"
            title="Reminder Time"
            value={formatTime(settings.reminderTime)}
            showChevron
            onPress={() => {}}
          />
        </SettingsSection>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300).duration(500)}>
        <SettingsSection title="Appearance">
          <SettingsItem
            icon="moon"
            title="System Theme"
            subtitle="Follow device settings"
            isSwitch
            value={settings.darkModeAuto}
            onValueChange={(value) => updateSetting("darkModeAuto", value)}
          />
        </SettingsSection>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(400).duration(500)}>
        <SettingsSection title="About">
          <SettingsItem
            icon="info"
            title="Version"
            value="1.0.0"
          />
          <SettingsItem
            icon="github"
            title="Source Code"
            showChevron
            onPress={() => {}}
          />
          <SettingsItem
            icon="mail"
            title="Send Feedback"
            showChevron
            onPress={() => {}}
          />
        </SettingsSection>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(500).duration(500)}>
        <SettingsSection title="Account">
          <SettingsItem
            icon="log-out"
            title="Log Out"
            onPress={handleLogout}
          />
          <SettingsItem
            icon="trash-2"
            title="Clear All Data"
            destructive
            onPress={handleClearData}
          />
        </SettingsSection>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatar: {
    width: 64,
    height: 64,
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
    gap: 2,
  },
});
