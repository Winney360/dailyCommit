// Token storage for web

const TOKEN_KEY = "@dailycommit_token";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error("Error setting token:", error);
  }
}

export function deleteToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error("Error deleting token:", error);
  }
}
