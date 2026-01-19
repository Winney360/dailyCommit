import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { WeeklyChart } from "@/components/WeeklyChart";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { getStreakData } from "@/lib/storage";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

const BADGES = [
  { id: "first-commit", name: "First Steps", icon: "play", requirement: 1, color: "#10B981" },
  { id: "week-streak", name: "Week Warrior", icon: "calendar", requirement: 7, color: "#F97316" },
  { id: "two-weeks", name: "Fortnight Force", icon: "zap", requirement: 14, color: "#8B5CF6" },
  { id: "month-streak", name: "Monthly Master", icon: "award", requirement: 30, color: "#EF4444" },
  { id: "hundred-commits", name: "Centurion", icon: "target", requirement: 100, color: "#3B82F6" },
];

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();

  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    lastCommitDate: null,
    todayCommits: 0,
    weeklyCommits: [0, 0, 0, 0, 0, 0, 0],
    totalCommits: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await getStreakData();
    setStreakData(data);
  };

  const earnedBadges = BADGES.filter(
    (badge) =>
      streakData.longestStreak >= badge.requirement ||
      streakData.totalCommits >= badge.requirement
  );

  const nextBadge = BADGES.find(
    (badge) =>
      streakData.longestStreak < badge.requirement &&
      streakData.totalCommits < badge.requirement
  );

  const isEmpty = streakData.totalCommits === 0;

  if (isEmpty) {
    return (
      <View
        style={[
          styles.emptyContainer,
          {
            backgroundColor: theme.backgroundRoot,
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
      >
        <EmptyState
          icon="bar-chart-2"
          title="No Stats Yet"
          message="Start committing to see your progress and earn badges."
        />
      </View>
    );
  }

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
        <View style={styles.statsGrid}>
          <StatCard
            icon="git-commit"
            value={streakData.totalCommits}
            label="Total Commits"
            theme={theme}
          />
          <StatCard
            icon="zap"
            value={streakData.currentStreak}
            label="Current Streak"
            theme={theme}
            highlight
          />
          <StatCard
            icon="award"
            value={streakData.longestStreak}
            label="Best Streak"
            theme={theme}
          />
          <StatCard
            icon="star"
            value={earnedBadges.length}
            label="Badges Earned"
            theme={theme}
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(500)}>
        <WeeklyChart weeklyCommits={streakData.weeklyCommits} title="Weekly Activity" />
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300).duration(500)}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Badges
        </ThemedText>
        <View style={styles.badgesContainer}>
          {BADGES.map((badge) => {
            const isEarned =
              streakData.longestStreak >= badge.requirement ||
              streakData.totalCommits >= badge.requirement;
            return (
              <BadgeCard
                key={badge.id}
                badge={badge}
                isEarned={isEarned}
                theme={theme}
              />
            );
          })}
        </View>
      </Animated.View>

      {nextBadge ? (
        <Animated.View entering={FadeInUp.delay(400).duration(500)}>
          <View
            style={[
              styles.nextBadgeCard,
              { backgroundColor: theme.backgroundDefault },
              Shadows.card,
            ]}
          >
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              NEXT MILESTONE
            </ThemedText>
            <View style={styles.nextBadgeContent}>
              <View style={[styles.badgeIconSmall, { backgroundColor: nextBadge.color + "20" }]}>
                <Feather name={nextBadge.icon} size={20} color={nextBadge.color} />
              </View>
              <View style={styles.nextBadgeText}>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  {nextBadge.name}
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {nextBadge.requirement - Math.max(streakData.longestStreak, streakData.totalCommits)} more to go
                </ThemedText>
              </View>
            </View>
          </View>
        </Animated.View>
      ) : null}
    </ScrollView>
  );
}

function StatCard({ icon, value, label, theme, highlight = false }) {
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: theme.backgroundDefault },
        Shadows.card,
      ]}
    >
      <View
        style={[
          styles.statIcon,
          { backgroundColor: highlight ? theme.primary + "20" : theme.backgroundSecondary },
        ]}
      >
        <Feather
          name={icon}
          size={20}
          color={highlight ? theme.primary : theme.textSecondary}
        />
      </View>
      <ThemedText
        type="h2"
        style={[styles.statValue, highlight && { color: theme.primary }]}
      >
        {value}
      </ThemedText>
      <ThemedText type="caption" style={{ color: theme.textSecondary }}>
        {label}
      </ThemedText>
    </View>
  );
}

function BadgeCard({ badge, isEarned, theme }) {
  return (
    <View
      style={[
        styles.badgeCard,
        {
          backgroundColor: theme.backgroundDefault,
          opacity: isEarned ? 1 : 0.5,
        },
      ]}
    >
      <View
        style={[
          styles.badgeIcon,
          { backgroundColor: isEarned ? badge.color + "20" : theme.backgroundSecondary },
        ]}
      >
        <Feather
          name={badge.icon}
          size={24}
          color={isEarned ? badge.color : theme.textSecondary}
        />
      </View>
      <ThemedText type="small" style={[styles.badgeName, { color: theme.text }]}>
        {badge.name}
      </ThemedText>
      {isEarned ? (
        <View style={[styles.earnedBadge, { backgroundColor: theme.success }]}>
          <Feather name="check" size={10} color={theme.buttonText} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    gap: Spacing.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  badgeCard: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    position: "relative",
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  badgeName: {
    textAlign: "center",
    fontSize: 11,
  },
  earnedBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBadgeCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  nextBadgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  badgeIconSmall: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBadgeText: {
    flex: 1,
    gap: 2,
  },
});
