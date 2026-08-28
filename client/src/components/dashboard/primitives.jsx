import useCountUp from '../../hooks/useCountUp';

export const FONT = "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const TONES = {
  primary: 'var(--primary)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger:  'var(--danger)',
  info:    'var(--info)',
  muted:   'var(--text-muted)',
};

function resolveTone(tone) {
  if (tone && TONES[tone]) return TONES[tone];
  return TONES.primary;
}
export function toneOf(tone) { return resolveTone(tone); }

export const cardStyle = {
  background: 'var(--surface, #fff)',
  border: '1px solid var(--border, #e2e8f0)',
  borderRadius: 'var(--radius)',
  padding: 20,
  boxShadow: 'var(--shadow-sm)',
};

export function AnimatedNumber({ value, format = (v) => Math.round(v).toLocaleString('en-IN'), duration = 1000 }) {
  const v = useCountUp(value, duration);
  return <>{format(v)}</>;
}

/* Ring — flat single-colour stroke, no gradient, no glow */
export function Ring({ value, size = 120, stroke = 12, color = 'var(--primary)', track = 'var(--border)', textColor = 'var(--text)', big = false }) {
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
        style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.25,.8,.25,1)' }}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize={big ? 24 : 16} fontWeight={800} fill={textColor} fontFamily={FONT}>
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
  const w = 130, h = 36;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * w;
    const y = h - ((d - min) / range) * (h - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const areaPts = `0,${h} ${pts} ${w},${h}`;
  const gid = `sl-${Math.abs(color.charCodeAt(0))}`;
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.20" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPts} fill={`url(#${gid})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* Kpi — flat 1px left-border accent, no top gradient stripe, no glow shadow */
export function Kpi({ label, value, format, icon: Icon, tone, spark, ring }) {
  const c = resolveTone(tone);
  return (
    <div style={{
      background: 'var(--surface, #fff)',
      border: '1px solid var(--border, #e2e8f0)',
      borderLeft: `3px solid ${c}`,
      borderRadius: 'var(--radius)',
      padding: '14px 16px',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
        <span style={{
          display: 'inline-flex', padding: 6, borderRadius: 'var(--radius-sm)',
          color: c, background: `color-mix(in srgb, ${c} 12%, var(--surface-2, #f1f5f9))`,
        }}>
          <Icon size={14} />
        </span>
      </div>
      <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 800, marginTop: 8, color: 'var(--text)', fontFamily: FONT }}>
        <AnimatedNumber value={value} format={format} />
      </div>
      <div style={{ height: 28, display: 'flex', alignItems: 'center', marginTop: 4, flex: '0 0 auto' }}>
        {ring != null
          ? <Ring value={ring} size={28} stroke={4} color={c} track="var(--border)" textColor="var(--text)" />
          : (spark && spark.length ? <Sparkline data={spark} color={c} /> : null)}
      </div>
    </div>
  );
}

export function TextKpi({ label, value, icon: Icon, tone = 'primary' }) {
  const c = resolveTone(tone);
  return (
    <div style={{
      background: 'var(--surface, #fff)',
      border: '1px solid var(--border, #e2e8f0)',
      borderLeft: `3px solid ${c}`,
      borderRadius: 'var(--radius)',
      padding: '14px 16px',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
        <span style={{
          display: 'inline-flex', padding: 6, borderRadius: 'var(--radius-sm)',
          color: c, background: `color-mix(in srgb, ${c} 12%, var(--surface-2, #f1f5f9))`,
        }}>
          <Icon size={14} />
        </span>
      </div>
      <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 800, marginTop: 8, color: 'var(--text)', fontFamily: FONT }}>
        {value}
      </div>
      <div style={{ height: 28, flex: '0 0 auto' }} />
    </div>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', background: 'var(--surface-2, #f1f5f9)', borderRadius: 999, padding: 4, gap: 3, overflowX: 'auto', flexWrap: 'nowrap', border: '1px solid var(--border)' }}>
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
              padding: '7px 14px', fontSize: 13, fontWeight: 600,
              background: active ? color : 'transparent',
              color: active ? '#fff' : 'var(--text-muted)',
              /* No glow shadow on active — just flat color */
              boxShadow: 'none',
              transition: 'background 150ms, color 150ms',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}
          >
            {o.dot && <span style={{ width: 7, height: 7, borderRadius: 999, background: active ? '#fff' : color }} />}
            <span>{o.label}</span>
            {o.count != null && (
              <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 999, background: active ? 'rgba(255,255,255,0.22)' : 'var(--border, #e2e8f0)', color: active ? '#fff' : 'var(--text-muted)' }}>
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* SectionHeader — flat icon chip, no gradient, no glow */
export function SectionHeader({ icon: Icon, title, subtitle, tone = 'primary', action }) {
  const c = resolveTone(tone);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          display: 'inline-flex', padding: 9, borderRadius: 'var(--radius-sm)',
          color: c,
          background: `color-mix(in srgb, ${c} 12%, var(--surface-2, #f1f5f9))`,
          border: `1px solid color-mix(in srgb, ${c} 20%, var(--border))`,
        }}>
          <Icon size={17} />
        </span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 'var(--fs-md)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* GlassPanel — clean card, no gradient accent bar, no glow */
export function GlassPanel({ children, style }) {
  return (
    <div style={{
      borderRadius: 'var(--radius)',
      padding: 20,
      background: 'var(--surface, #fff)',
      border: '1px solid var(--border, #e2e8f0)',
      boxShadow: 'var(--shadow-sm)',
      ...style,
    }}>
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

/*
  Hero — the single deliberate use of the sky-blue band on dashboards.
  Flat #0EA5E9 background, white text, no extra gradients, no glow.
  Used ONCE per layout — not repeated.
*/
export function Hero({ title, subtitle, eyebrow, actions, aside, compact = false }) {
  const pad = compact ? '16px 22px' : '22px 28px';
  const titleSize = compact ? 22 : 26;
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      borderRadius: 'var(--radius)',
      padding: pad,
      color: '#fff',
      /* Single flat sky-blue — NO gradient */
      background: '#0EA5E9',
      marginBottom: 22,
    }}>
      {/* Subtle dot grid — the one allowed texture, very low opacity */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }} />
      <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ minWidth: 240 }}>
          {eyebrow && (
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.8, marginBottom: 6 }}>
              {eyebrow}
            </div>
          )}
          <h1 style={{ margin: '0 0 4px', fontSize: titleSize, fontWeight: 800, fontFamily: FONT, letterSpacing: '-0.02em' }}>{title}</h1>
          <p style={{ margin: 0, maxWidth: 540, opacity: 0.85, fontSize: 13, lineHeight: 1.55 }}>{subtitle}</p>
          {actions && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: compact ? 12 : 16 }}>{actions}</div>}
        </div>
        {aside && <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>{aside}</div>}
      </div>
    </div>
  );
}
