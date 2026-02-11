import React from "react";
import { View, StyleSheet, Pressable, Switch } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

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
        { backgroundColor: pressed && !isSwitch ? theme.backgroundSecondary : "transparent" },
      ]}
    >
      {icon ? (
        <View style={[styles.iconContainer, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name={icon} size={20} color={iconColor} />
        </View>
      ) : null}
      
      <View style={styles.textContainer}>
        <ThemedText type="body" style={{ color: textColor }}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>

      {isSwitch ? (
        <Switch
          value={value}
          onValueChange={handleSwitchChange}
          trackColor={{ false: theme.border, true: theme.primary }}
          thumbColor={theme.buttonText}
        />
      ) : showChevron ? (
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      ) : value ? (
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
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
          { 
            backgroundColor: theme.backgroundDefault,
            borderWidth: 1,
            borderColor: theme.border,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.lg,
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  sectionContent: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
});
