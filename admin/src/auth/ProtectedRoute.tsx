import { useAuth } from './AuthContext';
import { useEffect } from 'react';

export function ProtectedRoute({ children, onRedirect }: { children: React.ReactNode; onRedirect: () => void }) {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      onRedirect();
    }
  }, [isAuthenticated, isLoading, onRedirect]);

  if (isLoading) {
    return (
      <div className="full-page-state">
        <div className="spinner" />
        <span>正在確認登入狀態...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
