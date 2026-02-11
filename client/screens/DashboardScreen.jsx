import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
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
import { Spacing } from "@/constants/theme";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [streakData, setLocalStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    lastCommitDate: null,
    todayCommits: 0,
    weeklyCommits: [0, 0, 0, 0, 0, 0, 0],
    totalCommits: 0,
  });
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    loadStreakData();
  }, []);

  const loadStreakData = async () => {
    const data = await getStreakData();
    setLocalStreakData(data);
    setIsFirstLoad(false);
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadStreakData();
    setIsRefreshing(false);
  }, []);

  const simulateCommit = async () => {
    const today = new Date().toISOString().split("T")[0];
    const dayOfWeek = new Date().getDay();
    const adjustedDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const newWeeklyCommits = [...streakData.weeklyCommits];
    newWeeklyCommits[adjustedDayIndex] += 1;

    const wasAlreadyCommittedToday = streakData.lastCommitDate === today;
    
    const newData = {
      ...streakData,
      todayCommits: streakData.todayCommits + 1,
      lastCommitDate: today,
      weeklyCommits: newWeeklyCommits,
      totalCommits: streakData.totalCommits + 1,
      currentStreak: wasAlreadyCommittedToday
        ? streakData.currentStreak
        : streakData.currentStreak + 1,
      longestStreak: Math.max(
        streakData.longestStreak,
        wasAlreadyCommittedToday
          ? streakData.currentStreak
          : streakData.currentStreak + 1
      ),
    };

    setLocalStreakData(newData);
    await setStreakData(newData);
  };

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
          message="Make your first commit to begin building your coding streak. Every day counts!"
          actionLabel="Simulate Commit"
          onAction={simulateCommit}
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
                    shadowColor: theme.warning,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
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