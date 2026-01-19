import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import StatsScreen from "@/screens/StatsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

const Stack = createNativeStackNavigator();

export default function StatsStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          title: "Stats",
        }}
      />
    </Stack.Navigator>
  );
}
