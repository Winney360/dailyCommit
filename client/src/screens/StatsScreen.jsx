import React, { useState, useEffect } from 'react';
import { Award, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getStreakData, getTotalAllTimeCommits, setTotalAllTimeCommits } from '@/lib/storage';
import { getTotalAllTimeCommits as fetchTotalCommits } from '@/lib/api';

const BADGES = [
  { id: 'first-commit', name: 'Getting Started', requirement: 1, color: '#34D399' },
  { id: 'week-streak', name: 'Week Warrior', requirement: 7, color: '#F59E0B' },
  { id: 'two-weeks', name: 'Fortnight Force', requirement: 14, color: '#7C3AED' },
  { id: 'month-streak', name: 'Monthly Master', requirement: 30, color: '#9F7AEA' },
  { id: 'hundred-days', name: 'Centurion', requirement: 100, color: '#34D399' },
  { id: 'six-months', name: 'Half-Year Hero', requirement: 180, color: '#8B5CF6' },
  { id: 'full-year', name: 'Year Warrior', requirement: 365, color: '#F59E0B' },
];

export default function StatsScreen() {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalCommits: 0,
    yearlyCommits: 0,
  });
  const [totalAllTimeCommits, setTotalAllTimeCommitsState] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadData();
      // Fetch fresh data if all-time commits is 0
      const stored = getTotalAllTimeCommits(user.id);
      if (stored === 0) {
        syncAllTimeCommits();
      }
    }
  }, [user?.id]);

  // Listen for storage changes from other tabs/components
  useEffect(() => {
    const handleStorageChange = () => {
      if (user?.id) {
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also set up an interval to check for updates every 5 seconds
    const interval = setInterval(() => {
      if (user?.id) {
        const freshData = getTotalAllTimeCommits(user.id);
        if (freshData !== totalAllTimeCommits) {
          setTotalAllTimeCommitsState(freshData);
        }
      }
    }, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [user?.id, totalAllTimeCommits]);

  const loadData = () => {
    if (!user?.id) return;
    const data = getStreakData(user.id);
    setStreakData(data);

    const totalCommits = getTotalAllTimeCommits(user.id);
    setTotalAllTimeCommitsState(totalCommits);
  };

  const syncAllTimeCommits = async () => {
    if (!user?.id || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      const response = await fetchTotalCommits();
      const total = response.totalAllTimeCommits || 0;
      setTotalAllTimeCommits(user.id, total);
      setTotalAllTimeCommitsState(total);
    } catch (error) {
      console.error('Failed to sync all-time commits:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const earnedBadges = BADGES.filter((badge) => streakData.longestStreak >= badge.requirement);
  const nextBadge = BADGES.find((badge) => streakData.longestStreak < badge.requirement);

  return (
    <div className="flex-1 bg-base p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold text-primary">Statistics & Achievements</h1>
        <button
          onClick={syncAllTimeCommits}
          disabled={isRefreshing}
          className="p-3 rounded-lg hover:bg-hover transition-colors disabled:opacity-50 group relative"
          title="Refresh all-time commits"
        >
          <RefreshCw size={20} className={`text-accent ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 text-primary font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none bg-secondary border border-custom rounded px-2 py-1">Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-secondary border border-custom rounded-lg p-6">
          <h3 className="text-muted font-semibold mb-2">Total All-Time</h3>
          <p className="text-4xl font-bold text-success">{totalAllTimeCommits.toLocaleString()}</p>
          <span className="text-sm text-muted">commits</span>
        </div>

        <div className="bg-secondary border border-custom rounded-lg p-6">
          <h3 className="text-muted font-semibold mb-2">This Year</h3>
          <p className="text-4xl font-bold text-warning">{streakData.yearlyCommits}</p>
          <span className="text-sm text-muted">commits</span>
        </div>

        <div className="bg-secondary border border-custom rounded-lg p-6">
          <h3 className="text-muted font-semibold mb-2">Longest Streak</h3>
          <p className="text-4xl font-bold text-accent">{streakData.longestStreak}</p>
          <span className="text-sm text-muted">days</span>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-primary mb-2">Achievements</h2>
        <p className="text-muted mb-6">
          {earnedBadges.length} of {BADGES.length} badges earned
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {BADGES.map((badge) => {
            const isEarned = earnedBadges.some((b) => b.id === badge.id);
            return (
              <div key={badge.id} className={`rounded-lg p-6 text-center border transition-all ${
                isEarned 
                  ? 'bg-secondary border-custom-light' 
                  : 'bg-base border-custom opacity-60'
              }`}>
                <div className={`flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4 ${
                  isEarned ? 'bg-primary' : 'bg-hover'
                }`}>
                  <Award size={32} className="text-white" />
                </div>
                <h3 className="text-primary font-semibold mb-1">{badge.name}</h3>
                <p className="text-muted text-sm mb-2">{badge.requirement} day{badge.requirement > 1 ? 's' : ''} streak</p>
                {isEarned && <span className="inline-block px-3 py-1 bg-success text-white text-xs font-semibold rounded-full">Earned!</span>}
              </div>
            );
          })}
        </div>

        {nextBadge && (
          <div className="bg-secondary border border-custom rounded-lg p-6">
            <h3 className="text-primary font-semibold mb-2">Next Achievement</h3>
            <p className="text-primary">
              <span className="font-semibold">{nextBadge.name}</span> — {nextBadge.requirement - streakData.currentStreak} more day
              {nextBadge.requirement - streakData.currentStreak > 1 ? 's' : ''} to go!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
