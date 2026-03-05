import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Trash2, User, Shield, Bell, X, Check, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { deleteAccount } from '@/lib/api';
import { clearAllData } from '@/lib/storage';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Reminder states
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [notificationPermission, setNotificationPermission] = useState('default');
  
  // Toast states
  const [toast, setToast] = useState({ show: false, message: '', type: 'info', action: null });

  useEffect(() => {
    // Load reminder settings from localStorage
    const savedEnabled = localStorage.getItem('reminderEnabled') === 'true';
    const savedTime = localStorage.getItem('reminderTime') || '20:00';
    setReminderEnabled(savedEnabled);
    setReminderTime(savedTime);

    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Set up interval to check for reminders every 30 seconds (more frequent)
    const checkInterval = setInterval(checkAndSendReminder, 30000);
    
    // Check immediately on mount
    checkAndSendReminder();

    return () => clearInterval(checkInterval);
  }, []);

  const checkAndSendReminder = () => {
    const enabled = localStorage.getItem('reminderEnabled') === 'true';
    const time = localStorage.getItem('reminderTime') || '20:00';
    
    //console.log('[Reminder] Checking:', { enabled, time, permission: Notification?.permission });
    
    if (!enabled || !('Notification' in window) || Notification.permission !== 'granted') {
      //console.log('[Reminder] Check failed:', { 
        enabled, 
        hasNotificationAPI: 'Notification' in window, 
        permission: Notification?.permission 
      });
      return;
    }

    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    //console.log('[Reminder] Time check:', { 
      currentTime: `${currentHours}:${currentMinutes}`, 
      reminderTime: `${hours}:${minutes}`,
      matches: currentHours === hours && currentMinutes === minutes
    });

    // Check if it's the reminder time (within the current minute)
    if (currentHours === hours && currentMinutes === minutes) {
      const lastNotification = localStorage.getItem('lastReminderSent');
      const today = now.toDateString();

      //console.log('[Reminder] Time matched!', { lastNotification, today });

      // Only send one notification per day
      if (lastNotification !== today) {
        //console.log('[Reminder] Sending notification...');
        sendNotification();
        localStorage.setItem('lastReminderSent', today);
      } else {
        //console.log('[Reminder] Already sent today');
      }
    }
  };

  const sendNotification = () => {
    //console.log('[Reminder] sendNotification called');
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('DailyCommit Reminder', {
        body: 'Don\'t forget to make your daily commit! Keep your streak alive! 🔥',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'daily-commit-reminder',
        requireInteraction: false,
      });
      //console.log('[Reminder] Notification sent successfully');
    } else {
      //console.log('[Reminder] Cannot send notification:', {
        hasAPI: 'Notification' in window,
        permission: Notification?.permission
      });
    }
  };

  const showToast = (message, type = 'info', action = null) => {
    setToast({ show: true, message, type, action });
    
    // Auto-dismiss after 4 seconds if not a confirm toast
    if (!action) {
      setTimeout(() => {
        hideToast();
      }, 4000);
    }
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'info', action: null });
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      showToast('This browser does not support notifications', 'error');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        // Send a test notification
        new Notification('DailyCommit', {
          body: 'Reminders enabled! You\'ll get notified at ' + reminderTime,
          icon: '/favicon.ico',
        });
        showToast('Reminders enabled successfully! 🔔', 'success');
        return true;
      } else {
        showToast('Notification permission denied. Please enable in browser settings.', 'error');
        setReminderEnabled(false);
        localStorage.setItem('reminderEnabled', 'false');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const handleReminderToggle = async () => {
    const newEnabled = !reminderEnabled;
    
    if (newEnabled) {
      // Show confirmation toast with accept/deny options
      showToast(
        'Enable daily commit reminders? You\'ll receive a notification at your set time.',
        'confirm',
        {
          onAccept: async () => {
            hideToast();
            // Request permission if not granted
            if (notificationPermission !== 'granted') {
              const granted = await requestNotificationPermission();
              if (!granted) {
                return; // Don't enable if permission denied
              }
            } else {
              showToast('Reminders enabled! 🔔', 'success');
            }
            setReminderEnabled(true);
            localStorage.setItem('reminderEnabled', 'true');
          },
          onDeny: () => {
            hideToast();
            // Keep toggle in off position
          }
        }
      );
    } else {
      // Directly disable
      setReminderEnabled(false);
      localStorage.setItem('reminderEnabled', 'false');
      showToast('Reminders disabled', 'info');
    }
  };

  const handleReminderTimeChange = (e) => {
    const newTime = e.target.value;
    setReminderTime(newTime);
    localStorage.setItem('reminderTime', newTime);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') {
      showToast('Please type DELETE to confirm', 'error');
      return;
    }

    setIsDeleting(true);
    try {
      // Store GitHub username before any clears happen
      const githubUsername = user?.username;
      const githubName = user?.name || '';

      await deleteAccount();
      clearAllData();
      
      // Save GitHub account info AFTER clearing other data but BEFORE logout
      if (githubUsername) {
        localStorage.setItem('lastDeletedGitHubUsername', githubUsername);
        localStorage.setItem('lastDeletedGitHubName', githubName);
        //console.log('[SettingsScreen] Saved deleted account info:', { username: githubUsername, name: githubName });
      }
      
      logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Failed to delete account:', error);
      showToast('Failed to delete account. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 bg-base p-4 md:p-8 animate-fade-in">
      <h1 className="text-2xl md:text-4xl font-bold text-primary mb-6 md:mb-8 animate-slide-up">Settings</h1>

      <div className="mb-6 md:mb-8 animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <h2 className="flex items-center gap-2 md:gap-3 text-xl md:text-2xl font-bold text-primary mb-4 md:mb-6">
          <User size={18} className="md:w-5 md:h-5" />
          Account Information
        </h2>
        <div className="bg-secondary border border-custom rounded-lg divide-y divide-custom hover:border-primary/50 transition-all duration-300">
          <div className="px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 hover:bg-hover/50 transition-colors duration-200">
            <span className="text-muted font-medium text-sm md:text-base">Username</span>
            <span className="text-primary text-sm md:text-base break-all">{user?.username || 'N/A'}</span>
          </div>
          <div className="px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 hover:bg-hover/50 transition-colors duration-200">
            <span className="text-muted font-medium text-sm md:text-base">Name</span>
            <span className="text-primary text-sm md:text-base break-all">{user?.name || 'N/A'}</span>
          </div>
          <div className="px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 hover:bg-hover/50 transition-colors duration-200">
            <span className="text-muted font-medium text-sm md:text-base">User ID</span>
            <span className="text-primary font-mono text-xs md:text-sm break-all">{user?.id || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="mb-6 md:mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <h2 className="flex items-center gap-2 md:gap-3 text-xl md:text-2xl font-bold text-primary mb-4 md:mb-6">
          <Bell size={18} className="md:w-5 md:h-5" />
          Daily Reminders
        </h2>
        <div className="bg-secondary border border-custom rounded-lg p-4 md:p-6 hover:border-accent/50 transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
            <div>
              <h3 className="text-primary font-semibold mb-1 text-sm md:text-base">Enable Daily Reminder</h3>
              <p className="text-muted text-xs md:text-sm">Get notified to make your daily commit</p>
            </div>
            <button
              type="button"
              onClick={handleReminderToggle}
              role="switch"
              aria-checked={reminderEnabled}
              aria-label="Enable daily reminder"
              className={`relative inline-flex h-8 w-14 items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-300 ${
                reminderEnabled ? 'bg-primary shadow-lg shadow-primary/40' : 'bg-hover'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-all duration-300 pointer-events-none ${
                  reminderEnabled ? 'translate-x-7 shadow-lg' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {reminderEnabled && (
            <div className="pt-4 border-t border-custom animate-slide-up">
              <label className="flex items-center gap-2 mb-2">
                <Clock size={18} className="text-accent" />
                <span className="text-muted font-medium">Reminder Time</span>
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={handleReminderTimeChange}
                className="w-full px-4 py-2 bg-hover border border-custom text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              />
              <p className="text-muted text-sm mt-2">
                You'll receive a notification at {reminderTime} every day
              </p>
              {notificationPermission !== 'granted' && (
                <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg animate-slide-up">
                  <p className="text-warning text-sm">
                    ⚠️ Notification permission required. Click the toggle to enable.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 md:mb-8 animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <h2 className="flex items-center gap-2 md:gap-3 text-xl md:text-2xl font-bold text-primary mb-4 md:mb-6">
          <Shield size={18} className="md:w-5 md:h-5" />
          Actions
        </h2>

        <div className="space-y-3 animate-stagger-children">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 px-6 py-3 bg-hover hover:bg-tertiary text-primary font-semibold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg"
          >
            <LogOut size={20} />
            <span>Log Out</span>
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center gap-3 px-6 py-3 bg-red-900 hover:bg-red-800 text-red-100 font-semibold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-red-900/50"
          >
            <Trash2 size={20} />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {showLogoutModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="bg-secondary border border-custom rounded-lg p-8 max-w-sm w-full animate-scale-in shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-primary mb-2">Confirm Logout</h3>
            <p className="text-muted mb-6">Are you sure you want to log out?</p>
            <div className="flex gap-3 animate-stagger-children">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 bg-hover hover:bg-tertiary text-primary font-semibold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-primary/40"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-secondary border border-custom rounded-lg p-8 max-w-sm w-full animate-scale-in shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-primary mb-4">Delete Account</h3>
            <p className="text-muted mb-3">This action cannot be undone. All your data will be permanently deleted.</p>
            <p className="text-muted mb-4">
              Type <span className="font-bold">DELETE</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-4 py-2 bg-hover border border-custom text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 mb-6"
            />
            <div className="flex gap-3 animate-stagger-children">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-hover hover:bg-tertiary text-primary font-semibold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteInput !== 'DELETE' || isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-red-900/50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast.show && (
        <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 left-4 md:left-auto z-50 animate-slide-up">
          <div className={`bg-secondary border rounded-lg shadow-lg p-4 min-w-[320px] max-w-md transition-all duration-300 ${
            toast.type === 'error' ? 'border-red-500 bg-red-950/20' : 
            toast.type === 'success' ? 'border-success bg-success/10' : 
            toast.type === 'confirm' ? 'border-primary bg-primary/10' : 
            'border-custom'
          }`}>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-primary text-sm">{toast.message}</p>
              </div>
              {!toast.action && (
                <button
                  onClick={hideToast}
                  className="text-muted hover:text-primary transition-colors duration-200 hover:scale-110"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            
            {toast.action && (
              <div className="flex gap-2 mt-3 animate-stagger-children">
                <button
                  onClick={toast.action.onDeny}
                  className="flex-1 px-3 py-2 bg-hover hover:bg-tertiary text-muted text-sm font-medium rounded transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  Deny
                </button>
                <button
                  onClick={toast.action.onAccept}
                  className="flex-1 px-3 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-1"
                >
                  <Check size={16} />
                  Accept
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
