import { NavLink, useLocation } from 'react-router-dom';
import { GraduationCap, LogOut, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, Building2, Megaphone, ClipboardList, Handshake,
  ShieldCheck, Award, BarChart3, ScrollText, Briefcase,
  FileText, Bell,
} from 'lucide-react';

const TPC_NAV = [
  {
    label: 'Overview',
    items: [{ to: '/tpc/dashboard', icon: LayoutDashboard, text: 'Dashboard' }],
  },
  {
    label: 'Management',
    items: [
      { to: '/tpc/students', icon: Users, text: 'Students' },
      { to: '/tpc/companies', icon: Building2, text: 'Companies' },
      { to: '/tpc/drives', icon: Megaphone, text: 'Drives' },
    ],
  },
  {
    label: 'Workflow',
    items: [
      { to: '/tpc/applications', icon: ClipboardList, text: 'Applications' },
      { to: '/tpc/offers', icon: Handshake, text: 'Offers' },
      { to: '/tpc/placements', icon: Award, text: 'Placements' },
    ],
  },
  {
    label: 'Governance',
    items: [
      { to: '/tpc/policies', icon: ShieldCheck, text: 'Policies' },
      { to: '/tpc/reports', icon: BarChart3, text: 'Reports' },
      { to: '/tpc/audit-logs', icon: ScrollText, text: 'Audit Logs', adminOnly: true },
    ],
  },
];

const STUDENT_NAV = [
  {
    label: 'My Placement',
    items: [
      { to: '/student/dashboard', icon: LayoutDashboard, text: 'Dashboard' },
      { to: '/student/drives', icon: Briefcase, text: 'Open Drives' },
      { to: '/student/applications', icon: FileText, text: 'My Applications' },
      { to: '/student/offers', icon: Handshake, text: 'My Offers' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/student/placement-status', icon: Award, text: 'Placement Status' },
      { to: '/student/profile', icon: Users, text: 'Profile' },
      { to: '/student/notifications', icon: Bell, text: 'Notifications' },
    ],
  },
];

function NavItem({ to, icon: Icon, text }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <NavLink to={to} className={`nav-item ${active ? 'active' : ''}`} onClick={() => window.dispatchEvent(new Event('tpc:navigate'))} end>
      <Icon size={17} />
      {text}
    </NavLink>
  );
}

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const isStudent = user?.role === 'STUDENT';
  const nav = isStudent ? STUDENT_NAV : TPC_NAV;

  return (
    <>
      {open && <div className="sidebar-scrim" onClick={onClose} aria-hidden />}
      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Main navigation">
        <div className="sidebar-brand">
          <div className="brand-logo" style={isStudent ? { borderRadius: '50%' } : undefined}>
            <GraduationCap size={21} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {isStudent ? (
              <>
                <div className="brand-name" style={{ fontSize: 14.5 }}>{user?.name}</div>
                <div className="brand-tagline">Student Portal</div>
              </>
            ) : (
              <>
                <div className="brand-name">TPC Flow</div>
                <div className="brand-tagline">Placement Operations, Simplified.</div>
              </>
            )}
          </div>
          <button
            className="icon-btn"
            style={{ width: 30, height: 30, display: 'none' }}
            onClick={onClose}
            aria-label="Close navigation menu"
            data-mobile-close
          >
            <X size={15} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {nav.map((section) => {
            const items = section.items.filter((item) => !item.adminOnly || user?.role === 'ADMIN');
            if (items.length === 0) return null;
            return (
              <div key={section.label}>
                <div className="nav-section-label">{section.label}</div>
                {items.map((item) => (
                  <NavItem key={item.to} {...item} />
                ))}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {!isStudent && (
            <>
              <div className="avatar">{(user?.name || '?').slice(0, 1)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 650, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name}
                </div>
                <div className="user-chip-role">{user?.role === 'ADMIN' ? 'Administrator' : 'TPC Officer'}</div>
              </div>
              <button className="icon-btn" onClick={logout} title="Sign out" aria-label="Sign out" style={{ width: 32, height: 32 }}>
                <LogOut size={15} />
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
