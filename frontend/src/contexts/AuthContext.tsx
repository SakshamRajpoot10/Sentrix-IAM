import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/auth';
import type { UserInfo, AuthResponse } from '../services/auth';

interface AuthContextType {
  user: UserInfo | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  verifyOtp: (email: string, otp: string) => Promise<AuthResponse>;
  verifySignupOtp: (email: string, otp: string) => Promise<AuthResponse>;
  register: (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    organizationName: string
  ) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  updateUserPlan: (plan: string) => void;
  updateProfile: (data: Partial<UserInfo> & { password?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        try {
          const userData = await authService.getMe();
          setUser(userData);
        } catch (error) {
          console.error('Failed to restore auth session', error);
          localStorage.clear();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      if (!data.mfaRequired && data.accessToken && data.refreshToken && data.user) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        setUser(data.user);
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email: string, otp: string): Promise<AuthResponse> => {
    setLoading(true);
    try {
      const data = await authService.verifyOtp(email, otp);
      if (data.accessToken && data.refreshToken && data.user) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        setUser(data.user);
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const verifySignupOtp = async (email: string, otp: string): Promise<AuthResponse> => {
    setLoading(true);
    try {
      const data = await authService.verifySignupOtp(email, otp);
      if (data.accessToken && data.refreshToken && data.user) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        setUser(data.user);
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    organizationName: string
  ): Promise<AuthResponse> => {
    setLoading(true);
    try {
      const data = await authService.register(
        firstName,
        lastName,
        email,
        password,
        organizationName
      );
      if (data.accessToken && data.refreshToken && data.user) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        setUser(data.user);
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } catch (e) {
      console.warn("Logout request failed on server, clearing locally", e);
    } finally {
      localStorage.clear();
      setUser(null);
      setLoading(false);
    }
  };

  const updateUserPlan = (plan: string) => {
    if (user) {
      setUser({ ...user, plan });
    }
  };

  const updateProfile = async (data: Partial<UserInfo> & { password?: string }) => {
    const updatedUser = await authService.updateProfile(data);
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyOtp, verifySignupOtp, register, logout, updateUserPlan, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
