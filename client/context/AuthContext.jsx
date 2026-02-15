import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { getUser, setUser as saveUser, removeUser } from "@/lib/storage";

const AuthContext = createContext(undefined);

// Token key for SecureStore
const TOKEN_KEY = "dailycommit_github_token";

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    cleanupOldStorage();
    loadUser();
  }, []);

  // One-time cleanup of old non-user-specific storage keys
  async function cleanupOldStorage() {
    try {
      const oldKeys = [
        "@dailycommit_streak",
        "@dailycommit_settings", 
        "@dailycommit_commits"
      ];
      await AsyncStorage.multiRemove(oldKeys);
      console.log("Cleaned up old storage keys");
    } catch (error) {
      console.error("Error cleaning up old storage:", error);
    }
  }

  async function loadUser() {
    try {
      // Migrate token from AsyncStorage to SecureStore if needed
      const oldToken = await AsyncStorage.getItem(TOKEN_KEY);
      if (oldToken) {
        await SecureStore.setItemAsync(TOKEN_KEY, oldToken);
        await AsyncStorage.removeItem(TOKEN_KEY);
        console.log("Migrated token from AsyncStorage to SecureStore");
      }

      const savedUser = await getUser();
      const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!savedUser || !savedToken) {
      await removeUser();
      await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
      setUserState(null);
      setToken(null);
      return;
    }
      setUserState(savedUser);
      setToken(savedToken);
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(userData) {
    if (!userData?.id || !userData?.username) {
      throw new Error("Invalid user data: missing id or username");
    }

    const { accessToken, ...userWithoutToken } = userData;

    await saveUser(userWithoutToken);
    setUserState(userWithoutToken);

    if (accessToken) {
      await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
      setToken(accessToken);
    }
  }

  async function logout() {
    console.log("Logging out...");
    await removeUser();
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    setUserState(null);
    setToken(null);
    console.log("Logout complete");
  }

  async function updateUser(userData) {
    const updatedUser = { ...user, ...userData };
    await saveUser(updatedUser);
    setUserState(updatedUser);
  }

  async function getToken() {
    if (token) return token;
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      setToken(storedToken);
      return storedToken;
    } catch (error) {
      console.error("Error retrieving token:", error);
      return null;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user && !!token,
        token,
        getToken,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
