import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
        gradientColors: [theme.success + "20", theme.success + "10"],
        title: "You're all set!",
        subtitle: `${todayCommits} ${todayCommits === 1 ? "commit" : "commits"} today`,
      };
    }
    return {
      icon: "alert-circle",
      iconColor: theme.warning,
      bgColor: theme.warning + "15",
      gradientColors: [theme.warning + "20", theme.warning + "10"],
      title: "No commits yet",
      subtitle: `${timeRemaining} left today`,
    };
  };

  const config = getStatusConfig();

  return (
    <View
      style={[
        styles.container,
        Shadows.card,
      ]}
    >
      <LinearGradient
        colors={[theme.backgroundDefault, theme.backgroundSecondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderWidth: 1, borderColor: theme.border }]}
      >
        <LinearGradient
          colors={config.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconContainer}
        >
          <Feather name={config.icon} size={28} color={config.iconColor} />
        </LinearGradient>
        <View style={styles.textContainer}>
          <ThemedText type="h4" style={{ color: theme.text, fontWeight: '700' }}>
            {config.title}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 2 }}>
            {config.subtitle}
          </ThemedText>
        </View>
        {hasCommittedToday ? (
          <View style={[styles.badge, { backgroundColor: theme.success, ...Shadows.glow }]}>
            <Feather name="check" size={18} color={theme.buttonText} />
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
