import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, RefreshControl, Platform, AppState, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import Animated, { FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { StreakCounter } from "@/components/StreakCounter";
import { TodayStatus } from "@/components/TodayStatus";
import { MotivationCard } from "@/components/MotivationCard";
import { WeeklyChart } from "@/components/WeeklyChart";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { getStreakData, setStreakData } from "@/lib/storage";
import { getGitHubCommits } from "@/lib/api";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [streakData, setLocalStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    lastCommitDate: null,
    todayCommits: 0,
    weeklyCommits: [0, 0, 0, 0, 0, 0, 0],
    totalCommits: 0,
    yearlyCommits: 0,
  });
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadStreakData();
      syncCommitsFromGitHub();
    }
  }, [user?.id]);

  // Auto-sync when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active" && user?.id) {
        syncCommitsFromGitHub();
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [user?.id]);

  const loadStreakData = async () => {
    if (!user?.id) return;
    const data = await getStreakData(user.id);
    setLocalStreakData(data);
    setIsFirstLoad(false);
  };

  const syncCommitsFromGitHub = async () => {
    if (!user?.id || isSyncing) return;
    
    setIsSyncing(true);
    try {
      const response = await getGitHubCommits();
      const { commitsByDay, totalCommits } = response;

      // Helper function to get local date string (YYYY-MM-DD) in device timezone
      const getLocalDateString = (isoDateString) => {
        const date = new Date(isoDateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // Group commits by local date (commitsByDay has ISO timestamps as keys)
      const localCommitsByDay = {};
      Object.entries(commitsByDay).forEach(([timestamp, count]) => {
        // Convert each timestamp to local date
        const localDate = getLocalDateString(timestamp);
        localCommitsByDay[localDate] = (localCommitsByDay[localDate] || 0) + count;
      });

      // Calculate stats from GitHub data
      const today = getLocalDateString(new Date().toISOString());
      const todayCommits = localCommitsByDay[today] || 0;

      // Calculate weekly commits (last 7 days)
      const weeklyCommits = [0, 0, 0, 0, 0, 0, 0];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dateStr = getLocalDateString(date.toISOString());
        const dayOfWeek = date.getDay();
        const adjustedDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weeklyCommits[adjustedDayIndex] = localCommitsByDay[dateStr] || 0;
      }

      // Calculate current streak
      let currentStreak = 0;
      let checkDate = new Date();
      while (true) {
        const dateStr = getLocalDateString(checkDate.toISOString());
        if (localCommitsByDay[dateStr] && localCommitsByDay[dateStr] > 0) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (dateStr === today) {
          // Allow for today to not have commits yet
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      // Get last commit date
      const dates = Object.keys(localCommitsByDay).filter(date => localCommitsByDay[date] > 0);
      const lastCommitDate = dates.length > 0 ? dates.sort().reverse()[0] : null;

      // Calculate yearly commits (from Jan 1 of current year)
      const currentYear = new Date().getFullYear();
      const yearStart = getLocalDateString(new Date(currentYear, 0, 1).toISOString());
      let yearlyCommits = 0;
      Object.keys(localCommitsByDay).forEach(date => {
        if (date >= yearStart) {
          yearlyCommits += localCommitsByDay[date];
        }
      });

      // Load existing data to preserve longestStreak
      const existingData = await getStreakData(user.id);
      const longestStreak = Math.max(existingData.longestStreak, currentStreak);

      const newData = {
        currentStreak,
        longestStreak,
        lastCommitDate,
        todayCommits,
        weeklyCommits,
        totalCommits,
        yearlyCommits,
      };

      setLocalStreakData(newData);
      await setStreakData(user.id, newData);
      setIsFirstLoad(false);
    } catch (error) {
      console.error("Failed to sync commits:", error);
      // On error, still load local data
      await loadStreakData();
    } finally {
      setIsSyncing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await syncCommitsFromGitHub();
    setIsRefreshing(false);
  }, [user?.id]);

  const getTimeRemaining = () => {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const diff = endOfDay - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const today = new Date().toISOString().split("T")[0];
  const hasCommittedToday = streakData.lastCommitDate === today;
  const showEmptyState = streakData.totalCommits === 0 && !hasCommittedToday;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

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
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
          colors={[theme.primary]}
          progressBackgroundColor={theme.backgroundSecondary}
        />
      }
    >
      <Animated.View entering={FadeInUp.delay(100).duration(500)}>
        <ThemedText type="h3" style={[styles.greeting, { color: theme.text }]}>
          {getGreeting()}, {user?.username || "Developer"}
        </ThemedText>
      </Animated.View>

      {showEmptyState ? (
        <EmptyState
          icon="git-commit"
          title="Start Your Journey"
          message="Make your first commit to GitHub to begin building your coding streak. Every day counts!"
          actionLabel={isSyncing ? "Syncing..." : "Sync GitHub Commits"}
          onAction={syncCommitsFromGitHub}
        />
      ) : (
        <View style={styles.content}>
          <Animated.View entering={FadeInUp.delay(200).duration(500)}>
            <TodayStatus
              hasCommittedToday={hasCommittedToday}
              todayCommits={streakData.todayCommits}
              timeRemaining={getTimeRemaining()}
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300).duration(500)}>
            <StreakCounter
              currentStreak={streakData.currentStreak}
              longestStreak={streakData.longestStreak}
              animate={!isFirstLoad}
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400).duration(500)}>
            <WeeklyChart weeklyCommits={streakData.weeklyCommits} />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(500).duration(500)}>
            <MotivationCard
              currentStreak={streakData.currentStreak}
              hasCommittedToday={hasCommittedToday}
            />
          </Animated.View>

          {!hasCommittedToday ? (
            <Animated.View entering={FadeInUp.delay(600).duration(500)}>
              <View 
                style={[
                  styles.reminderCard, 
                  { 
                    backgroundColor: `${theme.warning}10`,
                    borderLeftColor: theme.warning,
                  }
                ]}
              >
                <View style={styles.reminderHeader}>
                  <View style={[styles.reminderDot, { backgroundColor: theme.warning }]} />
                  <ThemedText type="small" style={{ color: theme.warning, fontWeight: "600" }}>
                    Streak at risk!
                  </ThemedText>
                </View>
                <ThemedText type="caption" style={{ color: theme.textSecondary, marginLeft: 12 }}>
                  Push a commit before midnight to maintain your streak.
                </ThemedText>
              </View>
            </Animated.View>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  greeting: {
    marginBottom: Spacing["2xl"],
    fontWeight: '700',
  },
  content: {
    gap: Spacing.xl,
  },
  reminderCard: {
    padding: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    borderLeftWidth: 4,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },
  reminderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  reminderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});