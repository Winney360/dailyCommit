import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";

import DashboardStackNavigator from "@/navigation/DashboardStackNavigator";
import StatsStackNavigator from "@/navigation/StatsStackNavigator";
import SettingsStackNavigator from "@/navigation/SettingsStackNavigator";
import { useTheme } from "@/hooks/useTheme";
import { useResponsive } from "@/hooks/useResponsive";

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();
  const { isTablet } = useResponsive();

  return (
    <Tab.Navigator
      initialRouteName="DashboardTab"
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot,
            web: isTablet ? theme.backgroundDefault : theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          borderRightWidth: Platform.OS === "web" && isTablet ? 1 : 0,
          borderRightColor: theme.border,
          elevation: 0,
          ...(Platform.OS === "web" && isTablet
            ? {
                width: 220,
                height: "100%",
                paddingTop: 24,
                paddingBottom: 24,
                flexDirection: "column",
              }
            : {}),
        },
        tabBarLabelStyle:
          Platform.OS === "web" && isTablet
            ? { fontSize: 13, marginTop: 4 }
            : undefined,
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStackNavigator}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="StatsTab"
        component={StatsStackNavigator}
        options={{
          title: "Stats",
          tabBarIcon: ({ color, size }) => (
            <Feather name="bar-chart-2" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackNavigator}
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Feather name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
