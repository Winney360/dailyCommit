import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
        withSpring(1, { damping: 25, stiffness: 40 })
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
        Shadows.cardLarge,
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={[theme.backgroundDefault, theme.backgroundSecondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderWidth: 1, borderColor: theme.borderAccent }]}
      >
        <View style={styles.mainStreak}>
          <LinearGradient
            colors={[iconColor + "30", iconColor + "15"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <Feather
              name={isOnFire ? "zap" : "git-commit"}
              size={36}
              color={iconColor}
            />
          </LinearGradient>
          <View style={styles.streakInfo}>
            <ThemedText type="caption" style={{ color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 1, fontSize: 11, fontWeight: '600' }}>
              Current Streak
            </ThemedText>
            <View style={styles.streakValue}>
              <ThemedText type="h1" style={[styles.number, { color: theme.text }]}>
                {currentStreak}
              </ThemedText>
              <ThemedText type="body" style={{ color: theme.textSecondary, fontSize: 18, marginTop: 8 }}>
                {currentStreak === 1 ? "day" : "days"}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />

        <View style={styles.longestStreak}>
          <View style={[styles.badgeIcon, { backgroundColor: theme.warning + "20" }]}>
            <Feather name="award" size={18} color={theme.warning} />
          </View>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.sm, fontWeight: '500' }}>
            Best Streak: <ThemedText style={{ color: theme.text, fontWeight: '700' }}>{longestStreak}</ThemedText> {longestStreak === 1 ? "day" : "days"}
          </ThemedText>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  gradient: {
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.xl,
  },
  mainStreak: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  streakInfo: {
    marginLeft: Spacing.xl,
    flex: 1,
  },
  streakValue: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  number: {
    fontSize: 52,
    lineHeight: 60,
    fontWeight: "800",
    letterSpacing: -1,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.xl,
    opacity: 0.5,
  },
  longestStreak: {
    flexDirection: "row",
    alignItems: "center",
  },
  badgeIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
});
