import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUser, setUser as saveUser, removeUser } from '@/lib/storage';
import { getToken as getStoredToken, setToken as saveToken, deleteToken } from '@/lib/token-storage';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  function loadUser() {
    try {
      const savedUser = getUser();
      const savedToken = getStoredToken();
      
      if (!savedUser || !savedToken) {
        removeUser();
        deleteToken();
        setUserState(null);
        setToken(null);
      } else {
        setUserState(savedUser);
        setToken(savedToken);
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function login(userData) {
    //console.log('[AuthContext] login() called with:', { id: userData?.id, username: userData?.username });
    
    if (!userData?.id || !userData?.username) {
      console.error('[AuthContext] Invalid user data:', userData);
      throw new Error("Invalid user data: missing id or username");
    }

    const { accessToken, ...userWithoutToken } = userData;
    //console.log('[AuthContext] Saving user to localStorage...');

    saveUser(userWithoutToken);
    setUserState(userWithoutToken);
    //console.log('[AuthContext] User state updated');

    if (accessToken) {
      //console.log('[AuthContext] Saving token to localStorage...');
      saveToken(accessToken);
      setToken(accessToken);
      //console.log('[AuthContext] Token saved');
    }
    
    //console.log('[AuthContext] Login complete');
  }

  function logout() {
    //console.log("Logging out...");
    removeUser();
    deleteToken();
    setUserState(null);
    setToken(null);
    //console.log("Logout complete");
  }

  function updateUser(userData) {
    const updatedUser = { ...user, ...userData };
    saveUser(updatedUser);
    setUserState(updatedUser);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
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
