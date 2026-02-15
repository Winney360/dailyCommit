import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUser, setUser as saveUser, removeUser } from "@/lib/storage";
import { getToken as getStoredToken, setToken as saveToken, deleteToken } from "@/lib/token-storage";

const AuthContext = createContext(undefined);

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
      const savedUser = await getUser();
      const savedToken = await getStoredToken();
      if (!savedUser || !savedToken) {
      await removeUser();
      await deleteToken();
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
      await saveToken(accessToken);
      setToken(accessToken);
    }
  }

  async function logout() {
    console.log("Logging out...");
    await removeUser();
    await deleteToken();
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
      const storedToken = await getStoredToken();
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
