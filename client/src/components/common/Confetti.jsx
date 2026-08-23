import { useEffect, useRef } from 'react';

const COLORS = ['#6366F1', '#8B5CF6', '#06B6D4', '#F59E0B', '#10B981', '#EF4444', '#EC4899'];

export default function Confetti({ trigger, count = 90 }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!trigger) return undefined;
    const container = ref.current;
    if (!container) return undefined;

    const pieces = [];
    for (let i = 0; i < count; i += 1) {
      const p = document.createElement('div');
      const size = 6 + Math.random() * 8;
      p.style.position = 'absolute';
      p.style.width = `${size}px`;
      p.style.height = `${size * 1.4}px`;
      p.style.background = COLORS[i % COLORS.length];
      p.style.left = `${Math.random() * 100}vw`;
      p.style.top = '-24px';
      p.style.borderRadius = '2px';
      p.style.opacity = '0.95';
      p.style.willChange = 'transform, opacity';
      container.appendChild(p);

      const dx = (Math.random() - 0.5) * 240;
      const dy = window.innerHeight + 60;
      const rot = Math.random() * 760 - 380;
      const anim = p.animate(
        [
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
          { transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`, opacity: 0.15 },
        ],
        { duration: 1700 + Math.random() * 1300, easing: 'cubic-bezier(.2,.6,.4,1)' }
      );
      pieces.push(anim.finished.then(() => p.remove()).catch(() => {}));
    }
    return () => {
      pieces.forEach((p) => p.catch(() => {}));
    };
  }, [trigger, count]);

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}
    />
  );
}
