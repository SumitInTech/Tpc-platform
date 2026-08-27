import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, Bell, LogOut, CheckCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import NotificationDrawer from './NotificationDrawer';
import BrandLogo from '../common/BrandLogo';
import { initials, timeAgo } from '../../utils/formatters';

const PAGE_TITLES = {
  '/tpc/dashboard': ['Dashboard', 'Placement operations at a glance'],
  '/tpc/students': ['Students', 'Manage the graduating talent pool'],
  '/tpc/companies': ['Companies', 'Recruiting partners'],
  '/tpc/drives': ['Drives', 'Configure rules once — enforce them everywhere'],
  '/tpc/applications': ['Applications', 'Track every candidate through the funnel'],
  '/tpc/offers': ['Offers', 'Policy-enforced offer management'],
  '/tpc/placements': ['Placement Records', 'Auditable placement lifecycle'],
  '/tpc/policies': ['Placement Policies', 'Institution-defined guardrails'],
  '/tpc/reports': ['Reports', 'NIRF-oriented placement analytics'],
  '/tpc/audit-logs': ['Audit Logs', 'Who did what, when'],
  '/student/dashboard': ['Dashboard', 'Your placement journey'],
  '/student/drives': ['Open Drives', 'Drives matching your eligibility'],
  '/student/applications': ['My Applications', 'Live status of everything you applied to'],
  '/student/offers': ['My Offers', 'Review and respond to offers'],
  '/student/placement-status': ['Placement Status', 'Where you stand'],
  '/student/profile': ['Profile', 'Your academic record used for eligibility'],
  '/student/notifications': ['Notifications', 'Everything that happened while you were away'],
};

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { pref, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAllRead, refreshNotifications } = useNotification();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      // The notification drawer is portaled to document.body, so it sits outside this
      // header. Clicks inside the drawer must NOT be treated as "outside" (otherwise
      // interacting with it — e.g. filter chips — would close it).
      if (e.target instanceof Element && e.target.closest('.notif-drawer-overlay')) return;
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setNotifOpen(false);
        setUserOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const path = window.location.hash ? '' : window.location.pathname;
  const [title, subtitle] = PAGE_TITLES[path] || ['TPC Flow', ''];

  const ThemeIcon = pref === 'dark' ? Moon : Sun;

  return (
    <header className="topbar" ref={wrapRef}>
      <button className="icon-btn" onClick={onMenuClick} aria-label="Open navigation menu">
        <Menu size={18} />
      </button>

      <div className="topbar-logo">
        <BrandLogo size={32} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="topbar-title">{title}</div>
        <div className="topbar-sub">{subtitle}</div>
      </div>

      <button
        className="icon-btn"
        onClick={toggleTheme}
        title={`Theme: ${pref === 'dark' ? 'Dark' : 'Light'}. Click to switch.`}
        aria-label={`Theme: ${pref === 'dark' ? 'Dark' : 'Light'}. Click to switch.`}
      >
        <ThemeIcon size={17} />
      </button>

      <div style={{ position: 'relative' }}>
        <button
          className="icon-btn"
          onClick={() => {
            setNotifOpen((o) => !o);
            setUserOpen(false);
            refreshNotifications();
          }}
          aria-label={`Notifications (${unreadCount} unread)`}
        >
          <Bell size={17} />
          {unreadCount > 0 && <span className="notif-dot" aria-hidden />}
        </button>

        {notifOpen && (
          <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <button
          className="user-chip"
          onClick={() => {
            setUserOpen((o) => !o);
            setNotifOpen(false);
          }}
          aria-haspopup="menu"
        >
          <span className="avatar">{initials(user?.name)}</span>
          <span className="user-chip-name">{user?.name}</span>
        </button>

        {userOpen && (
          <div className="dropdown-panel" style={{ minWidth: 220 }} role="menu">
            <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{user?.name}</div>
              <div className="small muted">{user?.email}</div>
              <span className="badge mt-1" style={{ background: 'var(--primary-soft)', color: 'var(--primary-soft-text)' }}>
                {user?.role}
              </span>
            </div>
            {user?.role === 'STUDENT' && (
              <button
                className="nav-item"
                role="menuitem"
                onClick={() => {
                  setUserOpen(false);
                  navigate('/student/profile');
                }}
              >
                My Profile
              </button>
            )}
            <button className="nav-item" role="menuitem" onClick={logout} style={{ color: 'var(--danger-text)' }}>
              <LogOut size={15} /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
