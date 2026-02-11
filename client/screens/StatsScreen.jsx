import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
  { id: "first-commit", name: "First Steps", icon: "play", requirement: 1, color: "#34D399" },
  { id: "week-streak", name: "Week Warrior", icon: "calendar", requirement: 7, color: "#F59E0B" },
  { id: "two-weeks", name: "Fortnight Force", icon: "zap", requirement: 14, color: "#7C3AED" },
  { id: "month-streak", name: "Monthly Master", icon: "award", requirement: 30, color: "#9F7AEA" },
  { id: "hundred-commits", name: "Centurion", icon: "target", requirement: 100, color: "#34D399" },
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
              Shadows.card,
            ]}
          >
            <LinearGradient
              colors={[theme.backgroundDefault, theme.backgroundSecondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.nextBadgeGradient, { 
                borderWidth: 1,
                borderColor: theme.border,
              }]}
            >
              <ThemedText type="caption" style={{ color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 1, fontSize: 11, fontWeight: '700' }}>
                NEXT MILESTONE
              </ThemedText>
              <View style={styles.nextBadgeContent}>
                <LinearGradient
                  colors={[nextBadge.color + "30", nextBadge.color + "20"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.badgeIconSmall}
                >
                  <Feather name={nextBadge.icon} size={22} color={nextBadge.color} />
                </LinearGradient>
                <View style={styles.nextBadgeText}>
                  <ThemedText type="body" style={{ fontWeight: "700" }}>
                    {nextBadge.name}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: 2 }}>
                    {nextBadge.requirement - Math.max(streakData.longestStreak, streakData.totalCommits)} more to go
                  </ThemedText>
                </View>
              </View>
            </LinearGradient>
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
        Shadows.card,
      ]}
    >
      <LinearGradient
        colors={highlight 
          ? [theme.primary + "20", theme.primary + "10"]
          : [theme.backgroundDefault, theme.backgroundSecondary]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.statGradient, { 
          borderWidth: 1.5,
          borderColor: highlight ? theme.borderAccent : theme.border,
        }]}
      >
        <LinearGradient
          colors={highlight 
            ? [theme.primary + "30", theme.primary + "20"]
            : [theme.backgroundSecondary + "80", theme.backgroundSecondary]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statIcon}
        >
          <Feather
            name={icon}
            size={24}
            color={highlight ? theme.primary : theme.accent}
          />
        </LinearGradient>
        <ThemedText
          type="h2"
          style={[styles.statValue, { 
            color: highlight ? theme.primary : theme.text,
            fontWeight: '800',
            fontSize: 36,
          }]}
        >
          {value}
        </ThemedText>
        <ThemedText type="caption" style={[styles.statLabel, { color: theme.textSecondary }]}>
          {label}
        </ThemedText>
      </LinearGradient>
    </View>
  );
}

function BadgeCard({ badge, isEarned, theme }) {
  return (
    <View
      style={[
        styles.badgeCard,
        isEarned && Shadows.card,
      ]}
    >
      <LinearGradient
        colors={isEarned 
          ? [badge.color + "25", badge.color + "15"]
          : [theme.backgroundDefault, theme.backgroundSecondary]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.badgeGradient, {
          borderWidth: 1.5,
          borderColor: isEarned ? badge.color + "60" : theme.borderSubtle,
          opacity: isEarned ? 1 : 0.5,
        }]}
      >
        <LinearGradient
          colors={isEarned 
            ? [badge.color + "40", badge.color + "25"]
            : [theme.backgroundSecondary, theme.backgroundSecondary]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.badgeIcon}
        >
          <Feather
            name={badge.icon}
            size={28}
            color={isEarned ? badge.color : theme.textSecondary}
          />
        </LinearGradient>
        <ThemedText type="small" style={[styles.badgeName, { color: isEarned ? theme.text : theme.textSecondary, fontWeight: isEarned ? '600' : '400' }]}>
          {badge.name}
        </ThemedText>
        {isEarned ? (
          <View style={[styles.earnedBadge, { backgroundColor: theme.success, ...Shadows.glow }]}>
            <Feather name="check" size={12} color={theme.buttonText} />
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing["2xl"],
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
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  statGradient: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    gap: Spacing.sm,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
    fontWeight: '700',
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  badgeCard: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  badgeGradient: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
  },
  badgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBadgeCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  nextBadgeGradient: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    gap: Spacing.lg,
  },
  nextBadgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  badgeIconSmall: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBadgeText: {
    flex: 1,
    gap: 4,
  },
});
