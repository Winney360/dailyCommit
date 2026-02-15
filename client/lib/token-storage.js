import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "dailycommit_github_token";

/**
 * Platform-aware token storage
 * Uses SecureStore on native, AsyncStorage on web
 */

export async function getToken() {
  try {
    if (Platform.OS === "web") {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } else {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
}

export async function setToken(token) {
  try {
    if (Platform.OS === "web") {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch (error) {
    console.error("Error setting token:", error);
    throw error;
  }
}

export async function deleteToken() {
  try {
    if (Platform.OS === "web") {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error("Error deleting token:", error);
  }
}
