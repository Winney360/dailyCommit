import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  USER: "@dailycommit_user",
  STREAK_DATA: (userId) => `@dailycommit_streak_${userId}`,
  SETTINGS: (userId) => `@dailycommit_settings_${userId}`,
  COMMITS: (userId) => `@dailycommit_commits_${userId}`,
  EARNED_BADGES: (userId) => `@dailycommit_earned_badges_${userId}`,
  TOTAL_ALL_TIME_COMMITS: (userId) => `@dailycommit_total_commits_${userId}`,
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

export async function getStreakData(userId) {
  if (!userId) {
    console.warn("getStreakData called without userId");
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastCommitDate: null,
      todayCommits: 0,
      weeklyCommits: [0, 0, 0, 0, 0, 0, 0],
      totalCommits: 0,
      yearlyCommits: 0,
    };
  }
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.STREAK_DATA(userId));
    return data ? JSON.parse(data) : {
      currentStreak: 0,
      longestStreak: 0,
      lastCommitDate: null,
      todayCommits: 0,
      weeklyCommits: [0, 0, 0, 0, 0, 0, 0],
      totalCommits: 0,
      yearlyCommits: 0,
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
      yearlyCommits: 0,
    };
  }
}

export async function setStreakData(userId, data) {
  if (!userId) {
    console.warn("setStreakData called without userId");
    return;
  }
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.STREAK_DATA(userId), JSON.stringify(data));
  } catch (error) {
    console.error("Error setting streak data:", error);
  }
}

export async function getSettings(userId) {
  if (!userId) {
    console.warn("getSettings called without userId");
    return {
      reminderTime: "20:00",
      notificationsEnabled: true,
      darkModeAuto: true,
    };
  }
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS(userId));
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

export async function setSettings(userId, settings) {
  if (!userId) {
    console.warn("setSettings called without userId");
    return;
  }
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS(userId), JSON.stringify(settings));
  } catch (error) {
    console.error("Error setting settings:", error);
  }
}

export async function clearAllData() {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error("Error clearing data:", error);
  }
}

export async function clearUserData(userId) {
  if (!userId) return;
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.STREAK_DATA(userId),
      STORAGE_KEYS.SETTINGS(userId),
      STORAGE_KEYS.COMMITS(userId),
      STORAGE_KEYS.EARNED_BADGES(userId),
    ]);
  } catch (error) {
    console.error("Error clearing user data:", error);
  }
}

export async function getEarnedBadges(userId) {
  if (!userId) return [];
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.EARNED_BADGES(userId));
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting earned badges:", error);
    return [];
  }
}

export async function setEarnedBadges(userId, badgeIds) {
  if (!userId) return;
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.EARNED_BADGES(userId), JSON.stringify(badgeIds));
  } catch (error) {
    console.error("Error setting earned badges:", error);
  }
}

export async function getTotalAllTimeCommits(userId) {
  if (!userId) return 0;
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TOTAL_ALL_TIME_COMMITS(userId));
    return data ? parseInt(data) : 0;
  } catch (error) {
    console.error("Error getting total all-time commits:", error);
    return 0;
  }
}

export async function setTotalAllTimeCommits(userId, count) {
  if (!userId) return;
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TOTAL_ALL_TIME_COMMITS(userId), String(count));
  } catch (error) {
    console.error("Error setting total all-time commits:", error);
  }
}
