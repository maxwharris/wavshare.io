import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_ENDPOINTS } from '../config/api';

interface User {
  id: string;
  username: string;
  email: string;
  emailVerified?: boolean;
  profilePhoto?: string;
  description?: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface RegisterResult {
  success: boolean;
  message?: string;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<RegisterResult>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
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

  useEffect(() => {
    // Check for stored token on app load
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      // TODO: Validate token and get user info
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usernameOrEmail: email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Login failed with status:', response.status, 'Error:', errorData);
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      console.log('Login successful:', data);
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('token', data.token);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (data: RegisterData): Promise<RegisterResult> => {
    try {
      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: responseData.message || 'Registration failed'
        };
      }

      setUser(responseData.user);
      setToken(responseData.token);
      localStorage.setItem('token', responseData.token);

      return {
        success: true,
        message: responseData.message || 'Registration successful!'
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Network error. Please try again.'
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
