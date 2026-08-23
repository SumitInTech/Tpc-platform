import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Bell, CheckCheck, CheckCircle2, AlertTriangle, XCircle, Info, Radio } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import notificationService from '../../services/notificationService';
import { timeAgo } from '../../utils/formatters';

const TYPE_META = {
  SUCCESS: { icon: CheckCircle2, color: 'var(--success)' },
  WARNING: { icon: AlertTriangle, color: 'var(--warning)' },
  DANGER: { icon: XCircle, color: 'var(--danger)' },
  INFO: { icon: Info, color: 'var(--primary)' },
};

const categoryOf = (n) => {
  const et = (n.entityType || '').toLowerCase();
  if (et.includes('offer')) return 'Offers';
  if (et.includes('application')) return 'Applications';
  return 'Alerts';
};

const dayLabel = (dateStr) => {
  const d = new Date(dateStr);
  const now = new Date();
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((b - a) / 86400000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return 'Earlier';
};

export default function NotificationDrawer({ open, onClose }) {
  const { notifications, unreadCount, markAllRead, refreshNotifications } = useNotification();
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const chips = ['All', 'Offers', 'Applications', 'Alerts'];
  const countFor = (c) => (c === 'All' ? notifications.length : notifications.filter((n) => categoryOf(n) === c).length);
  const filtered = filter === 'All' ? notifications : notifications.filter((n) => categoryOf(n) === filter);

  const groups = { Today: [], Yesterday: [], Earlier: [] };
  filtered.forEach((n) => groups[dayLabel(n.createdAt)].push(n));

  const handleClick = async (n) => {
    if (!n.isRead) {
      try { await notificationService.markAsRead(n._id); refreshNotifications(); } catch { /* noop */ }
    }
  };

  return createPortal(
    <div className="notif-drawer-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="notif-drawer" role="dialog" aria-label="Notifications">
        <div className="notif-drawer-head">
          <span className="notif-live"><Radio size={13} /> Live</span>
          <div>
            <div className="notif-h-title">Notifications</div>
            <div className="notif-h-sub">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</div>
          </div>
          {unreadCount > 0 && (
            <button className="notif-mark" onClick={markAllRead} title="Mark all as read">
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          <button className="icon-btn notif-close" onClick={onClose} aria-label="Close notifications"><X size={18} /></button>
        </div>

        <div className="notif-chips">
          {chips.map((c) => (
            <button key={c} className={`notif-chip ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>
              {c} <span className="notif-chip-c">{countFor(c)}</span>
            </button>
          ))}
        </div>

        <div className="notif-drawer-body">
          {filtered.length === 0 ? (
            <div className="notif-empty">
              <div className="bell-float"><Bell size={40} /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>You're all set</div>
                <div className="small muted mt-1">New updates about applications, offers and policies will land here.</div>
              </div>
            </div>
          ) : (
            Object.entries(groups).map(([label, items]) =>
              items.length ? (
                <div key={label}>
                  <div className="notif-group-label">{label}</div>
                  {items.map((n, i) => {
                    const meta = TYPE_META[n.type] || TYPE_META.INFO;
                    const Icon = meta.icon;
                    return (
                      <button
                        key={n._id}
                        className={`notif-card ${n.isRead ? '' : 'unread'}`}
                        data-type={n.type}
                        style={{ animationDelay: `${i * 45}ms` }}
                        onClick={() => handleClick(n)}
                      >
                        <span className="notif-spine" />
                        <span className="notif-ic"><Icon size={16} /></span>
                        <span className="notif-body">
                          <span className="notif-top">
                            <span className="notif-title">{n.title}</span>
                            {!n.isRead && <span className="notif-new">NEW</span>}
                          </span>
                          <span className="notif-msg">{n.message}</span>
                          <span className="notif-time">{timeAgo(n.createdAt)}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null
            )
          )}
        </div>
      </aside>
    </div>,
    document.body
  );
}
