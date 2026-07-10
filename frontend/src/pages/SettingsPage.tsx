import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Building, Key, User, Lock, Save } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { success, error } = useNotification();
  const [activeTab, setActiveTab] = useState<'security' | 'profile'>('security');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setOrganizationName(user.organizationName || '');
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        firstName,
        lastName,
        email,
        password: password || undefined,
        organizationName
      });
      success('Workspace settings updated successfully!');
      setPassword('');
    } catch {
      error('Failed to update workspace settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight m-0 mb-1">
          Workspace Settings
        </h1>
        <p className="text-[var(--text-secondary)] m-0">
          Configure security defaults, manage profile credentials, and inspect system audit metrics.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-[var(--card-border)] gap-6 mb-6">
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 font-semibold text-sm transition-all relative cursor-pointer focus:outline-none ${
            activeTab === 'security'
              ? 'text-cyan-500 border-b-2 border-cyan-500 font-bold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Security & SDK Parameters
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 font-semibold text-sm transition-all relative cursor-pointer focus:outline-none ${
            activeTab === 'profile'
              ? 'text-cyan-500 border-b-2 border-cyan-500 font-bold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Profile & Workspace details
        </button>
      </div>

      {activeTab === 'security' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Org Detail Card */}
          <div className="glass p-6 rounded-xl border border-[var(--card-border)] space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2 m-0 mb-2">
              <Building className="w-4 h-4 text-cyan-400" />
              <span>Workspace Info</span>
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <p className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider m-0 mb-1">Workspace Name</p>
                <span className="font-semibold text-[var(--text-primary)]">{user?.organizationName}</span>
              </div>
              <div>
                <p className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider m-0 mb-1">ID</p>
                <span className="font-mono text-cyan-400 select-all">{user?.organizationId}</span>
              </div>
              <div>
                <p className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider m-0 mb-1">Billing Plan</p>
                <span className="font-semibold text-[var(--text-primary)]">{user?.plan}</span>
              </div>
            </div>
          </div>

          {/* Security Parameters Card */}
          <div className="glass p-6 rounded-xl border border-[var(--card-border)] space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2 m-0 mb-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Security Defaults</span>
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <p className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider m-0 mb-1">Default policy resolution</p>
                <span className="font-semibold text-red-400">DENY (Deny Override)</span>
              </div>
              <div>
                <p className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider m-0 mb-1">Session Expiration</p>
                <span className="font-semibold text-[var(--text-primary)]">60 Minutes</span>
              </div>
              <div>
                <p className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider m-0 mb-1">Automatic Revocation threshold</p>
                <span className="font-semibold text-[var(--text-primary)]">Risk Score &gt; 80%</span>
              </div>
            </div>
          </div>

          {/* Integration Details */}
          <div className="glass p-6 rounded-xl border border-[var(--card-border)] space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2 m-0 mb-2">
              <Key className="w-4 h-4 text-cyan-400" />
              <span>SDK Connection Specs</span>
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <p className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider m-0 mb-1">API Base URL</p>
                <span className="font-mono text-cyan-400">http://localhost:8080</span>
              </div>
              <div>
                <p className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider m-0 mb-1">TLS Policy</p>
                <span className="font-semibold text-[var(--text-primary)]">TLS 1.3 Required in Prod</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSaveProfile} className="max-w-2xl glass p-8 rounded-xl border border-[var(--card-border)] space-y-6">
          <h3 className="text-base font-bold text-[var(--text-primary)] m-0 mb-4 flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
            <User className="w-5 h-5 text-cyan-400" />
            <span>Manage Profiles</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-lg px-3 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-cyan-400/50 transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-lg px-3 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-cyan-400/50 transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-lg px-3 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-cyan-400/50 transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Company / Organization Name
              </label>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-lg px-3 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-cyan-400/50 transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Change Password (Leave blank to keep current)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-lg pl-10 pr-4 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-cyan-400/50 transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-[var(--card-border)]">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-lg shadow-cyan-500/10 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Workspace Changes'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
