import { QueryClient } from '@tanstack/react-query';

export function getApiUrl() {
  // For development, use localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:5001/';
  }
  
  // For production, use environment variable or default
  const host = import.meta.env.VITE_API_URL || window.location.origin;
  
  const url = host.startsWith('http://') || host.startsWith('https://')
    ? new URL(host)
    : new URL(`${host.includes('localhost') ? 'http' : 'https'}://${host}`);

  if (!url.href.endsWith('/')) {
    url.href += '/';
  }

  return url.href;
}

function throwIfResNotOk(res) {
  if (!res.ok) {
    const text = res.statusText || 'Request failed';
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(method, route, data) {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);

  const res = await fetch(url, {
    method,
    headers: data ? { 'Content-Type': 'application/json' } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'include',
  });

  throwIfResNotOk(res);
  return res;
}

export const getQueryFn = ({ on401: unauthorizedBehavior }) => async ({ queryKey }) => {
  const baseUrl = getApiUrl();
  const url = new URL(queryKey.join('/'), baseUrl);

  const res = await fetch(url, { credentials: 'include' });

  if (res.status === 401 && unauthorizedBehavior) {
    unauthorizedBehavior();
    throw new Error('Unauthorized');
  }

  throwIfResNotOk(res);
  return res.json();
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});
