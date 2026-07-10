import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Bot, 
  Lock, 
  Database, 
  Activity, 
  FileCheck, 
  CreditCard, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Agents', path: '/agents', icon: Bot },
    { name: 'Policies', path: '/policies', icon: Lock },
    { name: 'Resources', path: '/resources', icon: Database },
    { name: 'Real-time Monitor', path: '/monitor', icon: Activity },
    { name: 'Audit Trail', path: '/audit', icon: FileCheck },
    { name: 'Billing & Plans', path: '/billing', icon: CreditCard },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className={`w-64 bg-[var(--bg-secondary)] border-r border-[var(--card-border)] flex flex-col h-screen fixed left-0 top-0 z-30 transition-transform duration-300 transform 
      ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      {/* Brand Logo */}
      <Link to="/" onClick={onClose} className="h-16 px-6 border-b border-[var(--card-border)] flex items-center gap-3 hover:opacity-90 transition-opacity">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-400 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
          S
        </div>
        <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
          SENT<span className="text-cyan-600">RIX</span>
        </span>
      </Link>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => `
              flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
              ${isActive 
                ? 'bg-gradient-to-r from-cyan-500/10 to-violet-500/10 text-cyan-600 border-l-2 border-cyan-500 shadow-sm' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg-hover)]'
              }
            `}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Footer Profile & Logout */}
      <div className="p-4 border-t border-[var(--card-border)] bg-[var(--bg-tertiary)] flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-400 to-violet-500 flex items-center justify-center text-white font-semibold">
            {user?.firstName?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-[var(--text-secondary)] truncate">
              {user?.organizationName}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg border border-[var(--card-border)] text-sm font-medium text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
