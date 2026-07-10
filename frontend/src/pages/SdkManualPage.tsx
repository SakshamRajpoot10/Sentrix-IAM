import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Terminal, 
  BookOpen, 
  Cpu, 
  Check, 
  Copy, 
  ArrowLeft, 
  Play, 
  Activity
} from 'lucide-react';

export const SdkManualPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'js' | 'python'>('js');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('intro');

  // Simulator State
  const [simAction, setSimAction] = useState('WRITE');
  const [simResource, setSimResource] = useState('database:prod:customer_records');
  const [simIp, setSimIp] = useState('192.168.1.15');
  const [simRisk, setSimRisk] = useState(0.25);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  // Sections list for side-nav
  const sections = [
    { id: 'intro', name: 'Overview' },
    { id: 'architecture', name: 'Architecture' },
    { id: 'install', name: 'Installation' },
    { id: 'initialize', name: 'Initialization' },
    { id: 'authorize', name: 'Authorization' },
    { id: 'heartbeat', name: 'Heartbeats & Logging' },
    { id: 'simulator', name: 'Interactive Simulator' }
  ];

  // Auto detect active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 120;
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetHeight = element.offsetHeight;
          if (scrollPos >= offsetTop && scrollPos < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const runSimulation = () => {
    setSimulating(true);
    setSimResult(null);
    setConsoleLogs([
      `[SDK] Initializing authorization check...`,
      `[SDK] Destination target: ${simResource}`,
      `[SDK] Evaluating action: ${simAction}`,
      `[SDK] Attaching client context (IP: ${simIp})`
    ]);

    setTimeout(() => {
      setConsoleLogs(prev => [...prev, `[API] Forwarding to Nginx API Gateway...`]);
    }, 400);

    setTimeout(() => {
      setConsoleLogs(prev => [
        ...prev, 
        `[API] Spring Boot PolicyEngine: Matching rules for resource path...`,
        `[API] FastAPI Anomaly Scorer: Ingesting sequence vectors...`,
        `[API] FastAPI Anomaly Scorer: Calculated risk score = ${simRisk.toFixed(2)}`
      ]);
    }, 900);

    setTimeout(() => {
      const allowed = simRisk < 0.80 && !simResource.includes('forbidden') && simAction !== 'DELETE';
      const decision = allowed ? 'ALLOW' : 'DENY';
      let reason = 'Allowed by policy rules.';
      
      if (simRisk >= 0.80) {
        reason = 'Anomaly detected: High behavioral risk score exceeds 0.80 threshold. Agent suspended.';
      } else if (simResource.includes('forbidden')) {
        reason = 'Explicit deny matched on sensitive target path.';
      } else if (simAction === 'DELETE') {
        reason = 'Action DELETE is restricted on the default policy tier.';
      }

      setConsoleLogs(prev => [
        ...prev,
        `[API] Conflict Resolution: Policy resolved to decision: ${decision}`,
        `[API] Audit Service: Signed hash chain block updated`,
        `[SDK] Authorization check completed: ${decision}`
      ]);

      setSimResult({
        allowed,
        decision,
        riskScore: simRisk,
        reason,
        matchedPolicies: allowed ? ['default-access-policy'] : ['restrictive-governance-shield'],
        timestamp: new Date().toISOString()
      });
      setSimulating(false);
    }, 1600);
  };

  const jsInstallCode = `npm install sentrix-sdk`;
  const pythonInstallCode = `pip install sentrix-sdk`;

  const jsSnippet = `const { SentrixClient } = require('sentrix-sdk');

// 1. Initialize the client
const client = new SentrixClient({
  apiKey: 'sen_live_yourApiKeyPrefix...',
  baseUrl: 'http://localhost:8080' // Your Sentrix Gateway URL
});

async function main() {
  // 2. Authenticate the agent session
  await client.authenticate();

  // 3. Perform authorization check before calling a tool
  const decision = await client.authorize({
    action: '${simAction}',
    resource: '${simResource}',
    context: { 
      ip_address: '${simIp}'
    }
  });

  if (decision.allowed) {
    console.log("Access Allowed! Risk Score:", decision.riskScore);
    // Execute target action...
    
    // 4. Log the execution outcome to the audit chain
    await client.logAction({
      action: '${simAction}',
      resource: '${simResource}',
      outcome: 'SUCCESS'
    });
  } else {
    console.warn("Blocked! Reason:", decision.reason);
    // Handle restriction...
  }
}
main();`;

  const pythonSnippet = `from sentrix_sdk import SentrixClient

# 1. Initialize the client
client = SentrixClient(
    api_key="sen_live_yourApiKeyPrefix...",
    base_url="http://localhost:8080" # Your Sentrix Gateway URL
)

# 2. Authenticate the agent session
session = client.authenticate()

# 3. Perform authorization check before calling a tool
decision = client.authorize(
    action="${simAction}",
    resource="${simResource}",
    context={
        "ip_address": "${simIp}"
    }
)

if decision.allowed:
    print(f"Access Allowed! Risk Score: {decision.risk_score}")
    # Execute target action...
    
    # 4. Log the execution outcome to the audit chain
    client.log_action(
        action="${simAction}",
        resource="${simResource}",
        outcome="SUCCESS"
    )
else:
    print(f"Blocked! Reason: {decision.reason}")
    # Handle restriction...`;

  const scrollIntoView = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 90,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col pt-[72px]">
      {/* Top Banner Navigation */}
      <header className="h-[72px] border-b border-slate-200 bg-white/80 backdrop-blur-md fixed top-0 left-0 right-0 z-50 transition-transform duration-300">
        <div className="max-w-[1280px] mx-auto h-full px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 text-slate-900 hover:opacity-90 transition-opacity no-underline">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
            <svg viewBox="0 0 48 46" className="w-8 h-8 text-[var(--color-sovereign-ink)]">
              <path fill="currentColor" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"/>
            </svg>
            <span className="text-[17px] font-bold tracking-[0.08em] uppercase font-roobert">
              Sentrix Docs
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-semibold text-slate-500 font-mono">v1.0.0 (Local Dev)</span>
            <Link to="/dashboard" className="px-5 py-2 rounded-full bg-[var(--color-sovereign-ink)] text-white text-xs font-bold no-underline hover:opacity-90 transition-all shadow-sm">
              Console Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-[1280px] w-full mx-auto px-6 py-10 flex-1 flex gap-10 relative">
        
        {/* Sticky Sidebar Navigation */}
        <aside className="w-[240px] hidden md:block shrink-0">
          <div className="sticky top-[110px] space-y-6">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-3">SDK Core Manual</p>
              <ul className="list-none pl-0 space-y-1.5 m-0">
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => scrollIntoView(section.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer bg-transparent ${
                        activeSection === section.id
                          ? 'bg-slate-100 text-[var(--color-sovereign-violet)]'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {section.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl space-y-2">
              <p className="text-[10px] font-bold text-slate-600 m-0 uppercase tracking-wider">Local Registries</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>NPM:</span>
                  <span className="font-semibold text-slate-700">Port 4873</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>PyPI:</span>
                  <span className="font-semibold text-slate-700">Port 8081</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Documentation Content Area */}
        <main className="flex-1 min-w-0 space-y-16">
          
          {/* Section: Intro */}
          <section id="intro" className="scroll-mt-24 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[rgba(107,43,234,0.06)] rounded-full text-xs font-semibold text-[var(--color-sovereign-violet)] tracking-[0.08em] uppercase">
              <BookOpen className="w-4 h-4" />
              <span>Sovereign SDK Reference</span>
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none m-0">
              Integrate AI Agent Governance
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed m-0">
              The Sentrix SDK allows engineering teams to wrap autonomous runtime agents (like LangChain, LlamaIndex, or custom python loops) with security firewalls. By checking policies in real-time and updating behavioral telemetry, you prevent data exfiltration, tool abuse, and prompt injection exploits.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3">
              <div className="bg-white p-5 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <span>Rule-Based Policies (Layer 1)</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed m-0">
                  Matches agent action paths using wildcards (glob expressions) against preconfigured allowed and denied paths, utilizing priority-sorted "Deny-Overrides" conflict resolution.
                </p>
              </div>
              <div className="bg-white p-5 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Cpu className="w-5 h-5 text-[var(--color-sovereign-violet)]" />
                  <span>ML Behavior Baselining (Layer 2)</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed m-0">
                  Runs an ensemble scorer (Isolation Forest and PyTorch LSTM Autoencoder) that analyzes event latency, ip address stability, and token sequence trajectories to auto-revoke compromised agents.
                </p>
              </div>
            </div>
          </section>

          {/* Section: Architecture Flow */}
          <section id="architecture" className="scroll-mt-24 space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight m-0">Runtime Interception Architecture</h2>
            <p className="text-sm text-slate-600 leading-relaxed m-0">
              The sequence flow diagram below details how the SDK intercepts agent executions and communicates with the Sentrix core API.
            </p>

            {/* Sequence Flow SVG Diagram */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white overflow-x-auto flex justify-center">
              <svg width="600" height="340" viewBox="0 0 600 340" fill="none" className="min-w-[550px]">
                {/* Headers */}
                <g className="font-mono text-xs font-bold">
                  {/* SDK Node */}
                  <rect x="20" y="20" width="100" height="40" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="1"/>
                  <text x="70" y="44" fill="#cbd5e1" textAnchor="middle">AI Agent SDK</text>
                  <line x1="70" y1="60" x2="70" y2="300" stroke="#475569" strokeWidth="1" strokeDasharray="4 4" />

                  {/* Sentrix Backend */}
                  <rect x="230" y="20" width="140" height="40" rx="8" fill="#581c87" stroke="#a21caf" strokeWidth="1"/>
                  <text x="300" y="44" fill="#f5f3ff" textAnchor="middle">Spring Policy Engine</text>
                  <line x1="300" y1="60" x2="300" y2="300" stroke="#a21caf" strokeWidth="1" strokeDasharray="4 4" />

                  {/* ML Service */}
                  <rect x="460" y="20" width="120" height="40" rx="8" fill="#065f46" stroke="#059669" strokeWidth="1"/>
                  <text x="520" y="44" fill="#ecfdf5" textAnchor="middle">FastAPI ML Service</text>
                  <line x1="520" y1="60" x2="520" y2="300" stroke="#059669" strokeWidth="1" strokeDasharray="4 4" />
                </g>

                {/* Flows */}
                <g className="font-mono text-[10px]">
                  {/* 1. Request Auth */}
                  <line x1="70" y1="100" x2="295" y2="100" stroke="#818cf8" strokeWidth="1.5" markerEnd="url(#arrow)" />
                  <text x="185" y="92" fill="#818cf8" textAnchor="middle">1. authorize(action, resource)</text>

                  {/* 2. Run ML Scoring */}
                  <line x1="300" y1="130" x2="515" y2="130" stroke="#34d399" strokeWidth="1.5" markerEnd="url(#arrow)" />
                  <text x="410" y="122" fill="#34d399" textAnchor="middle">{"2. POST /predict {events}"}</text>

                  {/* 3. ML Scoring Response */}
                  <line x1="520" y1="160" x2="305" y2="160" stroke="#34d399" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow)" />
                  <text x="410" y="152" fill="#34d399" textAnchor="middle">3. return riskScore: 0.25</text>

                  {/* 4. Evaluate Policy & Conflict Resolution */}
                  <path d="M 300 180 C 340 180, 340 210, 305 210" stroke="#d8b4fe" strokeWidth="1.5" markerEnd="url(#arrow)" />
                  <text x="350" y="198" fill="#d8b4fe" textAnchor="start">4. Match rules +</text>
                  <text x="350" y="210" fill="#d8b4fe" textAnchor="start">   Deny-Overrides</text>

                  {/* 5. Return decision */}
                  <line x1="298" y1="240" x2="75" y2="240" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow)" />
                  <text x="185" y="232" fill="#818cf8" textAnchor="middle">5. Decision ALLOW / DENY</text>

                  {/* 6. Append to Hash Chain */}
                  <path d="M 300 260 C 340 260, 340 290, 305 290" stroke="#f472b6" strokeWidth="1.5" markerEnd="url(#arrow)" />
                  <text x="350" y="278" fill="#f472b6" textAnchor="start">6. Immutable audit</text>
                  <text x="350" y="290" fill="#f472b6" textAnchor="start">   log entry signed</text>
                </g>

                {/* SVG Markers */}
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="currentColor" />
                  </marker>
                </defs>
              </svg>
            </div>
          </section>

          {/* Section: Installation */}
          <section id="install" className="scroll-mt-24 space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight m-0">1. Installation</h2>
            <p className="text-sm text-slate-600 leading-relaxed m-0">
              Install the SDK packages globally from your local private registries. These registries point to local developer instances hosted at `http://localhost:4873/` (npm) and `http://localhost:8081/` (pip).
            </p>

            {/* Code Tabs */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="flex border-b border-slate-800 px-4 bg-slate-950">
                <button
                  onClick={() => setActiveTab('js')}
                  className={`px-4 py-3 text-xs font-semibold border-none cursor-pointer bg-transparent transition-all ${
                    activeTab === 'js' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Node.js (npm)
                </button>
                <button
                  onClick={() => setActiveTab('python')}
                  className={`px-4 py-3 text-xs font-semibold border-none cursor-pointer bg-transparent transition-all ${
                    activeTab === 'python' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Python (pip)
                </button>
              </div>
              <div className="p-5 font-mono text-xs text-white relative">
                {activeTab === 'js' ? (
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-300">{jsInstallCode}</span>
                    <button
                      onClick={() => handleCopy(jsInstallCode, 'js-install')}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer border-none"
                    >
                      {copiedText === 'js-install' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-300">{pythonInstallCode}</span>
                    <button
                      onClick={() => handleCopy(pythonInstallCode, 'py-install')}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer border-none"
                    >
                      {copiedText === 'py-install' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section: Initialization */}
          <section id="initialize" className="scroll-mt-24 space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight m-0">2. Client Initialization</h2>
            <p className="text-sm text-slate-600 leading-relaxed m-0">
              Create an instance of the SentrixClient. By default, the client reads `SENTRIX_API_KEY` and `SENTRIX_BASE_URL` from the environment if no parameters are supplied.
            </p>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Initialization Code</span>
                <button
                  onClick={() => handleCopy(activeTab === 'js' ? jsSnippet : pythonSnippet, 'init-snippet')}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border-none cursor-pointer flex items-center gap-1.5"
                >
                  {copiedText === 'init-snippet' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-5 font-mono text-[11px] leading-relaxed text-slate-300 overflow-x-auto m-0">
                {activeTab === 'js' ? jsSnippet : pythonSnippet}
              </pre>
            </div>
          </section>

          {/* Section: Interception & Authorization */}
          <section id="authorize" className="scroll-mt-24 space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight m-0">3. Intercepting & Authorizing Actions</h2>
            <p className="text-sm text-slate-600 leading-relaxed m-0">
              Integrate authorization checks at execution entry points of your agents. Wrap tool calls with policy checks to prevent unauthorized actions immediately.
            </p>

            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 m-0">Method Details:</h3>
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-slate-800 font-bold m-0">client.authorize(action, resource, context)</p>
                  <p className="text-[11px] text-slate-500 m-0 mt-1">Queries policies and ML scorers. Returns a Decision object with `allowed`, `riskScore`, `reason`, and `matchedPolicies` fields.</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-slate-800 font-bold m-0">client.check(action, resource, context)</p>
                  <p className="text-[11px] text-slate-500 m-0 mt-1">Returns a simple boolean (`true` or `false`) stating whether the action is permitted.</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-slate-800 font-bold m-0">client.protect(action, resource, fn, options)</p>
                  <p className="text-[11px] text-slate-500 m-0 mt-1">AOP-style decorator wrapping a function. Checks authorization before executing and automatically registers audit logs upon completion.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Heartbeat & Logs */}
          <section id="heartbeat" className="scroll-mt-24 space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight m-0">4. Session Heartbeats & Logs</h2>
            <p className="text-sm text-slate-600 leading-relaxed m-0">
              AI agents operate over sessions. By calling `.startHeartbeat()`, the SDK maintains an active background request thread to keep session JWTs valid.
            </p>

            <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-amber-800 m-0 flex items-center gap-1.5">
                <Activity className="w-4 h-4" />
                <span>Session Expiry Security Note</span>
              </h4>
              <p className="text-xs text-amber-700 leading-relaxed m-0">
                If the backend doesn't receive a heartbeat or request from an agent for more than 5 minutes, it revokes the active session token automatically. This protects against session hijacking in case the script crashed or key leaks occurred.
              </p>
            </div>
          </section>

          {/* Section: Live SDK Simulator */}
          <section id="simulator" className="scroll-mt-24 space-y-6">
            <div className="border-t border-slate-200 pt-10">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight m-0">Interactive SDK Playground</h2>
              <p className="text-sm text-slate-600 leading-relaxed m-0 mt-2">
                Configure agent settings and click simulate to test how the SDK client communicates with the policy engine.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {/* Simulator Input Panel (5 columns) */}
              <div className="lg:col-span-5 border-r border-slate-200 p-6 space-y-6 bg-slate-50/50">
                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider m-0">Config simulator</p>
                
                {/* Action input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Action (HTTP Method / Action Name)</label>
                  <select 
                    value={simAction} 
                    onChange={(e) => setSimAction(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-slate-400"
                  >
                    <option value="READ">READ</option>
                    <option value="WRITE">WRITE</option>
                    <option value="DELETE">DELETE (Restricted)</option>
                    <option value="EXECUTE">EXECUTE</option>
                  </select>
                </div>

                {/* Resource input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Resource URI</label>
                  <select 
                    value={simResource} 
                    onChange={(e) => setSimResource(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-slate-400"
                  >
                    <option value="database:prod:customer_records">database:prod:customer_records</option>
                    <option value="api:v1:payments:refunds">api:v1:payments:refunds</option>
                    <option value="server:root:configs:forbidden">server:root:configs:forbidden (Forbidden Path)</option>
                  </select>
                </div>

                {/* IP input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Context Source IP</label>
                  <input 
                    type="text" 
                    value={simIp} 
                    onChange={(e) => setSimIp(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-400" 
                  />
                </div>

                {/* Risk Score input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                    <span>Simulated ML Risk Score</span>
                    <span className={`font-mono text-xs ${simRisk >= 0.80 ? 'text-red-500' : simRisk >= 0.50 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {simRisk.toFixed(2)}
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0.0" 
                    max="1.0" 
                    step="0.05"
                    value={simRisk} 
                    onChange={(e) => setSimRisk(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[var(--color-sovereign-violet)]" 
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold font-mono">
                    <span>0.00 (Safe)</span>
                    <span>0.80 (Revoke Threshold)</span>
                    <span>1.00 (Anomaly)</span>
                  </div>
                </div>

                <button
                  onClick={runSimulation}
                  disabled={simulating}
                  className="w-full py-3 rounded-xl bg-[var(--color-sovereign-ink)] hover:opacity-90 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2 border-none cursor-pointer transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{simulating ? 'Simulating Interception...' : 'Simulate Authorization Request'}</span>
                </button>
              </div>

              {/* Console & Result Display (7 columns) */}
              <div className="lg:col-span-7 flex flex-col min-h-[380px] bg-slate-950 text-slate-300">
                {/* Console Header */}
                <div className="px-5 py-3 border-b border-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider font-mono">SDK Authorization Output</span>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  </div>
                </div>

                {/* Console Log Body */}
                <div className="flex-1 p-5 font-mono text-[10px] space-y-2 overflow-y-auto leading-relaxed max-h-[220px]">
                  {consoleLogs.length === 0 ? (
                    <p className="text-slate-600 m-0 italic">Configure values on the left and click Simulate to start...</p>
                  ) : (
                    consoleLogs.map((log, index) => (
                      <p key={index} className="m-0 text-slate-400">
                        {log.startsWith('[SDK]') ? (
                          <span className="text-cyan-400 font-semibold">{log}</span>
                        ) : log.startsWith('[API]') ? (
                          <span className="text-fuchsia-400 font-semibold">{log}</span>
                        ) : (
                          <span>{log}</span>
                        )}
                      </p>
                    ))
                  )}
                </div>

                {/* Decision Output Panel */}
                <div className="p-5 border-t border-slate-900 bg-slate-950/80 flex items-center gap-4">
                  {simulating ? (
                    <div className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                      <span className="text-xs font-semibold text-slate-400 font-mono">Waiting for policy evaluation...</span>
                    </div>
                  ) : simResult ? (
                    <div className="w-full flex items-start gap-4">
                      {/* Badge status */}
                      <div className={`px-4 py-2 rounded-xl border flex flex-col items-center justify-center shrink-0 font-bold font-mono text-center ${
                        simResult.allowed 
                          ? 'bg-emerald-950/30 border-emerald-900 text-emerald-400' 
                          : 'bg-red-950/30 border-red-900 text-red-400'
                      }`}>
                        <span className="text-[9px] uppercase tracking-wider font-semibold opacity-70">Decision</span>
                        <span className="text-sm mt-0.5">{simResult.decision}</span>
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Reason:</span>
                          <span className="text-xs font-semibold text-white leading-tight">{simResult.reason}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-slate-500 font-bold uppercase tracking-wider">Matched Policy:</span>
                          <span className="font-semibold font-mono text-slate-400">{simResult.matchedPolicies.join(', ')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-slate-500 font-bold uppercase tracking-wider">Risk Index:</span>
                          <span className={`font-semibold font-mono ${simResult.riskScore >= 0.8 ? 'text-red-400' : 'text-slate-400'}`}>{simResult.riskScore.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-600 font-mono">Playground Idle. Ready to simulate.</span>
                  )}
                </div>
              </div>
            </div>
          </section>

        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 mt-20">
        <div className="max-w-[1280px] mx-auto px-6 flex items-center justify-between text-slate-500 text-xs">
          <span>&copy; {new Date().getFullYear()} Sentrix Inc. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/" className="hover:text-slate-800 no-underline font-semibold">Home</Link>
            <Link to="/dashboard" className="hover:text-slate-800 no-underline font-semibold">Workspace Console</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
