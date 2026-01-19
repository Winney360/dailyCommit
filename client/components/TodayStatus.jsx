import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

export function TodayStatus({ hasCommittedToday, todayCommits, timeRemaining }) {
  const { theme } = useTheme();

  const getStatusConfig = () => {
    if (hasCommittedToday) {
      return {
        icon: "check-circle",
        iconColor: theme.success,
        bgColor: theme.success + "15",
        title: "You're all set!",
        subtitle: `${todayCommits} ${todayCommits === 1 ? "commit" : "commits"} today`,
      };
    }
    return {
      icon: "alert-circle",
      iconColor: theme.warning,
      bgColor: theme.warning + "15",
      title: "No commits yet",
      subtitle: `${timeRemaining} left today`,
    };
  };

  const config = getStatusConfig();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.backgroundDefault },
        Shadows.card,
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
        <Feather name={config.icon} size={28} color={config.iconColor} />
      </View>
      <View style={styles.textContainer}>
        <ThemedText type="h4" style={{ color: theme.text }}>
          {config.title}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {config.subtitle}
        </ThemedText>
      </View>
      {hasCommittedToday ? (
        <View style={[styles.badge, { backgroundColor: theme.success }]}>
          <Feather name="check" size={16} color={theme.buttonText} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
