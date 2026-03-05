import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Github } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getApiUrl } from '@/lib/query-client';

export default function LoginScreen() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAccountChoice, setShowAccountChoice] = useState(false);
  const [pendingGitHubUser, setPendingGitHubUser] = useState(null);

  useEffect(() => {
    //console.log('[LoginScreen] Component mounted, window.location.search:', window.location.search);
    
    // If already logged in, redirect to dashboard
    if (user) {
      //console.log('[LoginScreen] User already logged in, redirecting to dashboard');
      navigate('/', { replace: true });
      return;
    }

    // Check if we're on the callback page
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get('user');
    const tokenParam = urlParams.get('token');

    //console.log('[LoginScreen] URL params:', { userParam: !!userParam, tokenParam: !!tokenParam });

    if (userParam) {
      //console.log('[LoginScreen] Found user param, processing callback...');
      handleCallback(userParam, tokenParam);
    } else {
      //console.log('[LoginScreen] No user param found, staying on login page');
    }
  }, [user, navigate]);

  const handleContinueWithExistingAccount = async () => {
    if (!pendingGitHubUser) return;
    
    setIsLoading(true);
    try {
      login(pendingGitHubUser);
      // Clear the deleted account markers
      localStorage.removeItem('lastDeletedGitHubUsername');
      localStorage.removeItem('lastDeletedGitHubName');
      window.history.replaceState({}, document.title, window.location.pathname);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('[LoginScreen] Login error:', error);
      setError('Failed to log in. Please try again.');
      setIsLoading(false);
    }
  };

  const handleDifferentAccount = () => {
    // User wants to log in with different GitHub account
    // Clear the choice modal and go back to login button
    setPendingGitHubUser(null);
    setShowAccountChoice(false);
    setError(null);
    // Clear the pending user from localStorage too
    localStorage.removeItem('lastDeletedGitHubUsername');
    localStorage.removeItem('lastDeletedGitHubName');
  };

  const handleCallback = async (userParam, tokenParam) => {
    setIsLoading(true);
    //console.log('[LoginScreen] Processing OAuth callback...');
    
    try {
      const userData = JSON.parse(decodeURIComponent(userParam));
      /*console.log('[LoginScreen] Parsed user data:', { 
        id: userData.id, 
        username: userData.username,
        name: userData.name,
        email: userData.email 
      }); */

      if (tokenParam) {
        userData.accessToken = decodeURIComponent(tokenParam);
        //console.log('[LoginScreen] Token received');
      }

      // Check if this GitHub account was previously deleted
      const lastDeletedUsername = localStorage.getItem('lastDeletedGitHubUsername');
      const lastDeletedName = localStorage.getItem('lastDeletedGitHubName');
      
      /*console.log('[LoginScreen] Checking for deleted account:', {
        lastDeletedUsername,
        currentUsername: userData.username,
        matches: lastDeletedUsername && userData.username === lastDeletedUsername
      }); */
      
      if (lastDeletedUsername && userData.username === lastDeletedUsername) {
        //console.log('[LoginScreen] Detected returning deleted account - showing choice modal');
        // Same GitHub account that was previously deleted - ask user to choose
        setPendingGitHubUser(userData);
        setShowAccountChoice(true);
        setIsLoading(false);
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      //console.log('[LoginScreen] Calling login()...');
      login(userData);
      //console.log('[LoginScreen] Login successful, user saved to storage');

      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      //console.log('[LoginScreen] URL params cleared');

      navigate('/', { replace: true });
      //console.log('[LoginScreen] Navigating to dashboard');
    } catch (error) {
      console.error('[LoginScreen] Callback error:', error);
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

  if (isLoading && !error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base animate-fade-in">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
          <p className="text-primary font-medium">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (showAccountChoice && pendingGitHubUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base px-6 animate-fade-in">
        <div className="w-full max-w-md">
          <div className="bg-secondary border border-custom rounded-lg p-8 animate-scale-in shadow-xl">
            <p className="text-muted mb-2 text-sm">GitHub Account Detected</p>
            <h2 className="text-2xl font-bold text-primary mb-1">@{pendingGitHubUser.username}</h2>
            <p className="text-muted text-sm mb-6">Your account was previously deleted. What would you like to do?</p>
            
            <div className="space-y-3 animate-stagger-children">
              <button
                onClick={handleContinueWithExistingAccount}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 hover:scale-105 active:scale-95"
              >
                Continue with @{pendingGitHubUser.username}
              </button>
              <button
                onClick={handleDifferentAccount}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-hover hover:bg-tertiary text-primary font-semibold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Use Different GitHub Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-base px-6 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center animate-slide-up">
          <h1 className="text-5xl font-bold text-accent mb-3 hover:text-primary transition-colors duration-300">DailyCommit</h1>
          <p className="text-muted text-lg">Track your GitHub commits and maintain your daily coding streak</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950 border border-red-800 rounded-lg animate-slide-up">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <button 
            onClick={handleGitHubLogin} 
            disabled={isLoading} 
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-primary hover:bg-primary-hover disabled:bg-primary-hover disabled:opacity-50 text-white font-semibold rounded-lg transition-all duration-200 mb-8 hover:shadow-lg hover:shadow-primary/40 hover:scale-105 active:scale-95 group"
          >
            <Github size={24} className="group-hover:animate-subtle-bounce" />
            <span>Continue with GitHub</span>
          </button>
        </div>

        <p className="text-center text-muted text-sm animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Sign in to access your GitHub commit history and track your progress
        </p>
      </div>
    </div>
  );
}
