import { Sparkles } from 'lucide-react';
import useCountUp from '../../hooks/useCountUp';

export const FONT = "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const TONES = {
  primary: 'var(--primary)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
  info: 'var(--info)',
  muted: 'var(--text-muted)',
};

function resolveTone(tone) {
  if (tone && TONES[tone]) return TONES[tone];
  return TONES.primary;
}

export function toneOf(tone) {
  return resolveTone(tone);
}

export const cardStyle = {
  background: 'var(--surface, #fff)',
  border: '1px solid var(--border, #e2e8f0)',
  borderRadius: 'var(--radius)',
  padding: 18,
  boxShadow: 'var(--shadow-md)',
};

export function AnimatedNumber({ value, format = (v) => Math.round(v).toLocaleString('en-IN'), duration = 1000 }) {
  const v = useCountUp(value, duration);
  return <>{format(v)}</>;
}

export function Ring({ value, size = 120, stroke = 12, color = 'var(--primary)', track = 'rgba(255,255,255,0.25)', textColor = '#fff', big = false }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(100, Math.max(0, value)) / 100);
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.2,.7,.3,1)' }}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize={big ? 26 : 18} fontWeight={800} fill={textColor}>
        {Math.round(value)}%
      </text>
    </svg>
  );
}

export function Sparkline({ data, color = 'var(--primary)' }) {
  if (!data || data.length === 0) return <div style={{ height: 36 }} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 130;
  const h = 36;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * w;
    const y = h - ((d - min) / range) * (h - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const areaPts = `0,${h} ${pts} ${w},${h}`;
  const gid = `sl-${color.replace('#', '')}`;
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPts} fill={`url(#${gid})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function Kpi({ label, value, format, icon: Icon, tone, spark, ring }) {
  const c = resolveTone(tone);
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--surface, #fff)', border: '1px solid var(--border, #e2e8f0)', borderRadius: 'var(--radius)', padding: 12, boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${c}, transparent)` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
        <span style={{ display: 'inline-flex', padding: 6, borderRadius: 'var(--radius-sm)', color: c, background: `color-mix(in srgb, ${c} 15%, transparent)` }}>
          <Icon size={15} />
        </span>
      </div>
      <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 800, marginTop: 6, color: 'var(--text)', fontFamily: FONT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <AnimatedNumber value={value} format={format} />
      </div>
      <div style={{ height: 30, display: 'flex', alignItems: 'center', marginTop: 2, flex: '0 0 auto' }}>
        {ring != null
          ? <Ring value={ring} size={30} stroke={5} color={c} track="var(--border)" textColor="var(--text)" />
          : (spark && spark.length ? <Sparkline data={spark} color={c} /> : null)}
      </div>
    </div>
  );
}

export function TextKpi({ label, value, icon: Icon, tone = 'primary' }) {
  const c = resolveTone(tone);
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--surface, #fff)', border: '1px solid var(--border, #e2e8f0)', borderRadius: 'var(--radius)', padding: 12, boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${c}, transparent)` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
        <span style={{ display: 'inline-flex', padding: 6, borderRadius: 'var(--radius-sm)', color: c, background: `color-mix(in srgb, ${c} 15%, transparent)` }}>
          <Icon size={15} />
        </span>
      </div>
      <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 800, marginTop: 6, color: 'var(--text)', fontFamily: FONT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </div>
      <div style={{ height: 30, flex: '0 0 auto' }} />
    </div>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', background: 'var(--surface-2, #eef2f7)', borderRadius: 999, padding: 5, gap: 4, overflowX: 'auto', flexWrap: 'nowrap' }}>
      {options.map((o) => {
        const active = o.value === value;
        const color = o.color ? resolveTone(o.color) : 'var(--primary)';
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(active ? '' : o.value)}
            style={{
              flex: '0 0 auto', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', borderRadius: 999,
              padding: '9px 14px', fontSize: 13, fontWeight: 700,
              background: active ? color : 'transparent',
              color: active ? '#fff' : 'var(--text-sub, #64748b)',
              boxShadow: active ? `0 12px 24px -12px ${color}` : 'none',
              transition: 'all .2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}
          >
            {o.dot && <span style={{ width: 8, height: 8, borderRadius: 999, background: active ? '#fff' : color }} />}
            <span>{o.label}</span>
            {o.count != null && (
              <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 999, background: active ? 'rgba(255,255,255,0.28)' : 'var(--border, #e2e8f0)', color: active ? '#fff' : 'var(--text-sub)' }}>
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function SectionHeader({ icon: Icon, title, subtitle, tone = 'primary', action }) {
  const c = resolveTone(tone);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ display: 'inline-flex', padding: 10, borderRadius: 'var(--radius)', color: '#fff', background: `linear-gradient(135deg, ${c}, color-mix(in srgb, ${c} 82%, black))`, boxShadow: `0 12px 24px -14px ${c}` }}>
          <Icon size={18} />
        </span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 'var(--fs-md)' }}>{title}</div>
          {subtitle && <div className="small muted" style={{ marginTop: 2 }}>{subtitle}</div>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function GlassPanel({ children, style, gradient }) {
  return (
    <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', padding: 18, background: 'var(--surface, #fff)', border: '1px solid var(--border, #e2e8f0)', boxShadow: 'var(--shadow-md)', ...style }}>
      {gradient && <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 4, borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', background: gradient }} />}
      {children}
    </div>
  );
}

export function KpiGrid({ children }) {
  const kids = Array.isArray(children) ? children : [children];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: 14, columnGap: 14 }}>
      {kids.map((child, i) => (
        <div key={i} style={{ flex: '1 1 calc(25% - 11px)', minWidth: 160, maxWidth: '100%' }}>{child}</div>
      ))}
    </div>
  );
}

export function Hero({ title, subtitle, eyebrow, actions, aside, gradient, compact = false }) {
  const pad = compact ? '18px 22px' : '26px 28px';
  const titleSize = compact ? 24 : 30;
  const subSize = compact ? 13 : 14;
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, padding: pad, color: '#fff', background: gradient || 'linear-gradient(120deg, #4f46e5, #4338ca)', boxShadow: '0 24px 55px -28px rgba(79,70,229,0.75)' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 18% 18%, rgba(255,255,255,0.28), transparent 42%), radial-gradient(circle at 82% 0%, rgba(255,255,255,0.18), transparent 38%)' }} />
      <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ minWidth: 280 }}>
          {eyebrow && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.9 }}>
              <Sparkles size={compact ? 15 : 18} />
              <span style={{ letterSpacing: 1, fontSize: compact ? 11 : 12, textTransform: 'uppercase', fontWeight: 700 }}>{eyebrow}</span>
            </div>
          )}
          <h1 style={{ margin: '8px 0 4px', fontSize: titleSize, fontWeight: 800, fontFamily: FONT }}>{title}</h1>
          <p style={{ margin: 0, maxWidth: 560, opacity: 0.92, fontSize: subSize, lineHeight: 1.5 }}>{subtitle}</p>
          {actions && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: compact ? 14 : 18 }}>{actions}</div>}
        </div>
        {aside && <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>{aside}</div>}
      </div>
    </div>
  );
}
