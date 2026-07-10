import React, { createContext, useContext, useEffect, useState } from 'react';
import { billingService } from '../services/billing';
import type { PricingPlan, SubscriptionDetails } from '../services/billing';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

interface BillingContextType {
  plans: PricingPlan[];
  plansLoading: boolean;
  subscribe: (planId: string) => Promise<void>;
  subscriptionLoading: boolean;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const BillingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUserPlan } = useAuth();
  const { success, error, info } = useNotification();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await billingService.getPlans();
        setPlans(data);
      } catch (err) {
        console.error('Failed to load plans', err);
      } finally {
        setPlansLoading(false);
      }
    };

    fetchPlans();

    // Dynamically load Razorpay Checkout Script
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const subscribe = async (planId: string) => {
    if (!user) {
      error('You must be logged in to subscribe.');
      return;
    }

    setSubscriptionLoading(true);
    info(`Initializing subscription for ${planId} Plan...`);

    try {
      // 1. Call backend to create subscription
      const details: SubscriptionDetails = await billingService.createSubscription(planId);

      // 2. Configure Razorpay options
      const options = {
        key: details.razorpayKeyId,
        subscription_id: details.subscriptionId,
        name: 'Sentrix IAM',
        description: `${planId} Subscription Plan`,
        image: '/logo.svg',
        handler: async (response: any) => {
          setSubscriptionLoading(true);
          info('Verifying payment signature...');
          try {
            // 3. Verify payment signature on backend
            const result = await billingService.verifyPayment(
              response.razorpay_payment_id,
              response.razorpay_subscription_id,
              response.razorpay_signature
            );
            
            if (result.status === 'active') {
              success('🎉 Subscription activated successfully!');
              updateUserPlan(result.plan);
            } else {
              error('Payment verification failed.');
            }
          } catch (err: any) {
            error(err.response?.data?.message || 'Verification failed. Please contact support.');
          } finally {
            setSubscriptionLoading(false);
          }
        },
        prefill: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
        },
        theme: {
          color: '#06b6d4', // Cyan 500
        },
      };

      // 3. Open Razorpay checkout modal
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to initialize subscription checkout.');
    } finally {
      setSubscriptionLoading(false);
    }
  };

  return (
    <BillingContext.Provider value={{ plans, plansLoading, subscribe, subscriptionLoading }}>
      {children}
    </BillingContext.Provider>
  );
};

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (!context) throw new Error('useBilling must be used within BillingProvider');
  return context;
};
