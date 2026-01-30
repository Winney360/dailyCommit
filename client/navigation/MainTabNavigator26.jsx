import React from "react";
import { createNativeBottomTabNavigator } from "@react-navigation/bottom-tabs/unstable";

import HomeStackNavigator from "@/navigation/HomeStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";

const Tab = createNativeBottomTabNavigator();

export default function MainTabNavigator26() {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          title: "Home",
          icon: {
            sfSymbolName: "house",
          },
          selectedIcon: {
            sfSymbolName: "house.fill",
          },
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: "Profile",
          icon: {
            sfSymbolName: "person",
          },
          selectedIcon: {
            sfSymbolName: "person.fill",
          },
        }}
      />
    </Tab.Navigator>
  );
}