import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Activity, 
  Terminal, 
  Wifi, 
  WifiOff, 
  Clock,
  Lock
} from 'lucide-react';

interface LiveEvent {
  type: string;
  agentId?: string;
  agentName?: string;
  action: string;
  resource: string;
  outcome: string; // ALLOWED, DENIED, CHALLENGED
  riskScore?: number;
  reason?: string;
  timestamp: string;
}

export const MonitorPage: React.FC = () => {
  const { connected, subscribe } = useWebSocket();
  const { user } = useAuth();
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ALLOWED' | 'DENIED' | 'ANOMALY'>('ALL');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subscribe to STOMP broadcast topic
    const unsubscribe = subscribe('/topic/events', (newEvent: LiveEvent) => {
      setEvents((prev) => [newEvent, ...prev].slice(0, 100)); // Keep last 100 events
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe]);

  const filteredEvents = events.filter((e) => {
    if (filter === 'ALL') return true;
    if (filter === 'ALLOWED') return e.outcome === 'ALLOWED';
    if (filter === 'DENIED') return e.outcome === 'DENIED';
    if (filter === 'ANOMALY') return (e.riskScore ?? 0) >= 0.7 || e.type === 'ANOMALY';
    return true;
  });

  const getDecisionStyles = (decision: string) => {
    switch (decision) {
      case 'DENIED':
        return 'text-red-400 bg-red-500/10 border border-red-500/20';
      case 'CHALLENGED':
        return 'text-amber-400 bg-amber-500/10 border border-amber-500/20';
      default:
        return 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20';
    }
  };

  if (user?.plan === 'FREE') {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="max-w-md w-full glass p-8 rounded-2xl border border-[var(--card-border)] bg-[var(--bg-secondary)] text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/10 animate-pulse">
            <Lock className="w-9 h-9" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Real-time Feed Locked</h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Live threat event streaming via STOMP WebSockets is exclusive to Pro and Enterprise tiers. Upgrade to get instant request interceptions.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/billing"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold text-sm shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              Upgrade Workspace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight m-0 mb-1">
            Real-time Threat Monitor
          </h1>
          <p className="text-[var(--text-secondary)] m-0">
            Live stream of agent authorization requests, policy evaluations, and risk anomalies.
          </p>
        </div>

        {/* Connection Status Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
          connected 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {connected ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span>LIVE FEED ACTIVE</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>DISCONNECTED</span>
            </>
          )}
        </div>
      </div>

      {/* Control Filters */}
      <div className="flex gap-2">
        {(['ALL', 'ALLOWED', 'DENIED', 'ANOMALY'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              filter === f 
                ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white' 
                : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg-hover)]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Monitor Terminal */}
      <div className="glass rounded-xl border border-[var(--card-border)] bg-[var(--bg-secondary)] shadow-2xl overflow-hidden flex flex-col h-[550px]">
        {/* Terminal Header */}
        <div className="px-6 py-3 bg-[var(--bg-tertiary)] border-b border-[var(--card-border)] flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] shrink-0">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="font-mono uppercase tracking-wider">sentrix-audit-listener.log</span>
        </div>

        {/* Terminal logs list */}
        <div className="flex-1 overflow-y-auto p-6 font-mono text-xs space-y-4" ref={scrollRef}>
          {filteredEvents.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] space-y-2">
              <Activity className="w-8 h-8 animate-pulse text-slate-700" />
              <p>Awaiting live security logs stream...</p>
            </div>
          ) : (
            filteredEvents.map((e, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-[var(--bg-primary)] border border-[var(--card-border)] flex items-start gap-4 hover:opacity-95 transition-all duration-150">
                <span className="text-[var(--text-muted)] shrink-0 pt-0.5 select-none flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(e.timestamp).toLocaleTimeString()}
                </span>

                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[var(--text-primary)] font-bold">{e.agentName ?? 'SYSTEM'}</span>
                    <span className="text-[var(--text-muted)]">requested</span>
                    <span className="text-cyan-400 font-semibold">{e.action}</span>
                    <span className="text-[var(--text-muted)]">on</span>
                    <span className="text-violet-400 font-semibold truncate max-w-xs" title={e.resource}>{e.resource}</span>
                  </div>

                  {e.reason && (
                    <p className="text-[var(--text-secondary)] m-0 leading-normal">
                      Reason: {e.reason}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {e.riskScore !== undefined && (
                    <div className="text-right">
                      <span className={`font-bold ${e.riskScore >= 0.7 ? 'text-red-400' : e.riskScore >= 0.3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        Risk: {(e.riskScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                  <span className={`px-2.5 py-1 rounded text-[10px] font-extrabold tracking-wider ${getDecisionStyles(e.outcome)}`}>
                    {e.outcome}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
