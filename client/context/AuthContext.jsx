import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { getUser, setUser as saveUser, removeUser } from "@/lib/storage";

const AuthContext = createContext(undefined);

// Secure token key
const TOKEN_KEY = "@dailycommit_github_token";

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const savedUser = await getUser();
      const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      setUserState(savedUser);
      setToken(savedToken);
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(userData) {
    // Validate user data
    if (!userData?.id || !userData?.username) {
      throw new Error("Invalid user data: missing id or username");
    }

    // Remove token from user object before storing in regular storage
    const { accessToken, ...userWithoutToken } = userData;

    // Store user data in AsyncStorage
    await saveUser(userWithoutToken);
    setUserState(userWithoutToken);

    // Store sensitive token in secure storage
    if (accessToken) {
      await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
      setToken(accessToken);
    }
  }

  async function logout() {
    await removeUser();
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setUserState(null);
    setToken(null);
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
        isAuthenticated: !!user,
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
