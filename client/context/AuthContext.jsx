import React, { createContext, useContext, useState, useEffect } from "react";
import { getUser, setUser as saveUser, removeUser } from "@/lib/storage";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const savedUser = await getUser();
      setUserState(savedUser);
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(userData) {
    await saveUser(userData);
    setUserState(userData);
  }

  async function logout() {
    await removeUser();
    setUserState(null);
  }

  async function updateUser(userData) {
    const updatedUser = { ...user, ...userData };
    await saveUser(updatedUser);
    setUserState(updatedUser);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
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
