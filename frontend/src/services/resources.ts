import { api } from './api';

export interface ProtectedResource {
  id: string;
  name: string;
  resourceType: string;
  identifier: string;
  sensitivity: string; // PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED, CRITICAL
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export const resourceService = {
  create: async (resource: Partial<ProtectedResource>): Promise<ProtectedResource> => {
    const response = await api.post<ProtectedResource>('/api/v1/resources', resource);
    return response.data;
  },

  list: async (page = 0, size = 20): Promise<{ content: ProtectedResource[], totalElements: number, totalPages: number }> => {
    const response = await api.get('/api/v1/resources', { params: { page, size } });
    return response.data;
  },

  get: async (id: string): Promise<ProtectedResource> => {
    const response = await api.get<ProtectedResource>(`/api/v1/resources/${id}`);
    return response.data;
  },

  update: async (id: string, resource: Partial<ProtectedResource>): Promise<ProtectedResource> => {
    const response = await api.put<ProtectedResource>(`/api/v1/resources/${id}`, resource);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/resources/${id}`);
  },
};
