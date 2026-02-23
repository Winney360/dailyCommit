import React, { useState, useEffect } from 'react';
import { Award } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getStreakData, getTotalAllTimeCommits } from '@/lib/storage';
import './StatsScreen.css';

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
    <div className="stats-screen">
      <h1>Statistics & Achievements</h1>

      <div className="overview-cards">
        <div className="overview-card">
          <h3>Total All-Time</h3>
          <p className="big-number">{totalAllTimeCommits.toLocaleString()}</p>
          <span>commits</span>
        </div>

        <div className="overview-card">
          <h3>This Year</h3>
          <p className="big-number">{streakData.yearlyCommits}</p>
          <span>commits</span>
        </div>

        <div className="overview-card">
          <h3>Longest Streak</h3>
          <p className="big-number">{streakData.longestStreak}</p>
          <span>days</span>
        </div>
      </div>

      <div className="achievements-section">
        <h2>Achievements</h2>
        <p className="section-subtitle">
          {earnedBadges.length} of {BADGES.length} badges earned
        </p>

        <div className="badges-grid">
          {BADGES.map((badge) => {
            const isEarned = earnedBadges.some((b) => b.id === badge.id);
            return (
              <div key={badge.id} className={`badge-card ${isEarned ? 'earned' : 'locked'}`}>
                <div className="badge-icon" style={{ backgroundColor: isEarned ? badge.color : '#2D2440' }}>
                  <Award size={32} color="#ffffff" />
                </div>
                <h3>{badge.name}</h3>
                <p>{badge.requirement} day{badge.requirement > 1 ? 's' : ''} streak</p>
                {isEarned && <span className="earned-label">Earned!</span>}
              </div>
            );
          })}
        </div>

        {nextBadge && (
          <div className="next-badge">
            <h3>Next Achievement</h3>
            <p>
              <strong>{nextBadge.name}</strong> - {nextBadge.requirement - streakData.longestStreak} more day
              {nextBadge.requirement - streakData.longestStreak > 1 ? 's' : ''} to go!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
