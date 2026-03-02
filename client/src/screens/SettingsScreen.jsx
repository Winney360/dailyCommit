import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Trash2, User, Shield } from 'lucide-react';
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
    <div className="flex-1 bg-slate-950 p-8">
      <h1 className="text-4xl font-bold text-slate-100 mb-8">Settings</h1>

      <div className="mb-8">
        <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-100 mb-6">
          <User size={20} />
          Account Information
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-lg divide-y divide-slate-800">
          <div className="px-6 py-4 flex justify-between items-center">
            <span className="text-slate-400 font-medium">Username</span>
            <span className="text-slate-100">{user?.username || 'N/A'}</span>
          </div>
          <div className="px-6 py-4 flex justify-between items-center">
            <span className="text-slate-400 font-medium">Name</span>
            <span className="text-slate-100">{user?.name || 'N/A'}</span>
          </div>
          <div className="px-6 py-4 flex justify-between items-center">
            <span className="text-slate-400 font-medium">User ID</span>
            <span className="text-slate-100 font-mono text-sm">{user?.id || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-100 mb-6">
          <Shield size={20} />
          Actions
        </h2>

        <div className="space-y-3">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-lg transition-colors"
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
            className="bg-slate-900 border border-slate-800 rounded-lg p-8 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-slate-100 mb-2">Confirm Logout</h3>
            <p className="text-slate-400 mb-6">Are you sure you want to log out?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
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
            className="bg-slate-900 border border-slate-800 rounded-lg p-8 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-slate-100 mb-4">Delete Account</h3>
            <p className="text-slate-400 mb-3">This action cannot be undone. All your data will be permanently deleted.</p>
            <p className="text-slate-400 mb-4">
              Type <span className="font-bold">DELETE</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:border-blue-600 mb-6"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-lg transition-colors"
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
