import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: "#7C3AED",
    background: "#0A071B",
    card: "#1A142C",
    text: "#E9E2F5",
    border: "#2D2440",
    notification: "#7C3AED",
  },
};

export default function App() {
  const [initialState, setInitialState] = useState();

  useEffect(() => {
    // Restore navigation state from storage
    const restoreState = async () => {
      try {
        const savedState = await AsyncStorage.getItem("navigationState");
        if (savedState) {
          setInitialState(JSON.parse(savedState));
        }
      } catch (error) {
        console.error("Failed to restore navigation state:", error);
      }
    };

    restoreState();
  }, []);

  const onStateChange = async (state) => {
    try {
      await AsyncStorage.setItem("navigationState", JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save navigation state:", error);
    }
  };

  useEffect(() => {
    // Handle notification response when user taps on notification
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      // You can navigate to specific screens based on notification data
      console.log("Notification tapped:", response);
    });

    return () => subscription.remove();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SafeAreaProvider>
            <GestureHandlerRootView style={styles.root}>
              <KeyboardProvider>
                <NavigationContainer 
                  theme={customDarkTheme}
                  initialState={initialState}
                  onStateChange={onStateChange}
                >
                  <RootStackNavigator />
                </NavigationContainer>
                <StatusBar style="light" backgroundColor="#0A071B" />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </SafeAreaProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0A071B",
  },
});
