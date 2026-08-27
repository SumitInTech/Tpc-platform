import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';

function useCountUp(target, decimals = 0, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (typeof target !== 'number' || isNaN(target)) { setVal(target); return; }
    let raf;
    const start = performance.now();
    const from = 0;
    const factor = Math.pow(10, decimals);
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round((from + (target - from) * eased) * factor) / factor);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, decimals, duration]);
  return val;
}

const ACCENTS = {
  primary: { color: 'var(--primary)' },
  success: { color: 'var(--success)' },
  warning: { color: 'var(--warning)' },
  danger:  { color: 'var(--danger)' },
  info:    { color: 'var(--info)' },
};

const StatCard = ({ icon: Icon, label, value, accent, tone = 'primary', suffix, decimals = 0, loading, onClick }) => {
  const key = accent || tone || 'primary';
  const a = ACCENTS[key] || ACCENTS.primary;
  const clickable = !!onClick;
  const animated = useCountUp(typeof value === 'number' ? value : 0, decimals);
  const display = typeof value === 'number' ? animated : value;
  const formatted = typeof display === 'number' ? display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : display;

  const handle = (e) => { if (clickable) onClick(e); };

  return (
    <div
      className={`card stat-card${clickable ? ' stat-click' : ''}`}
      style={{ '--accent': a.color }}
      onClick={handle}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handle(e); } } : undefined}
    >
      <div className="stat-icon" style={{ background: `color-mix(in srgb, ${a.color} 16%, transparent)`, color: a.color }}>
        {Icon && <Icon size={20} />}
      </div>
      <div className="stat-value">
        {loading ? <span className="skeleton sk-line" style={{ width: 80, display: 'inline-block' }} /> : formatted}
        {suffix && !loading && <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text-muted)' }}>{suffix}</span>}
      </div>
      <div className="stat-label">{label}</div>
      {clickable && <span className="stat-go" aria-hidden="true"><ArrowUpRight size={16} /></span>}
    </div>
  );
};

export default StatCard;
