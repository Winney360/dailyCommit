import React, { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import LoginScreen from "@/screens/LoginScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";

const Stack = createNativeStackNavigator();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { user, isLoading } = useAuth(); // Use user directly, not isAuthenticated
  const { theme } = useTheme();

  // Debug
  useEffect(() => {
    console.log("=== ROOT STACK NAVIGATOR DEBUG ===");
    console.log("isLoading:", isLoading);
    console.log("user:", user);
    console.log("user exists:", !!user);
    console.log("user has id:", !!user?.id);
  }, [isLoading, user]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.backgroundRoot }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator 
      screenOptions={screenOptions}
    >
      {!user ? (
        // No user - show Login
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        // Has user - show Main app
        <Stack.Screen
          name="Main"
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}