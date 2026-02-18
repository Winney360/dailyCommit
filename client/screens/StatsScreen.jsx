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
import { useAuth } from "@/context/AuthContext";
import { getStreakData } from "@/lib/storage";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

const BADGES = [
  { id: "first-commit", name: "Getting Started", description: "1 day streak", icon: "play", requirement: 1, color: "#34D399", type: "streak" },
  { id: "week-streak", name: "Week Warrior", description: "7 days straight", icon: "calendar", requirement: 7, color: "#F59E0B", type: "streak" },
  { id: "two-weeks", name: "Fortnight Force", description: "14 days straight", icon: "zap", requirement: 14, color: "#7C3AED", type: "streak" },
  { id: "month-streak", name: "Monthly Master", description: "30 days straight", icon: "award", requirement: 30, color: "#9F7AEA", type: "streak" },
  { id: "hundred-days", name: "Centurion", description: "100 days straight", icon: "target", requirement: 100, color: "#34D399", type: "streak" },
  { id: "six-months", name: "Half-Year Hero", description: "6 months straight", icon: "trending-up", requirement: 180, color: "#8B5CF6", type: "streak" },
  { id: "nine-months", name: "Nine-Month Ninja", description: "9 months straight", icon: "zap", requirement: 270, color: "#EC4899", type: "streak" },
  { id: "full-year", name: "Year Warrior", description: "365 days straight", icon: "star", requirement: 365, color: "#F59E0B", type: "streak" },
];

// Level system: infinite levels with scaling difficulty
// Levels 1-5: 10 commits each
// Levels 6-10: 20 commits each
// Levels 11-15: 30 commits each
// And so on, incrementing by 10 every 5 levels

const getCommitsRequiredForLevel = (level) => {
  if (level <= 0) return 0;
  
  let totalCommits = 0;
  for (let i = 1; i < level; i++) {
    const increment = Math.floor((i - 1) / 5) * 10 + 10;
    totalCommits += increment;
  }
  return totalCommits;
};

const getCurrentLevel = (totalCommits) => {
  let level = 1;
  while (getCommitsRequiredForLevel(level + 1) <= totalCommits) {
    level++;
  }
  return level;
};

const getCommitsForNextLevel = (totalCommits) => {
  return getCommitsRequiredForLevel(getCurrentLevel(totalCommits) + 1);
};

const getLevelProgress = (totalCommits) => {
  const currentLevel = getCurrentLevel(totalCommits);
  const currentLevelRequired = getCommitsRequiredForLevel(currentLevel);
  const nextLevelRequired = getCommitsRequiredForLevel(currentLevel + 1);
  
  const progress = totalCommits - currentLevelRequired;
  const needed = nextLevelRequired - currentLevelRequired;
  
  return {
    currentLevel,
    progress,
    needed,
    percentage: (progress / needed) * 100,
  };
};

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    lastCommitDate: null,
    todayCommits: 0,
    weeklyCommits: [0, 0, 0, 0, 0, 0, 0],
    totalCommits: 0,
    yearlyCommits: 0,
  });

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    const data = await getStreakData(user.id);
    setStreakData(data);
  };

  const earnedBadges = BADGES.filter((badge) => {
    if (badge.type === "streak") {
      return streakData.longestStreak >= badge.requirement;
    } else if (badge.type === "commit") {
      return streakData.totalCommits >= badge.requirement;
    }
    return false;
  });

  const nextBadge = BADGES.find((badge) => {
    if (badge.type === "streak") {
      return streakData.longestStreak < badge.requirement;
    } else if (badge.type === "commit") {
      return streakData.totalCommits < badge.requirement;
    }
    return false;
  });

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
            icon="calendar"
            value={streakData.yearlyCommits}
            label="This Year"
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
          <LevelCard
            level={getCurrentLevel(streakData.totalCommits)}
            progress={getLevelProgress(streakData.totalCommits)}
            theme={theme}
            highlight
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(150).duration(500)}>
        <Card
          icon="award"
          label="Badges Earned"
          theme={theme}
        />
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).duration(500)}>
        <WeeklyChart weeklyCommits={streakData.weeklyCommits} title="Weekly Activity" />
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(250).duration(500)}>
        <View style={[styles.infoCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          <View style={styles.infoHeader}>
            <Feather name="info" size={20} color={theme.primary} />
            <ThemedText type="h5" style={[styles.infoTitle, { color: theme.text }]}>
              How Levels Work
            </ThemedText>
          </View>
          <View style={styles.infoContent}>
            <InfoRow level="1-5" commits="10" theme={theme} />
            <InfoRow level="6-10" commits="20" theme={theme} />
            <InfoRow level="11-15" commits="30" theme={theme} />
            <InfoRow level="16+" commits="+10 per tier" theme={theme} />
          </View>
          <ThemedText type="small" style={[styles.infoFooter, { color: theme.textSecondary }]}>
            Each level requires more commits. Keep building your streak!
          </ThemedText>
          <ThemedText type="small" style={[styles.infoNote, { color: theme.textSecondary }]}>
            💡 Levels are based on Git commits only. Other GitHub activities (repo creation, PRs, issues) are not counted.
          </ThemedText>
        </View>
      </Animated.View>
      <Animated.View entering={FadeInUp.delay(300).duration(500)}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Badges
        </ThemedText>
        <View style={styles.badgesContainer}>
          {BADGES.map((badge) => {
            let isEarned = false;
            if (badge.type === "streak") {
              isEarned = streakData.longestStreak >= badge.requirement;
            } else if (badge.type === "commit") {
              isEarned = streakData.totalCommits >= badge.requirement;
            }
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
                    {(() => {
                      const current = nextBadge.type === "streak" ? streakData.longestStreak : streakData.totalCommits;
                      const remaining = Math.max(0, nextBadge.requirement - current);
                      return `${remaining} more to go`;
                    })()}
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

function LevelCard({ level, progress, theme, highlight = false }) {
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
            name="trending-up"
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
          {level}
        </ThemedText>
        <ThemedText type="caption" style={[styles.statLabel, { color: theme.textSecondary }]}>
          Level
        </ThemedText>
        <View style={[styles.progressBar, { backgroundColor: theme.border, marginTop: Spacing.sm }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress.percentage}%`,
                backgroundColor: theme.primary,
              },
            ]}
          />
        </View>
        <ThemedText 
          type="caption" 
          style={[styles.progressText, { color: theme.textSecondary, marginTop: 4 }]}
        >
          {progress.progress}/{progress.needed}
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
        <ThemedText type="caption" style={[styles.badgeDescription, { color: isEarned ? theme.textSecondary : theme.textTertiary, fontSize: 9 }]}>
          {badge.description}
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

function InfoRow({ level, commits, theme }) {
  return (
    <View style={styles.infoRow}>
      <ThemedText type="small" style={[styles.infoRowLabel, { color: theme.text, fontWeight: '600' }]}>
        Level {level}
      </ThemedText>
      <ThemedText type="small" style={[styles.infoRowValue, { color: theme.primary }]}>
        {commits} commits
      </ThemedText>
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
  badgeDescription: {
    textAlign: "center",
    marginTop: 2,
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
  progressBar: {
    height: 6,
    borderRadius: 3,
    width: "100%",
    overflow: 'hidden',
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    textAlign: "center",
  },
  infoCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  infoTitle: {
    fontWeight: "700",
  },
  infoContent: {
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  infoRowLabel: {
    flex: 1,
  },
  infoRowValue: {
    fontWeight: "600",
    textAlign: "right",
  },
  infoFooter: {
    marginTop: Spacing.sm,
    fontStyle: "italic",
  },
  infoNote: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    fontStyle: "italic",
    lineHeight: 18,
  },
});
