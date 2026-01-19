import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

export function LoadingSpinner({ message = "Loading...", fullScreen = false }) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        fullScreen && styles.fullScreen,
        { backgroundColor: fullScreen ? theme.backgroundRoot : "transparent" },
      ]}
    >
      <ActivityIndicator size="large" color={theme.primary} />
      {message ? (
        <ThemedText type="small" style={[styles.message, { color: theme.textSecondary }]}>
          {message}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  fullScreen: {
    flex: 1,
  },
  message: {
    marginTop: Spacing.md,
  },
});
