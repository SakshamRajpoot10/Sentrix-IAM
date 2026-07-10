import { api } from './api';

export interface Agent {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  apiKeyPrefix: string;
  riskScore: number;
  trustLevel: number;
  maxActionsPerMinute: number;
  allowedIpRanges: string[];
  metadata: Record<string, any>;
  activePolicies: number;
  activeSessions: number;
  lastActiveAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentCreatedResponse extends Omit<Agent, 'apiKeyPrefix' | 'riskScore' | 'trustLevel' | 'maxActionsPerMinute' | 'allowedIpRanges' | 'metadata' | 'activePolicies' | 'activeSessions' | 'lastActiveAt' | 'updatedAt'> {
  apiKey: string;
  apiKeyPrefix: string;
  warning: string;
}

export const agentService = {
  create: async (agent: Partial<Agent>): Promise<AgentCreatedResponse> => {
    const response = await api.post<AgentCreatedResponse>('/api/v1/agents', agent);
    return response.data;
  },
  
  list: async (page = 0, size = 20): Promise<{ content: Agent[], totalElements: number, totalPages: number }> => {
    const response = await api.get('/api/v1/agents', { params: { page, size } });
    return response.data;
  },
  
  get: async (id: string): Promise<Agent> => {
    const response = await api.get<Agent>(`/api/v1/agents/${id}`);
    return response.data;
  },
  
  update: async (id: string, agent: Partial<Agent>): Promise<Agent> => {
    const response = await api.put<Agent>(`/api/v1/agents/${id}`, agent);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/agents/${id}`);
  },
  
  suspend: async (id: string): Promise<Agent> => {
    const response = await api.post<Agent>(`/api/v1/agents/${id}/suspend`);
    return response.data;
  },
  
  activate: async (id: string): Promise<Agent> => {
    const response = await api.post<Agent>(`/api/v1/agents/${id}/activate`);
    return response.data;
  },
  
  regenerateKey: async (id: string): Promise<AgentCreatedResponse> => {
    const response = await api.post<AgentCreatedResponse>(`/api/v1/agents/${id}/regenerate-key`);
    return response.data;
  }
};
