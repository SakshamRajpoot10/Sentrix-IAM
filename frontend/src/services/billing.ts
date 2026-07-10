import { api } from './api';

export interface PlanFeature {
  name: string;
  included: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  displayName: string;
  priceMonthly: number; // in paise
  currency: string;
  features: PlanFeature[];
  agentLimit: number;
  policyLimit: number;
  apiCallLimit: number;
  auditRetentionDays: number;
  recommended: boolean;
}

export interface SubscriptionDetails {
  subscriptionId: string;
  plan: string;
  razorpayKeyId: string;
  status: string;
}

export const billingService = {
  getPlans: async (): Promise<PricingPlan[]> => {
    const response = await api.get<PricingPlan[]>('/api/v1/billing/plans');
    return response.data;
  },

  createSubscription: async (planId: string): Promise<SubscriptionDetails> => {
    const response = await api.post<SubscriptionDetails>('/api/v1/billing/create-subscription', { planId });
    return response.data;
  },

  verifyPayment: async (
    razorpayPaymentId: string,
    razorpaySubscriptionId: string,
    razorpaySignature: string
  ): Promise<{ status: string; plan: string; message: string }> => {
    const response = await api.post('/api/v1/billing/verify-payment', {
      razorpayPaymentId,
      razorpaySubscriptionId,
      razorpaySignature,
    });
    return response.data;
  },

  getBillingHistory: async (): Promise<any[]> => {
    const response = await api.get('/api/v1/billing/history');
    return response.data;
  },

  getSubscriptionStatus: async (subscriptionId: string): Promise<{ status: string; plan: string }> => {
    const response = await api.get<{ status: string; plan: string }>(`/api/v1/billing/subscription-status/${subscriptionId}`);
    return response.data;
  },

  getPendingSubscriptions: async (): Promise<any[]> => {
    const response = await api.get('/api/v1/billing/admin/pending-subscriptions');
    return response.data;
  },

  approveSubscription: async (subscriptionId: string): Promise<any> => {
    const response = await api.post(`/api/v1/billing/admin/approve-subscription/${subscriptionId}`);
    return response.data;
  },

  rejectSubscription: async (subscriptionId: string): Promise<any> => {
    const response = await api.post(`/api/v1/billing/admin/reject-subscription/${subscriptionId}`);
    return response.data;
  },
};
