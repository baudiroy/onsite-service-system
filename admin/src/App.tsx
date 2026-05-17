import { useEffect, useMemo, useState } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { adminMenuItems } from './config/menu';
import { AdminLayout } from './layout/AdminLayout';
import { AuditLogPage } from './pages/AuditLogPage';
import { CaseManagementPage } from './pages/CaseManagementPage';
import { CustomerAdminPage } from './pages/CustomerAdminPage';
import { CustomerInquiryPreviewPage } from './pages/CustomerInquiryPreviewPage';
import { DashboardPage } from './pages/DashboardPage';
import { DispatchUnitAdminPage } from './pages/DispatchUnitAdminPage';
import { LineChannelAdminPage } from './pages/LineChannelAdminPage';
import { LoginPage } from './pages/LoginPage';
import { OrganizationAdminPage } from './pages/OrganizationAdminPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { UserAdminPage } from './pages/UserAdminPage';

function normalizePath(path: string) {
  if (path === '/') return '/dashboard';
  return path;
}

function usePathname() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (nextPath: string) => {
    const normalized = normalizePath(nextPath);
    if (window.location.pathname === normalized) return;
    window.history.pushState({}, '', normalized);
    setPath(normalized);
  };

  return { path, navigate };
}

function AppRoutes() {
  const { path, navigate } = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const menuPage = useMemo(() => {
    return adminMenuItems.find((item) => item.path === path);
  }, [path]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && path === '/login') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate, path]);

  if (path === '/login') {
    return <LoginPage onLoginSuccess={() => navigate('/dashboard')} />;
  }

  return (
    <ProtectedRoute onRedirect={() => navigate('/login')}>
      <AdminLayout path={path} onNavigate={navigate}>
        {path === '/dashboard' ? (
          <DashboardPage />
        ) : path === '/users' ? (
          <UserAdminPage />
        ) : path === '/organizations' ? (
          <OrganizationAdminPage />
        ) : path === '/dispatch-units' ? (
          <DispatchUnitAdminPage />
        ) : path === '/cases' ? (
          <CaseManagementPage />
        ) : path === '/customers' ? (
          <CustomerAdminPage />
        ) : path === '/customer-inquiries' ? (
          <CustomerInquiryPreviewPage />
        ) : path === '/line-channels' ? (
          <LineChannelAdminPage />
        ) : path === '/audit-logs' ? (
          <AuditLogPage />
        ) : (
          <PlaceholderPage title={menuPage?.label || '後台頁面'} description={menuPage?.description} />
        )}
      </AdminLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
