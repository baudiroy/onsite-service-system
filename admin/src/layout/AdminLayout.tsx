import { adminMenuItems } from '../config/menu';
import { canShowMenuItem } from '../auth/permissions';
import { useAuth } from '../auth/AuthContext';

type AdminLayoutProps = {
  path: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
};

export function AdminLayout({ path, onNavigate, children }: AdminLayoutProps) {
  const { currentUser, logout } = useAuth();
  const visibleItems = adminMenuItems.filter((item) => canShowMenuItem(currentUser, item));

  async function handleLogout() {
    await logout();
    onNavigate('/login');
  }

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">到</div>
          <div>
            <strong>到府服務系統</strong>
            <span>Admin Console</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="後台選單">
          {visibleItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`nav-item ${path === item.path || (path === '/' && item.path === '/dashboard') ? 'active' : ''}`}
              disabled={item.disabled}
              title={item.disabled ? '後續任務開放' : item.description}
              onClick={() => onNavigate(item.path)}
            >
              <span>{item.label}</span>
              {item.disabled ? <small>待開放</small> : null}
            </button>
          ))}
        </nav>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div>
            <p className="eyebrow">後台營運</p>
            <h1>管理工作台</h1>
          </div>

          <div className="user-menu">
            <div className="user-summary">
              <strong>{currentUser?.displayName || currentUser?.email}</strong>
              <span>{currentUser?.email}</span>
            </div>
            <button type="button" className="secondary-button" onClick={handleLogout}>
              登出
            </button>
          </div>
        </header>

        <main className="content-area">{children}</main>
      </div>
    </div>
  );
}
