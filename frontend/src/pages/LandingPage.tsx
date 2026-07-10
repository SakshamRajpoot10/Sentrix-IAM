import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Shield, 
  Key, 
  FileCheck, 
  ArrowRight, 
  Check, 
  Code,
  Download,
  X,
  BookOpen
} from 'lucide-react';
// Sentrix brand SVG asset is embedded inline

export const LandingPage: React.FC = () => {
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { user } = useAuth();

  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setActiveModal(null);
      setIsClosing(false);
    }, 300);
  };



  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-800 flex flex-col relative overflow-hidden font-sans pt-[72px]">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-200/20 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-violet-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className={`h-[72px] border-b border-[var(--color-cool-hairline)] bg-white/80 backdrop-blur-md fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${headerVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-[1200px] mx-auto h-full px-6 flex items-center justify-between relative">
          {/* Left Monogram and Logo */}
          <Link to="/" className="flex items-center gap-3 z-10 hover:opacity-90 transition-opacity">
            <svg viewBox="0 0 48 46" className="w-8 h-8 text-[var(--color-sovereign-ink)] filter drop-shadow-[0_2px_4px_rgba(134,59,255,0.15)]">
              <path 
                fill="currentColor" 
                d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"
              />
            </svg>
            <span className="text-[17px] font-bold tracking-[0.08em] text-[var(--color-sovereign-ink)] font-roobert">
              SENTRIX
            </span>
          </Link>

          {/* Center Navigation Links - Distributed layout */}
          <nav className="hidden md:flex items-center gap-12 text-[15px] font-medium text-[var(--color-carbon-gray)] absolute left-1/2 -translate-x-1/2">
            <a href="#features" className="hover:text-[var(--color-sovereign-ink)] transition-colors tracking-wide">Capabilities</a>
            <a href="#pricing" className="hover:text-[var(--color-sovereign-ink)] transition-colors tracking-wide">Pricing</a>
            <a href="#developers" className="hover:text-[var(--color-sovereign-ink)] transition-colors tracking-wide">Developers</a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-5 z-10">
            {user ? (
              <Link 
                to="/dashboard" 
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 hover:opacity-90 text-white font-medium text-[15px] shadow-subtle hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Workspace
              </Link>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-[15px] font-medium text-[var(--color-carbon-gray)] hover:text-[var(--color-sovereign-ink)] transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="px-6 py-2.5 rounded-full bg-[var(--color-sovereign-ink)] hover:opacity-90 text-white font-medium text-[15px] shadow-subtle transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section - spacious gap-24 for clear separation on desktop */}
      <section className="relative z-10 max-w-[1200px] mx-auto px-6 pt-8 pb-16 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        <div className="flex-1 space-y-6 max-w-[500px] text-left">
          {/* Typographic Eyebrow Label - No background, no border */}
          <div className="text-[12px] font-medium text-[var(--color-sovereign-violet)] uppercase tracking-[0.12em] font-roobert">
            SOVEREIGN RUNTIME SECURITY FOR AI AGENTS
          </div>

          <h1 className="text-[44px] sm:text-[52px] lg:text-[72px] font-bold text-[var(--color-sovereign-ink)] leading-[1.00] m-0 tracking-[-0.03em] font-roobert">
            Secure and Govern Your{' '}
            <span className="text-[var(--color-sovereign-violet)]">
              AI Agent Fleet
            </span>{' '}
            In Real Time
          </h1>

          <p className="text-[18px] text-[var(--color-carbon-gray)] m-0 leading-[1.63] tracking-[-0.09px]">
            Sentrix delivers cryptographically secure authorization, request interception, and real-time risk evaluation for autonomous LLM applications. Govern tools, enforce policies, and monitor baselines in one dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link 
              to={user ? "/dashboard" : "/register"} 
              className="px-6 py-3 rounded-full bg-[var(--color-sovereign-ink)] hover:opacity-90 text-white font-medium text-[15px] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-subtle"
            >
              <span>{user ? "Go to Workspace" : "Initialize Workspace"}</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </Link>
            <a 
              href="#features" 
              className="px-6 py-3 rounded-full border border-[var(--color-cool-hairline)] bg-white hover:bg-slate-50 text-[var(--color-sovereign-ink)] font-medium text-[15px] flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
            >
              <span>Explore Platform</span>
            </a>
          </div>

          <div className="grid grid-cols-3 gap-8 pt-8 border-t border-[var(--color-cool-hairline)] text-left">
            <div>
              <p className="text-[32px] font-bold text-[var(--color-sovereign-ink)] m-0 tracking-[-0.015em]">&lt; 12ms</p>
              <p className="text-[11px] text-[var(--color-carbon-gray)] font-medium m-0 mt-1.5 uppercase tracking-[0.08em] font-roobert">Inference Latency</p>
            </div>
            <div>
              <p className="text-[32px] font-bold text-[var(--color-sovereign-ink)] m-0 tracking-[-0.015em]">100%</p>
              <p className="text-[11px] text-[var(--color-carbon-gray)] font-medium m-0 mt-1.5 uppercase tracking-[0.08em] font-roobert">Audit Chain</p>
            </div>
            <div>
              <p className="text-[32px] font-bold text-[var(--color-sovereign-ink)] m-0 tracking-[-0.015em]">HMAC</p>
              <p className="text-[11px] text-[var(--color-carbon-gray)] font-medium m-0 mt-1.5 uppercase tracking-[0.08em] font-roobert">Secret Prefix</p>
            </div>
          </div>
        </div>

        {/* Futuristic AI Agent Security Hero SVG Drawing / Art */}
        <div className="flex-1 w-full max-w-[450px] relative lg:mt-0 mt-8 flex items-center justify-center overflow-visible h-[450px]">
          {/* Animated Floating Fluid/Water Background */}
          <div className="absolute top-10 left-10 w-[300px] h-[300px] bg-gradient-to-tr from-cyan-400/20 to-emerald-300/10 blur-3xl animate-float-fluid -z-10" />
          <div className="absolute bottom-10 right-10 w-[280px] h-[280px] bg-gradient-to-tr from-violet-600/20 to-fuchsia-400/10 blur-3xl animate-float-fluid-slow -z-10" />
          <div className="absolute inset-0 bg-sky-200/5 rounded-full blur-2xl animate-pulse -z-10" />

          {/* High-Tech HUD Blueprint SVG Drawing containing the Brand Logo */}
          <div className="w-full h-full max-h-[420px] z-10 hover:scale-[1.02] transition-transform duration-500 flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="w-full h-full text-slate-800 dark:text-white" fill="none">
              {/* Outer Tech Circles */}
              <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="opacity-30" />
              <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="0.5" className="opacity-20" />
              <circle cx="100" cy="100" r="75" stroke="currentColor" strokeWidth="1.5" strokeDasharray="40 180" className="opacity-40 animate-spin" style={{ animationDuration: '20s' }} />
              
              {/* Crosshairs */}
              <line x1="100" y1="5" x2="100" y2="25" stroke="currentColor" strokeWidth="1" className="opacity-40" />
              <line x1="100" y1="175" x2="100" y2="195" stroke="currentColor" strokeWidth="1" className="opacity-40" />
              <line x1="5" y1="100" x2="25" y2="100" stroke="currentColor" strokeWidth="1" className="opacity-40" />
              <line x1="175" y1="100" x2="195" y2="100" stroke="currentColor" strokeWidth="1" className="opacity-40" />

              {/* Inner Tech Rings */}
              <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="1" strokeDasharray="10 10" className="opacity-30" />
              
              {/* The Brand Logo in the Center (Scaled & Centered) */}
              <g transform="translate(47.2, 49.4) scale(2.2)">
                <path 
                  fill="currentColor" 
                  d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"
                  className="text-slate-900 dark:text-white filter drop-shadow-[0_0_8px_rgba(134,59,255,0.4)]"
                />
              </g>
            </svg>
          </div>
        </div>
      </section>


      {/* Features Grid */}
      <section id="features" className="max-w-[1200px] mx-auto w-full px-6 py-24 border-t border-[var(--color-cool-hairline)] scroll-mt-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl font-extrabold text-[var(--color-sovereign-ink)] tracking-tight m-0" style={{ letterSpacing: '-0.48px' }}>
            Complete Security Infrastructure for Autonomous Agents
          </h2>
          <p className="text-[var(--color-carbon-gray)] text-sm leading-relaxed m-0">
            Sentrix gives security and engineering teams granular visibility and controls over AI behaviors, integrations, and tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white p-8 border border-[var(--color-cool-hairline)] shadow-neverhack-card space-y-5 transition-shadow" style={{ borderRadius: '14px' }}>
            <div className="p-3 w-fit bg-[rgba(107,43,234,0.06)] border border-[var(--color-cool-hairline)] rounded-[10px] text-[var(--color-sovereign-violet)]">
              <Key className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-sovereign-ink)] m-0" style={{ letterSpacing: '-0.24px' }}>Dynamic Credentials</h3>
            <p className="text-sm text-[var(--color-carbon-gray)] m-0 leading-relaxed">
              Provision prefix-indexed API credentials for each agent deployment. Dynamically refresh, expire, or rotate keys programmatically to enforce least-privileged access levels.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-8 border border-[var(--color-cool-hairline)] shadow-neverhack-card space-y-5 transition-shadow" style={{ borderRadius: '14px' }}>
            <div className="p-3 w-fit bg-[rgba(107,43,234,0.06)] border border-[var(--color-cool-hairline)] rounded-[10px] text-[var(--color-sovereign-violet)]">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-sovereign-ink)] m-0" style={{ letterSpacing: '-0.24px' }}>Deny-Override Engine</h3>
            <p className="text-sm text-[var(--color-carbon-gray)] m-0 leading-relaxed">
              Enforce priority-sorted permission matrices containing glob pattern path matches. Prevent data leaks instantly with default deny rules overriding permissive rules.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-8 border border-[var(--color-cool-hairline)] shadow-neverhack-card space-y-5 transition-shadow" style={{ borderRadius: '14px' }}>
            <div className="p-3 w-fit bg-[rgba(107,43,234,0.06)] border border-[var(--color-cool-hairline)] rounded-[10px] text-[var(--color-sovereign-violet)]">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-sovereign-ink)] m-0" style={{ letterSpacing: '-0.24px' }}>Immutable Logs</h3>
            <p className="text-sm text-[var(--color-carbon-gray)] m-0 leading-relaxed">
              Every access request, session heartbeat, and evaluation response is logged in an append-only cryptographic ledger chained via SHA-256 signatures to ensure audit trails.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-[1200px] mx-auto w-full px-6 py-20 border-t border-[var(--color-cool-hairline)] scroll-mt-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl font-extrabold text-[var(--color-sovereign-ink)] tracking-tight m-0" style={{ letterSpacing: '-0.48px' }}>
            Tailored Plans for Startups and Enterprises
          </h2>
          <p className="text-[var(--color-carbon-gray)] text-sm leading-relaxed m-0">
            Start protecting your models for free. Upgrade as your agent deployments and security demands scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Tier */}
          <div className="bg-white border border-[var(--color-cool-hairline)] p-8 flex flex-col justify-between shadow-neverhack-card relative" style={{ borderRadius: '14px' }}>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-[var(--color-sovereign-ink)] m-0">Starter</h3>
                <p className="text-xs text-[var(--color-carbon-gray)] mt-1 m-0">For developers starting with AI safety</p>
              </div>
              <div className="flex items-baseline">
                <span className="text-4xl font-extrabold text-[var(--color-sovereign-ink)]">₹0</span>
                <span className="text-[var(--color-carbon-gray)] text-xs ml-1 font-medium">/ month</span>
              </div>
              <ul className="space-y-3.5 pl-0 list-none m-0 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2 text-sm text-[var(--color-carbon-gray)]">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Up to 5 Active Agents</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-carbon-gray)]">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Up to 10 Security Policies</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-carbon-gray)]">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>10,000 API Calls / Month</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-carbon-gray)]">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>7 Days Audit Retention</span>
                </li>
              </ul>
            </div>
            <Link 
              to="/register" 
              className="mt-8 px-4 py-2.5 rounded-full border border-[var(--color-sovereign-ink)] text-center text-sm font-semibold text-[var(--color-sovereign-ink)] hover:bg-slate-50 transition-colors"
            >
              Sign Up Free
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="bg-white border-2 border-[var(--color-sovereign-violet)] p-8 flex flex-col justify-between shadow-neverhack-chat relative" style={{ borderRadius: '14px' }}>
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-[var(--color-sovereign-violet)] text-white text-[10px] font-bold tracking-wider rounded-full uppercase shadow-sm">
              MOST POPULAR
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-[var(--color-sovereign-ink)] m-0">Sentrix Pro</h3>
                <p className="text-xs text-[var(--color-carbon-gray)] mt-1 m-0">Advanced rule sets and dynamic scaling</p>
              </div>
              <div className="flex items-baseline">
                <span className="text-4xl font-extrabold text-[var(--color-sovereign-ink)]">₹4,999</span>
                <span className="text-[var(--color-carbon-gray)] text-xs ml-1 font-medium">/ month</span>
              </div>
              <ul className="space-y-3.5 pl-0 list-none m-0 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2 text-sm text-[var(--color-carbon-gray)]">
                  <Check className="w-4 h-4 text-[var(--color-sovereign-violet)] shrink-0" />
                  <span className="font-semibold text-[var(--color-sovereign-ink)]">Up to 50 Active Agents</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-carbon-gray)]">
                  <Check className="w-4 h-4 text-[var(--color-sovereign-violet)] shrink-0" />
                  <span className="font-semibold text-[var(--color-sovereign-ink)]">Up to 100 Security Policies</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-carbon-gray)]">
                  <Check className="w-4 h-4 text-[var(--color-sovereign-violet)] shrink-0" />
                  <span>500,000 API Calls / Month</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-carbon-gray)]">
                  <Check className="w-4 h-4 text-[var(--color-sovereign-violet)] shrink-0" />
                  <span>30 Days Audit Retention</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-carbon-gray)]">
                  <Check className="w-4 h-4 text-[var(--color-sovereign-violet)] shrink-0" />
                  <span>LSTM Anomaly Pipeline</span>
                </li>
              </ul>
            </div>
            <Link 
              to="/register" 
              className="mt-8 px-4 py-2.5 rounded-full bg-[var(--color-sovereign-ink)] hover:opacity-90 text-white text-center text-sm font-semibold shadow-md"
            >
              Upgrade to Pro
            </Link>
          </div>

          {/* Enterprise Tier */}
          <div className="bg-white border border-[var(--color-cool-hairline)] p-8 flex flex-col justify-between shadow-neverhack-card relative" style={{ borderRadius: '14px' }}>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-[var(--color-sovereign-ink)] m-0">Enterprise</h3>
                <p className="text-xs text-[var(--color-carbon-gray)] mt-1 m-0">Bespoke integrations and private deployments</p>
              </div>
              <div className="flex items-baseline">
                <span className="text-4xl font-extrabold text-[var(--color-sovereign-ink)]">Custom</span>
              </div>
              <ul className="space-y-3.5 pl-0 list-none m-0 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2 text-sm text-[var(--color-carbon-gray)]">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold text-[var(--color-sovereign-ink)]">Unlimited Active Agents</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-carbon-gray)]">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold text-[var(--color-sovereign-ink)]">Unlimited Security Policies</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-carbon-gray)]">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Unlimited API Queries</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-carbon-gray)]">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>365 Days Audit Retention</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-[var(--color-carbon-gray)]">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Dedicated ML Server Nodes</span>
                </li>
              </ul>
            </div>
            <Link 
              to="/register" 
              className="mt-8 px-4 py-2.5 rounded-full border border-[var(--color-sovereign-ink)] text-center text-sm font-semibold text-[var(--color-sovereign-ink)] hover:bg-slate-50 transition-colors"
            >
              Contact Enterprise
            </Link>
          </div>
        </div>
      </section>

      {/* Developer Section */}
      <section id="developers" className="bg-[var(--color-mist-surface)] text-[var(--color-sovereign-ink)] py-24 border-t border-b border-[var(--color-cool-hairline)] scroll-mt-10">
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[rgba(107,43,234,0.06)] rounded-full text-xs font-semibold text-[var(--color-sovereign-violet)] tracking-[0.08em]">
              <Code className="w-3.5 h-3.5" />
              <span>DEVELOPER SDK PACKAGES</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight m-0 text-[var(--color-sovereign-ink)]" style={{ letterSpacing: '-0.48px' }}>
              Integrate in Three Lines of Code
            </h2>
            <p className="text-[var(--color-carbon-gray)] text-sm leading-relaxed m-0">
              Connect your AI agent runtime script (e.g. LangChain, LlamaIndex, or custom Python agents) directly to Sentrix. Intercept call execution using our SDK wrappers.
            </p>
            <div className="pt-2">
              <Link 
                to="/sdk-manual" 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--color-sovereign-violet)] hover:bg-[var(--color-sovereign-violet)]/90 text-white font-medium text-[13px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-subtle no-underline"
              >
                <BookOpen className="w-4 h-4" />
                <span>Explore Guided Manual</span>
              </Link>
            </div>
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2.5 text-[var(--color-carbon-gray)] text-sm font-semibold">
                  <Check className="w-4 h-4 text-[var(--color-sovereign-violet)]" />
                  <span>Python: <code className="bg-white border border-[var(--color-cool-hairline)] px-2 py-0.5 rounded text-xs font-mono text-[var(--color-sovereign-violet)]">pip install sentrix-sdk</code></span>
                </div>
                <a 
                  href="/sdk/python/sentrix_sdk-1.0.0-py3-none-any.whl" 
                  download 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all w-fit cursor-pointer no-underline shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Download className="w-3 h-3" />
                  <span>Download .whl</span>
                </a>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2.5 text-[var(--color-carbon-gray)] text-sm font-semibold">
                  <Check className="w-4 h-4 text-[var(--color-sovereign-violet)]" />
                  <span>JavaScript/TypeScript: <code className="bg-white border border-[var(--color-cool-hairline)] px-2 py-0.5 rounded text-xs font-mono text-[var(--color-sovereign-violet)]">npm i sentrix-sdk</code></span>
                </div>
                <a 
                  href="/sdk/javascript/sentrix-sdk-1.0.0.tgz" 
                  download 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all w-fit cursor-pointer no-underline shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Download className="w-3 h-3" />
                  <span>Download tarball</span>
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[var(--color-cool-hairline)] rounded-[14px] p-6 font-mono text-xs text-[var(--color-carbon-gray)] shadow-neverhack-card space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Example Python SDK integration</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-sovereign-violet)]" />
            </div>
            <pre className="overflow-x-auto text-[11px] leading-relaxed m-0 text-slate-800">
{`from sentrix import SentrixClient

# 1. Initialize client using the agent's API Key
sentrix = SentrixClient(api_key="sx_live_8192...")

# 2. Intercept and evaluate tool access before execution
decision = sentrix.authorize(
    action="db:execute_query",
    resource="postgres/customer_records",
    context={"ip": "192.168.1.42"}
)

if decision.allowed:
    # Safe to invoke tool
    execute_database_query()
else:
    # Block tool access
    raise PermissionError("Access denied by Sentrix policy")`}
            </pre>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-[var(--color-carbon-gray)] py-12 border-t border-[var(--color-cool-hairline)]">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center font-bold text-white shadow-sm text-sm">
              S
            </div>
            <span className="text-base font-bold text-[var(--color-sovereign-ink)] tracking-wider">SENTRIX</span>
          </div>

          <p className="text-xs m-0">
            &copy; {new Date().getFullYear()} Sentrix Inc. All rights reserved. Dynamic AI Agent IAM.
          </p>

          <div className="flex gap-6 text-xs font-semibold">
            <button 
              onClick={() => { setActiveModal('privacy'); setIsClosing(false); }}
              className="hover:text-[var(--color-sovereign-ink)] transition-colors focus:outline-none cursor-pointer bg-transparent border-none text-[var(--color-carbon-gray)] font-semibold p-0"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => { setActiveModal('terms'); setIsClosing(false); }}
              className="hover:text-[var(--color-sovereign-ink)] transition-colors focus:outline-none cursor-pointer bg-transparent border-none text-[var(--color-carbon-gray)] font-semibold p-0"
            >
              Terms of Service
            </button>
            <a href="#developers" className="hover:text-[var(--color-sovereign-ink)] transition-colors">Developer Docs</a>
          </div>
        </div>
      </footer>

      {/* Policy Modals */}
      {activeModal && (
        <div 
          onClick={closeModal}
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md transition-all duration-300 ${
            isClosing ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] transition-all duration-300 ${
              isClosing 
                ? 'opacity-0 translate-y-[-40px] scale-95' 
                : 'opacity-100 translate-y-0 scale-100'
            }`}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900 m-0">
                {activeModal === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
              </h3>
              <button 
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-600 leading-relaxed font-sans scrollbar-thin">
              {activeModal === 'privacy' ? (
                <>
                  <p className="m-0 font-medium text-slate-800">
                    Last updated: July 2026
                  </p>
                  <p className="m-0">
                    Sentrix Inc. ("we", "us", or "our") is dedicated to protecting the operational integrity and private metadata of your autonomous AI agent fleets. This Privacy Policy governs our ingestion of authorization telemetry and runtime security checkpoints.
                  </p>
                  <div className="space-y-4 text-left">
                    <h4 className="font-bold text-slate-950 m-0 text-sm">1. INGESTED TELEMETRY DATA</h4>
                    <ul className="list-disc pl-5 space-y-2 m-0">
                      <li><strong>SDK Verification Payload</strong>: We capture model action names, target resources, and cryptographic verification request signatures.</li>
                      <li><strong>Device Metadata</strong>: IP address, API key prefix signatures, and calling process system information.</li>
                      <li><strong>Exclusion of Plaintext Secrets</strong>: We never ingest plaintext passwords, secret prefix details, or private database credentials. All payload keys are client-hashed.</li>
                    </ul>

                    <h4 className="font-bold text-slate-950 m-0 text-sm">2. CRYPTOGRAPHIC DATA INTEGRITY</h4>
                    <ul className="list-disc pl-5 space-y-2 m-0">
                      <li>Each audit block is cryptographically chained using SHA-256 prefixes.</li>
                      <li>This tamper-proof chain is stored in a decentralized ledger format for auditing, ensuring total immutability of system runtime decisions.</li>
                    </ul>

                    <h4 className="font-bold text-slate-950 m-0 text-sm">3. ML ANALYTICAL EVALUATION</h4>
                    <ul className="list-disc pl-5 space-y-2 m-0">
                      <li>Anomaly detection profiles use isolation forests to calculate live threat scores.</li>
                      <li>These vectors are aggregated securely in local redis memory and are never shared with external advertising or tracking networks.</li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <p className="m-0 font-medium text-slate-800">
                    Last updated: July 2026
                  </p>
                  <p className="m-0">
                    Please read these Terms & Conditions ("Terms") carefully before initializing your Sentrix Sovereign Identity Agent IAM Workspace. By provisioning a gateway, you agree to comply with all operational guidelines.
                  </p>
                  <div className="space-y-4 text-left">
                    <h4 className="font-bold text-slate-950 m-0 text-sm">1. PROVISIONING OF WORKSPACE</h4>
                    <ul className="list-disc pl-5 space-y-2 m-0">
                      <li>Workspaces are assigned specific query ceilings based on plan subscriptions (Free, Pro, or Enterprise).</li>
                      <li>Creating duplicate free tier accounts to bypass agent limits is strictly prohibited.</li>
                    </ul>

                    <h4 className="font-bold text-slate-950 m-0 text-sm">2. BILLING & UPI QR PAYMENT GATEWAYS</h4>
                    <ul className="list-disc pl-5 space-y-2 m-0">
                      <li>Plan upgrades are processed dynamically via UPI QR codes, VPA requests, Cards, or secure Net Banking portals.</li>
                      <li>Payments are authorized in real-time, instantly adjusting workspace limits and model capabilities.</li>
                      <li>Invoices are generated dynamically and remain available for immediate HTML receipt download.</li>
                    </ul>

                    <h4 className="font-bold text-slate-950 m-0 text-sm">3. RUNTIME SAFETY & MODEL COMPLIANCE</h4>
                    <ul className="list-disc pl-5 space-y-2 m-0">
                      <li>The user is solely responsible for autonomous tool actions committed by registered agents.</li>
                      <li>Policy configurations must comply with sovereign database protection standards.</li>
                    </ul>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50 rounded-b-2xl">
              <button 
                onClick={closeModal}
                className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Close Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
