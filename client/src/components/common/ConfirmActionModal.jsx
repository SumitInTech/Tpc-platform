import { useEffect } from 'react';

/*
  ConfirmActionModal — flat, clean, no glassmorphism.
  Status tone shown as a 1px left-border accent on the header band,
  not as a gradient background. No backdrop-filter on modal surface.
*/
const TONE_MAP = {
  primary: { color: '#0EA5E9', soft: '#E0F2FE' },
  success: { color: '#16A34A', soft: '#DCFCE7' },
  warning: { color: '#D97706', soft: '#FEF3C7' },
  danger:  { color: '#DC2626', soft: '#FEE2E2' },
  info:    { color: '#0284C7', soft: '#E0F2FE' },
};

export default function ConfirmActionModal({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  tone = 'danger', icon: Icon, loading = false, onConfirm, onCancel,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape' && !loading) onCancel?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const { color, soft } = TONE_MAP[tone] || TONE_MAP.danger;

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        background: 'rgba(15,23,42,0.45)',
        /* No backdrop-filter — avoid glassmorphism */
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 440,
          background: 'var(--surface, #fff)',
          borderRadius: 'var(--radius-lg, 16px)',
          border: '1px solid var(--border, #e2e8f0)',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
          animation: 'modalPop .24s cubic-bezier(.25,.8,.25,1)',
        }}
      >
        {/* Header — flat soft tint, no gradient, 3px left accent */}
        <div style={{
          padding: '24px 24px 16px',
          background: soft,
          borderBottom: `3px solid ${color}`,
          textAlign: 'center',
        }}>
          {/* Icon — flat soft chip */}
          <div style={{
            width: 52, height: 52, margin: '0 auto 14px',
            borderRadius: 14,
            background: `color-mix(in srgb, ${color} 14%, white)`,
            border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color,
          }}>
            {Icon ? <Icon size={26} /> : <span style={{ fontSize: 24, fontWeight: 800, color }}>!</span>}
          </div>
          <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text, #0f172a)' }}>
            {title}
          </h3>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 24px 8px' }}>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: 'var(--text-muted, #64748b)' }}>{message}</p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, padding: '16px 24px 24px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn"
            style={{ flex: 1, background: color, color: '#fff', borderColor: 'transparent' }}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading
              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin .7s linear infinite' }} />
                  Working…
                </span>
              : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
