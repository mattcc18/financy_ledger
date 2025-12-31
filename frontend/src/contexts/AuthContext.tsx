import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

interface User {
  user_id: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenRefreshTimer, setTokenRefreshTimer] = useState<NodeJS.Timeout | null>(null);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Set up automatic token refresh
  useEffect(() => {
    if (user && tokenRefreshTimer === null) {
      // Refresh token every 50 minutes (tokens expire after 1 hour)
      const interval = setInterval(() => {
        refreshToken().catch(console.error);
      }, 50 * 60 * 1000); // 50 minutes

      setTokenRefreshTimer(interval);

      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    } else if (!user && tokenRefreshTimer) {
      clearInterval(tokenRefreshTimer);
      setTokenRefreshTimer(null);
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const refreshTokenValue = localStorage.getItem('refresh_token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      // Check token expiration
      const tokenData = parseJwt(token);
      if (tokenData && tokenData.exp) {
        const expirationTime = tokenData.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const timeUntilExpiration = expirationTime - currentTime;

        // If token expires in less than 5 minutes, refresh it
        if (timeUntilExpiration < 5 * 60 * 1000) {
          if (refreshTokenValue) {
            try {
              await refreshToken();
            } catch (error) {
              console.error('Token refresh failed:', error);
              logout();
              setLoading(false);
              return;
            }
          } else {
            // No refresh token, user needs to login again
            logout();
            setLoading(false);
            return;
          }
        }
      }

      // Verify token by getting current user
      const userData = await api.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      // Token is invalid, clear it
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.signIn(email, password);
      
      // Store tokens
      localStorage.setItem('auth_token', response.access_token);
      if (response.refresh_token) {
        localStorage.setItem('refresh_token', response.refresh_token);
      }
      
      // Get user data
      const userData = await api.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const response = await api.signUp(email, password);
      
      // Store tokens
      localStorage.setItem('auth_token', response.access_token);
      if (response.refresh_token) {
        localStorage.setItem('refresh_token', response.refresh_token);
      }
      
      // Get user data
      const userData = await api.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    if (tokenRefreshTimer) {
      clearInterval(tokenRefreshTimer);
      setTokenRefreshTimer(null);
    }
  };

  const refreshToken = async () => {
    const refreshTokenValue = localStorage.getItem('refresh_token');
    if (!refreshTokenValue) {
      throw new Error('No refresh token available');
    }

    try {
      // Call backend to refresh token (if endpoint exists)
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshTokenValue }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      localStorage.setItem('auth_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Don't logout immediately - let the user continue with current token
      // The API service will handle 401 errors
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        signup,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to parse JWT token
function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

