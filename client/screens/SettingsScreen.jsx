import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, Image, Platform, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Notifications from "expo-notifications";

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

  const resetToLogin = () => {
    const parent = navigation.getParent();
    if (parent) {
      parent.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Login" }],
        })
      );
    }
  };

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

    // Handle notifications permission
    if (key === "notificationsEnabled" && value) {
      await requestNotificationPermission();
      await scheduleDailyReminder();
    } else if (key === "notificationsEnabled" && !value) {
      await cancelDailyReminder();
    }
  };

  const requestNotificationPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      return newStatus === "granted";
    }
    return true;
  };

  const scheduleDailyReminder = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();

      const [hours, minutes] = settings.reminderTime.split(":").map(Number);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "DailyCommit Reminder",
          body: "Don't forget to make your daily GitHub commit!",
          data: { screen: "Dashboard" },
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });

      console.log("Daily reminder scheduled for", settings.reminderTime);
    } catch (error) {
      console.error("Failed to schedule reminder:", error);
    }
  };

  const cancelDailyReminder = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log("Daily reminders cancelled");
    } catch (error) {
      console.error("Failed to cancel reminders:", error);
    }
  };

  const handleReminderTimePress = async () => {
    if (Platform.OS === "ios" || Platform.OS === "android") {
      // For mobile, you'd use a DateTimePicker component
      Alert.alert(
        "Reminder Time",
        "Time picker would open here. For now, you can manually edit in settings.",
        [{ text: "OK" }]
      );
    } else {
      // For web, show an alert with instructions
      Alert.alert(
        "Set Reminder Time",
        "Enter time in 24-hour format (HH:MM):",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Set",
            onPress: () => {
              Alert.prompt(
                "Reminder Time",
                "Enter time (HH:MM):",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Save",
                    onPress: async (time) => {
                      if (time && /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
                        await updateSetting("reminderTime", time);
                        Alert.alert("Success", `Reminder time set to ${time}`);
                      } else {
                        Alert.alert("Error", "Please enter a valid time in HH:MM format");
                      }
                    },
                  },
                ],
                "plain-text",
                settings.reminderTime
              );
            },
          },
        ]
      );
    }
  };

  const handleGitHubPress = () => {
    Linking.openURL("https://github.com/yourusername/dailycommit");
  };

  const handleFeedbackPress = () => {
    Linking.openURL("mailto:support@example.com?subject=DailyCommit Feedback");
  };

  const handleLogout = async () => {
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
              console.log("Starting logout...");

              await cancelDailyReminder();
              await logout();

              console.log("Logout successful");

              resetToLogin();
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Error", "Failed to log out. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleClearData = async () => {
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
            try {
              await cancelDailyReminder();
              await clearAllData();
              await logout();

              Alert.alert(
                "Data Cleared",
                "All data has been cleared. You will be redirected to login.",
                [
                  {
                    text: "OK",
                    onPress: () => {
                      resetToLogin();
                    },
                  },
                ]
              );
            } catch (error) {
              console.error("Clear data error:", error);
              Alert.alert("Error", "Failed to clear data. Please try again.");
            }
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
            subtitle={formatTime(settings.reminderTime)}
            showChevron
            onPress={handleReminderTimePress}
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
            subtitle="1.0.0"
          />
          <SettingsItem
            icon="github"
            title="Source Code"
            subtitle="View on GitHub"
            showChevron
            onPress={handleGitHubPress}
          />
          <SettingsItem
            icon="mail"
            title="Send Feedback"
            subtitle="Help us improve"
            showChevron
            onPress={handleFeedbackPress}
          />
        </SettingsSection>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(500).duration(500)}>
        <SettingsSection title="Account">
          <SettingsItem
            icon="log-out"
            title="Log Out"
            subtitle="Sign out of your account"
            onPress={handleLogout}
          />
          <SettingsItem
            icon="trash-2"
            title="Clear All Data"
            subtitle="Delete all app data"
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
