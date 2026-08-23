import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="app-shell">
      <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="main-area">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="page-content" key={location.pathname}>
          <div className="page-enter">{children}</div>
        </main>
      </div>
    </div>
  );
}
