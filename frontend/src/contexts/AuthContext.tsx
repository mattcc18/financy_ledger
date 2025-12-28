import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

interface User {
  user_id: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error loading auth data:', e);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.signIn(email, password);
      const { access_token, user: userData } = response;
      
      if (!access_token) {
        throw new Error('Login failed: No access token received. Please verify your email address.');
      }
      
      setToken(access_token);
      setUser({
        user_id: userData.id || userData.user_id || userData.user?.id,
        email: userData.email || userData.user?.email
      });
      
      // Store in localStorage
      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('auth_user', JSON.stringify({
        user_id: userData.id || userData.user_id || userData.user?.id,
        email: userData.email || userData.user?.email
      }));
    } catch (error) {
      console.error('Login error:', error);
      // Re-throw with better error message
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Login failed. Please check your email and password.');
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const response = await api.signUp(email, password);
      const { access_token, user: userData } = response;
      
      setToken(access_token);
      setUser({
        user_id: userData.id || userData.user_id,
        email: userData.email
      });
      
      // Store in localStorage
      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('auth_user', JSON.stringify({
        user_id: userData.id || userData.user_id,
        email: userData.email
      }));
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!token && !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

