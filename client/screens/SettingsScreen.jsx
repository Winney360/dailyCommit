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
  const { user, logout, token } = useAuth();

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

  useEffect(() => {
    if (user?.id) {
      loadSettings();
    }
  }, [user?.id]);

  const loadSettings = async () => {
    if (!user?.id) return;
    const savedSettings = await getSettings(user.id);
    setLocalSettings(savedSettings);
    
    // Parse saved time for temp state
    if (savedSettings?.reminderTime) {
      const [hours, minutes] = savedSettings.reminderTime.split(":").map(Number);
      setTempHour(hours);
      setTempMinute(minutes);
    }
  };

  const updateSetting = async (key, value) => {
    if (!user?.id) return;
    const newSettings = { ...settings, [key]: value };
    setLocalSettings(newSettings);
    await setSettings(user.id, newSettings);

    // Handle notifications permission (skip on web)
    if (Platform.OS !== "web") {
      if (key === "notificationsEnabled" && value) {
        const hasPermission = await requestNotificationPermission();
        if (hasPermission) {
          await scheduleDailyReminder();
        } else {
          // Revert the setting if permission denied
          const revertedSettings = { ...settings, [key]: false };
          setLocalSettings(revertedSettings);
          await setSettings(user.id, revertedSettings);
          showErrorToast("Permission Denied", "Notifications permission is required for reminders");
        }
      } else if (key === "notificationsEnabled" && !value) {
        await cancelDailyReminder();
      }
    }
  };

  const requestNotificationPermission = async () => {
    if (Platform.OS === "web") return false;
    
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      return finalStatus === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  };

  const scheduleDailyReminder = async () => {
    if (Platform.OS === "web") return;
    
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
      showErrorToast("Reminder Failed", "Could not schedule daily reminder");
    }
  };

  const cancelDailyReminder = async () => {
    if (Platform.OS === "web") return;
    
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
      showSuccessToast("Reminder Set", `Daily reminder set for ${formatTime(timeString)}`);
    } else if (Platform.OS === "web") {
      showInfoToast("Time Saved", `Reminder time saved to ${formatTime(timeString)}. Notifications are only available on mobile devices.`);
    }
  };

  const handleGitHubPress = () => {
    Linking.openURL("https://github.com/Winney360/dailyCommit.git");
  };

  const handleLogout = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowLogoutModal(true);
  };

  const executeDeleteAccount = async () => {
    try {
      console.log("Starting account deletion...");
      await cancelDailyReminder();
      
      console.log("Calling deleteAccount API...");
      await deleteAccount();
      console.log("Account deleted from MongoDB");
      
      await clearAllData();
      console.log("Local data cleared");
      
      // Revoke GitHub OAuth token BEFORE logout
      if (token) {
        try {
          const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
          console.log("Revoking token at:", apiUrl);
          
          const revokeRes = await fetch(
            `${apiUrl}/api/auth/revoke-github-token`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
          
          if (!revokeRes.ok) {
            console.error("Revoke failed:", revokeRes.status);
          } else {
            console.log("GitHub token revoked successfully");
          }
        } catch (error) {
          console.error("Failed to revoke GitHub token:", error);
        }
      } else {
        console.warn("No token available, skipping GitHub revocation");
      }
      
      // Clear OAuth session (web)
      if (Platform.OS === "web") {
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      }
      
      // Reset auth state
      await logout();
      console.log("Logged out - GitHub token revoked");

      showSuccessToast(
        "Account Deleted",
        "Your DailyCommit account has been permanently deleted."
      );
    } catch (error) {
      console.error("Delete account error:", error);
      showErrorToast("Deletion Failed", error.message || "Could not delete account");
    }
  };

  const handleDeleteAccount = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    setDeleteInput("");
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = () => {
    if (deleteInput === "DELETE") {
      executeDeleteAccount();
      setShowDeleteModal(false);
    }
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
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
          <View style={[styles.profileCard, { backgroundColor: theme.backgroundDefault }]}>
            <View style={[styles.avatarContainer, { backgroundColor: theme.primary + "20" }]}>
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
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={styles.modalTitle}>
              Set Reminder Time
            </ThemedText>
            
            <View style={styles.pickerContainer}>
              <View style={styles.pickerColumn}>
                <TouchableOpacity
                  style={[styles.pickerArrow, { backgroundColor: theme.backgroundRoot }]}
                  onPress={() => setTempHour((h) => (h === 23 ? 0 : h + 1))}
                >
                  <Feather name="chevron-up" size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={[styles.pickerValue, { borderColor: theme.textTertiary }]}>
                  <ThemedText type="h2">{String(tempHour).padStart(2, "0")}</ThemedText>
                </View>
                <TouchableOpacity
                  style={[styles.pickerArrow, { backgroundColor: theme.backgroundRoot }]}
                  onPress={() => setTempHour((h) => (h === 0 ? 23 : h - 1))}
                >
                  <Feather name="chevron-down" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <ThemedText type="h2" style={styles.pickerSeparator}>:</ThemedText>

              <View style={styles.pickerColumn}>
                <TouchableOpacity
                  style={[styles.pickerArrow, { backgroundColor: theme.backgroundRoot }]}
                  onPress={() => setTempMinute((m) => (m === 59 ? 0 : m + 1))}
                >
                  <Feather name="chevron-up" size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={[styles.pickerValue, { borderColor: theme.textTertiary }]}>
                  <ThemedText type="h2">{String(tempMinute).padStart(2, "0")}</ThemedText>
                </View>
                <TouchableOpacity
                  style={[styles.pickerArrow, { backgroundColor: theme.backgroundRoot }]}
                  onPress={() => setTempMinute((m) => (m === 0 ? 59 : m - 1))}
                >
                  <Feather name="chevron-down" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: theme.textTertiary }]}
                onPress={() => setShowTimePicker(false)}
              >
                <ThemedText>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={handleTimePickerSave}
              >
                <ThemedText style={{ color: "white" }}>Save</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={styles.modalTitle}>
              Delete Account?
            </ThemedText>
            
            <ThemedText style={[styles.modalText, { color: theme.textSecondary }]}>
              This action cannot be undone. Type "DELETE" to confirm.
            </ThemedText>

            <TextInput
              style={[
                styles.deleteInput,
                {
                  backgroundColor: theme.backgroundRoot,
                  borderColor: theme.textTertiary,
                  color: theme.text,
                },
              ]}
              placeholder="Type DELETE"
              placeholderTextColor={theme.textTertiary}
              value={deleteInput}
              onChangeText={setDeleteInput}
              autoCapitalize="characters"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: theme.textTertiary }]}
                onPress={() => setShowDeleteModal(false)}
              >
                <ThemedText>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.deleteButton,
                  {
                    backgroundColor: deleteInput === "DELETE" ? "#DC2626" : theme.textTertiary,
                  },
                ]}
                onPress={confirmDeleteAccount}
                disabled={deleteInput !== "DELETE"}
              >
                <ThemedText style={{ color: "white" }}>Delete</ThemedText>
              </TouchableOpacity>
            </View>
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
        <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={styles.modalTitle}>
              Sign Out?
            </ThemedText>
            
            <ThemedText style={[styles.modalText, { color: theme.textSecondary }]}>
              Are you sure you want to sign out?
            </ThemedText>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: theme.textTertiary }]}
                onPress={() => setShowLogoutModal(false)}
              >
                <ThemedText>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                  setShowLogoutModal(false);
                  logout();
                }}
              >
                <ThemedText style={{ color: "white" }}>Sign Out</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    ...Shadows.card,
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
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  modalTitle: {
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  modalText: {
    marginBottom: Spacing.xl,
    textAlign: "center",
  },
  pickerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  pickerColumn: {
    alignItems: "center",
    width: 80,
  },
  pickerArrow: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerValue: {
    width: "100%",
    height: 70,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: Spacing.sm,
  },
  pickerSeparator: {
    marginHorizontal: Spacing.md,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    borderWidth: 0,
  },
  deleteButton: {
    borderWidth: 0,
  },
  deleteInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    marginBottom: Spacing.xl,
  },
});