import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AdminUser,
  UserOrganization,
  UserRole,
  UserStatus,
  createUser,
  disableUser,
  getUser,
  listUserOrganizations,
  listUserRoles,
  listUsers,
  updateUser
} from '../api/users';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../lib/apiClient';

type UserFormState = {
  email: string;
  password: string;
  displayName: string;
  status: UserStatus;
};

type DetailState = {
  user: AdminUser | null;
  roles: UserRole[];
  organizations: UserOrganization[];
  loading: boolean;
  rolesError: string;
  organizationsError: string;
};

const DEFAULT_LIMIT = 20;

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function statusLabel(status?: string | null) {
  return status === 'disabled' ? '停用' : '啟用';
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const requestId = import.meta.env.DEV && error.requestId ? `（requestId: ${error.requestId}）` : '';
    return `${error.message || '操作失敗，請稍後再試。'}${requestId}`;
  }

  return '操作失敗，請稍後再試。';
}

function isAdminLikeUser(currentUser: ReturnType<typeof useAuth>['currentUser'], hasRole: (roleKey: string) => boolean) {
  return Boolean(currentUser?.userType === 'system' || hasRole('admin') || hasRole('system'));
}

function getInitialForm(): UserFormState {
  return {
    email: '',
    password: '',
    displayName: '',
    status: 'active'
  };
}

function validateCreateForm(form: UserFormState) {
  if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    return '請輸入有效的 Email。';
  }
  if (!form.password) return '請輸入密碼。';
  if (!form.displayName.trim()) return '請輸入顯示名稱。';
  return '';
}

export function UserAdminPage() {
  const { currentUser, hasPermission, hasRole } = useAuth();
  const canRead = hasPermission('users.read') || isAdminLikeUser(currentUser, hasRole);
  const canManage = hasPermission('users.manage') || isAdminLikeUser(currentUser, hasRole);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState<number | undefined>();
  const [limit] = useState(DEFAULT_LIMIT);
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<UserFormState>(getInitialForm);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState<Pick<UserFormState, 'displayName' | 'status'>>({
    displayName: '',
    status: 'active'
  });
  const [editError, setEditError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [disablingUserId, setDisablingUserId] = useState('');
  const [pendingDisableUser, setPendingDisableUser] = useState<AdminUser | null>(null);

  const [detailUserId, setDetailUserId] = useState('');
  const [detail, setDetail] = useState<DetailState>({
    user: null,
    roles: [],
    organizations: [],
    loading: false,
    rolesError: '',
    organizationsError: ''
  });

  const hasNextPage = useMemo(() => {
    if (typeof total === 'number') return offset + limit < total;
    return users.length === limit;
  }, [limit, offset, total, users.length]);

  const hasPreviousPage = offset > 0;

  const loadUsers = useCallback(async () => {
    if (!canRead) return;

    setLoading(true);
    setError('');

    try {
      const result = await listUsers({
        q: appliedQuery.trim() || undefined,
        status: statusFilter,
        limit,
        offset,
        sort: 'createdAtDesc'
      });
      setUsers(result.data);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [appliedQuery, canRead, limit, offset, statusFilter]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!detailUserId) return;

    let active = true;

    async function loadDetail() {
      setDetail({
        user: null,
        roles: [],
        organizations: [],
        loading: true,
        rolesError: '',
        organizationsError: ''
      });

      try {
        const user = await getUser(detailUserId);
        if (!active) return;

        const [rolesResult, organizationsResult] = await Promise.allSettled([
          listUserRoles(detailUserId),
          listUserOrganizations(detailUserId)
        ]);

        if (!active) return;

        setDetail({
          user,
          roles: rolesResult.status === 'fulfilled' ? rolesResult.value : [],
          organizations: organizationsResult.status === 'fulfilled' ? organizationsResult.value : [],
          loading: false,
          rolesError: rolesResult.status === 'rejected' ? errorMessage(rolesResult.reason) : '',
          organizationsError: organizationsResult.status === 'rejected' ? errorMessage(organizationsResult.reason) : ''
        });
      } catch (err) {
        if (!active) return;
        setDetail({
          user: null,
          roles: [],
          organizations: [],
          loading: false,
          rolesError: '',
          organizationsError: errorMessage(err)
        });
      }
    }

    void loadDetail();

    return () => {
      active = false;
    };
  }, [detailUserId]);

  function applyFilters(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setOffset(0);
    setAppliedQuery(query);
  }

  function resetCreateForm() {
    setCreateForm(getInitialForm());
    setCreateError('');
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError('');

    const validationError = validateCreateForm(createForm);
    if (validationError) {
      setCreateError(validationError);
      return;
    }

    setCreating(true);

    try {
      await createUser({
        email: createForm.email.trim(),
        password: createForm.password,
        displayName: createForm.displayName.trim(),
        status: createForm.status
      });
      setShowCreate(false);
      resetCreateForm();
      setNotice('使用者已建立。');
      setOffset(0);
      await loadUsers();
    } catch (err) {
      setCreateError(errorMessage(err));
    } finally {
      setCreateForm((current) => ({ ...current, password: '' }));
      setCreating(false);
    }
  }

  function openEdit(user: AdminUser) {
    setEditingUser(user);
    setEditForm({
      displayName: user.displayName || '',
      status: user.status
    });
    setEditError('');
  }

  async function handleUpdateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingUser) return;

    setEditError('');
    if (!editForm.displayName.trim()) {
      setEditError('請輸入顯示名稱。');
      return;
    }

    setUpdating(true);

    try {
      await updateUser(editingUser.id, {
        displayName: editForm.displayName.trim(),
        status: editForm.status
      });
      setEditingUser(null);
      setNotice('使用者已更新。');
      await loadUsers();
      if (detailUserId === editingUser.id) {
        setDetailUserId('');
      }
    } catch (err) {
      setEditError(errorMessage(err));
    } finally {
      setUpdating(false);
    }
  }

  async function performDisableUser(user: AdminUser) {
    setDisablingUserId(user.id);
    setError('');

    try {
      await disableUser(user.id);
      setPendingDisableUser(null);
      setNotice('使用者已停用。');
      await loadUsers();
      if (detailUserId === user.id) {
        setDetailUserId('');
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDisablingUserId('');
    }
  }

  if (!canRead) {
    return (
      <section className="page-hero">
        <p className="eyebrow">Permission Required</p>
        <h2>使用者管理</h2>
        <p>你需要 users.read 權限才能查看使用者管理頁。</p>
      </section>
    );
  }

  return (
    <div className="admin-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">User Admin</p>
          <h2>使用者管理</h2>
          <p>管理後台帳號、狀態、角色與組織關聯。</p>
        </div>
        {canManage ? (
          <button type="button" className="primary-button" onClick={() => setShowCreate(true)}>
            新增使用者
          </button>
        ) : null}
      </section>

      <section className="toolbar-panel">
        <form className="toolbar-form" onSubmit={applyFilters}>
          <label>
            搜尋
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Email / 顯示名稱"
            />
          </label>
          <label>
            狀態
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as UserStatus | '');
                setOffset(0);
              }}
            >
              <option value="">全部</option>
              <option value="active">啟用</option>
              <option value="disabled">停用</option>
            </select>
          </label>
          <div className="toolbar-actions">
            <button type="submit" className="secondary-button">搜尋</button>
            <button type="button" className="secondary-button" onClick={() => void loadUsers()} disabled={loading}>
              重新整理
            </button>
          </div>
        </form>
      </section>

      {notice ? <div className="form-success">{notice}</div> : null}
      {error ? <div className="form-error" role="alert">{error}</div> : null}

      <section className="data-panel">
        {loading ? (
          <div className="inline-state">載入使用者中...</div>
        ) : users.length === 0 ? (
          <div className="inline-state">目前沒有符合條件的使用者。</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>顯示名稱</th>
                  <th>使用者類型</th>
                  <th>狀態</th>
                  <th>建立時間</th>
                  <th>更新時間</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{user.displayName}</td>
                    <td>{user.userType || '-'}</td>
                    <td>
                      <span className={`status-pill ${user.status === 'disabled' ? 'is-disabled' : 'is-active'}`}>
                        {statusLabel(user.status)}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>{formatDate(user.updatedAt)}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="link-button" onClick={() => setDetailUserId(user.id)}>
                          查看
                        </button>
                        {canManage ? (
                          <>
                            <button type="button" className="link-button" onClick={() => openEdit(user)}>
                              編輯
                            </button>
                            <button
                              type="button"
                              className="link-button danger"
                              onClick={() => setPendingDisableUser(user)}
                              disabled={user.status === 'disabled' || disablingUserId === user.id}
                            >
                              {disablingUserId === user.id ? '停用中' : '停用'}
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="pagination-bar">
          <span>
            顯示 {users.length} 筆
            {typeof total === 'number' ? `，共 ${total} 筆` : ''}
          </span>
          <div>
            <button
              type="button"
              className="secondary-button"
              disabled={!hasPreviousPage || loading}
              onClick={() => setOffset(Math.max(0, offset - limit))}
            >
              上一頁
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={!hasNextPage || loading}
              onClick={() => setOffset(offset + limit)}
            >
              下一頁
            </button>
          </div>
        </div>
      </section>

      {showCreate ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel" aria-label="新增使用者">
            <header className="modal-header">
              <h3>新增使用者</h3>
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setShowCreate(false);
                  resetCreateForm();
                }}
              >
                關閉
              </button>
            </header>
            <form className="stacked-form" onSubmit={handleCreateUser}>
              <label>
                Email
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))}
                  required
                />
              </label>
              <label>
                密碼
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(event) => setCreateForm((current) => ({ ...current, password: event.target.value }))}
                  required
                  autoComplete="new-password"
                />
              </label>
              <label>
                顯示名稱
                <input
                  type="text"
                  value={createForm.displayName}
                  onChange={(event) => setCreateForm((current) => ({ ...current, displayName: event.target.value }))}
                  required
                />
              </label>
              <label>
                狀態
                <select
                  value={createForm.status}
                  onChange={(event) => setCreateForm((current) => ({ ...current, status: event.target.value as UserStatus }))}
                >
                  <option value="active">啟用</option>
                  <option value="disabled">停用</option>
                </select>
              </label>
              {createError ? <div className="form-error" role="alert">{createError}</div> : null}
              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={() => setShowCreate(false)}>
                  取消
                </button>
                <button type="submit" className="primary-button" disabled={creating}>
                  {creating ? '建立中...' : '建立'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {editingUser ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel" aria-label="編輯使用者">
            <header className="modal-header">
              <h3>編輯使用者</h3>
              <button type="button" className="link-button" onClick={() => setEditingUser(null)}>
                關閉
              </button>
            </header>
            <form className="stacked-form" onSubmit={handleUpdateUser}>
              <div className="readonly-field">
                <span>Email</span>
                <strong>{editingUser.email}</strong>
              </div>
              <label>
                顯示名稱
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(event) => setEditForm((current) => ({ ...current, displayName: event.target.value }))}
                  required
                />
              </label>
              <label>
                狀態
                <select
                  value={editForm.status}
                  onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value as UserStatus }))}
                >
                  <option value="active">啟用</option>
                  <option value="disabled">停用</option>
                </select>
              </label>
              {editError ? <div className="form-error" role="alert">{editError}</div> : null}
              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={() => setEditingUser(null)}>
                  取消
                </button>
                <button type="submit" className="primary-button" disabled={updating}>
                  {updating ? '更新中...' : '更新'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {pendingDisableUser ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel" aria-label="停用使用者確認">
            <header className="modal-header">
              <h3>停用使用者</h3>
              <button type="button" className="link-button" onClick={() => setPendingDisableUser(null)}>
                關閉
              </button>
            </header>
            <p className="modal-copy">
              確定要停用 <strong>{pendingDisableUser.email}</strong> 嗎？停用後該使用者將無法登入。
            </p>
            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={() => setPendingDisableUser(null)}>
                取消
              </button>
              <button
                type="button"
                className="primary-button danger-button"
                onClick={() => void performDisableUser(pendingDisableUser)}
                disabled={disablingUserId === pendingDisableUser.id}
              >
                {disablingUserId === pendingDisableUser.id ? '停用中...' : '確認停用'}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {detailUserId ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel modal-wide" aria-label="使用者詳情">
            <header className="modal-header">
              <h3>使用者詳情</h3>
              <button type="button" className="link-button" onClick={() => setDetailUserId('')}>
                關閉
              </button>
            </header>
            {detail.loading ? (
              <div className="inline-state">載入詳情中...</div>
            ) : detail.user ? (
              <div className="detail-grid">
                <section className="detail-section">
                  <h4>基本資料</h4>
                  <dl>
                    <div><dt>ID</dt><dd>{detail.user.id}</dd></div>
                    <div><dt>Email</dt><dd>{detail.user.email}</dd></div>
                    <div><dt>顯示名稱</dt><dd>{detail.user.displayName}</dd></div>
                    <div><dt>使用者類型</dt><dd>{detail.user.userType || '-'}</dd></div>
                    <div><dt>狀態</dt><dd>{statusLabel(detail.user.status)}</dd></div>
                    <div><dt>建立時間</dt><dd>{formatDate(detail.user.createdAt)}</dd></div>
                    <div><dt>更新時間</dt><dd>{formatDate(detail.user.updatedAt)}</dd></div>
                  </dl>
                </section>

                <section className="detail-section">
                  <h4>Roles</h4>
                  {detail.rolesError ? <div className="form-error">{detail.rolesError}</div> : null}
                  {!detail.rolesError && detail.roles.length === 0 ? (
                    <p className="muted">尚無角色資料。</p>
                  ) : (
                    <ul className="compact-list">
                      {detail.roles.map((role) => (
                        <li key={role.id || role.roleId || role.roleKey}>
                          <strong>{role.roleKey || role.name || role.roleId || '-'}</strong>
                          <span>{role.name || role.description || ''}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="detail-section">
                  <h4>Organizations</h4>
                  {detail.organizationsError ? <div className="form-error">{detail.organizationsError}</div> : null}
                  {!detail.organizationsError && detail.organizations.length === 0 ? (
                    <p className="muted">尚無組織關聯資料。</p>
                  ) : (
                    <ul className="compact-list">
                      {detail.organizations.map((membership) => (
                        <li key={membership.id || membership.organizationId}>
                          <strong>
                            {membership.organization?.organizationName
                              || membership.organization?.organizationCode
                              || membership.organizationId
                              || '-'}
                          </strong>
                          <span>{membership.roleNote || membership.organization?.status || ''}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            ) : (
              <div className="form-error">使用者詳情載入失敗。</div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
