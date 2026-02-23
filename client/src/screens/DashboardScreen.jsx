import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getStreakData, setStreakData, setTotalAllTimeCommits } from '@/lib/storage';
import { getGitHubCommits, getTotalAllTimeCommits as fetchTotalCommits } from '@/lib/api';
import './DashboardScreen.css';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [streakData, setLocalStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    lastCommitDate: null,
    todayCommits: 0,
    weeklyCommits: [0, 0, 0, 0, 0, 0, 0],
    totalCommits: 0,
    yearlyCommits: 0,
  });

  useEffect(() => {
    if (user?.id) {
      loadStreakData();
      syncCommitsFromGitHub();
    }
  }, [user?.id]);

  const loadStreakData = () => {
    if (!user?.id) return;
    const data = getStreakData(user.id);
    setLocalStreakData(data);
  };

  const syncCommitsFromGitHub = async () => {
    if (!user?.id || isRefreshing) return;

    setIsRefreshing(true);
    try {
      const response = await getGitHubCommits();
      const { commitsByDay, totalCommits } = response;

      const getLocalDateString = (isoDateString) => {
        const date = new Date(isoDateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const localCommitsByDay = {};
      Object.entries(commitsByDay).forEach(([timestamp, count]) => {
        const localDate = getLocalDateString(timestamp);
        localCommitsByDay[localDate] = (localCommitsByDay[localDate] || 0) + count;
      });

      const today = getLocalDateString(new Date().toISOString());
      const todayCommits = localCommitsByDay[today] || 0;

      const weeklyCommits = [0, 0, 0, 0, 0, 0, 0];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dateStr = getLocalDateString(date.toISOString());
        const dayOfWeek = date.getDay();
        const adjustedDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weeklyCommits[adjustedDayIndex] = localCommitsByDay[dateStr] || 0;
      }

      let longestStreakValue = 0;
      let currentStreak = 0;
      let tempStreak = 0;

      const streakYearStart = new Date(new Date().getFullYear(), 0, 1);
      for (let d = new Date(streakYearStart); d <= new Date(); d.setDate(d.getDate() + 1)) {
        const dateStr = getLocalDateString(d.toISOString());
        if (localCommitsByDay[dateStr] && localCommitsByDay[dateStr] > 0) {
          tempStreak++;
          longestStreakValue = Math.max(longestStreakValue, tempStreak);
        } else {
          tempStreak = 0;
        }
      }

      let checkDate = new Date();
      while (true) {
        const dateStr = getLocalDateString(checkDate.toISOString());
        if (localCommitsByDay[dateStr] && localCommitsByDay[dateStr] > 0) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (dateStr === today) {
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      const updatedData = {
        currentStreak,
        longestStreak: longestStreakValue,
        lastCommitDate: today,
        todayCommits,
        weeklyCommits,
        totalCommits,
        yearlyCommits: totalCommits,
      };

      setStreakData(user.id, updatedData);
      setLocalStreakData(updatedData);

      const totalsResponse = await fetchTotalCommits();
      setTotalAllTimeCommits(user.id, totalsResponse.totalAllTime || 0);
    } catch (error) {
      console.error('Failed to sync commits:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="dashboard-screen">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {user?.name || user?.username}!</h1>
          <p>Here's your commit activity for today</p>
        </div>
        <button className="refresh-button" onClick={syncCommitsFromGitHub} disabled={isRefreshing}>
          <RefreshCw size={20} className={isRefreshing ? 'spinning' : ''} />
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Current Streak</h3>
          <p className="stat-value">{streakData.currentStreak}</p>
          <span className="stat-label">days</span>
        </div>

        <div className="stat-card">
          <h3>Longest Streak</h3>
          <p className="stat-value">{streakData.longestStreak}</p>
          <span className="stat-label">days</span>
        </div>

        <div className="stat-card">
          <h3>Today's Commits</h3>
          <p className="stat-value">{streakData.todayCommits}</p>
          <span className="stat-label">commits</span>
        </div>

        <div className="stat-card">
          <h3>This Year</h3>
          <p className="stat-value">{streakData.yearlyCommits}</p>
          <span className="stat-label">commits</span>
        </div>
      </div>

      <div className="weekly-chart">
        <h2>This Week</h2>
        <div className="chart-bars">
          {streakData.weeklyCommits.map((count, index) => (
            <div key={index} className="chart-bar-container">
              <div className="chart-bar-wrapper">
                <div
                  className="chart-bar"
                  style={{
                    height: `${Math.min((count / Math.max(...streakData.weeklyCommits, 1)) * 100, 100)}%`,
                  }}
                ></div>
              </div>
              <span className="chart-label">{dayNames[index]}</span>
              <span className="chart-value">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
