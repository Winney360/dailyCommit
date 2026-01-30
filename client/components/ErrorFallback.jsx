import React from "react";
import { reloadAppAsync } from "expo";
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  Text,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Spacing, BorderRadius } from "@/constants/theme";

export function ErrorFallback({ error, resetError }) {
  // Use default light theme to avoid hook calls
  const theme = {
    backgroundDefault: "#FFFFFF",
    text: "#000000",
    textSecondary: "#666666",
    error: "#FF3B30",
    buttonText: "#FFFFFF",
    primary: "#007AFF",
  };

  const handleRestart = async () => {
    try {
      await reloadAppAsync();
    } catch (restartError) {
      console.error("Failed to restart app:", restartError);
      resetError();
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.backgroundDefault }
      ]}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: theme.error + "20" }]}>
          <Feather name="alert-triangle" size={48} color={theme.error} />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>
          Something went wrong
        </Text>

        <Text style={[styles.message, { color: theme.textSecondary }]}>
          DailyCommit encountered an error. Please restart the app to continue tracking your coding streak.
        </Text>

        {__DEV__ && (
          <ScrollView style={styles.devErrorContainer}>
            <Text style={[styles.devErrorText, { color: theme.error }]}>
              {error.message}
            </Text>
            {error.stack && (
              <Text style={[styles.devStackTrace, { color: theme.textSecondary }]}>
                {error.stack}
              </Text>
            )}
          </ScrollView>
        )}

        <Pressable
          onPress={handleRestart}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: theme.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <View style={styles.buttonContent}>
            <Feather name="refresh-cw" size={20} color={theme.buttonText} />
            <Text style={[styles.buttonText, { color: theme.buttonText, marginLeft: Spacing.sm }]}>
              Restart App
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing["2xl"],
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
    width: "100%",
    maxWidth: 400,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 32,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  devErrorContainer: {
    maxHeight: 200,
    width: "100%",
    marginVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(255, 59, 48, 0.1)",
  },
  devErrorText: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  devStackTrace: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: "monospace",
  },
  button: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing["2xl"],
    minWidth: 200,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.lg,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontWeight: "600",
    textAlign: "center",
    fontSize: 16,
  },
});
