/**
 * API Client with automatic token refresh and auth handling
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Fetch wrapper with automatic authentication and error handling
 */
export async function apiFetch(endpoint: string, options: FetchOptions = {}) {
  const { skipAuth = false, ...fetchOptions } = options;

  // Get token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Prepare headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Add auth header if not skipped and token exists
  if (!skipAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    // Handle 401 Unauthorized - token expired
    if (response.status === 401) {
      // Clear storage and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        // Only redirect if we're not already on the login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?session=expired';
        }
      }
      throw new Error('Session expired. Please log in again.');
    }

    // Parse response
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    // Re-throw with more context
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network request failed');
  }
}

/**
 * Helper functions for common HTTP methods
 */
export const api = {
  get: (endpoint: string, options?: FetchOptions) =>
    apiFetch(endpoint, { ...options, method: 'GET' }),

  post: (endpoint: string, body?: any, options?: FetchOptions) =>
    apiFetch(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: (endpoint: string, body?: any, options?: FetchOptions) =>
    apiFetch(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: (endpoint: string, body?: any, options?: FetchOptions) =>
    apiFetch(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: (endpoint: string, options?: FetchOptions) =>
    apiFetch(endpoint, { ...options, method: 'DELETE' }),
};
