import { getApiUrl } from './query-client';
import { getToken, setToken } from './token-storage';

/**
 * Make an authenticated API request
 * Automatically includes GitHub access token if available
 */
export async function fetchAuthenticated(endpoint, options = {}) {
  const baseUrl = getApiUrl();
  const url = `${baseUrl}${endpoint}`;

  try {
    const token = getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      throw new Error('Authentication expired. Please log in again.');
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
    const data = await fetchAuthenticated('api/github/commits');
    return data;
  } catch (error) {
    console.error('Failed to fetch GitHub commits:', error);
    throw error;
  }
}

/**
 * Get fast commit totals (all-time + current year) for the authenticated user
 */
export async function getTotalAllTimeCommits() {
  try {
    const data = await fetchAuthenticated('api/github/total-commits');
    return data;
  } catch (error) {
    console.error('Failed to fetch total commits:', error);
    throw error;
  }
}

/**
 * Delete the authenticated user's account data
 */
export async function deleteAccount() {
  try {
    const data = await fetchAuthenticated('api/user/delete', {
      method: 'DELETE',
    });
    return data;
  } catch (error) {
    console.error('Failed to delete account:', error);
    throw error;
  }
}

/**
 * Refresh authentication token (if using refresh tokens)
 */
export async function refreshToken() {
  try {
    const data = await fetchAuthenticated('api/auth/refresh', {
      method: 'POST',
    });
    
    if (data.token) {
      setToken(data.token);
    }
    
    return data;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    throw error;
  }
}
