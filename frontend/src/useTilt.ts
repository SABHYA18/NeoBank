import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from './prefersReducedMotion';

/**
 * Pointer-tracked 3D tilt + light follow for cards. Sets --mx/--my (for the
 * specular highlight) and a subtle rotateX/rotateY transform. No-op under
 * reduced-motion or on coarse (touch) pointers.
 */
export function useTilt<T extends HTMLElement>(max = 6) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || window.matchMedia('(pointer: coarse)').matches) return;

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--mx', `${px * 100}%`);
        el.style.setProperty('--my', `${py * 100}%`);
        const ry = (px - 0.5) * max * 2;
        const rx = (0.5 - py) * max * 2;
        el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      el.style.transform = '';
      el.style.removeProperty('--mx');
      el.style.removeProperty('--my');
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [max]);

  return ref;
}
