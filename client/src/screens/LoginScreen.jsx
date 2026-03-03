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

  useEffect(() => {
    console.log('[LoginScreen] Component mounted, window.location.search:', window.location.search);
    
    // If already logged in, redirect to dashboard
    if (user) {
      console.log('[LoginScreen] User already logged in, redirecting to dashboard');
      navigate('/', { replace: true });
      return;
    }

    // Check if we're on the callback page
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get('user');
    const tokenParam = urlParams.get('token');

    console.log('[LoginScreen] URL params:', { userParam: !!userParam, tokenParam: !!tokenParam });

    if (userParam) {
      console.log('[LoginScreen] Found user param, processing callback...');
      handleCallback(userParam, tokenParam);
    } else {
      console.log('[LoginScreen] No user param found, staying on login page');
    }
  }, [user, navigate]);

  const handleCallback = async (userParam, tokenParam) => {
    setIsLoading(true);
    console.log('[LoginScreen] Processing OAuth callback...');
    
    try {
      const userData = JSON.parse(decodeURIComponent(userParam));
      console.log('[LoginScreen] Parsed user data:', { id: userData.id, username: userData.username });

      if (tokenParam) {
        userData.accessToken = decodeURIComponent(tokenParam);
        console.log('[LoginScreen] Token received');
      }

      console.log('[LoginScreen] Calling login()...');
      login(userData);
      console.log('[LoginScreen] Login successful, user saved to storage');

      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      console.log('[LoginScreen] URL params cleared');

      navigate('/', { replace: true });
      console.log('[LoginScreen] Navigating to dashboard');
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
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
          <p className="text-slate-100 font-medium">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-blue-500 mb-3">DailyCommit</h1>
          <p className="text-slate-400 text-lg">Track your GitHub commits and maintain your daily coding streak</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950 border border-red-800 rounded-lg">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        <button onClick={handleGitHubLogin} disabled={isLoading} className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors mb-8">
          <Github size={24} />
          <span>Continue with GitHub</span>
        </button>

        <p className="text-center text-slate-500 text-sm">
          Sign in to access your GitHub commit history and track your progress
        </p>
      </div>
    </div>
  );
}
