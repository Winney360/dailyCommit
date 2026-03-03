import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getStreakData, setStreakData, setTotalAllTimeCommits } from '@/lib/storage';
import { getGitHubCommits, getTotalAllTimeCommits as fetchTotalCommits } from '@/lib/api';

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
    <div className="flex-1 bg-base p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-primary">Welcome back, {user?.name || user?.username}!</h1>
          <p className="text-muted mt-2">Here's your commit activity for today</p>
        </div>
        <button onClick={syncCommitsFromGitHub} disabled={isRefreshing} className="p-3 rounded-lg hover:bg-hover transition-colors disabled:opacity-50">
          <RefreshCw size={20} className={`text-accent ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-secondary border border-custom rounded-lg p-6">
          <h3 className="text-muted font-semibold mb-2">Current Streak</h3>
          <p className="text-4xl font-bold text-warning">{streakData.currentStreak}</p>
          <span className="text-sm text-muted">days</span>
        </div>

        <div className="bg-secondary border border-custom rounded-lg p-6">
          <h3 className="text-muted font-semibold mb-2">Longest Streak</h3>
          <p className="text-4xl font-bold text-warning">{streakData.longestStreak}</p>
          <span className="text-sm text-muted">days</span>
        </div>

        <div className="bg-secondary border border-custom rounded-lg p-6">
          <h3 className="text-muted font-semibold mb-2">Today's Commits</h3>
          <p className="text-4xl font-bold text-warning">{streakData.todayCommits}</p>
          <span className="text-sm text-muted">commits</span>
        </div>

        <div className="bg-secondary border border-custom rounded-lg p-6">
          <h3 className="text-muted font-semibold mb-2">This Year</h3>
          <p className="text-4xl font-bold text-warning">{streakData.yearlyCommits}</p>
          <span className="text-sm text-muted">commits</span>
        </div>
      </div>

      <div className="bg-secondary border border-custom rounded-lg p-6">
        <h2 className="text-2xl font-bold text-primary mb-6">This Week</h2>
        <div className="flex items-end justify-between gap-6 h-48">
          {streakData.weeklyCommits.map((count, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="w-full bg-hover rounded-t-lg relative group" style={{ height: `${Math.min((count / Math.max(...streakData.weeklyCommits, 1)) * 100, 100)}%` }}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-accent text-white px-2 py-1 rounded text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{count}</div>
              </div>
              <span className="text-xs text-muted mt-2 font-medium">{dayNames[index]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
