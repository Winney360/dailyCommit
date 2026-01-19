import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

const MOTIVATIONAL_MESSAGES = [
  { message: "Every commit counts. Keep building.", icon: "code" },
  { message: "Consistency beats intensity. Show up daily.", icon: "repeat" },
  { message: "Small progress is still progress.", icon: "trending-up" },
  { message: "Your future self will thank you.", icon: "clock" },
  { message: "The best time to code is now.", icon: "zap" },
  { message: "Build something you're proud of.", icon: "heart" },
  { message: "One commit at a time.", icon: "git-commit" },
  { message: "You're closer than you were yesterday.", icon: "target" },
];

const STREAK_MESSAGES = [
  { min: 0, max: 0, message: "Start your journey today.", icon: "play" },
  { min: 1, max: 2, message: "Great start! Keep it going.", icon: "thumbs-up" },
  { min: 3, max: 6, message: "You're building momentum!", icon: "trending-up" },
  { min: 7, max: 13, message: "One week strong! Incredible.", icon: "award" },
  { min: 14, max: 29, message: "Two weeks! You're unstoppable.", icon: "zap" },
  { min: 30, max: 89, message: "A month of dedication. Legendary.", icon: "star" },
  { min: 90, max: Infinity, message: "You're a coding machine!", icon: "cpu" },
];

export function MotivationCard({ currentStreak = 0, hasCommittedToday = false }) {
  const { theme } = useTheme();
  
  const getStreakMessage = () => {
    const streakMsg = STREAK_MESSAGES.find(
      (s) => currentStreak >= s.min && currentStreak <= s.max
    );
    return streakMsg || STREAK_MESSAGES[0];
  };

  const getDailyMotivation = () => {
    const today = new Date();
    const dayOfYear = Math.floor(
      (today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
    );
    return MOTIVATIONAL_MESSAGES[dayOfYear % MOTIVATIONAL_MESSAGES.length];
  };

  const displayMessage = hasCommittedToday ? getStreakMessage() : getDailyMotivation();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.primary + "10" },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
        <Feather name={displayMessage.icon} size={20} color={theme.primary} />
      </View>
      <ThemedText type="body" style={[styles.message, { color: theme.text }]}>
        {displayMessage.message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    flex: 1,
    marginLeft: Spacing.md,
    fontStyle: "italic",
  },
});
