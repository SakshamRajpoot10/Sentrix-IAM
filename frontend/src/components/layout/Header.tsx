import React from 'react';
import { Menu, Sun, Moon, Shield, Sparkles, Crown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getPlanBadge = (plan?: string) => {
    switch (plan) {
      case 'PRO':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 shadow-sm">
            <Sparkles className="w-3 h-3" />
            <span>PRO</span>
          </span>
        );
      case 'ENTERPRISE':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
            <Crown className="w-3 h-3" />
            <span>ENTERPRISE</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm">
            <Shield className="w-3 h-3" />
            <span>FREE</span>
          </span>
        );
    }
  };

  return (
    <header className="h-16 px-4 md:px-8 bg-[var(--bg-secondary)] border-b border-[var(--card-border)] flex items-center justify-between fixed top-0 right-0 left-0 md:left-64 z-20">
      <div className="flex items-center gap-3 md:gap-4">
        {/* Hamburger Menu Button */}
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg-hover)] md:hidden transition-all duration-200 cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>

        <h2 className="text-sm md:text-base font-semibold text-[var(--text-primary)] tracking-tight leading-none m-0">
          {user?.organizationName}
        </h2>
        {getPlanBadge(user?.plan)}
      </div>

      <div className="flex items-center gap-5">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg-hover)] transition-all duration-200"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Info & Avatar */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-violet-500 flex items-center justify-center text-white font-medium text-sm">
            {user?.firstName?.[0] || 'U'}
          </div>
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            {user?.firstName} {user?.lastName}
          </span>
        </div>
      </div>
    </header>
  );
};
