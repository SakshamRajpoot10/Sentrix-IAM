import { api } from './api';

export interface Policy {
  id: string;
  name: string;
  description: string;
  effect: string; // ALLOW, DENY, CHALLENGE
  enforcement: string; // ENFORCING, PERMISSIVE, DISABLED
  priority: number;
  rules: Array<Record<string, any>>;
  conditions?: Record<string, any>;
  isSystem: boolean;
  version: number;
  assignedAgents: number;
  createdAt: string;
  updatedAt: string;
}

export const policyService = {
  create: async (policy: Partial<Policy>): Promise<Policy> => {
    const response = await api.post<Policy>('/api/v1/policies', policy);
    return response.data;
  },

  list: async (page = 0, size = 20): Promise<{ content: Policy[], totalElements: number, totalPages: number }> => {
    const response = await api.get('/api/v1/policies', { params: { page, size } });
    return response.data;
  },

  get: async (id: string): Promise<Policy> => {
    const response = await api.get<Policy>(`/api/v1/policies/${id}`);
    return response.data;
  },

  update: async (id: string, policy: Partial<Policy>): Promise<Policy> => {
    const response = await api.put<Policy>(`/api/v1/policies/${id}`, policy);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/policies/${id}`);
  },

  assign: async (policyId: string, agentId: string): Promise<void> => {
    await api.post(`/api/v1/policies/${policyId}/agents/${agentId}`);
  },

  unassign: async (policyId: string, agentId: string): Promise<void> => {
    await api.delete(`/api/v1/policies/${policyId}/agents/${agentId}`);
  },
};
