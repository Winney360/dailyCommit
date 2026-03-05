import React, { useState, useEffect } from 'react';
import { Award, RefreshCw } from 'lucide-react';
import FlameIcon from '@/components/FlameIcon';
import { useAuth } from '@/context/AuthContext';
import { getStreakData, getTotalAllTimeCommits, setTotalAllTimeCommits } from '@/lib/storage';
import { getTotalAllTimeCommits as fetchTotalCommits } from '@/lib/api';

const BADGES = [
  { id: 'first-commit', name: 'Getting Started', requirement: 1, color: '#34D399', flameColor: '#F97316' },
  { id: 'week-streak', name: 'Week Warrior', requirement: 7, color: '#F59E0B', flameColor: '#F59E0B' },
  { id: 'two-weeks', name: 'Fortnight Force', requirement: 14, color: '#7C3AED', flameColor: '#7C3AED' },
  { id: 'month-streak', name: 'Monthly Master', requirement: 30, color: '#9F7AEA', flameColor: '#9F7AEA' },
  { id: 'hundred-days', name: 'Centurion', requirement: 100, color: '#34D399', flameColor: '#3B82F6' },
  { id: 'six-months', name: 'Half-Year Hero', requirement: 180, color: '#8B5CF6', flameColor: '#EC4899' },
  { id: 'nine-months', name: 'Nine-Month Streak', requirement: 270, color: '#EC4899', flameColor: '#F472B6' },
  { id: 'full-year', name: 'Year Warrior', requirement: 365, color: '#F59E0B', flameColor: '#FBBF24' },
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

  const formatRequirement = (requirement) => {
    if (requirement === 180) return '6 months';
    if (requirement === 270) return '9 months';
    return `${requirement} day${requirement > 1 ? 's' : ''}`;
  };

  const earnedBadges = BADGES.filter((badge) => streakData.longestStreak >= badge.requirement);
  const nextBadge = BADGES.find((badge) => streakData.longestStreak < badge.requirement);

  return (
    <div className="flex-1 bg-base p-4 md:p-8 animate-fade-in">
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-up">
        <h1 className="text-2xl md:text-4xl font-bold text-primary">Statistics & Achievements</h1>
        <button
          onClick={syncAllTimeCommits}
          disabled={isRefreshing}
          className="p-3 rounded-lg hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-200 disabled:opacity-50 group relative hover:scale-110 active:scale-95"
          title="Refresh all-time commits"
          aria-label="Refresh all-time commits"
        >
          <RefreshCw size={20} className={`text-accent ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 text-primary font-medium text-sm opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100 transition-opacity whitespace-nowrap pointer-events-none bg-secondary border border-custom rounded px-2 py-1">Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12 animate-stagger-children">
        <div className="bg-secondary border border-custom rounded-lg p-4 md:p-6 hover:border-success/50 transition-all duration-300 hover:shadow-lg hover:shadow-success/20 hover:scale-105 cursor-default">
          <h3 className="text-muted font-semibold mb-2 text-sm md:text-base">Total All-Time</h3>
          <p className="text-3xl md:text-4xl font-bold text-success">{totalAllTimeCommits.toLocaleString()}</p>
          <span className="text-xs md:text-sm text-muted">commits</span>
        </div>

        <div className="bg-secondary border border-custom rounded-lg p-4 md:p-6 hover:border-warning/50 transition-all duration-300 hover:shadow-lg hover:shadow-warning/20 hover:scale-105 cursor-default">
          <h3 className="text-muted font-semibold mb-2 text-sm md:text-base">This Year</h3>
          <p className="text-3xl md:text-4xl font-bold text-warning">{streakData.yearlyCommits}</p>
          <span className="text-xs md:text-sm text-muted">commits</span>
        </div>

        <div className="bg-secondary border border-custom rounded-lg p-4 md:p-6 hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent/20 hover:scale-105 cursor-default">
          <h3 className="text-muted font-semibold mb-2 text-sm md:text-base">Longest Streak</h3>
          <p className="text-3xl md:text-4xl font-bold text-accent">{streakData.longestStreak}</p>
          <span className="text-xs md:text-sm text-muted">days</span>
        </div>
      </div>

      <div className="animate-slide-up">
        <h2 className="text-xl md:text-2xl font-bold text-primary mb-2">Achievements</h2>
        <p className="text-muted mb-4 md:mb-6 text-sm md:text-base">
          {earnedBadges.length} of {BADGES.length} badges earned
        </p>

        <div className="grid grid-cols-6 sm:grid-cols-6 lg:grid-cols-12 gap-4 md:gap-6 mb-6 md:mb-8 animate-stagger-children">
          {BADGES.map((badge, index) => {
            const isEarned = earnedBadges.some((b) => b.id === badge.id);
            const isLast2 = index >= BADGES.length - 2;
            return (
              <div 
                key={badge.id} 
                className={`rounded-lg p-2 sm:p-4 md:p-6 text-center border transition-all duration-300 hover:scale-110 active:scale-95 flex flex-col ${
                  isLast2 ? 'col-span-3 sm:col-span-3 lg:col-span-3' : 'col-span-2 sm:col-span-3 lg:col-span-3'
                } ${
                  isEarned 
                    ? 'bg-secondary border-custom-light hover:shadow-lg hover:shadow-primary/20 cursor-pointer' 
                    : 'bg-base border-custom opacity-60 hover:opacity-80'
                }`}
              >
                <div className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full mx-auto mb-2 sm:mb-3 md:mb-4 transition-all duration-300 ${
                  isEarned ? 'bg-primary shadow-lg shadow-primary/40' : 'bg-hover'
                }`}>
                  <Award size={24} className="text-white" />
                </div>
                <h3 className="text-primary font-semibold mb-1 text-xs sm:text-sm md:text-base">{badge.name}</h3>
                <p className="text-muted text-xs sm:text-xs md:text-sm mb-2">{formatRequirement(badge.requirement)} streak</p>
                <div className="mt-auto pt-2">
                  {isEarned ? (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full" style={{ 
                      background: `linear-gradient(135deg, ${badge.flameColor}20, ${badge.flameColor}10)`,
                      boxShadow: `0 0 8px ${badge.flameColor}40`
                    }}>
                      <span className="text-white text-xs font-semibold">Earned</span>
                      <FlameIcon color={badge.flameColor} size={16} />
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-hover/50">
                      <span className="text-muted text-xs font-semibold">Locked</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {nextBadge && (
          <div className="bg-secondary border border-custom rounded-lg p-6 animate-slide-up hover:border-primary/50 transition-all duration-300">
            <h3 className="text-primary font-semibold mb-4">Next Achievement 🎯</h3>
            <p className="text-primary mb-4">
              <span className="font-semibold">{nextBadge.name}</span> — <span className="text-accent font-bold">{nextBadge.requirement - streakData.currentStreak}</span> more day{nextBadge.requirement - streakData.currentStreak > 1 ? 's' : ''} to go!
            </p>
            <div className="space-y-3">
              <div className="w-full h-4 bg-base border-2 border-accent rounded-lg overflow-hidden shadow-md">
                <div 
                  className="h-full bg-accent transition-all duration-500 ease-out shadow-lg shadow-primary/50"
                  style={{ width: `${Math.min((streakData.currentStreak / nextBadge.requirement) * 100, 100)}%` }}
                />
              </div>
              <div className="text-center">
                <span className="text-sm font-semibold text-primary">{streakData.currentStreak}/{nextBadge.requirement} days</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
