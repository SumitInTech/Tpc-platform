import { Bell, CheckCheck } from 'lucide-react';
import notificationService from '../../services/notificationService';
import { useNotification } from '../../context/NotificationContext';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import { timeAgo } from '../../utils/formatters';

export default function NotificationsPage() {
  const { notifications, markAllRead, refreshNotifications } = useNotification();

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-desc">Application updates, offers and policy decisions that involve you.</p>
        </div>
        {notifications.some((n) => !n.isRead) && (
          <Button variant="secondary" icon={CheckCheck} onClick={markAllRead}>Mark all read</Button>
        )}
      </div>

      <Card pad="sm">
        {notifications.length === 0 ? (
          <EmptyState icon={Bell} title="Nothing here yet"
            description="You'll be notified when drives publish, your applications move forward, or you receive offers." />
        ) : (
          notifications.map((n) => (
            <div key={n._id} className={`notif-row ${n.isRead ? '' : 'unread'}`} style={{ borderRadius: 8 }}>
              <div style={{ flex: 1 }}>
                <div className="notif-title">{n.title}</div>
                <div className="notif-msg">{n.message}</div>
              </div>
              <span className="small muted" style={{ whiteSpace: 'nowrap' }}>{timeAgo(n.createdAt)}</span>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
