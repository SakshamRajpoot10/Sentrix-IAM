import React, { useEffect, useState } from 'react';
import { analyticsService } from '../services/analytics';
import type { DashboardMetrics } from '../services/analytics';
import { 
  Bot, 
  Lock, 
  Activity, 
  ShieldAlert, 
  Cpu 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await analyticsService.getDashboard();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    };
    loadMetrics();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass p-6 rounded-xl h-32 shimmer" />
        ))}
      </div>
    );
  }

  // Simulated chart data
  const activityData = [
    { name: '00:00', allowed: 120, denied: 4 },
    { name: '04:00', allowed: 180, denied: 1 },
    { name: '08:00', allowed: 340, denied: 12 },
    { name: '12:00', allowed: 490, denied: 18 },
    { name: '16:00', allowed: 410, denied: 9 },
    { name: '20:00', allowed: 290, denied: 3 },
  ];

  const riskData = [
    { name: 'Low Risk (<0.3)', value: metrics.activeAgents },
    { name: 'Medium Risk (0.3-0.7)', value: metrics.suspendedAgents },
    { name: 'High Risk (>0.7)', value: metrics.suspendedAgents > 0 ? 1 : 0 },
  ];

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  const statCards = [
    {
      title: 'Active Agents',
      value: `${metrics.activeAgents} / ${metrics.totalAgents}`,
      description: 'Fully authenticated & running',
      icon: Bot,
      color: 'text-cyan-400 bg-cyan-500/10',
    },
    {
      title: 'Active Policies',
      value: metrics.totalPolicies,
      description: 'Enforcing runtime rule sets',
      icon: Lock,
      color: 'text-violet-400 bg-violet-500/10',
    },
    {
      title: 'Recent Activity',
      value: metrics.recentAuditLogs,
      description: 'Evaluation actions in last 24h',
      icon: Activity,
      color: 'text-emerald-400 bg-emerald-500/10',
    },
    {
      title: 'Average Risk',
      value: `${(metrics.avgRiskScore * 100).toFixed(1)}%`,
      description: 'System-wide anomaly index',
      icon: ShieldAlert,
      color: 'text-rose-400 bg-rose-500/10',
    },
  ];

  const usagePercent = Math.min(100, (metrics.apiCallsToday / metrics.apiCallLimit) * 100);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight m-0 mb-1">
          Security Console
        </h1>
        <p className="text-[var(--text-secondary)] m-0">
          Real-time tracking, policy enforcement, and threat analysis for autonomous systems.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="glass glass-hover p-6 rounded-xl flex items-center justify-between border border-[var(--card-border)] shadow-md">
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider m-0 mb-1.5">
                {card.title}
              </p>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] m-0 tracking-tight leading-none mb-1">
                {card.value}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] m-0">
                {card.description}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${card.color}`}>
              <card.icon className="w-5 h-5 shrink-0" />
            </div>
          </div>
        ))}
      </div>

      {/* Plan Limits & Progress */}
      <div className="glass p-6 rounded-xl border border-[var(--card-border)]">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider m-0">
              Monthly API Calls quota
            </h3>
          </div>
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            {metrics.apiCallsToday.toLocaleString()} / {metrics.apiCallLimit.toLocaleString()} ({usagePercent.toFixed(1)}%)
          </span>
        </div>
        <div className="w-full bg-[var(--bg-primary)] rounded-full h-2 overflow-hidden border border-[var(--card-border)]">
          <div 
            className="bg-gradient-to-r from-cyan-400 to-violet-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${usagePercent}%` }}
          />
        </div>
      </div>

      {/* Grid of Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <div className="glass p-6 rounded-xl border border-[var(--card-border)] lg:col-span-2">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider m-0 mb-6">
            Agent Actions Timeline
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorAllowed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDenied" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="allowed" name="Allowed Actions" stroke="#06b6d4" fillOpacity={1} fill="url(#colorAllowed)" />
                <Area type="monotone" dataKey="denied" name="Violations/Blocked" stroke="#ef4444" fillOpacity={1} fill="url(#colorDenied)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Chart */}
        <div className="glass p-6 rounded-xl border border-[var(--card-border)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider m-0 mb-6">
            Threat & Risk Indexes
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                />
                <Bar dataKey="value" name="Total Agents" radius={[4, 4, 0, 0]}>
                  {riskData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
