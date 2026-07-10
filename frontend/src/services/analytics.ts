import { api } from './api';

export interface DashboardMetrics {
  totalAgents: number;
  activeAgents: number;
  suspendedAgents: number;
  totalPolicies: number;
  totalResources: number;
  totalAuditLogs: number;
  recentAuditLogs: number;
  allowedActions24h: number;
  deniedActions24h: number;
  avgRiskScore: number;
  apiCallsToday: number;
  apiCallLimit: number;
  plan: string;
  lastEventAt?: string;
}

export const analyticsService = {
  getDashboard: async (): Promise<DashboardMetrics> => {
    const response = await api.get<DashboardMetrics>('/api/v1/analytics/dashboard');
    return response.data;
  },
};
