import { api } from './api';

export interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
  organizationName: string;
  plan: string;
}

export interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  user?: UserInfo;
  mfaRequired?: boolean;
  email?: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/v1/auth/login', { email, password });
    return response.data;
  },

  verifyOtp: async (email: string, otp: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/v1/auth/verify-otp', { email, otp });
    return response.data;
  },

  register: async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    organizationName: string
  ): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/v1/auth/register', {
      firstName,
      lastName,
      email,
      password,
      organizationName,
    });
    return response.data;
  },

  verifySignupOtp: async (email: string, otp: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/v1/auth/register/verify-otp', { email, otp });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/api/v1/auth/logout');
  },

  updateProfile: async (data: Partial<UserInfo> & { password?: string }): Promise<UserInfo> => {
    const response = await api.put<UserInfo>('/api/v1/auth/profile', data);
    return response.data;
  },

  getMe: async (): Promise<UserInfo> => {
    const response = await api.get<UserInfo>('/api/v1/auth/me');
    return response.data;
  },
};
