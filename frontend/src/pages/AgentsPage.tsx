import React, { useEffect, useState } from 'react';
import { agentService } from '../services/agents';
import type { Agent, AgentCreatedResponse } from '../services/agents';
import { useNotification } from '../contexts/NotificationContext';
import { 
  Bot, 
  Plus, 
  Copy, 
  Check, 
  ShieldAlert, 
  Trash2,
  Power,
  X
} from 'lucide-react';

export const AgentsPage: React.FC = () => {
  const { success, error, warning, info } = useNotification();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('AUTONOMOUS');
  const [maxActions, setMaxActions] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  
  // Plaintext API Key display state (shown once)
  const [createdKeyDetails, setCreatedKeyDetails] = useState<AgentCreatedResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchAgents = React.useCallback(async () => {
    try {
      const data = await agentService.list();
      setAgents(data.content);
    } catch {
      error('Failed to load agents list.');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setSubmitting(true);
    try {
      const data = await agentService.create({
        name,
        description,
        type,
        maxActionsPerMinute: maxActions,
      });
      success(`Agent '${name}' registered successfully.`);
      setCreatedKeyDetails(data);
      setName('');
      setDescription('');
      setType('AUTONOMOUS');
      setMaxActions(60);
      setIsModalOpen(false);
      fetchAgents();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create agent.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    success('API Key copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    info('Updating agent state...');
    try {
      if (currentStatus === 'ACTIVE') {
        await agentService.suspend(id);
        warning('Agent suspended. All sessions revoked.');
      } else {
        await agentService.activate(id);
        success('Agent activated and risk index reset.');
      }
      fetchAgents();
    } catch {
      error('Failed to toggle agent status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to decommission this agent? This action is permanent.')) return;
    try {
      await agentService.delete(id);
      success('Agent decommissioned.');
      fetchAgents();
    } catch {
      error('Failed to decommission agent.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight m-0 mb-1">
            Agents Identity Management
          </h1>
          <p className="text-[var(--text-secondary)] m-0">
            Register and manage cryptographic identities, API keys, and session lifecycles for your AI models.
          </p>
        </div>
        <button
          onClick={() => { setCreatedKeyDetails(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-lg shadow-cyan-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Register Agent</span>
        </button>
      </div>

      {/* API Key Modal (Shown immediately after creation) */}
      {createdKeyDetails && (
        <div className="glass p-6 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-4 animate-fade-in border-glow">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] m-0 mb-1">
                ⚠️ Secure Your Agent API Key
              </h3>
              <p className="text-sm text-[var(--text-secondary)] m-0">
                This API key is shown only **ONCE** at registration time. Save it securely. If lost, you must regenerate it, which invalidates all active sessions.
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <div className="flex-1 bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-lg px-4 py-3 font-mono text-cyan-400 select-all overflow-x-auto text-sm">
              {createdKeyDetails.apiKey}
            </div>
            <button
              onClick={() => handleCopy(createdKeyDetails.apiKey)}
              className="p-3 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 rounded-lg text-white font-semibold flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all"
              title="Copy API Key"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="flex justify-end mt-2">
            <button
              onClick={() => setCreatedKeyDetails(null)}
              className="px-4 py-2 border border-[var(--card-border)] rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg-hover)] transition-all duration-200 cursor-pointer"
            >
              I have saved the key
            </button>
          </div>
        </div>
      )}

      {/* Agents List / Loader */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass p-6 rounded-xl h-24 shimmer" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="glass p-12 rounded-xl border border-[var(--card-border)] text-center space-y-3">
          <Bot className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-[var(--text-primary)] m-0">No Agents Registered</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto m-0">
            Register your first autonomous agent or tool integration to start enforcing security policies.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div key={agent.id} className="glass p-6 rounded-xl border border-[var(--card-border)] space-y-4 shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-tr from-cyan-400/10 to-violet-500/10 border border-cyan-400/20 rounded-lg text-cyan-400">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)] m-0 mb-0.5">
                      {agent.name}
                    </h3>
                    <span className="text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                      ID: {agent.id.substring(0, 8)}... | Prefix: {agent.apiKeyPrefix}
                    </span>
                  </div>
                </div>

                {/* Status Dot */}
                <span className={`w-2.5 h-2.5 rounded-full ${agent.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              </div>

              {agent.description && (
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                  {agent.description}
                </p>
              )}

              {/* Stats & Metadata */}
              <div className="grid grid-cols-2 gap-4 py-2 border-y border-[var(--card-border)] text-xs text-[var(--text-secondary)]">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] m-0 mb-1">
                    Risk score
                  </p>
                  <span className={`font-bold ${agent.riskScore > 0.7 ? 'text-red-400' : agent.riskScore > 0.3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {(agent.riskScore * 100).toFixed(0)}%
                  </span>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] m-0 mb-1">
                    Type
                  </p>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {agent.type}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => handleToggleStatus(agent.id, agent.status)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all duration-200 ${
                    agent.status === 'ACTIVE'
                      ? 'border-red-500/20 text-red-400 hover:bg-red-500/10'
                      : 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{agent.status === 'ACTIVE' ? 'Suspend' : 'Activate'}</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(agent.id)}
                    className="p-1.5 border border-[var(--card-border)] rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 cursor-pointer"
                    title="Decommission Agent"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass max-w-md w-full p-6 rounded-xl border border-[var(--card-border)] shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--card-border)] transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-[var(--text-primary)] m-0 mb-6 flex items-center gap-2">
              <Bot className="w-5 h-5 text-cyan-400" />
              <span>Register New AI Agent</span>
            </h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Agent Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. CodeCopilot-v2"
                  className="w-full bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400/50 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the agent's main functions and purpose..."
                  className="w-full bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400/50 transition-all h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Agent Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-cyan-400/50 transition-all"
                  >
                    <option value="AUTONOMOUS">AUTONOMOUS</option>
                    <option value="SEMI_AUTONOMOUS">SEMI-AUTO</option>
                    <option value="SUPERVISED">SUPERVISED</option>
                    <option value="TOOL">INTEGRATION TOOL</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Max actions/min
                  </label>
                  <input
                    type="number"
                    value={maxActions}
                    onChange={(e) => setMaxActions(parseInt(e.target.value) || 60)}
                    min={1}
                    max={10000}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-cyan-400/50 transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-cyan-500/10 disabled:opacity-50"
              >
                {submitting ? <span>Registering...</span> : <span>Register Workspace Identity</span>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
