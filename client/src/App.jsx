import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/layout/Layout';
import Skeleton from './components/common/Skeleton';

import LoginPage from './pages/auth/LoginPage';

import TPCDashboard from './pages/tpc/TPCDashboard';
import StudentsPage from './pages/tpc/StudentsPage';
import CompaniesPage from './pages/tpc/CompaniesPage';
import DrivesPage from './pages/tpc/DrivesPage';
import DriveCreatePage from './pages/tpc/DriveCreatePage';
import DriveDetailPage from './pages/tpc/DriveDetailPage';
import ApplicationsPage from './pages/tpc/ApplicationsPage';
import OffersPage from './pages/tpc/OffersPage';
import PoliciesPage from './pages/tpc/PoliciesPage';
import PlacementsPage from './pages/tpc/PlacementsPage';
import ReportsPage from './pages/tpc/ReportsPage';
import AuditLogsPage from './pages/tpc/AuditLogsPage';

import StudentDashboard from './pages/student/StudentDashboard';
import StudentDrivesPage from './pages/student/StudentDrivesPage';
import StudentDriveDetailPage from './pages/student/StudentDriveDetailPage';
import StudentApplicationsPage from './pages/student/StudentApplicationsPage';
import StudentOffersPage from './pages/student/StudentOffersPage';
import StudentProfilePage from './pages/student/StudentProfilePage';
import StudentPlacementStatusPage from './pages/student/StudentPlacementStatusPage';
import NotificationsPage from './pages/student/NotificationsPage';

function BootSplash() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }} aria-busy="true">
      <div style={{ width: 320 }}>
        <Skeleton variant="title" />
        <Skeleton />
        <Skeleton />
        <div className="mt-3" />
        <Skeleton variant="card" />
      </div>
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <BootSplash />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'STUDENT' ? '/student/dashboard' : '/tpc/dashboard'} replace />;
  }
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <BootSplash />;
  if (user) return <Navigate to={user.role === 'STUDENT' ? '/student/dashboard' : '/tpc/dashboard'} replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

              {/* TPC + Admin */}
              <Route path="/tpc/dashboard" element={<ProtectedRoute allowedRoles={['TPC_OFFICER', 'ADMIN']}><TPCDashboard /></ProtectedRoute>} />
              <Route path="/tpc/students" element={<ProtectedRoute allowedRoles={['TPC_OFFICER', 'ADMIN']}><StudentsPage /></ProtectedRoute>} />
              <Route path="/tpc/companies" element={<ProtectedRoute allowedRoles={['TPC_OFFICER', 'ADMIN']}><CompaniesPage /></ProtectedRoute>} />
              <Route path="/tpc/drives" element={<ProtectedRoute allowedRoles={['TPC_OFFICER', 'ADMIN']}><DrivesPage /></ProtectedRoute>} />
              <Route path="/tpc/drives/create" element={<ProtectedRoute allowedRoles={['TPC_OFFICER', 'ADMIN']}><DriveCreatePage /></ProtectedRoute>} />
              <Route path="/tpc/drives/:id" element={<ProtectedRoute allowedRoles={['TPC_OFFICER', 'ADMIN']}><DriveDetailPage /></ProtectedRoute>} />
              <Route path="/tpc/applications" element={<ProtectedRoute allowedRoles={['TPC_OFFICER', 'ADMIN']}><ApplicationsPage /></ProtectedRoute>} />
              <Route path="/tpc/offers" element={<ProtectedRoute allowedRoles={['TPC_OFFICER', 'ADMIN']}><OffersPage /></ProtectedRoute>} />
              <Route path="/tpc/policies" element={<ProtectedRoute allowedRoles={['TPC_OFFICER', 'ADMIN']}><PoliciesPage /></ProtectedRoute>} />
              <Route path="/tpc/placements" element={<ProtectedRoute allowedRoles={['TPC_OFFICER', 'ADMIN']}><PlacementsPage /></ProtectedRoute>} />
              <Route path="/tpc/reports" element={<ProtectedRoute allowedRoles={['TPC_OFFICER', 'ADMIN']}><ReportsPage /></ProtectedRoute>} />
              <Route path="/tpc/audit-logs" element={<ProtectedRoute allowedRoles={['TPC_OFFICER', 'ADMIN']}><AuditLogsPage /></ProtectedRoute>} />

              {/* Student */}
              <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
              <Route path="/student/drives" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDrivesPage /></ProtectedRoute>} />
              <Route path="/student/drives/:id" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDriveDetailPage /></ProtectedRoute>} />
              <Route path="/student/applications" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentApplicationsPage /></ProtectedRoute>} />
              <Route path="/student/offers" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentOffersPage /></ProtectedRoute>} />
              <Route path="/student/placement-status" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentPlacementStatusPage /></ProtectedRoute>} />
              <Route path="/student/profile" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentProfilePage /></ProtectedRoute>} />
              <Route path="/student/notifications" element={<ProtectedRoute allowedRoles={['STUDENT']}><NotificationsPage /></ProtectedRoute>} />

              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
