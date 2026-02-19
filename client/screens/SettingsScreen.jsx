import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Image, Platform, Linking, Modal, TouchableOpacity, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
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
import { deleteAccount } from "@/lib/api";
import { showSuccessToast, showErrorToast, showInfoToast } from "@/lib/toast";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user, logout } = useAuth();

  const [settings, setLocalSettings] = useState({
    reminderTime: "20:00",
    notificationsEnabled: true,
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempHour, setTempHour] = useState(20);
  const [tempMinute, setTempMinute] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadSettings();
    }
  }, [user?.id]);

  const loadSettings = async () => {
    if (!user?.id) return;
    const savedSettings = await getSettings(user.id);
    setLocalSettings(savedSettings);
  };

  const updateSetting = async (key, value) => {
    if (!user?.id) return;
    const newSettings = { ...settings, [key]: value };
    setLocalSettings(newSettings);
    await setSettings(user.id, newSettings);

    // Handle notifications permission (skip on web)
    if (Platform.OS !== "web") {
      if (key === "notificationsEnabled" && value) {
        await requestNotificationPermission();
        await scheduleDailyReminder();
      } else if (key === "notificationsEnabled" && !value) {
        await cancelDailyReminder();
      }
    }
  };

  const requestNotificationPermission = async () => {
    if (Platform.OS === "web") return true; // Notifications not supported on web
    
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      return newStatus === "granted";
    }
    return true;
  };

  const scheduleDailyReminder = async () => {
    if (Platform.OS === "web") return; // Notifications not supported on web
    
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
    if (Platform.OS === "web") return; // Notifications not supported on web
    
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log("Daily reminders cancelled");
    } catch (error) {
      console.error("Failed to cancel reminders:", error);
    }
  };

  const handleReminderTimePress = () => {
    const [hours, minutes] = settings.reminderTime.split(":").map(Number);
    setTempHour(hours);
    setTempMinute(minutes);
    setShowTimePicker(true);
  };

  const handleTimePickerSave = async () => {
    const timeString = `${String(tempHour).padStart(2, "0")}:${String(tempMinute).padStart(2, "0")}`;
    await updateSetting("reminderTime", timeString);
    setShowTimePicker(false);
    
    if (settings.notificationsEnabled && Platform.OS !== "web") {
      await scheduleDailyReminder();
      showSuccessToast("Reminder Set", `Reminder time set to ${formatTime(timeString)}`);
    } else if (Platform.OS === "web") {
      showInfoToast("Web Reminder", `Reminder time saved to ${formatTime(timeString)}. Notifications are only available on mobile devices.`);
    }
  };

  const handleGitHubPress = () => {
    Linking.openURL("https://github.com/Winney360/dailyCommit.git");
  };

  const handleLogout = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Show logout confirmation modal for all platforms
    setShowLogoutModal(true);
  };

  const executeDeleteAccount = async () => {
    try {
      console.log("Starting account deletion...");
      await cancelDailyReminder();
      
      console.log("Calling deleteAccount API...");
      await deleteAccount();
      console.log("Account deleted from Firebase");
      
      await clearAllData();
      console.log("Local data cleared");
      
      await logout();
      console.log("Logged out");

      // Navigation will happen automatically via AuthContext state change
      if (Platform.OS === "web") {
        setShowDeleteSuccess(true);
        setTimeout(() => setShowDeleteSuccess(false), 2000);
      } else {
        showSuccessToast(
          "Account Deleted",
          "Your DailyCommit account has been permanently deleted."
        );
      }
    } catch (error) {
      console.error("Delete account error:", error);
      showErrorToast("Deletion Failed", error.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    setDeleteInput("");
    setShowDeleteModal(true);
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
            style={[styles.avatarContainer, { backgroundColor: theme.primary + "20"} ]}
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
        </SettingsSection>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(400).duration(500)}>
        <SettingsSection title="Account">
          <SettingsItem
            icon="log-out"
            title="Log Out"
            subtitle="Sign out of your account"
            onPress={handleLogout}
          />
          <SettingsItem
            icon="user-x"
            title="Delete Account"
            subtitle="Remove your DailyCommit account"
            destructive
            onPress={handleDeleteAccount}
          />
        </SettingsSection>
      </Animated.View>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4" style={{ color: theme.text }}>
                Set Reminder Time
              </ThemedText>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Time Display */}
            <View style={[styles.timeDisplay, { backgroundColor: theme.primary + "10", borderColor: theme.primary }]}>
              <ThemedText type="h1" style={{ color: theme.primary, fontWeight: "900" }}>
                {String(tempHour).padStart(2, "0")}:{String(tempMinute).padStart(2, "0")}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
                {formatTime(`${String(tempHour).padStart(2, "0")}:${String(tempMinute).padStart(2, "0")}`)}
              </ThemedText>
            </View>

            {/* Hour Picker */}
            <View style={styles.pickerSection}>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
                Hours
              </ThemedText>
              <View style={styles.numberPicker}>
                <TouchableOpacity
                  style={[styles.pickerButton, { backgroundColor: theme.backgroundSecondary }]}
                  onPress={() => setTempHour(tempHour === 0 ? 23 : tempHour - 1)}
                >
                  <Feather name="minus" size={20} color={theme.primary} />
                </TouchableOpacity>
                <View style={[styles.pickerValue, { borderColor: theme.border }]}>
                  <ThemedText type="h5">{String(tempHour).padStart(2, "0")}</ThemedText>
                </View>
                <TouchableOpacity
                  style={[styles.pickerButton, { backgroundColor: theme.backgroundSecondary }]}
                  onPress={() => setTempHour(tempHour === 23 ? 0 : tempHour + 1)}
                >
                  <Feather name="plus" size={20} color={theme.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Minute Picker */}
            <View style={styles.pickerSection}>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
                Minutes
              </ThemedText>
              <View style={styles.numberPicker}>
                <TouchableOpacity
                  style={[styles.pickerButton, { backgroundColor: theme.backgroundSecondary }]}
                  onPress={() => setTempMinute(tempMinute === 0 ? 59 : tempMinute - 1)}
                >
                  <Feather name="minus" size={20} color={theme.primary} />
                </TouchableOpacity>
                <View style={[styles.pickerValue, { borderColor: theme.border }]}>
                  <ThemedText type="h5">{String(tempMinute).padStart(2, "0")}</ThemedText>
                </View>
                <TouchableOpacity
                  style={[styles.pickerButton, { backgroundColor: theme.backgroundSecondary }]}
                  onPress={() => setTempMinute(tempMinute === 59 ? 0 : tempMinute + 1)}
                >
                  <Feather name="plus" size={20} color={theme.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: theme.border }]}
                onPress={() => setShowTimePicker(false)}
              >
                <ThemedText type="body" style={{ color: theme.text, fontWeight: "600" }}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={handleTimePickerSave}
              >
                <ThemedText type="body" style={{ color: "white", fontWeight: "600" }}>
                  Save
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}> 
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}> 
            <View style={styles.modalHeader}>
              <ThemedText type="h4" style={{ color: theme.text }}>
                Delete Account
              </ThemedText>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.lg }}>
                Type DELETE to permanently remove your DailyCommit account and data.
            </ThemedText>

            <TextInput
              value={deleteInput}
              onChangeText={setDeleteInput}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="Type DELETE"
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.deleteInput,
                {
                  borderColor: deleteInput === "DELETE" ? theme.primary : theme.border,
                  color: theme.text,
                  backgroundColor: theme.backgroundSecondary,
                },
              ]}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: theme.border }]}
                onPress={() => setShowDeleteModal(false)}
              >
                <ThemedText type="body" style={{ color: theme.text, fontWeight: "600" }}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: deleteInput === "DELETE" ? theme.error : theme.border,
                    opacity: deleteInput === "DELETE" ? 1 : 0.5,
                  },
                ]}
                onPress={async () => {
                  if (deleteInput !== "DELETE") return;
                  setShowDeleteModal(false);
                  await executeDeleteAccount();
                }}
              >
                <ThemedText type="body" style={{ color: "white", fontWeight: "600" }}>
                  Delete Account
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Success Modal */}
      <Modal
        visible={showDeleteSuccess}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteSuccess(false)}
      >
        <View style={[styles.successModalContainer, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
          <View style={[styles.successModalContent, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="check-circle" size={48} color="#FB923C" />
            <ThemedText type="h4" style={{ color: theme.text, marginTop: Spacing.md }}>
              Account Deleted
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.sm, textAlign: "center" }}>
              Your DailyCommit account has been permanently deleted.
            </ThemedText>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={[styles.successModalContent, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="log-out" size={48} color="#EF4444" />
            <ThemedText type="h4" style={{ color: theme.text, marginTop: Spacing.md }}>
              Log Out?
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.sm, textAlign: "center" }}>
              Are you sure you want to log out?
            </ThemedText>
            <View style={{ flexDirection: "row", gap: Spacing.md, marginTop: Spacing.xl, width: "100%" }}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: theme.border, backgroundColor: "transparent" }]}
                onPress={() => setShowLogoutModal(false)}
              >
                <ThemedText type="body" style={{ color: theme.text, fontWeight: "600" }}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={async () => {
                  setShowLogoutModal(false);
                  const doLogout = async () => {
                    try {
                      console.log("Starting logout...");
                      await cancelDailyReminder();
                      await logout();
                      console.log("Logout successful");
                    } catch (error) {
                      console.error("Logout error:", error);
                      showErrorToast("Logout Failed", "Please try again");
                    }
                  };
                  await doLogout();
                }}
              >
                <ThemedText type="body" style={{ color: "white", fontWeight: "600" }}>
                  Log Out
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  // Time Picker Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  timeDisplay: {
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xxl,
    borderWidth: 2,
  },
  pickerSection: {
    marginBottom: Spacing.xl,
  },
  numberPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  pickerButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerValue: {
    width: 80,
    height: 60,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xxl,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  saveButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  deleteInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  successModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  successModalContent: {
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    alignItems: "center",
    flex: 0,
    width: 280,
  },
});
