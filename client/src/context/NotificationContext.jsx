import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import notificationService from '../services/notificationService';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

const NotificationContext = createContext(null);

let toastId = 0;

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();
  const pollRef = useRef(null);

  const pushToast = useCallback((type, title, msg) => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, type, title, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const toast = useMemo(() => ({
    success: (title, msg) => pushToast('success', title, msg),
    error: (title, msg) => pushToast('error', title, msg),
    warning: (title, msg) => pushToast('warning', title, msg),
    info: (title, msg) => pushToast('info', title, msg),
  }), [pushToast]);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationService.getNotifications({ limit: 30 });
      setNotifications(res.data || []);
    } catch {
      /* silent — polling */
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return undefined;
    }
    refreshNotifications();
    pollRef.current = setInterval(refreshNotifications, 15000);
    return () => clearInterval(pollRef.current);
  }, [user, refreshNotifications]);

  const markAllRead = useCallback(async () => {
    // Optimistic: clear the unread count immediately for instant feedback.
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await notificationService.markAllRead();
    } catch {
      refreshNotifications(); // revert to server truth on failure
    }
  }, [refreshNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{ toast, notifications, refreshNotifications, markAllRead, unreadCount }}
    >
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === 'success' && <CheckCircle2 size={19} color="var(--success)" />}
            {t.type === 'error' && <XCircle size={19} color="var(--danger)" />}
            {t.type === 'warning' && <AlertTriangle size={19} color="var(--warning)" />}
            {t.type === 'info' && <Info size={19} color="var(--info)" />}
            <div>
              <div className="toast-title">{t.title}</div>
              {t.msg && <div className="toast-msg">{t.msg}</div>}
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);
