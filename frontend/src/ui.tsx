import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { IconClose, IconMoon, IconSun } from './icons';
import type { Theme } from './useTheme';
import { AnimatedNumber } from './motion';
import { useTilt } from './useTilt';

export type TabId = 'dashboard' | 'transactions' | 'ledger' | 'wallet' | 'clearledger' | 'profile';

export function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="btn-icon glow-hover"
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      title={theme === 'light' ? 'Dark mode' : 'Light mode'}
    >
      {theme === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />}
    </button>
  );
}

export function Toast({
  message,
  type,
}: {
  message: string;
  type: 'success' | 'error' | 'info';
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`toast toast-${type}`}
    >
      <span className="toast-dot" aria-hidden />
      {message}
    </div>
  );
}

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="page-header">
      <h1 className="page-title">{title}</h1>
      {description ? <p className="page-desc">{description}</p> : null}
    </header>
  );
}

export function Panel({
  children,
  className = '',
  glow,
  style,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <section className={`panel ${glow ? 'panel-glow' : ''} ${className}`.trim()} style={style}>
      {children}
    </section>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="section-title">{children}</h2>;
}

export function Field({
  label,
  children,
  id,
}: {
  label: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="input" {...props} />;
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return (
    <button type="button" className={`btn btn-${variant} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}

export function SubmitButton({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }) {
  return (
    <button type="submit" className={`btn btn-${variant} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal panel panel-glow"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3 id="modal-title" className="modal-title">
            {title}
          </h3>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close">
            <IconClose />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  const ref = useTilt<HTMLDivElement>(5);
  return (
    <div className="metric-card" ref={ref}>
      <span className="metric-label">{label}</span>
      <span className="metric-value">
        <AnimatedNumber value={value} />
      </span>
    </div>
  );
}

export function MetricGrid({ children }: { children: ReactNode }) {
  return <div className="hero-grid">{children}</div>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="empty-state">{children}</p>;
}

export function Row({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`row ${className}`.trim()}>{children}</div>;
}
