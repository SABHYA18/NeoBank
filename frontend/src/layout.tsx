import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  IconAccount,
  IconAuth,
  IconClearLedger,
  IconLedger,
  IconLogo,
  IconMoon,
  IconProfile,
  IconSun,
  IconTransactions,
  IconWallet,
} from './icons';
import { ThemeToggle } from './ui';
import type { TabId } from './ui';
import type { Theme } from './useTheme';
import { CommandPalette } from './CommandPalette';
import type { Command } from './CommandPalette';

const NAV: { id: TabId; label: string; modClass: string; Icon: typeof IconAccount }[] = [
  { id: 'dashboard', label: 'Accounts', modClass: 'nav-mod-dashboard', Icon: IconAccount },
  { id: 'transactions', label: 'Transactions', modClass: 'nav-mod-transactions', Icon: IconTransactions },
  { id: 'ledger', label: 'Ledger', modClass: 'nav-mod-ledger', Icon: IconLedger },
  { id: 'wallet', label: 'Wallet', modClass: 'nav-mod-wallet', Icon: IconWallet },
  { id: 'clearledger', label: 'ClearLedger', modClass: 'nav-mod-clearledger', Icon: IconClearLedger },
  { id: 'profile', label: 'Profile', modClass: 'nav-mod-profile', Icon: IconProfile },
];

export function AppLayout({
  activeTab,
  onTabChange,
  username,
  isLiveMode,
  backendStatus,
  theme,
  onThemeToggle,
  onToggleLiveMode,
  onSignOut,
  children,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  username?: string;
  isLiveMode: boolean;
  backendStatus: string;
  theme: Theme;
  onThemeToggle: () => void;
  onToggleLiveMode: () => void;
  onSignOut: () => void;
  children: ReactNode;
}) {
  const [cmdkOpen, setCmdkOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdkOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const commands = useMemo<Command[]>(() => {
    const nav: Command[] = NAV.map(({ id, label, Icon }) => ({
      id: `nav-${id}`,
      label,
      group: 'Navigate',
      keywords: id,
      icon: <Icon size={18} className="nav-icon" />,
      run: () => onTabChange(id),
    }));
    const actions: Command[] = [
      {
        id: 'theme',
        label: theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode',
        group: 'Actions',
        keywords: 'theme appearance dark light',
        icon: theme === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />,
        run: onThemeToggle,
      },
      {
        id: 'mode',
        label: isLiveMode ? 'Switch to Simulation mode' : 'Switch to Live API mode',
        group: 'Actions',
        keywords: 'live simulation api backend mode',
        icon: <IconTransactions size={18} />,
        run: onToggleLiveMode,
      },
      {
        id: 'signout',
        label: 'Sign out',
        group: 'Actions',
        keywords: 'logout exit',
        icon: <IconAuth size={18} />,
        run: onSignOut,
      },
    ];
    return [...nav, ...actions];
  }, [theme, isLiveMode, onTabChange, onThemeToggle, onToggleLiveMode, onSignOut]);

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      {cmdkOpen && <CommandPalette onClose={() => setCmdkOpen(false)} commands={commands} />}

      <aside className="sidebar" aria-label="Main navigation">
        <div className="sidebar-brand">
          <IconLogo className="brand-icon" aria-hidden />
          <span className="brand-text">NeoBank</span>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ id, label, modClass, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                className={`nav-item ${modClass} ${active ? 'nav-item-active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={20} className="nav-icon" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          <span className="user-chip" title={username ? `@${username}` : 'User'}>
            @{username || 'user'}
          </span>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <p className="topbar-context">
            {NAV.find((n) => n.id === activeTab)?.label ?? 'NeoBank'}
          </p>
          <div className="topbar-actions">
            <button
              type="button"
              className="cmdk-trigger"
              onClick={() => setCmdkOpen(true)}
              aria-label="Open command palette"
            >
              <span>Search</span>
              <kbd>⌘K</kbd>
            </button>
            <ThemeToggle theme={theme} onToggle={onThemeToggle} />
            <button
              type="button"
              className={`mode-chip ${isLiveMode ? 'mode-chip-live' : ''}`}
              onClick={onToggleLiveMode}
              aria-pressed={isLiveMode}
            >
              {isLiveMode ? `Live · ${backendStatus}` : 'Simulation'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onSignOut}>
              Sign out
            </button>
          </div>
        </header>

        <main id="main" className="main-content" key={activeTab}>
          {children}
        </main>

        <footer className="app-footer">
          <span>NeoBank</span>
          <span className="text-muted">Banking · PayFlow · ClearLedger</span>
        </footer>
      </div>
    </div>
  );
}

export function AuthLayout({
  authMode,
  onAuthModeChange,
  theme,
  onThemeToggle,
  isLiveMode,
  onToggleLiveMode,
  children,
}: {
  authMode: 'login' | 'signup';
  onAuthModeChange: (mode: 'login' | 'signup') => void;
  theme: Theme;
  onThemeToggle: () => void;
  isLiveMode: boolean;
  onToggleLiveMode: () => void;
  children: ReactNode;
}) {
  return (
    <div className="auth-shell">
      <header className="auth-top">
        <div className="sidebar-brand">
          <IconAuth className="brand-icon text-accent" aria-hidden />
          <span className="brand-text">NeoBank</span>
        </div>
        <div className="topbar-actions">
          <ThemeToggle theme={theme} onToggle={onThemeToggle} />
          <button
            type="button"
            className={`mode-chip ${isLiveMode ? 'mode-chip-live' : ''}`}
            onClick={onToggleLiveMode}
            aria-pressed={isLiveMode}
          >
            {isLiveMode ? 'Live API' : 'Simulation'}
          </button>
        </div>
      </header>

      <div className="auth-center">
        <PanelAuth
          authMode={authMode}
          onAuthModeChange={onAuthModeChange}
          isLiveMode={isLiveMode}
        >
          {children}
        </PanelAuth>
      </div>
    </div>
  );
}

function PanelAuth({
  authMode,
  onAuthModeChange,
  isLiveMode,
  children,
}: {
  authMode: 'login' | 'signup';
  onAuthModeChange: (mode: 'login' | 'signup') => void;
  isLiveMode: boolean;
  children: ReactNode;
}) {
  return (
    <div className="panel panel-glow auth-panel">
      <div className="auth-head">
        <h1 className="page-title">{authMode === 'login' ? 'Sign in' : 'Create account'}</h1>
        <p className="page-desc">
          {authMode === 'login'
            ? 'Access your accounts and wallet.'
            : 'Register and open your first bank account.'}
        </p>
      </div>

      <div className="segmented" role="tablist" aria-label="Authentication mode">
        <button
          type="button"
          role="tab"
          aria-selected={authMode === 'login'}
          className={`segmented-item ${authMode === 'login' ? 'segmented-active' : ''}`}
          onClick={() => onAuthModeChange('login')}
        >
          <IconAuth size={16} />
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={authMode === 'signup'}
          className={`segmented-item ${authMode === 'signup' ? 'segmented-active' : ''}`}
          onClick={() => onAuthModeChange('signup')}
        >
          <IconProfile size={16} />
          Sign up
        </button>
      </div>

      {children}

      <p className="auth-hint text-muted">
        {isLiveMode ? (
          'Connected to Spring Boot API on port 8081.'
        ) : (
          <>
            Demo: <strong>jane@neobank.com</strong> / <strong>Password123!</strong>
          </>
        )}
      </p>
    </div>
  );
}
