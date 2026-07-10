import React, { useState, useEffect } from 'react';
import { useBilling } from '../contexts/BillingContext';
import { useAuth } from '../contexts/AuthContext';
import { billingService } from '../services/billing';
import { useNotification } from '../contexts/NotificationContext';
import { 
  Check, 
  Sparkles, 
  Crown, 
  ShieldCheck, 
  CreditCard,
  Zap,
  X,
  QrCode,
  Loader2,
  Download,
  Calendar,
  Layers,
  Cpu,
  History,
  Building,
  XCircle
} from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  displayName: string;
  priceMonthly: number;
  currency: string;
  features: { name: string; included: boolean }[];
  agentLimit: number;
  policyLimit: number;
  apiCallLimit: number;
  auditRetentionDays: number;
  recommended: boolean;
}

interface PaymentRecord {
  id: string;
  planId: string;
  planName: string;
  date: string;
  amount: number;
  method: string;
  status: string;
}

const popularBanks = [
  { id: 'sbi', name: 'State Bank of India' },
  { id: 'hdfc', name: 'HDFC Bank' },
  { id: 'icici', name: 'ICICI Bank' },
  { id: 'axis', name: 'Axis Bank' },
  { id: 'kotak', name: 'Kotak Mahindra Bank' },
  { id: 'pnb', name: 'Punjab National Bank' },
];

export const BillingPage: React.FC = () => {
  const { plans, plansLoading } = useBilling();
  const { user, updateUserPlan } = useAuth();
  const { success, error } = useNotification();

  // Modal States
  const [activePlan, setActivePlan] = useState<PricingPlan | null>(null);
  const [paymentMode, setPaymentMode] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiMethod, setUpiMethod] = useState<'qr' | 'vpa'>('qr');
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [isProcessingSim, setIsProcessingSim] = useState(false);

  const [paymentStep, setPaymentStep] = useState<'idle' | 'initializing' | 'paying' | 'verifying' | 'success' | 'failed'>('idle');
  const [countdown, setCountdown] = useState<number>(60);
  const [upiTimer, setUpiTimer] = useState<number>(0);
  const [progressMsg, setProgressMsg] = useState<string>('Initializing sandbox checkout...');
  const [subDetails, setSubDetails] = useState<{ subscriptionId: string; paymentId: string } | null>(null);

  // Interactive UPI QR States
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [isVerifyingUpi, setIsVerifyingUpi] = useState(false);

  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');



  // Payment History State
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  // Load payment history from backend API
  const fetchBillingHistory = React.useCallback(async () => {
    try {
      const data = await billingService.getBillingHistory();
      if (data && data.length > 0) {
        setPayments(data.map(p => ({
          id: p.id,
          planId: p.planId,
          planName: p.planName,
          date: p.date,
          amount: p.amount,
          method: p.method,
          status: p.status
        })));
      } else {
        setPayments([
          {
            id: 'pay_init_default',
            planId: 'FREE',
            planName: 'Free Workspace',
            date: new Date().toLocaleDateString(),
            amount: 0,
            method: 'System Provisioning',
            status: 'SUCCESS'
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch billing history from backend', err);
    }
  }, []);

  useEffect(() => {
    fetchBillingHistory();
  }, [fetchBillingHistory]);

  // Handle Subscribe Button Click
  const handleSubscribe = async (plan: PricingPlan) => {
    setActivePlan(plan);
    setPaymentStep('initializing');
    setProgressMsg('Registering subscription on backend...');
    setPaymentMode('upi');
    setUpiMethod('qr');
    setUpiId('');
    setSelectedBank('');
    setIsProcessingSim(false);
    setShowPinPrompt(false);
    setPinValue('');
    setIsVerifyingUpi(false);
    
    try {
      // Create subscription draft in backend
      const details = await billingService.createSubscription(plan.id);
      setSubDetails({
        subscriptionId: details.subscriptionId,
        paymentId: 'pay_dummy_' + Math.random().toString(36).substring(2, 11)
      });
      setPaymentStep('paying');
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to initialize subscription.');
      setActivePlan(null);
      setPaymentStep('idle');
    }
  };

  const triggerPaymentVerification = React.useCallback(async () => {
    if (!activePlan || !subDetails) return;
    setPaymentStep('verifying');
    
    try {
      // Call backend payment verification with sandbox override signature
      await billingService.verifyPayment(
        subDetails.paymentId,
        subDetails.subscriptionId,
        'dummy_signature'
      );
      
      // Update local storage and auth user plan state
      updateUserPlan(activePlan.id);

      // Fetch latest history from database
      await fetchBillingHistory();

      success(`🎉 Workspace successfully upgraded to ${activePlan.displayName}!`);
      setPaymentStep('success');
    } catch (err: any) {
      error(err.response?.data?.message || 'Payment signature verification failed.');
      setPaymentStep('paying');
    }
  }, [activePlan, subDetails, updateUserPlan, fetchBillingHistory, success, error]);

  // 60-second countdown (fails if timer runs out without user confirming payment)
  useEffect(() => {
    let timerInterval: any;

    if (paymentStep === 'paying' && subDetails?.subscriptionId && !isVerifyingUpi) {
      setCountdown(60);
      setProgressMsg('Awaiting UPI QR code scan from your mobile device...');

      timerInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            setPaymentStep('failed');
            error('Payment session expired or not done.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(timerInterval);
    };
  }, [paymentStep, subDetails, isVerifyingUpi, error]);

  // Handle interactive QR payment PIN verification
  const handleQrPaymentVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinValue || pinValue.length < 4) {
      error('Please enter a valid 4 to 6 digit UPI PIN.');
      return;
    }
    
    setIsVerifyingUpi(true);
    setProgressMsg('Verifying UPI PIN credentials...');
    
    // Simulate a realistic banking delay (3 seconds of rotating/loading)
    let secondsElapsed = 0;
    const simulationInterval = setInterval(() => {
      secondsElapsed += 1;
      if (secondsElapsed === 1) {
        setProgressMsg('Connecting to secure banking network...');
      } else if (secondsElapsed === 2) {
        setProgressMsg('Authorizing account settlement...');
      } else if (secondsElapsed >= 3) {
        clearInterval(simulationInterval);
        
        // Execute the backend verification call
        if (activePlan && subDetails) {
          billingService.verifyPayment(
            subDetails.paymentId,
            subDetails.subscriptionId,
            'dummy_signature'
          ).then(async () => {
            // Update auth context plan
            updateUserPlan(activePlan.id);
            // Fetch updated history
            await fetchBillingHistory();
            success(`🎉 Workspace successfully upgraded to ${activePlan.displayName}!`);
            setPaymentStep('success');
            setIsVerifyingUpi(false);
          }).catch((err) => {
            console.error(err);
            error('Payment authorization failed or not done.');
            setPaymentStep('failed');
            setIsVerifyingUpi(false);
          });
        }
      }
    }, 1000);
  };

  const runSimulatedCheckout = (initialMsg: string, nextMsg: string) => {
    setIsProcessingSim(true);
    setUpiTimer(0);
    setProgressMsg(initialMsg);
    
    let currentTimer = 0;
    const interval = setInterval(() => {
      currentTimer += 1;
      setUpiTimer(currentTimer);
      if (currentTimer === 3) {
        setProgressMsg(nextMsg);
      } else if (currentTimer === 6) {
        clearInterval(interval);
        setIsProcessingSim(false);
        triggerPaymentVerification();
      }
    }, 1000);
  };

  const handleUpiVpaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiId) {
      error('Please enter a valid UPI ID.');
      return;
    }
    runSimulatedCheckout(
      `Resolving UPI Address '${upiId}'...`,
      `Request sent! Approve the transaction notification on your UPI app...`
    );
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCvv || !cardHolder) {
      error('Please fill out all card details.');
      return;
    }
    runSimulatedCheckout(
      'Connecting to card acquiring network...',
      'Verifying OTP credentials and authentication tokens...'
    );
  };

  const handleNetBankingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBank) {
      error('Please select a bank first.');
      return;
    }
    const bank = popularBanks.find(b => b.id === selectedBank);
    runSimulatedCheckout(
      `Redirecting to secure ${bank?.name} login portal...`,
      'Awaiting net banking merchant approval token...'
    );
  };

  // Compile Invoice Receipt File
  const generateInvoiceContent = (planId: string, planName: string, paymentId: string, date: string, amount: number, method: string) => {
    const amountFloat = amount / 100;
    const priceText = amountFloat.toFixed(2);
    const basePrice = (amountFloat / 1.18).toFixed(2);
    const taxValue = (amountFloat - Number(basePrice)).toFixed(2);
    const sgst = (Number(taxValue) / 2).toFixed(2);
    const cgst = (Number(taxValue) / 2).toFixed(2);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice - Sentrix Security</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; background: #fff; line-height: 1.5; }
    .invoice-card { max-w: 700px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 24px; margin-bottom: 24px; }
    .title { font-size: 28px; font-weight: 800; color: #0f172a; tracking-tight: -0.025em; }
    .brand { font-weight: 900; color: #06b6d4; font-size: 24px; }
    .meta-col { text-align: right; font-size: 13px; color: #64748b; }
    .bill-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 24px; margin-bottom: 32px; font-size: 14px; }
    .bill-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; margin-bottom: 8px; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    .table th { background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 12px; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; text-align: left; }
    .table td { border-bottom: 1px solid #f1f5f9; padding: 16px 12px; font-size: 14px; }
    .table-right { text-align: right; }
    .totals-box { margin-left: auto; width: 280px; font-size: 14px; border-top: 2px solid #e2e8f0; padding-top: 16px; }
    .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .total-row.grand { font-size: 16px; font-weight: 800; border-top: 1px solid #f1f5f9; padding-top: 8px; color: #0f172a; }
    .footer { text-align: center; margin-top: 48px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 24px; }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="brand">SENT<span style="color: #6366f1;">RIX</span></div>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">Sovereign Runtime Security</p>
      </div>
      <div class="meta-col">
        <div class="title">INVOICE</div>
        <p style="margin: 4px 0 0 0;">Invoice #: INV-26-${paymentId.replace('pay_dummy_', '').replace('pay_init_', '').toUpperCase()}</p>
        <p style="margin: 2px 0 0 0;">Date: ${date}</p>
      </div>
    </div>

    <div class="bill-grid">
      <div>
        <div class="bill-title">Billed By</div>
        <strong>Sentrix Technologies Private Limited</strong><br>
        102 Security Boulevard, Tech Park<br>
        Bangalore, KA 560001, India<br>
        GSTIN: 29AABCS8493L1Z4
      </div>
      <div>
        <div class="bill-title">Billed To</div>
        <strong>${user?.firstName || 'User'} ${user?.lastName || ''}</strong><br>
        ${user?.organizationName || 'My Workspace'}<br>
        Email: ${user?.email || 'N/A'}<br>
        Workspace ID: ${user?.organizationId || 'N/A'}
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="table-right">Qty</th>
          <th class="table-right">Rate</th>
          <th class="table-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Sentrix ${planName} Upgrade (${planId})</strong><br>
            <span style="font-size: 12px; color: #64748b;">Sovereign policy enforcement, behavioral analysis, and audit log pipelines.</span>
          </td>
          <td class="table-right">1</td>
          <td class="table-right">₹${basePrice}</td>
          <td class="table-right">₹${basePrice}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals-box">
      <div class="total-row">
        <span>Subtotal</span>
        <span>₹${basePrice}</span>
      </div>
      <div class="total-row">
        <span>CGST (9%)</span>
        <span>₹${cgst}</span>
      </div>
      <div class="total-row">
        <span>SGST (9%)</span>
        <span>₹${sgst}</span>
      </div>
      <div class="total-row grand">
        <span>Total Paid</span>
        <span>₹${priceText}</span>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for choosing Sentrix to secure your AI fleet!</p>
      <p style="margin-top: 4px;">Payment Method: ${method}</p>
    </div>
  </div>
</body>
</html>
    `;
  };

  const handleDownloadInvoice = () => {
    if (!activePlan || !subDetails || !user) return;
    triggerDownload(activePlan.id, activePlan.displayName, subDetails.paymentId, new Date().toLocaleDateString(), activePlan.priceMonthly, paymentMode === 'upi' ? 'UPI' : 'Card');
  };

  const triggerDownload = (planId: string, planName: string, paymentId: string, date: string, amount: number, method: string) => {
    const html = generateInvoiceContent(planId, planName, paymentId, date, amount, method);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_Sentrix_${planId}_${paymentId}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'PRO':
        return <Sparkles className="w-5 h-5 text-violet-400" />;
      case 'ENTERPRISE':
        return <Crown className="w-5 h-5 text-amber-400" />;
      default:
        return <Zap className="w-5 h-5 text-cyan-400" />;
    }
  };

  // UPI payment QR URI (used in QR code generation)
  const _upiPaymentUri = activePlan
    ? `upi://pay?pa=dummy-sentrix@icici&pn=Sentrix%20Sovereign%20IAM&am=${(activePlan.priceMonthly / 100).toFixed(2)}&cu=INR&tn=Sentrix%20Plan%20Upgrade`
    : '';
  void _upiPaymentUri; // intentionally retained for future QR deep-link use

  // Subscription Details & Usage Computations
  const daysTotal = 30;
  const daysLeft = user?.plan === 'FREE' ? 7 : 28;
  const strokeDashoffset = 251.2 - (251.2 * daysLeft) / daysTotal;

  // Token limits computation based on plan
  let apiLimitText = '10,000';
  let apiLimitVal = 10000;
  let apiUsed = 4210;
  let modelName = 'Llama-3-8B-Instruct (Default)';
  let paymentMethodName = 'Free Workspace';

  if (user?.plan === 'PRO') {
    apiLimitText = '500,000';
    apiLimitVal = 500000;
    apiUsed = 125482;
    modelName = 'GPT-4o & Claude 3.5 Sonnet';
    paymentMethodName = 'UPI Paytm';
  } else if (user?.plan === 'ENTERPRISE') {
    apiLimitText = 'Unlimited';
    apiLimitVal = 999999999;
    apiUsed = 2481092;
    modelName = 'Custom Fine-tuned LLMs & GPT-4o';
    paymentMethodName = 'Corporate Invoice / ACH';
  }

  return (
    <div className="space-y-8 relative">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight m-0 mb-1">
          Plans & Subscriptions
        </h1>
        <p className="text-[var(--text-secondary)] m-0">
          Scale your execution limits, audit retention policies, and machine learning threat baselines.
        </p>
      </div>

      {/* Subscription usage widget & payment history grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Usage Widget Box (SVG Circle) */}
        <div className="glass p-6 rounded-xl border border-[var(--card-border)] bg-[var(--bg-secondary)] flex flex-col justify-between space-y-6">
          <div>
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>Active Subscription</span>
            </span>
            <h3 className="text-lg font-bold text-[var(--text-primary)] m-0">
              {user?.plan === 'FREE' ? 'Free Workspace' : user?.plan === 'PRO' ? 'Sentrix Pro' : 'Sentrix Enterprise'}
            </h3>
          </div>

          <div className="flex items-center gap-6">
            {/* SVG Circle widget */}
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  className="stroke-slate-800"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  className="stroke-cyan-400 transition-all duration-1000"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-extrabold text-[var(--text-primary)] leading-none">{daysLeft}</span>
                <span className="text-[8px] text-[var(--text-secondary)] uppercase mt-0.5 font-bold">Days Left</span>
              </div>
            </div>

            {/* Model & Payment Summary */}
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[9px] uppercase text-[var(--text-muted)] block tracking-wider">Governed Model</span>
                <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  <span className="truncate max-w-[150px]">{modelName}</span>
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-[var(--text-muted)] block tracking-wider">Billing Type</span>
                <span className="font-semibold text-[var(--text-primary)]">{paymentMethodName}</span>
              </div>
            </div>
          </div>

          {/* Token usage progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-[var(--text-secondary)]">Token/API Credit Usage</span>
              <span className="text-[var(--text-primary)]">
                {apiUsed.toLocaleString()} / {apiLimitText}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 rounded-full"
                style={{ width: `${Math.min((apiUsed / apiLimitVal) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Payment History List Log */}
        <div className="glass p-6 rounded-xl border border-[var(--card-border)] bg-[var(--bg-secondary)] lg:col-span-2 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              <span>Payment & Upgrades History</span>
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              {payments.length} Transaction{payments.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[160px] space-y-2.5 pr-2">
            {payments.map((rec) => (
              <div 
                key={rec.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--card-border)] text-xs hover:border-cyan-500/20 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--bg-primary)]">
                    {getPlanIcon(rec.planId)}
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--text-primary)] m-0">{rec.planName}</h4>
                    <span className="text-[10px] text-[var(--text-secondary)] block mt-0.5">
                      {rec.date} • {rec.method}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="font-extrabold text-[var(--text-primary)] block">
                      {rec.amount === 0 ? '₹0' : `₹${(rec.amount / 100).toLocaleString()}`}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {rec.status}
                    </span>
                  </div>
                  
                  {/* Download Invoice Button */}
                  <button
                    onClick={() => triggerDownload(rec.planId, rec.planName, rec.id, rec.date, rec.amount, rec.method)}
                    className="p-2 rounded-lg border border-[var(--card-border)] hover:bg-[var(--card-bg-hover)] text-cyan-400 hover:text-cyan-300 transition-all cursor-pointer"
                    title="Download Receipt Invoice"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Plans List */}
      <div>
        <h3 className="text-base font-bold text-[var(--text-primary)] uppercase tracking-wider m-0 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-400" />
          <span>Available Plans</span>
        </h3>
        
        {plansLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass h-[400px] shimmer rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const isCurrent = user?.plan === plan.id;
              
              return (
                <div 
                  key={plan.id} 
                  className={`glass p-8 rounded-xl border relative flex flex-col justify-between h-[450px] shadow-lg transition-all ${
                    plan.recommended 
                      ? 'border-cyan-400/40 bg-cyan-400/[0.02] border-glow' 
                      : 'border-[var(--card-border)]'
                  }`}
                >
                  {/* Recommended Badge */}
                  {plan.recommended && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-full text-[10px] font-extrabold text-white tracking-wider">
                      RECOMMENDED
                    </span>
                  )}

                  <div className="space-y-4">
                    {/* Plan Meta */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getPlanIcon(plan.id)}
                        <h3 className="text-base font-bold text-[var(--text-primary)] m-0">
                          {plan.displayName}
                        </h3>
                      </div>
                    </div>

                    {/* Price */}
                    <div>
                      <span className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
                        {plan.priceMonthly === 0 ? '₹0' : `₹${(plan.priceMonthly / 100).toLocaleString()}`}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]"> / month</span>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-2 p-0 m-0 list-none">
                      {plan.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2 text-xs">
                          <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${feature.included ? 'text-cyan-400' : 'text-slate-600'}`} />
                          <span className={feature.included ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] line-through'}>
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Call-to-action Button */}
                  <button
                    onClick={() => handleSubscribe(plan as PricingPlan)}
                    disabled={isCurrent || plan.id === 'FREE'}
                    className={`w-full mt-4 py-2.5 px-4 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isCurrent 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default' 
                        : plan.id === 'FREE'
                        ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20 cursor-default'
                        : 'bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    {isCurrent ? (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>YOUR CURRENT PLAN</span>
                      </>
                    ) : plan.id === 'FREE' ? (
                      <span>DEFAULT SETTING</span>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>UPGRADE WORKSPACE</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CUSTOM CHECKOUT MODAL */}
      {activePlan && paymentStep !== 'idle' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass w-full max-w-lg rounded-xl border border-[var(--card-border)] bg-[var(--bg-secondary)] overflow-hidden shadow-2xl flex flex-col relative animate-fade-in">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--card-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-[var(--text-primary)] m-0">
                  Sentrix Premium Gateway
                </h3>
              </div>
              {paymentStep !== 'verifying' && paymentStep !== 'success' && (
                <button
                  onClick={() => {
                    setActivePlan(null);
                    setPaymentStep('idle');
                  }}
                  className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg-hover)] cursor-pointer focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Modal Content */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              
              {/* Plan Box */}
              <div className="flex justify-between items-center p-4 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--card-border)]">
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)] m-0">
                    {activePlan.displayName} Plan Upgrade
                  </h4>
                  <span className="text-[10px] text-[var(--text-secondary)] uppercase">
                    1 Month billing period
                  </span>
                </div>
                <span className="text-lg font-extrabold text-[var(--text-primary)]">
                  ₹{(activePlan.priceMonthly / 100).toLocaleString()}
                </span>
              </div>

              {paymentStep === 'initializing' && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                  <span className="text-sm text-[var(--text-secondary)]">{progressMsg}</span>
                </div>
              )}

              {paymentStep === 'paying' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Mode Tabs */}
                  <div className="flex gap-4 border-b border-[var(--card-border)] pb-2">
                    <button
                      onClick={() => { setPaymentMode('upi'); setIsProcessingSim(false); }}
                      className={`pb-2 text-xs font-semibold flex items-center gap-1.5 focus:outline-none cursor-pointer ${
                        paymentMode === 'upi'
                          ? 'text-cyan-400 border-b-2 border-cyan-400'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      <span>UPI Options</span>
                    </button>
                    <button
                      onClick={() => { setPaymentMode('card'); setIsProcessingSim(false); }}
                      className={`pb-2 text-xs font-semibold flex items-center gap-1.5 focus:outline-none cursor-pointer ${
                        paymentMode === 'card'
                          ? 'text-cyan-400 border-b-2 border-cyan-400'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Credit/Debit Card</span>
                    </button>
                    <button
                      onClick={() => { setPaymentMode('netbanking'); setIsProcessingSim(false); }}
                      className={`pb-2 text-xs font-semibold flex items-center gap-1.5 focus:outline-none cursor-pointer ${
                        paymentMode === 'netbanking'
                          ? 'text-cyan-400 border-b-2 border-cyan-400'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      <Building className="w-4 h-4" />
                      <span>Net Banking</span>
                    </button>
                  </div>

                  {/* UPI MODE */}
                  {paymentMode === 'upi' && (
                    <div className="space-y-4">
                      {/* Sub-toggle: QR vs VPA */}
                      {!isProcessingSim && (
                        <div className="flex bg-[var(--bg-tertiary)] p-1 rounded-lg border border-[var(--card-border)] gap-2">
                          <button
                            type="button"
                            onClick={() => setUpiMethod('qr')}
                            className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                              upiMethod === 'qr'
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                : 'text-[var(--text-secondary)] border border-transparent'
                            }`}
                          >
                            Scan QR Code
                          </button>
                          <button
                            type="button"
                            onClick={() => setUpiMethod('vpa')}
                            className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                              upiMethod === 'vpa'
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                : 'text-[var(--text-secondary)] border border-transparent'
                            }`}
                          >
                            Pay via UPI ID
                          </button>
                        </div>
                      )}

                      {/* UPI QR Method */}
                      {upiMethod === 'qr' && (
                        <div className="flex flex-col items-center space-y-4 py-2 w-full animate-fade-in">
                          {isVerifyingUpi ? (
                            // Rotating loading state
                            <div className="flex flex-col items-center justify-center py-8 space-y-4 w-full animate-fade-in">
                              <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
                              <span className="text-sm font-semibold text-[var(--text-primary)] text-center">
                                {progressMsg}
                              </span>
                              <p className="text-xs text-[var(--text-secondary)]">Checking transaction completion status...</p>
                            </div>
                          ) : showPinPrompt ? (
                            // PIN entry screen
                            <form onSubmit={handleQrPaymentVerify} className="space-y-4 w-full max-w-xs animate-fade-in">
                              <div className="text-center space-y-2">
                                <h4 className="text-sm font-bold text-[var(--text-primary)] m-0">Enter UPI PIN</h4>
                                <p className="text-xs text-[var(--text-secondary)] m-0">Please type your secure 4-digit or 6-digit banking pin to complete payment authorization.</p>
                              </div>
                              
                              <div className="space-y-2">
                                <input
                                  type="password"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  maxLength={6}
                                  placeholder="••••"
                                  value={pinValue}
                                  onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ''))}
                                  className="w-full bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-lg px-3 py-3 text-center text-lg font-extrabold text-[var(--text-primary)] tracking-widest focus:outline-none focus:border-cyan-400/50 placeholder:text-slate-700"
                                  autoFocus
                                />
                              </div>

                              <div className="flex gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowPinPrompt(false);
                                    setPinValue('');
                                  }}
                                  className="flex-1 py-2 px-3 rounded-lg border border-[var(--card-border)] hover:bg-[var(--card-bg-hover)] text-[var(--text-secondary)] text-xs font-semibold transition-all cursor-pointer"
                                >
                                  Back
                                </button>
                                <button
                                  type="submit"
                                  className="flex-[2] py-2 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white text-xs font-bold transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                                >
                                  Submit PIN
                                </button>
                              </div>
                            </form>
                          ) : (
                            // Main QR scan screen
                            <div className="flex flex-col items-center space-y-4 w-full animate-fade-in">
                              <p className="text-center text-xs text-[var(--text-secondary)] max-w-sm m-0">
                                Scan this QR code using any UPI app (GPay, PhonePe, Paytm, BHIM) to authorize the simulated upgrade.
                              </p>
                              
                              <div className="p-3 bg-white rounded-xl shadow-lg border border-slate-200">
                                <img 
                                  src="/upi_payment_qr.jpg"
                                  alt="UPI Payment QR Code"
                                  className="w-[180px] h-[180px] object-contain"
                                />
                              </div>

                              {/* Countdown Timer */}
                              <div className="flex items-center gap-3 bg-[var(--bg-tertiary)] px-4 py-2 rounded-full border border-[var(--card-border)] shadow-sm">
                                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                                <span className="text-xs font-bold text-cyan-400">
                                  {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                                </span>
                                <span className="text-[9px] text-[var(--text-secondary)] uppercase font-bold tracking-wider">Remaining</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => setShowPinPrompt(true)}
                                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white text-xs font-bold transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                              >
                                <QrCode className="w-4 h-4" />
                                <span>Confirm Payment (Enter PIN)</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* UPI VPA Method */}
                      {upiMethod === 'vpa' && (
                        <div className="space-y-4">
                          {isProcessingSim ? (
                            <div className="flex flex-col items-center justify-center py-6 space-y-4">
                              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                              <span className="text-xs font-semibold text-[var(--text-primary)] text-center">
                                {progressMsg}
                              </span>
                              <div className="w-full h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-1000"
                                  style={{ width: `${Math.min((upiTimer / 6) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <form onSubmit={handleUpiVpaSubmit} className="space-y-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Virtual Payment Address (UPI ID)</label>
                                <input
                                  type="text"
                                  placeholder="username@okhdfcbank"
                                  value={upiId}
                                  onChange={(e) => setUpiId(e.target.value)}
                                  className="w-full bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-cyan-400/50 placeholder:text-slate-600"
                                />
                              </div>
                              <button
                                type="submit"
                                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white text-xs font-bold transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                              >
                                Send Payment Request
                              </button>
                            </form>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* CARD MODE */}
                  {paymentMode === 'card' && (
                    <div className="space-y-4">
                      {isProcessingSim ? (
                        <div className="flex flex-col items-center justify-center py-6 space-y-4">
                          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                          <span className="text-xs font-semibold text-[var(--text-primary)] text-center">
                            {progressMsg}
                          </span>
                          <div className="w-full h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-1000"
                              style={{ width: `${Math.min((upiTimer / 6) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleCardSubmit} className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Cardholder Name</label>
                            <input
                              type="text"
                              placeholder="John Doe"
                              value={cardHolder}
                              onChange={(e) => setCardHolder(e.target.value)}
                              className="w-full bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-cyan-400/50 placeholder:text-slate-600"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Card Number</label>
                            <input
                              type="text"
                              placeholder="4111 2222 3333 4444"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                              className="w-full bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-cyan-400/50 placeholder:text-slate-600"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Expiry</label>
                              <input
                                type="text"
                                placeholder="MM/YY"
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(e.target.value)}
                                className="w-full bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-cyan-400/50 placeholder:text-slate-600"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">CVV</label>
                              <input
                                type="password"
                                placeholder="123"
                                value={cardCvv}
                                onChange={(e) => setCardCvv(e.target.value)}
                                className="w-full bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-cyan-400/50 placeholder:text-slate-600"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white text-xs font-bold transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                          >
                            Authorize Card Transaction
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  {/* NET BANKING MODE */}
                  {paymentMode === 'netbanking' && (
                    <div className="space-y-4">
                      {isProcessingSim ? (
                        <div className="flex flex-col items-center justify-center py-6 space-y-4">
                          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                          <span className="text-xs font-semibold text-[var(--text-primary)] text-center">
                            {progressMsg}
                          </span>
                          <div className="w-full h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-1000"
                              style={{ width: `${Math.min((upiTimer / 6) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={handleNetBankingSubmit} className="space-y-4">
                          <p className="text-xs text-[var(--text-secondary)] m-0">Select your bank from the options below:</p>
                          <div className="grid grid-cols-2 gap-3">
                            {popularBanks.map((bank) => (
                              <button
                                key={bank.id}
                                type="button"
                                onClick={() => setSelectedBank(bank.id)}
                                className={`p-3 rounded-lg border text-left text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                                  selectedBank === bank.id
                                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/50 shadow-md shadow-cyan-500/5'
                                    : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--card-border)] hover:bg-[var(--card-bg-hover)]'
                                }`}
                              >
                                <Building className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{bank.name}</span>
                              </button>
                            ))}
                          </div>
                          <button
                            type="submit"
                            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white text-xs font-bold transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                          >
                            Pay securely via Net Banking
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}

              {paymentStep === 'verifying' && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                  <span className="text-sm text-[var(--text-secondary)]">Verifying payment records on server...</span>
                </div>
              )}

              {paymentStep === 'success' && (
                <div className="flex flex-col items-center space-y-6 py-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                    <Check className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] m-0 mb-1">
                      Upgrade Successful!
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] max-w-sm m-0">
                      Your workspace plan has been upgraded to <strong className="text-cyan-400">{activePlan.displayName}</strong>. Execution limits and retention policies are now active.
                    </p>
                  </div>

                  {subDetails && (
                    <div className="w-full p-4 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--card-border)] text-left text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Transaction ID</span>
                        <span className="font-mono text-[var(--text-primary)]">{subDetails.paymentId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Subscription ID</span>
                        <span className="font-mono text-[var(--text-primary)]">{subDetails.subscriptionId}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 w-full pt-2">
                    <button
                      onClick={handleDownloadInvoice}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-cyan-500/10"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Receipt Invoice</span>
                    </button>
                    <button
                      onClick={() => {
                        setActivePlan(null);
                        setPaymentStep('idle');
                      }}
                      className="flex-1 py-3 px-4 rounded-lg border border-[var(--card-border)] hover:bg-[var(--card-bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold transition-all cursor-pointer"
                    >
                      Close Gateway
                    </button>
                  </div>
                </div>
              )}

              {paymentStep === 'failed' && (
                <div className="flex flex-col items-center space-y-6 py-6 text-center animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shadow-lg shadow-red-500/10">
                    <XCircle className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] m-0 mb-1">
                      Upgrade Failed
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] max-w-sm m-0">
                      Payment verification failed or timed out. Please ensure the payment was completed in your UPI app and try again.
                    </p>
                  </div>

                  {subDetails && (
                    <div className="w-full p-4 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--card-border)] text-left text-xs space-y-1.5 font-mono">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Subscription ID</span>
                        <span className="text-[var(--text-primary)]">{subDetails.subscriptionId}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 w-full pt-2">
                    <button
                      onClick={() => {
                        setPaymentStep('paying');
                        setCountdown(60);
                      }}
                      className="flex-1 py-3 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-cyan-500/10"
                    >
                      Retry Payment
                    </button>
                    <button
                      onClick={() => {
                        setActivePlan(null);
                        setPaymentStep('idle');
                      }}
                      className="flex-1 py-3 px-4 rounded-lg border border-[var(--card-border)] hover:bg-[var(--card-bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold transition-all cursor-pointer"
                    >
                      Cancel & Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
