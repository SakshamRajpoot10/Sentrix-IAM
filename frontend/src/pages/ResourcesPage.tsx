import React, { useEffect, useState } from 'react';
import { resourceService } from '../services/resources';
import type { ProtectedResource } from '../services/resources';
import { useNotification } from '../contexts/NotificationContext';
import { 
  Database, 
  Plus, 
  Trash2, 
  Shield, 
  Globe, 
  Lock, 
  AlertOctagon,
  X,
  FileCode,
  Link
} from 'lucide-react';

export const ResourcesPage: React.FC = () => {
  const { success, error } = useNotification();
  const [resources, setResources] = useState<ProtectedResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [resourceType, setResourceType] = useState('DATABASE');
  const [identifier, setIdentifier] = useState('database:prod:users');
  const [sensitivity, setSensitivity] = useState('CONFIDENTIAL');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchResources = React.useCallback(async () => {
    try {
      const data = await resourceService.list();
      setResources(data.content);
    } catch {
      error('Failed to load protected resources.');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !identifier || !resourceType) return;

    setSubmitting(true);
    try {
      await resourceService.create({
        name,
        resourceType,
        identifier,
        sensitivity,
        description,
      });

      success(`Resource '${name}' registered successfully.`);
      setName('');
      setResourceType('DATABASE');
      setIdentifier('database:prod:users');
      setSensitivity('CONFIDENTIAL');
      setDescription('');
      setIsModalOpen(false);
      fetchResources();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create resource.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to unregister this resource?')) return;
    try {
      await resourceService.delete(id);
      success('Resource unregistered successfully.');
      fetchResources();
    } catch {
      error('Failed to delete resource.');
    }
  };

  const getSensitivityBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/20">
            <AlertOctagon className="w-3 h-3" />
            <span>CRITICAL</span>
          </span>
        );
      case 'RESTRICTED':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">
            <Lock className="w-3 h-3" />
            <span>RESTRICTED</span>
          </span>
        );
      case 'CONFIDENTIAL':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/15 text-violet-400 border border-violet-500/20">
            <Shield className="w-3 h-3" />
            <span>CONFIDENTIAL</span>
          </span>
        );
      case 'INTERNAL':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
            <Shield className="w-3 h-3" />
            <span>INTERNAL</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/20">
            <Globe className="w-3 h-3" />
            <span>PUBLIC</span>
          </span>
        );
    }
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'DATABASE':
        return <Database className="w-5 h-5" />;
      case 'API':
        return <Link className="w-5 h-5" />;
      default:
        return <FileCode className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight m-0 mb-1">
            Protected Resources
          </h1>
          <p className="text-[var(--text-secondary)] m-0">
            Register sensitive internal databases, API scopes, and configuration stores to track accesses and prevent leaks.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-lg shadow-cyan-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Register Resource</span>
        </button>
      </div>

      {/* Resources Table */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="glass p-6 rounded-xl h-20 shimmer" />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="glass p-12 rounded-xl border border-[var(--card-border)] text-center space-y-3">
          <Database className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-[var(--text-primary)] m-0">No Protected Resources</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto m-0">
            Register internal APIs or database identifiers to begin access monitoring.
          </p>
        </div>
      ) : (
        <div className="glass rounded-xl border border-[var(--card-border)] overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--card-border)] bg-[var(--bg-tertiary)]">
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Resource</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Identifier Scope</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Sensitivity</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)] bg-[var(--bg-secondary)]">
                {resources.map((res) => (
                  <tr key={res.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-tr from-cyan-400/10 to-violet-500/10 border border-cyan-400/20 rounded-lg text-cyan-400">
                          {getResourceTypeIcon(res.resourceType)}
                        </div>
                        <div>
                          <div className="font-semibold text-[var(--text-primary)]">{res.name}</div>
                          {res.description && <div className="text-xs text-[var(--text-secondary)]">{res.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{res.resourceType}</td>
                    <td className="px-6 py-4 font-mono text-xs text-cyan-400 select-all">{res.identifier}</td>
                    <td className="px-6 py-4">{getSensitivityBadge(res.sensitivity)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(res.id)}
                        className="p-1.5 border border-[var(--card-border)] rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 cursor-pointer"
                        title="Unregister Resource"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
              <Database className="w-5 h-5 text-cyan-400" />
              <span>Register Protected Resource</span>
            </h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Resource Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Postgres Prod Users Schema"
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
                  placeholder="e.g. Contains PII of active customers"
                  className="w-full bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400/50 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Resource Type
                  </label>
                  <select
                    value={resourceType}
                    onChange={(e) => setResourceType(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-cyan-400/50 transition-all"
                  >
                    <option value="DATABASE">DATABASE</option>
                    <option value="API">API ENDPOINT</option>
                    <option value="CONFIG">CONFIG FILE</option>
                    <option value="SYSTEM">SYSTEM PROCESS</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    Sensitivity Level
                  </label>
                  <select
                    value={sensitivity}
                    onChange={(e) => setSensitivity(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-cyan-400/50 transition-all"
                  >
                    <option value="PUBLIC">PUBLIC</option>
                    <option value="INTERNAL">INTERNAL</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                    <option value="RESTRICTED">RESTRICTED</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Scope Identifier (Exact or Prefix pattern)
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="database:prod:users"
                  className="w-full bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400/50 transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-cyan-500/10 disabled:opacity-50"
              >
                {submitting ? <span>Registering...</span> : <span>Register Resource</span>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
