import { useEffect } from 'react';

const TONE_HEX = {
  primary: '#4F46E5',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#0284C7',
};

export default function ConfirmActionModal({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  tone = '#EF4444', gradient, icon: Icon, loading = false, onConfirm, onCancel,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape' && !loading) onCancel?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const toneColor = TONE_HEX[tone] || tone;
  const headGradient = gradient || `linear-gradient(135deg, ${toneColor}, ${toneColor}bb)`;

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 448, background: 'var(--surface, #fff)', borderRadius: 24, overflow: 'hidden',
          boxShadow: `0 40px 90px -34px rgba(15,23,42,0.75), 0 0 0 1px rgba(255,255,255,0.06) inset, 0 18px 50px -30px ${toneColor}aa`,
          animation: 'modalPop .32s cubic-bezier(.2,.7,.3,1)',
        }}
      >
        <div style={{ position: 'relative', padding: '30px 26px 16px', background: headGradient, color: '#fff', textAlign: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.28), transparent 60%)' }} />

          <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 14px' }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: 24, background: 'rgba(255,255,255,0.22)', animation: 'pulseRing 1.9s infinite' }} />
            <span style={{ position: 'absolute', inset: 9, borderRadius: 20, background: 'rgba(255,255,255,0.16)', animation: 'pulseRing 1.9s infinite', animationDelay: '.3s' }} />
            <div style={{ position: 'absolute', inset: 18, borderRadius: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.24)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}>
              {Icon ? <Icon size={32} /> : <span style={{ fontSize: 30, fontWeight: 800 }}>!</span>}
            </div>
          </div>

          <h3 style={{ position: 'relative', margin: 0, fontSize: 21, fontWeight: 800, letterSpacing: '-0.01em' }}>{title}</h3>
        </div>

        <div style={{ padding: '22px 26px 8px' }}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: 'var(--text-sub, #475569)' }}>{message}</p>
        </div>

        <div style={{ display: 'flex', gap: 10, padding: '20px 26px 26px' }}>
          <button
            type="button" className="btn btn-ghost" style={{ flex: 1 }}
            onClick={onCancel} disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button" className="btn btn-shimmer" style={{ flex: 1, background: headGradient, borderColor: 'transparent', color: '#fff' }}
            onClick={onConfirm} disabled={loading}
          >
            {loading ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.5)', borderTopColor: '#fff', display: 'inline-block', animation: 'spinSlow .7s linear infinite' }} /> Working…</span> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
