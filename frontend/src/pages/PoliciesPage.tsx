import React, { useEffect, useState } from 'react';
import { policyService } from '../services/policies';
import type { Policy } from '../services/policies';
import { useNotification } from '../contexts/NotificationContext';
import { 
  Lock, 
  Plus, 
  Trash2, 
  X
} from 'lucide-react';

export const PoliciesPage: React.FC = () => {
  const { success, error } = useNotification();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [effect, setEffect] = useState('ALLOW');
  const [enforcement, setEnforcement] = useState('ENFORCING');
  const [priority, setPriority] = useState(100);
  const [actions, setActions] = useState('WRITE');
  const [resourcePattern, setResourcePattern] = useState('database:prod:*');
  const [submitting, setSubmitting] = useState(false);

  const fetchPolicies = React.useCallback(async () => {
    try {
      const data = await policyService.list();
      setPolicies(data.content);
    } catch {
      error('Failed to load policies.');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !resourcePattern || !actions) return;

    setSubmitting(true);
    try {
      // Parse comma-separated list of actions
      const parsedActions = actions.split(',').map((a) => a.trim().toUpperCase());
      const parsedResources = resourcePattern.split(',').map((r) => r.trim());

      const rules = [
        {
          actions: parsedActions,
          resources: parsedResources,
        },
      ];

      await policyService.create({
        name,
        description,
        effect,
        enforcement,
        priority,
        rules,
      });

      success(`Policy '${name}' created successfully.`);
      setName('');
      setDescription('');
      setEffect('ALLOW');
      setEnforcement('ENFORCING');
      setPriority(100);
      setActions('WRITE');
      setResourcePattern('database:prod:*');
      setIsModalOpen(false);
      fetchPolicies();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create policy.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this policy?')) return;
    try {
      await policyService.delete(id);
      success('Policy deleted successfully.');
      fetchPolicies();
    } catch {
      error('Failed to delete policy.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight m-0 mb-1">
            Access Policies
          </h1>
          <p className="text-[var(--text-secondary)] m-0">
            Define fine-grained rule sets, actions, and conditional resource mappings using our deny-override engine.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-lg shadow-cyan-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>New Policy</span>
        </button>
      </div>

      {/* Policies List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="glass p-6 rounded-xl h-24 shimmer" />
          ))}
        </div>
      ) : policies.length === 0 ? (
        <div className="glass p-12 rounded-xl border border-[var(--card-border)] text-center space-y-3">
          <Lock className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-[var(--text-primary)] m-0">No Policies Created</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto m-0">
            Define security rules to govern agent read/write permissions on key internal systems.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {policies.map((policy) => (
            <div key={policy.id} className="glass p-6 rounded-xl border border-[var(--card-border)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-tr from-cyan-400/10 to-violet-500/10 border border-cyan-400/20 rounded-lg text-cyan-400 mt-1">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-[var(--text-primary)] m-0">
                      {policy.name}
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      policy.effect === 'ALLOW' 
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/10' 
                        : policy.effect === 'DENY'
                        ? 'bg-red-500/15 text-red-400 border border-red-500/10'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/10'
                    }`}>
                      {policy.effect}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      policy.enforcement === 'ENFORCING'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/10'
                        : 'bg-slate-500/15 text-slate-400 border border-slate-500/10'
                    }`}>
                      {policy.enforcement}
                    </span>
                  </div>
                  {policy.description && (
                    <p className="text-xs text-[var(--text-secondary)] m-0 mt-1 max-w-xl">
                      {policy.description}
                    </p>
                  )}
                  {/* Rules overview */}
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-mono text-[var(--text-secondary)]">
                    <span className="text-[var(--text-muted)] font-sans">Rules:</span>
                    {policy.rules?.map((rule, idx) => (
                      <span key={idx} className="bg-[var(--bg-primary)] px-2 py-0.5 rounded border border-[var(--card-border)]">
                        Actions: [{rule.actions?.join(', ')}] ➜ Resources: [{rule.resources?.join(', ')}]
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 justify-end">
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] m-0 mb-0.5">
                    Priority
                  </p>
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    {policy.priority}
                  </span>
                </div>
                
                <button
                  onClick={() => handleDelete(policy.id)}
                  disabled={policy.isSystem}
                  className="p-2 border border-[var(--card-border)] rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                  title={policy.isSystem ? "System policy cannot be deleted" : "Delete Policy"}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
              className="absolute right-4 top-4 p-1 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer border border-transparent hover:border-[var(--card-border)]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-[var(--text-primary)] m-0 mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-cyan-400" />
              <span>Define Security Policy</span>
            </h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Policy Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Block Production Writes"
                  className="w-full bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400/50 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Prevents writing to critical production schemas"
                  className="w-full bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400/50 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Policy Effect
                  </label>
                  <select
                    value={effect}
                    onChange={(e) => setEffect(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-cyan-400/50 transition-all"
                  >
                    <option value="ALLOW">ALLOW</option>
                    <option value="DENY">DENY</option>
                    <option value="CHALLENGE">CHALLENGE</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Priority
                  </label>
                  <input
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value) || 100)}
                    min={1}
                    max={1000}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-cyan-400/50 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Enforce Actions (comma-separated)
                </label>
                <input
                  type="text"
                  value={actions}
                  onChange={(e) => setActions(e.target.value)}
                  placeholder="WRITE, DELETE, *"
                  className="w-full bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400/50 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Resource Glob Pattern (comma-separated)
                </label>
                <input
                  type="text"
                  value={resourcePattern}
                  onChange={(e) => setResourcePattern(e.target.value)}
                  placeholder="database:prod:*, api:v1:*"
                  className="w-full bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400/50 transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-cyan-500/10 disabled:opacity-50"
              >
                {submitting ? <span>Creating...</span> : <span>Create Policy</span>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
