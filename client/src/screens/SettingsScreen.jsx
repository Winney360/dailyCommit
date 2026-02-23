import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Trash2, User, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { deleteAccount } from '@/lib/api';
import { clearAllData } from '@/lib/storage';
import './SettingsScreen.css';

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
    <div className="settings-screen">
      <h1>Settings</h1>

      <div className="settings-section">
        <h2>
          <User size={20} />
          Account Information
        </h2>
        <div className="info-card">
          <div className="info-row">
            <span className="info-label">Username</span>
            <span className="info-value">{user?.username || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Name</span>
            <span className="info-value">{user?.name || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">User ID</span>
            <span className="info-value">{user?.id || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h2>
          <Shield size={20} />
          Actions
        </h2>

        <button className="action-button logout-button" onClick={() => setShowLogoutModal(true)}>
          <LogOut size={20} />
          <span>Log Out</span>
        </button>

        <button className="action-button delete-button" onClick={() => setShowDeleteModal(true)}>
          <Trash2 size={20} />
          <span>Delete Account</span>
        </button>
      </div>

      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out?</p>
            <div className="modal-actions">
              <button className="modal-button cancel" onClick={() => setShowLogoutModal(false)}>
                Cancel
              </button>
              <button className="modal-button confirm" onClick={handleLogout}>
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Account</h3>
            <p>This action cannot be undone. All your data will be permanently deleted.</p>
            <p>Type <strong>DELETE</strong> to confirm:</p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="Type DELETE"
              className="delete-input"
            />
            <div className="modal-actions">
              <button className="modal-button cancel" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button
                className="modal-button danger"
                onClick={handleDeleteAccount}
                disabled={deleteInput !== 'DELETE' || isDeleting}
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
