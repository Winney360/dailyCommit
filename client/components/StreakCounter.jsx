import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  interpolate,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

export function StreakCounter({ currentStreak, longestStreak, animate = true }) {
  const { theme } = useTheme();
  const scale = useSharedValue(animate ? 0 : 1);
  const opacity = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (animate) {
      scale.value = withDelay(
        200,
        withSpring(1, { damping: 12, stiffness: 100 })
      );
      opacity.value = withDelay(200, withSpring(1));
    }
  }, [animate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const isOnFire = currentStreak >= 7;
  const iconColor = isOnFire ? theme.accent : theme.primary;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: theme.backgroundDefault },
        Shadows.cardLarge,
        animatedStyle,
      ]}
    >
      <View style={styles.mainStreak}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor + "20" }]}>
          <Feather
            name={isOnFire ? "zap" : "git-commit"}
            size={32}
            color={iconColor}
          />
        </View>
        <View style={styles.streakInfo}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Current Streak
          </ThemedText>
          <View style={styles.streakValue}>
            <ThemedText type="h1" style={[styles.number, { color: theme.text }]}>
              {currentStreak}
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              {currentStreak === 1 ? "day" : "days"}
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.longestStreak}>
        <Feather name="award" size={20} color={theme.warning} />
        <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}>
          Longest: {longestStreak} {longestStreak === 1 ? "day" : "days"}
        </ThemedText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    padding: Spacing["2xl"],
  },
  mainStreak: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  streakInfo: {
    marginLeft: Spacing.lg,
    flex: 1,
  },
  streakValue: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.sm,
  },
  number: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    marginVertical: Spacing.lg,
  },
  longestStreak: {
    flexDirection: "row",
    alignItems: "center",
  },
});
