import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from './prefersReducedMotion';

const COUNT_UP_MS = 900;

function format(n: number, decimals: number) {
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Animates a pre-formatted figure (e.g. "₹2,48,910.00", "3", "Not active")
 * by counting up to its numeric value while preserving the original
 * prefix/suffix and Indian digit grouping. Non-numeric strings — or any value
 * under reduced-motion — render verbatim with no animation.
 */
const NUMBER_RE = /-?[\d,]*\.?\d+/;

export function AnimatedNumber({ value, className }: { value: string; className?: string }) {
  const animatable = NUMBER_RE.test(value) && !prefersReducedMotion();

  const [display, setDisplay] = useState(value);
  const fromRef = useRef(0);

  // Re-parse from `value` inside the effect so the dependency is a stable
  // string, not a fresh RegExp match array (which would restart every render).
  useEffect(() => {
    const match = value.match(NUMBER_RE);
    if (!match || prefersReducedMotion()) return;

    const target = parseFloat(match[0].replace(/,/g, ''));
    const prefix = value.slice(0, match.index);
    const suffix = value.slice((match.index ?? 0) + match[0].length);
    const decimals = match[0].includes('.') ? (match[0].split('.')[1]?.length ?? 0) : 0;

    const from = fromRef.current;
    const delta = target - from;
    let raf = 0;
    let start = 0;

    const step = (ts: number) => {
      if (!start) start = ts;
      const t = Math.min(1, (ts - start) / COUNT_UP_MS);
      const eased = 1 - Math.pow(1 - t, 4); // easeOutQuart
      setDisplay(prefix + format(from + delta * eased, decimals) + suffix);
      if (t < 1) raf = requestAnimationFrame(step);
      else fromRef.current = target;
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  // Static values (non-numeric, or reduced-motion) render the prop directly.
  return (
    <span className={`tabnum ${className ?? ''}`.trim()}>{animatable ? display : value}</span>
  );
}
