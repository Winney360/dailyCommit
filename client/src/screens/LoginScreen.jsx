import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Github } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getApiUrl } from '@/lib/query-client';
import './LoginScreen.css';

export default function LoginScreen() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (user) {
      navigate('/', { replace: true });
      return;
    }

    // Check if we're on the callback page
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get('user');
    const tokenParam = urlParams.get('token');

    if (userParam) {
      handleCallback(userParam, tokenParam);
    }
  }, [user, navigate]);

  const handleCallback = async (userParam, tokenParam) => {
    setIsLoading(true);
    try {
      const userData = JSON.parse(decodeURIComponent(userParam));

      if (tokenParam) {
        userData.accessToken = decodeURIComponent(tokenParam);
      }

      login(userData);

      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);

      navigate('/', { replace: true });
    } catch (error) {
      console.error('Callback error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const baseUrl = getApiUrl();
      const authUrl = `${baseUrl}api/auth/github`;
      
      // Redirect to OAuth flow
      window.location.href = authUrl;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleDemoMode = () => {
    const demoUser = {
      id: 'demo',
      username: 'DemoUser',
      name: 'Demo User',
      avatarUrl: null,
      accessToken: 'demo-token',
    };

    login(demoUser);
    navigate('/', { replace: true });
  };

  if (isLoading && !error) {
    return (
      <div className="login-screen">
        <div className="login-container">
          <div className="spinner"></div>
          <p>Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-header">
          <h1>DailyCommit</h1>
          <p>Track your GitHub commits and maintain your daily coding streak</p>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <button className="github-button" onClick={handleGitHubLogin} disabled={isLoading}>
          <Github size={24} />
          <span>Continue with GitHub</span>
        </button>

        <div className="divider">
          <span>or</span>
        </div>

        <button className="demo-button" onClick={handleDemoMode} disabled={isLoading}>
          Try Demo Mode
        </button>

        <p className="login-footer">
          Sign in to access your GitHub commit history and track your progress
        </p>
      </div>
    </div>
  );
}
