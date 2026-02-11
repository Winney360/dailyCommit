import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const { width: screenWidth } = Dimensions.get("window");

export function WeeklyChart({ weeklyCommits = [0, 0, 0, 0, 0, 0, 0], title = "This Week" }) {
  const { theme } = useTheme();
  const maxCommits = Math.max(...weeklyCommits, 1);
  const todayIndex = new Date().getDay();
  const adjustedTodayIndex = todayIndex === 0 ? 6 : todayIndex - 1;

  return (
    <View
      style={[
        styles.container,
        { 
          backgroundColor: theme.backgroundDefault,
          borderWidth: 1,
          borderColor: theme.border,
        },
        Shadows.card,
      ]}
    >
      <ThemedText type="h4" style={styles.title}>
        {title}
      </ThemedText>
      
      <View style={styles.chartContainer}>
        {weeklyCommits.map((commits, index) => {
          const height = commits > 0 ? (commits / maxCommits) * 100 : 8;
          const isToday = index === adjustedTodayIndex;
          const hasCommits = commits > 0;
          
          return (
            <View key={index} style={styles.barWrapper}>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${height}%`,
                      backgroundColor: hasCommits
                        ? isToday
                          ? theme.primary
                          : theme.primary + "80"
                        : theme.border,
                      minHeight: 8,
                    },
                  ]}
                />
              </View>
              <ThemedText
                type="caption"
                style={[
                  styles.dayLabel,
                  {
                    color: isToday ? theme.primary : theme.textSecondary,
                    fontWeight: isToday ? "600" : "400",
                  },
                ]}
              >
                {DAYS[index]}
              </ThemedText>
              {commits > 0 ? (
                <ThemedText
                  type="caption"
                  style={[styles.commitCount, { color: theme.textSecondary }]}
                >
                  {commits}
                </ThemedText>
              ) : null}
            </View>
          );
        })}
      </View>
      
      <View style={[styles.footer, { borderTopColor: theme.borderSubtle }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Commits
          </ThemedText>
        </View>
        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          Total: {weeklyCommits.reduce((a, b) => a + b, 0)}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.lg,
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 140,
    paddingTop: Spacing.lg,
  },
  barWrapper: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  barContainer: {
    flex: 1,
    justifyContent: "flex-end",
    width: "100%",
    paddingHorizontal: Spacing.xs,
  },
  bar: {
    width: "100%",
    borderRadius: BorderRadius.xs,
    minWidth: 20,
    maxWidth: 40,
    alignSelf: "center",
  },
  dayLabel: {
    fontSize: 11,
  },
  commitCount: {
    fontSize: 10,
    position: "absolute",
    top: 0,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
