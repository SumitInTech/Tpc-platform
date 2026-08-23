import { STATUS_BADGE_TONE } from '../../constants';
import { labelize } from '../../utils/formatters';

const toneStyles = {
  success: { background: 'var(--success-soft)', color: 'var(--success-text)' },
  danger: { background: 'var(--danger-soft)', color: 'var(--danger-text)' },
  warning: { background: 'var(--warning-soft)', color: 'var(--warning-text)' },
  info: { background: 'var(--info-soft)', color: 'var(--info-text)' },
  primary: { background: 'var(--primary-soft)', color: 'var(--primary-soft-text)' },
  neutral: { background: 'var(--surface-2)', color: 'var(--text-muted)' },
};

const Badge = ({ status, tone, children }) => {
  const t = tone || STATUS_BADGE_TONE[status] || 'neutral';
  return (
    <span className="badge" style={toneStyles[t]}>
      <span className="badge-dot" aria-hidden />
      {children || labelize(status)}
    </span>
  );
};

export default Badge;
