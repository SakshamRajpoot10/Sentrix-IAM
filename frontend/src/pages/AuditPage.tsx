import React, { useEffect, useState } from 'react';
import { auditService } from '../services/audit';
import type { AuditLog, VerificationResult } from '../services/audit';
import { agentService } from '../services/agents';
import type { Agent } from '../services/agents';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  FileCheck, 
  ShieldCheck, 
  ShieldAlert, 
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Download
} from 'lucide-react';

export const AuditPage: React.FC = () => {
  const { success, error, warning, info } = useNotification();
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  const fetchLogs = React.useCallback(async () => {
    try {
      const data = await auditService.list(selectedAgent || undefined);
      setLogs(data.content);
    } catch {
      error('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  }, [selectedAgent, error]);

  const fetchAgents = React.useCallback(async () => {
    try {
      const data = await agentService.list();
      setAgents(data.content);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleVerifyChain = async () => {
    setVerifying(true);
    setVerificationResult(null);
    info('Running cryptographic verification on entire hash chain...');
    try {
      const result = await auditService.verifyChain();
      setVerificationResult(result);
      if (result.verified) {
        success('Verification complete: Cryptographic chain intact!');
      } else {
        error('Warning: Integrity violation detected in chain!');
      }
    } catch {
      error('Verification check failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handleExportCSV = () => {
    if (user?.plan === 'FREE') {
      warning('CSV Export is locked for Free accounts. Please upgrade to Pro or Enterprise.');
      return;
    }
    
    // Generate CSV contents
    const headers = 'ID,Timestamp,Agent,Action,Resource,Decision,Hash\n';
    const rows = logs.map(log => 
      `"${log.id}","${new Date(log.createdAt).toLocaleString()}","${log.agentName ?? 'SYSTEM'}","${log.action}","${log.resource}","${log.decision}","${log.hash}"`
    ).join('\n');
    
    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sentrix_Audit_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    success('Audit logs exported successfully!');
  };

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'DENIED':
        return (
          <span className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-extrabold bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="w-3.5 h-3.5" />
            <span>DENIED</span>
          </span>
        );
      case 'CHALLENGED':
        return (
          <span className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>CHALLENGED</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>ALLOWED</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight m-0 mb-1">
            Audit Ledger
          </h1>
          <p className="text-[var(--text-secondary)] m-0">
            Tamper-proof, cryptographically chained execution records protecting model actions and access logs.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--card-border)] hover:bg-[var(--card-bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleVerifyChain}
            disabled={verifying}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-lg shadow-cyan-500/10 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{verifying ? 'Verifying Ledger...' : 'Verify Ledger Integrity'}</span>
          </button>
        </div>
      </div>

      {/* Verification Result Display */}
      {verificationResult && (
        <div className={`glass p-6 rounded-xl border animate-fade-in ${
          verificationResult.verified ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-red-500/25 bg-red-500/5'
        } space-y-2`}>
          <div className="flex items-center gap-3">
            {verificationResult.verified ? (
              <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />
            )}
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] m-0">
                {verificationResult.message}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] m-0 mt-0.5">
                Total blocks verified: {verificationResult.totalEntries} | Valid: {verificationResult.validEntries} | Compromised: {verificationResult.invalidEntries}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex gap-4 items-center bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-xl p-4">
        <Filter className="w-4 h-4 text-[var(--text-secondary)]" />
        <select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          className="bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-xs focus:outline-none focus:border-cyan-400/50"
        >
          <option value="">All Agents</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass p-6 rounded-xl h-16 shimmer" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="glass p-12 rounded-xl border border-[var(--card-border)] text-center space-y-3">
          <FileCheck className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-[var(--text-primary)] m-0">No Audit Logs</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto m-0">
            No events have been logged yet. Authenticate an agent through the SDK to populate the ledger.
          </p>
        </div>
      ) : (
        <div className="glass rounded-xl border border-[var(--card-border)] overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--card-border)] bg-[var(--bg-tertiary)]">
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Agent</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Request Block</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Outcome</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Verification Block Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)] bg-[var(--bg-secondary)] font-mono text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                    <td className="px-6 py-4 font-sans text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-sans text-[var(--text-primary)] font-semibold">{log.agentName ?? 'SYSTEM'}</td>
                    <td className="px-6 py-4">
                      <span className="text-cyan-400 font-bold">{log.action}</span>
                      <span className="text-[var(--text-secondary)]"> on </span>
                      <span className="text-violet-400 truncate max-w-xs block font-semibold">{log.resource}</span>
                    </td>
                    <td className="px-6 py-4">{getDecisionBadge(log.decision)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5 text-[10px] text-[var(--text-muted)]">
                        <span className="truncate max-w-[120px] select-all hover:text-[var(--text-primary)]" title={log.hash}>Curr: {log.hash.substring(0, 16)}...</span>
                        <span className="truncate max-w-[120px] select-all" title={log.previousHash}>Prev: {log.previousHash.substring(0, 16)}...</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
