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
