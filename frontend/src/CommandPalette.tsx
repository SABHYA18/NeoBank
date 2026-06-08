import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export type Command = {
  id: string;
  label: string;
  group: string;
  icon?: ReactNode;
  hint?: string;
  keywords?: string;
  run: () => void;
};

/**
 * Rendered only while open (parent mounts/unmounts it), so component state is
 * always fresh on open — no reset effect needed.
 */
export function CommandPalette({
  onClose,
  commands,
}: {
  onClose: () => void;
  commands: Command[];
}) {
  const [query, setQuery] = useState('');
  const [rawActive, setRawActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) =>
      `${c.label} ${c.group} ${c.keywords ?? ''}`.toLowerCase().includes(q),
    );
  }, [query, commands]);

  // Clamp the highlighted index to the current result set without an effect.
  const active = Math.min(rawActive, Math.max(0, filtered.length - 1));

  // focus the input on mount (DOM side-effect, not state)
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setRawActive((a) => (a + 1) % Math.max(1, filtered.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setRawActive((a) => (a - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = filtered[active];
        if (cmd) {
          onClose();
          cmd.run();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filtered, active, onClose]);

  useEffect(() => {
    listRef.current
      ?.querySelector('.cmdk-item-active')
      ?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  let lastGroup = '';

  return (
    <div className="cmdk-backdrop" role="presentation" onClick={onClose}>
      <div
        className="cmdk"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cmdk-input-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--text-muted)' }} aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            className="cmdk-input"
            placeholder="Jump to anything, run a command…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="cmdk-list" ref={listRef}>
          {filtered.length === 0 ? (
            <p className="cmdk-empty">No results for “{query}”.</p>
          ) : (
            filtered.map((cmd, i) => {
              const showGroup = cmd.group !== lastGroup;
              lastGroup = cmd.group;
              return (
                <div key={cmd.id}>
                  {showGroup && <div className="cmdk-group-label">{cmd.group}</div>}
                  <button
                    type="button"
                    className={`cmdk-item ${i === active ? 'cmdk-item-active' : ''}`}
                    onMouseMove={() => setRawActive(i)}
                    onClick={() => {
                      onClose();
                      cmd.run();
                    }}
                  >
                    {cmd.icon}
                    <span>{cmd.label}</span>
                    {cmd.hint && <span className="cmdk-hint">{cmd.hint}</span>}
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="cmdk-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
