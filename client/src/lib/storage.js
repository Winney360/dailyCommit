// Web storage utilities using localStorage

const STORAGE_KEYS = {
  USER: "@dailycommit_user",
  STREAK_DATA: (userId) => `@dailycommit_streak_${userId}`,
  SETTINGS: (userId) => `@dailycommit_settings_${userId}`,
  COMMITS: (userId) => `@dailycommit_commits_${userId}`,
  EARNED_BADGES: (userId) => `@dailycommit_earned_badges_${userId}`,
  TOTAL_ALL_TIME_COMMITS: (userId) => `@dailycommit_total_commits_${userId}`,
};

export function getUser() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}

export function setUser(user) {
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (error) {
    console.error("Error setting user:", error);
  }
}

export function removeUser() {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER);
  } catch (error) {
    console.error("Error removing user:", error);
  }
}

export function getStreakData(userId) {
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
    const data = localStorage.getItem(STORAGE_KEYS.STREAK_DATA(userId));
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

export function setStreakData(userId, data) {
  if (!userId) {
    console.warn("setStreakData called without userId");
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEYS.STREAK_DATA(userId), JSON.stringify(data));
  } catch (error) {
    console.error("Error setting streak data:", error);
  }
}

export function getSettings(userId) {
  if (!userId) {
    console.warn("getSettings called without userId");
    return {
      reminderTime: "20:00",
      notificationsEnabled: false, // Disabled by default on web
      darkModeAuto: true,
    };
  }
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS(userId));
    return data ? JSON.parse(data) : {
      reminderTime: "20:00",
      notificationsEnabled: false,
      darkModeAuto: true,
    };
  } catch (error) {
    console.error("Error getting settings:", error);
    return {
      reminderTime: "20:00",
      notificationsEnabled: false,
      darkModeAuto: true,
    };
  }
}

export function setSettings(userId, settings) {
  if (!userId) {
    console.warn("setSettings called without userId");
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS(userId), JSON.stringify(settings));
  } catch (error) {
    console.error("Error setting settings:", error);
  }
}

export function getCommits(userId) {
  if (!userId) {
    console.warn("getCommits called without userId");
    return {};
  }
  try {
    const data = localStorage.getItem(STORAGE_KEYS.COMMITS(userId));
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Error getting commits:", error);
    return {};
  }
}

export function setCommits(userId, commits) {
  if (!userId) {
    console.warn("setCommits called without userId");
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEYS.COMMITS(userId), JSON.stringify(commits));
  } catch (error) {
    console.error("Error setting commits:", error);
  }
}

export function getEarnedBadges(userId) {
  if (!userId) {
    console.warn("getEarnedBadges called without userId");
    return [];
  }
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EARNED_BADGES(userId));
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting earned badges:", error);
    return [];
  }
}

export function setEarnedBadges(userId, badges) {
  if (!userId) {
    console.warn("setEarnedBadges called without userId");
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEYS.EARNED_BADGES(userId), JSON.stringify(badges));
  } catch (error) {
    console.error("Error setting earned badges:", error);
  }
}

export function getTotalAllTimeCommits(userId) {
  if (!userId) {
    console.warn("getTotalAllTimeCommits called without userId");
    return 0;
  }
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TOTAL_ALL_TIME_COMMITS(userId));
    return data ? parseInt(data, 10) : 0;
  } catch (error) {
    console.error("Error getting total commits:", error);
    return 0;
  }
}

export function setTotalAllTimeCommits(userId, total) {
  if (!userId) {
    console.warn("setTotalAllTimeCommits called without userId");
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEYS.TOTAL_ALL_TIME_COMMITS(userId), total.toString());
  } catch (error) {
    console.error("Error setting total commits:", error);
  }
}

export function clearAllData() {
  try {
    localStorage.clear();
  } catch (error) {
    console.error("Error clearing storage:", error);
  }
}
