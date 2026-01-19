import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  USER: "@dailycommit_user",
  STREAK_DATA: "@dailycommit_streak",
  SETTINGS: "@dailycommit_settings",
  COMMITS: "@dailycommit_commits",
};

export async function getUser() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}

export async function setUser(user) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (error) {
    console.error("Error setting user:", error);
  }
}

export async function removeUser() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  } catch (error) {
    console.error("Error removing user:", error);
  }
}

export async function getStreakData() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.STREAK_DATA);
    return data ? JSON.parse(data) : {
      currentStreak: 0,
      longestStreak: 0,
      lastCommitDate: null,
      todayCommits: 0,
      weeklyCommits: [0, 0, 0, 0, 0, 0, 0],
      totalCommits: 0,
    };
  } catch (error) {
    console.error("Error getting streak data:", error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastCommitDate: null,
      todayCommits: 0,
      weeklyCommits: [0, 0, 0, 0, 0, 0, 0],
      totalCommits: 0,
    };
  }
}

export async function setStreakData(data) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.STREAK_DATA, JSON.stringify(data));
  } catch (error) {
    console.error("Error setting streak data:", error);
  }
}

export async function getSettings() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : {
      reminderTime: "20:00",
      notificationsEnabled: true,
      darkModeAuto: true,
    };
  } catch (error) {
    console.error("Error getting settings:", error);
    return {
      reminderTime: "20:00",
      notificationsEnabled: true,
      darkModeAuto: true,
    };
  }
}

export async function setSettings(settings) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error("Error setting settings:", error);
  }
}

export async function clearAllData() {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (error) {
    console.error("Error clearing data:", error);
  }
}
