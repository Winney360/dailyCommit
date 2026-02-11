import React from "react";
import { StyleSheet, Pressable, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

const springConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({
  elevation = 1,
  title,
  description,
  children,
  onPress,
  style,
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const getBackgroundColor = () => {
    switch (elevation) {
      case 1:
        return theme.backgroundDefault;
      case 2:
        return theme.backgroundSecondary;
      case 3:
        return theme.backgroundTertiary;
      default:
        return theme.backgroundRoot;
    }
  };

  const getGradientColors = () => {
    const baseColor = getBackgroundColor();
    return [baseColor, theme.backgroundSecondary];
  };

  const cardBackgroundColor = getBackgroundColor();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, springConfig);
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, springConfig);
    }
  };

  const CardContent = (
    <LinearGradient
      colors={getGradientColors()}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, { 
        borderWidth: 1,
        borderColor: theme.border,
      }]}
    >
      {title ? (
        <ThemedText type="h4" style={[styles.cardTitle, { fontWeight: '700' }]}>
          {title}
        </ThemedText>
      ) : null}
      {description ? (
        <ThemedText type="small" style={styles.cardDescription}>
          {description}
        </ThemedText>
      ) : null}
      {children}
    </LinearGradient>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          Shadows.card,
          animatedStyle,
          style,
        ]}
      >
        {CardContent}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View
      style={[
        styles.card,
        Shadows.card,
        style,
      ]}
    >
      {CardContent}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  gradient: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
  },
  cardTitle: {
    marginBottom: Spacing.sm,
  },
  cardDescription: {
    opacity: 0.8,
  },
});
