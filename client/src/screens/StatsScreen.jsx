import React, { useState, useEffect } from 'react';
import { Award } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getStreakData, getTotalAllTimeCommits } from '@/lib/storage';

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
  const [totalAllTimeCommits, setTotalAllTimeCommits] = useState(0);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = () => {
    if (!user?.id) return;
    const data = getStreakData(user.id);
    setStreakData(data);

    const totalCommits = getTotalAllTimeCommits(user.id);
    setTotalAllTimeCommits(totalCommits);
  };

  const earnedBadges = BADGES.filter((badge) => streakData.longestStreak >= badge.requirement);
  const nextBadge = BADGES.find((badge) => streakData.longestStreak < badge.requirement);

  return (
    <div className="flex-1 bg-slate-950 p-8">
      <h1 className="text-4xl font-bold text-slate-100 mb-8">Statistics & Achievements</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h3 className="text-slate-400 font-semibold mb-2">Total All-Time</h3>
          <p className="text-4xl font-bold text-blue-500">{totalAllTimeCommits.toLocaleString()}</p>
          <span className="text-sm text-slate-500">commits</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h3 className="text-slate-400 font-semibold mb-2">This Year</h3>
          <p className="text-4xl font-bold text-blue-500">{streakData.yearlyCommits}</p>
          <span className="text-sm text-slate-500">commits</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h3 className="text-slate-400 font-semibold mb-2">Longest Streak</h3>
          <p className="text-4xl font-bold text-blue-500">{streakData.longestStreak}</p>
          <span className="text-sm text-slate-500">days</span>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Achievements</h2>
        <p className="text-slate-400 mb-6">
          {earnedBadges.length} of {BADGES.length} badges earned
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {BADGES.map((badge) => {
            const isEarned = earnedBadges.some((b) => b.id === badge.id);
            return (
              <div key={badge.id} className={`rounded-lg p-6 text-center border transition-all ${
                isEarned 
                  ? 'bg-slate-900 border-blue-600' 
                  : 'bg-slate-950 border-slate-800 opacity-60'
              }`}>
                <div className={`flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4 ${
                  isEarned ? 'bg-linear-to-br from-blue-600 to-blue-700' : 'bg-slate-800'
                }`}>
                  <Award size={32} className="text-white" />
                </div>
                <h3 className="text-slate-100 font-semibold mb-1">{badge.name}</h3>
                <p className="text-slate-400 text-sm mb-2">{badge.requirement} day{badge.requirement > 1 ? 's' : ''} streak</p>
                {isEarned && <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">Earned!</span>}
              </div>
            );
          })}
        </div>

        {nextBadge && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h3 className="text-slate-100 font-semibold mb-2">Next Achievement</h3>
            <p className="text-slate-300">
              <span className="font-semibold">{nextBadge.name}</span> — {nextBadge.requirement - streakData.longestStreak} more day
              {nextBadge.requirement - streakData.longestStreak > 1 ? 's' : ''} to go!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
