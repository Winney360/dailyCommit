import React from "react";
import { View, StyleSheet, Pressable, Switch } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

export function SettingsItem({
  icon,
  title,
  subtitle,
  onPress,
  value,
  showChevron = false,
  isSwitch = false,
  onValueChange,
  destructive = false,
}) {
  const { theme } = useTheme();

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const handleSwitchChange = (newValue) => {
    if (onValueChange) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onValueChange(newValue);
    }
  };

  const textColor = destructive ? theme.error : theme.text;
  const iconColor = destructive ? theme.error : theme.textSecondary;

  return (
    <Pressable
      onPress={isSwitch ? undefined : handlePress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: pressed && !isSwitch ? theme.backgroundTertiary + "40" : "transparent" },
      ]}
    >
      {icon ? (
        <LinearGradient
          colors={[theme.backgroundSecondary, theme.backgroundTertiary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconContainer}
        >
          <Feather name={icon} size={20} color={destructive ? theme.error : theme.accent} />
        </LinearGradient>
      ) : null}
      
      <View style={styles.textContainer}>
        <ThemedText type="body" style={{ color: textColor, fontWeight: '600' }}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: 2 }}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>

      {isSwitch ? (
        <Switch
          value={value}
          onValueChange={handleSwitchChange}
          trackColor={{ false: theme.border, true: theme.primary + "80" }}
          thumbColor={value ? theme.primary : theme.textSecondary}
          ios_backgroundColor={theme.border}
        />
      ) : showChevron ? (
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      ) : value ? (
        <ThemedText type="small" style={{ color: theme.textSecondary, fontWeight: '500' }}>
          {value}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

export function SettingsSection({ title, children }) {
  const { theme } = useTheme();

  return (
    <View style={styles.section}>
      {title ? (
        <ThemedText
          type="caption"
          style={[styles.sectionTitle, { color: theme.textSecondary }]}
        >
          {title}
        </ThemedText>
      ) : null}
      <View
        style={[
          styles.sectionContent,
          Shadows.card,
        ]}
      >
        <LinearGradient
          colors={[theme.backgroundDefault, theme.backgroundSecondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.sectionGradient, { 
            borderWidth: 1,
            borderColor: theme.border,
          }]}
        >
          {children}
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    marginLeft: Spacing.lg,
    textTransform: "uppercase",
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '700',
  },
  sectionContent: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  sectionGradient: {
    borderRadius: BorderRadius.xl,
  },
});
