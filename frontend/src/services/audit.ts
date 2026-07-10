import { api } from './api';

export interface AuditLog {
  id: string;
  agentId?: string;
  agentName?: string;
  sessionId?: string;
  action: string;
  resource: string;
  decision: string; // ALLOWED, DENIED, CHALLENGED, ERROR
  riskScore?: number;
  policyId?: string;
  reason?: string;
  ipAddress?: string;
  requestContext?: Record<string, any>;
  hash: string;
  previousHash: string;
  createdAt: string;
}

export interface VerificationResult {
  verified: boolean;
  totalEntries: number;
  validEntries: number;
  invalidEntries: number;
  firstInvalidEntryId?: string;
  message: string;
}

export const auditService = {
  list: async (
    agentId?: string,
    page = 0,
    size = 50
  ): Promise<{ content: AuditLog[], totalElements: number, totalPages: number }> => {
    const params: Record<string, any> = { page, size };
    if (agentId) params.agentId = agentId;
    const response = await api.get('/api/v1/audit', { params });
    return response.data;
  },

  verifyChain: async (): Promise<VerificationResult> => {
    const response = await api.get<VerificationResult>('/api/v1/audit/chain/verify');
    return response.data;
  },
};
