import * as SecureStore from "expo-secure-store";
import { getApiUrl } from "./query-client";

const TOKEN_KEY = "dailycommit_github_token";

/**
 * Make an authenticated API request
 * Automatically includes GitHub access token if available
 */
export async function fetchAuthenticated(endpoint, options = {}) {
  const baseUrl = getApiUrl();
  const url = `${baseUrl}${endpoint}`;

  try {
    // Get token from secure storage
    const token = await SecureStore.getItemAsync(TOKEN_KEY);

    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Add authorization header if token exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle authentication errors
    if (response.status === 401) {
      // Token expired or invalid
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      throw new Error("Authentication expired. Please log in again.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `API Error: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
}

/**
 * Get commits from GitHub for the authenticated user
 */
export async function getGitHubCommits() {
  try {
    const data = await fetchAuthenticated("api/github/commits");
    return data;
  } catch (error) {
    console.error("Failed to fetch GitHub commits:", error);
    throw error;
  }
}

/**
 * Refresh authentication token (if using refresh tokens)
 */
export async function refreshToken() {
  try {
    const data = await fetchAuthenticated("api/auth/refresh", {
      method: "POST",
    });
    
    if (data.accessToken) {
      await SecureStore.setItemAsync(TOKEN_KEY, data.accessToken);
      return data.accessToken;
    }
  } catch (error) {
    console.error("Failed to refresh token:", error);
    throw error;
  }
}

/**
 * Check if user has a valid token
 */
export async function hasValidToken() {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    return !!token;
  } catch (error) {
    console.error("Error checking token:", error);
    return false;
  }
}
