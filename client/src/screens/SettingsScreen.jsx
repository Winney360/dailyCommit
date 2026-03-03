import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Trash2, User, Shield, Bell } from 'lucide-react';
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

    // Set up interval to check for reminders every minute
    const checkInterval = setInterval(checkAndSendReminder, 60000);
    
    // Check immediately on mount
    checkAndSendReminder();

    return () => clearInterval(checkInterval);
  }, []);

  const checkAndSendReminder = () => {
    const enabled = localStorage.getItem('reminderEnabled') === 'true';
    const time = localStorage.getItem('reminderTime') || '20:00';
    
    if (!enabled || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    // Check if it's the reminder time (within the current minute)
    if (currentHours === hours && currentMinutes === minutes) {
      const lastNotification = localStorage.getItem('lastReminderSent');
      const today = now.toDateString();

      // Only send one notification per day
      if (lastNotification !== today) {
        sendNotification();
        localStorage.setItem('lastReminderSent', today);
      }
    }
  };

  const sendNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('DailyCommit Reminder', {
        body: 'Don\'t forget to make your daily commit! Keep your streak alive! 🔥',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'daily-commit-reminder',
        requireInteraction: false,
      });
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return;
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
      } else {
        alert('Notification permission denied. Please enable notifications in your browser settings.');
        setReminderEnabled(false);
        localStorage.setItem('reminderEnabled', 'false');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const handleReminderToggle = async () => {
    const newEnabled = !reminderEnabled;
    
    if (newEnabled) {
      // Request permission if not granted
      if (notificationPermission !== 'granted') {
        await requestNotificationPermission();
        if (Notification.permission !== 'granted') {
          return; // Don't enable if permission denied
        }
      }
    }
    
    setReminderEnabled(newEnabled);
    localStorage.setItem('reminderEnabled', String(newEnabled));
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
      alert('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount();
      clearAllData();
      logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 bg-base p-8">
      <h1 className="text-4xl font-bold text-primary mb-8">Settings</h1>

      <div className="mb-8">
        <h2 className="flex items-center gap-3 text-2xl font-bold text-primary mb-6">
          <User size={20} />
          Account Information
        </h2>
        <div className="bg-secondary border border-custom rounded-lg divide-y divide-custom">
          <div className="px-6 py-4 flex justify-between items-center">
            <span className="text-muted font-medium">Username</span>
            <span className="text-primary">{user?.username || 'N/A'}</span>
          </div>
          <div className="px-6 py-4 flex justify-between items-center">
            <span className="text-muted font-medium">Name</span>
            <span className="text-primary">{user?.name || 'N/A'}</span>
          </div>
          <div className="px-6 py-4 flex justify-between items-center">
            <span className="text-muted font-medium">User ID</span>
            <span className="text-primary font-mono text-sm">{user?.id || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="flex items-center gap-3 text-2xl font-bold text-primary mb-6">
          <Bell size={20} />
          Daily Reminders
        </h2>
        <div className="bg-secondary border border-custom rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-primary font-semibold mb-1">Enable Daily Reminder</h3>
              <p className="text-muted text-sm">Get notified to make your daily commit</p>
            </div>
            <button
              onClick={handleReminderToggle}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                reminderEnabled ? 'bg-primary' : 'bg-hover'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  reminderEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {reminderEnabled && (
            <div className="pt-4 border-t border-custom">
              <label className="block mb-2">
                <span className="text-muted font-medium">Reminder Time</span>
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={handleReminderTimeChange}
                className="w-full px-4 py-2 bg-hover border border-custom text-primary rounded-lg focus:outline-none focus:border-primary"
              />
              <p className="text-muted text-sm mt-2">
                You'll receive a notification at {reminderTime} every day
              </p>
              {notificationPermission !== 'granted' && (
                <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                  <p className="text-warning text-sm">
                    ⚠️ Notification permission required. Click the toggle to enable.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="flex items-center gap-3 text-2xl font-bold text-primary mb-6">
          <Shield size={20} />
          Actions
        </h2>

        <div className="space-y-3">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 px-6 py-3 bg-hover hover:bg-tertiary text-primary font-semibold rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Log Out</span>
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center gap-3 px-6 py-3 bg-red-900 hover:bg-red-800 text-red-100 font-semibold rounded-lg transition-colors"
          >
            <Trash2 size={20} />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {showLogoutModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="bg-secondary border border-custom rounded-lg p-8 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-primary mb-2">Confirm Logout</h3>
            <p className="text-muted mb-6">Are you sure you want to log out?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 bg-hover hover:bg-tertiary text-primary font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-secondary border border-custom rounded-lg p-8 max-w-sm w-full"
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
              className="w-full px-4 py-2 bg-hover border border-custom text-primary rounded-lg focus:outline-none focus:border-primary mb-6"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-hover hover:bg-tertiary text-primary font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteInput !== 'DELETE' || isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
