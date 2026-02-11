import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

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
        Shadows.card,
      ]}
    >
      <LinearGradient
        colors={[theme.backgroundDefault, theme.backgroundSecondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { 
          borderWidth: 1,
          borderColor: theme.border,
        }]}
      >
        <ThemedText type="h4" style={[styles.title, { fontWeight: '700' }]}>
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
                  <LinearGradient
                    colors={hasCommits
                      ? isToday
                        ? [theme.primary, theme.primaryDark]
                        : [theme.accent, theme.primary + "80"]
                      : [theme.borderSubtle, theme.borderSubtle]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={[
                      styles.bar,
                      {
                        height: `${height}%`,
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
                      fontWeight: isToday ? "700" : "500",
                    },
                  ]}
                >
                  {DAYS[index]}
                </ThemedText>
                {commits > 0 ? (
                  <ThemedText
                    type="caption"
                    style={[styles.commitCount, { color: theme.text, fontWeight: '700', fontSize: 11 }]}
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
            <LinearGradient
              colors={[theme.primary, theme.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.legendDot}
            />
            <ThemedText type="caption" style={{ color: theme.textSecondary, fontWeight: '500' }}>
              Commits
            </ThemedText>
          </View>
          <ThemedText type="caption" style={{ color: theme.text, fontWeight: '700' }}>
            Total: {weeklyCommits.reduce((a, b) => a + b, 0)}
          </ThemedText>
        </View>
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
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
  },
  title: {
    marginBottom: Spacing.xl,
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 150,
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
    borderRadius: BorderRadius.sm,
    minWidth: 20,
    maxWidth: 40,
    alignSelf: "center",
  },
  dayLabel: {
    fontSize: 11,
  },
  commitCount: {
    fontSize: 11,
    position: "absolute",
    top: 0,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
    borderRadius: 4,
  },
});
