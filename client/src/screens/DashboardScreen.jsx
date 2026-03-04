import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getStreakData, setStreakData, setTotalAllTimeCommits } from '@/lib/storage';
import { getGitHubCommits, getTotalAllTimeCommits as fetchTotalCommits } from '@/lib/api';

const liquidStyles = `
  @keyframes liquidWave {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 40px 0;
    }
  }
  
  .liquid-fill {
    background: linear-gradient(
      90deg,
      #7c3aed 0%,
      #a78bfa 50%,
      #7c3aed 100%
    );
    background-size: 40px 100%;
    background-position: 0 0;
    animation: liquidWave 4s linear infinite;
    position: relative;
    opacity: 0.85;
  }
  
  .liquid-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%);
    animation: liquidGlow 4s ease-in-out infinite;
  }
  
  @keyframes liquidGlow {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.5; }
  }
`;

export default function DashboardScreen() {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasSyncedOnce, setHasSyncedOnce] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
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
    const styleSheet = document.createElement('style');
    styleSheet.textContent = liquidStyles;
    document.head.appendChild(styleSheet);
    return () => styleSheet.remove();
  }, []);

  useEffect(() => {
    if (user?.id) {
      setHasSyncedOnce(false);
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
    setLoadingProgress(0);

    // Realistic progress milestones with dynamic timing
    const milestones = [0, 15, 35, 58, 72, 82, 90, 95, 98, 100];
    const delays = [0, 200, 300, 400, 450, 500, 600, 700, 800, 0];
    
    const progressPromise = (async () => {
      for (let i = 0; i < milestones.length - 1; i++) {
        await new Promise(resolve => setTimeout(resolve, delays[i]));
        setLoadingProgress(milestones[i]);
      }
    })();

    try {
      const totalsPromise = fetchTotalCommits().catch(() => null);
      const response = await getGitHubCommits();
      const { commitsByDay, totalCommits } = response;

      const getLocalDateString = (isoDateString) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(isoDateString)) {
          return isoDateString;
        }

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
      const todayDate = new Date();
      const dayOfWeek = todayDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const daysFromSunday = dayOfWeek; // How many days since Sunday
      
      // Calculate start of this week (Sunday)
      const sundayDate = new Date(todayDate);
      sundayDate.setDate(todayDate.getDate() - daysFromSunday);
      
      // Fill in commits from Sunday to today only
      for (let i = 0; i <= daysFromSunday; i++) {
        const date = new Date(sundayDate);
        date.setDate(sundayDate.getDate() + i);
        const dateStr = getLocalDateString(date.toISOString());
        weeklyCommits[i] = localCommitsByDay[dateStr] || 0;
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

      const totalsResponse = await totalsPromise;
      if (totalsResponse) {
        setTotalAllTimeCommits(user.id, totalsResponse.totalAllTimeCommits || 0);
      }
    } catch (error) {
      console.error('Failed to sync commits:', error);
    } finally {
      await progressPromise;
      setLoadingProgress(100);
      setHasSyncedOnce(true);
      setIsRefreshing(false);
      // Reset progress bar after brief delay
      setTimeout(() => setLoadingProgress(0), 500);
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getFirstName = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(' ');
    return parts[0];
  };

  const getRemainingTimeInDay = () => {
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const msRemaining = endOfDay - now;
    const hoursRemaining = Math.ceil(msRemaining / (1000 * 60 * 60));
    return hoursRemaining;
  };

  return (
    <React.Fragment>
      <div className="flex-1 bg-base p-4 md:p-8">
        {!hasSyncedOnce && isRefreshing && (
          <div className="mb-6 md:mb-8 p-4 bg-accent/10 border border-accent/30 rounded-lg">
            <h3 className="text-primary font-semibold mb-4">Fetching your commit data...</h3>
            
            <div className="space-y-2">
              <div className="w-full h-4 bg-accent/40 rounded-full overflow-hidden border border-accent/50">
                <div 
                  className="liquid-fill h-full rounded-full transition-all duration-200 ease-out flex items-center justify-end pr-2 shadow-lg"
                  style={{ width: `${loadingProgress}%`, minWidth: '4px' }}
                >
                  {loadingProgress > 20 && (
                    <span className="text-white text-xs font-bold drop-shadow">{Math.round(loadingProgress)}%</span>
                  )}
                </div>
              </div>
              {loadingProgress <= 20 && (
                <div className="text-right">
                  <span className="text-accent font-bold text-sm">{Math.round(loadingProgress)}%</span>
                </div>
              )}
            </div>
            
            <p className="text-muted text-sm mt-4">We're syncing from GitHub. Your stats will update automatically.</p>
          </div>
        )}

      {hasSyncedOnce && streakData.todayCommits === 0 && (
        <div className="mb-6 md:mb-8 p-4 bg-warning/10 border border-warning/30 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-warning shrink-0 mt-0.5" />
          <div>
            <h3 className="text-warning font-semibold mb-1">No commits yet today</h3>
            <p className="text-warning/90 text-sm">You have {getRemainingTimeInDay()} hours left to make your first commit today and keep your streak alive! 🔥</p>
          </div>
        </div>
      )}

      <div className="mb-6 md:mb-8">
        <div className="flex items-start sm:items-center justify-between gap-3 mb-2 md:mb-3">
          <h1 className="text-2xl md:text-4xl font-bold text-primary">Welcome back, {getFirstName(user?.name) || user?.username}!</h1>
          <button onClick={syncCommitsFromGitHub} disabled={isRefreshing} className="p-2 sm:p-3 rounded-lg hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors disabled:opacity-50 group relative shrink-0" title="Refresh commits" aria-label="Refresh commits">
            <RefreshCw size={18} className={`text-accent ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="absolute bottom-full mb-2 right-0 text-primary font-medium text-sm opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100 transition-opacity whitespace-nowrap pointer-events-none bg-secondary border border-custom rounded px-2 py-1">Refresh</span>
          </button>
        </div>
        <p className="text-muted mt-2 text-sm md:text-base">Here's your commit activity for today</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-secondary border border-custom rounded-lg p-3 sm:p-4 md:p-6">
          <h3 className="text-muted font-semibold mb-1.5 text-xs sm:text-sm md:text-base">Current Streak</h3>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-warning leading-tight">{streakData.currentStreak}</p>
          <span className="text-xs md:text-sm text-muted">days</span>
        </div>

        <div className="bg-secondary border border-custom rounded-lg p-3 sm:p-4 md:p-6">
          <h3 className="text-muted font-semibold mb-1.5 text-xs sm:text-sm md:text-base">Longest Streak</h3>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-warning leading-tight">{streakData.longestStreak}</p>
          <span className="text-xs md:text-sm text-muted">days</span>
        </div>

        <div className="bg-secondary border border-custom rounded-lg p-3 sm:p-4 md:p-6">
          <h3 className="text-muted font-semibold mb-1.5 text-xs sm:text-sm md:text-base">Today's Commits</h3>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-warning leading-tight">{streakData.todayCommits}</p>
          <span className="text-xs md:text-sm text-muted">commits</span>
        </div>

        <div className="bg-secondary border border-custom rounded-lg p-3 sm:p-4 md:p-6">
          <h3 className="text-muted font-semibold mb-1.5 text-xs sm:text-sm md:text-base">This Year</h3>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-warning leading-tight">{streakData.yearlyCommits}</p>
          <span className="text-xs md:text-sm text-muted">commits</span>
        </div>
      </div>

      <div className="bg-secondary border border-custom rounded-lg p-4 md:p-6">
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-primary mb-1 md:mb-2">This Week</h2>
            <p className="text-muted text-xs md:text-sm">Your daily commit activity</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-2xl md:text-3xl font-bold text-warning">{streakData.weeklyCommits.reduce((sum, count) => sum + count, 0)}</p>
            <span className="text-xs text-muted">total commits</span>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-4 md:gap-6">
          <div className="flex items-end justify-center gap-1.5 sm:gap-2 md:gap-3 flex-1 w-full overflow-x-auto">
            {streakData.weeklyCommits.map((count, index) => {
              const maxCount = Math.max(...streakData.weeklyCommits, 1);
              const intensity = count === 0 ? 0.1 : Math.max(0.3, count / maxCount);
              const isBestDay = count > 0 && count === maxCount;
              
              return (
                <div key={index} className="flex flex-col items-center shrink-0">
                  <div 
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded transition-all hover:ring-2 hover:ring-offset-2 hover:ring-primary group relative cursor-pointer mb-2 ${
                      count === 0 ? 'bg-hover' : 'bg-primary'
                    }`}
                    style={{ opacity: intensity }}
                    title={`${dayNames[index]}: ${count} commit${count !== 1 ? 's' : ''}`}
                  >
                    {isBestDay && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-success text-lg">
                        ★
                      </div>
                    )}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-accent text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {dayNames[index]}: {count} {count === 1 ? 'commit' : 'commits'} {isBestDay && '🔥'}
                    </div>
                  </div>
                  <span className="text-xs text-muted">{dayNames[index]}</span>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col items-center gap-2 mt-4 md:mt-0">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted">Less</span>
              <div className="flex gap-1">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-hover opacity-30"></div>
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-primary opacity-50"></div>
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-primary opacity-75"></div>
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-primary opacity-100"></div>
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-primary opacity-100"></div>
              </div>
              <span className="text-xs text-muted">More</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </React.Fragment>
  );
}
