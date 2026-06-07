import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

export function IconAuth({ size = 20, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} {...rest}>
      <path d="M12 3 4 7v5c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V7l-8-4Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function IconProfile({ size = 20, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} {...rest}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5" />
    </svg>
  );
}

export function IconAccount({ size = 20, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} {...rest}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18M7 15h4" />
    </svg>
  );
}

export function IconTransactions({ size = 20, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} {...rest}>
      <path d="M7 7h10M7 12h7M7 17h10" />
      <path d="m5 7 2-2 2 2M19 17l-2 2-2-2" />
    </svg>
  );
}

export function IconLedger({ size = 20, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} {...rest}>
      <path d="M6 4h12v16H6z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}

export function IconWallet({ size = 20, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} {...rest}>
      <path d="M3 7h15a3 3 0 0 1 3 3v7H6a3 3 0 0 1-3-3V7Z" />
      <path d="M18 10h3v4h-3a2 2 0 1 1 0-4Z" />
      <path d="M3 7V6a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

export function IconSun({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} {...rest}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

export function IconMoon({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} {...rest}>
      <path d="M20 14.5A7.5 7.5 0 0 1 9.5 4 6.5 6.5 0 1 0 20 14.5Z" />
    </svg>
  );
}

export function IconPlus({ size = 16, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} {...rest}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconClose({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} {...rest}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function IconClearLedger({ size = 20, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} {...rest}>
      <path d="M4 19h16M6 16V8m6 8V5m6 11V10" />
    </svg>
  );
}

export function IconLogo({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} {...rest}>
      <path d="M4 12h16" />
      <path d="M12 4v16" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}
