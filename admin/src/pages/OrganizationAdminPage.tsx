import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Organization,
  OrganizationStatus,
  createOrganization,
  getOrganization,
  listOrganizations,
  updateOrganization
} from '../api/organizations';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../lib/apiClient';

type OrganizationFormState = {
  organizationCode: string;
  organizationName: string;
  status: OrganizationStatus;
};

type DetailState = {
  organization: Organization | null;
  loading: boolean;
  error: string;
};

const DEFAULT_LIMIT = 20;
const ORGANIZATION_CODE_PATTERN = /^[a-z0-9_-]+$/;

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

function getInitialForm(): OrganizationFormState {
  return {
    organizationCode: '',
    organizationName: '',
    status: 'active'
  };
}

function validateCreateForm(form: OrganizationFormState) {
  const code = form.organizationCode.trim();
  if (!code) return '請輸入組織代碼。';
  if (!ORGANIZATION_CODE_PATTERN.test(code)) {
    return '組織代碼僅允許小寫英文字母、數字、hyphen 與 underscore。';
  }
  if (!form.organizationName.trim()) return '請輸入組織名稱。';
  return '';
}

export function OrganizationAdminPage() {
  const { currentUser, hasPermission, hasRole } = useAuth();
  const canRead = hasPermission('organizations.read') || isAdminLikeUser(currentUser, hasRole);
  const canManage = hasPermission('organizations.manage') || isAdminLikeUser(currentUser, hasRole);

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [total, setTotal] = useState<number | undefined>();
  const [limit] = useState(DEFAULT_LIMIT);
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrganizationStatus | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<OrganizationFormState>(getInitialForm);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
  const [editForm, setEditForm] = useState<Pick<OrganizationFormState, 'organizationName' | 'status'>>({
    organizationName: '',
    status: 'active'
  });
  const [editError, setEditError] = useState('');
  const [updating, setUpdating] = useState(false);

  const [detailOrganizationId, setDetailOrganizationId] = useState('');
  const [detail, setDetail] = useState<DetailState>({
    organization: null,
    loading: false,
    error: ''
  });

  const hasNextPage = useMemo(() => {
    if (typeof total === 'number') return offset + limit < total;
    return organizations.length === limit;
  }, [limit, offset, organizations.length, total]);

  const hasPreviousPage = offset > 0;

  const loadOrganizations = useCallback(async () => {
    if (!canRead) return;

    setLoading(true);
    setError('');

    try {
      const result = await listOrganizations({
        q: appliedQuery.trim() || undefined,
        status: statusFilter,
        limit,
        offset,
        sort: 'createdAtDesc'
      });
      setOrganizations(result.data);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [appliedQuery, canRead, limit, offset, statusFilter]);

  useEffect(() => {
    void loadOrganizations();
  }, [loadOrganizations]);

  useEffect(() => {
    if (!detailOrganizationId) return;

    let active = true;

    async function loadDetail() {
      setDetail({
        organization: null,
        loading: true,
        error: ''
      });

      try {
        const organization = await getOrganization(detailOrganizationId);
        if (!active) return;
        setDetail({
          organization,
          loading: false,
          error: ''
        });
      } catch (err) {
        if (!active) return;
        setDetail({
          organization: null,
          loading: false,
          error: errorMessage(err)
        });
      }
    }

    void loadDetail();

    return () => {
      active = false;
    };
  }, [detailOrganizationId]);

  function applyFilters(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setOffset(0);
    setAppliedQuery(query);
  }

  function resetCreateForm() {
    setCreateForm(getInitialForm());
    setCreateError('');
  }

  async function handleCreateOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError('');

    const validationError = validateCreateForm(createForm);
    if (validationError) {
      setCreateError(validationError);
      return;
    }

    setCreating(true);

    try {
      await createOrganization({
        organizationCode: createForm.organizationCode.trim(),
        organizationName: createForm.organizationName.trim(),
        status: createForm.status
      });
      setShowCreate(false);
      resetCreateForm();
      setNotice('組織已建立。');
      setOffset(0);
      await loadOrganizations();
    } catch (err) {
      setCreateError(errorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  function openEdit(organization: Organization) {
    setEditingOrganization(organization);
    setEditForm({
      organizationName: organization.organizationName || '',
      status: organization.status
    });
    setEditError('');
  }

  async function handleUpdateOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingOrganization) return;

    setEditError('');
    if (!editForm.organizationName.trim()) {
      setEditError('請輸入組織名稱。');
      return;
    }

    setUpdating(true);

    try {
      await updateOrganization(editingOrganization.id, {
        organizationName: editForm.organizationName.trim(),
        status: editForm.status
      });
      setEditingOrganization(null);
      setNotice('組織已更新。');
      await loadOrganizations();
      if (detailOrganizationId === editingOrganization.id) {
        setDetailOrganizationId('');
      }
    } catch (err) {
      setEditError(errorMessage(err));
    } finally {
      setUpdating(false);
    }
  }

  if (!canRead) {
    return (
      <section className="page-hero">
        <p className="eyebrow">Permission Required</p>
        <h2>組織管理</h2>
        <p>你需要 organizations.read 權限才能查看組織管理頁。</p>
      </section>
    );
  }

  return (
    <div className="admin-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Organization Admin</p>
          <h2>組織管理</h2>
          <p>管理品牌、客戶、廠商、合作夥伴或其他 organization scope 的資料邊界。</p>
        </div>
        {canManage ? (
          <button type="button" className="primary-button" onClick={() => setShowCreate(true)}>
            新增組織
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
              placeholder="Organization code / name"
            />
          </label>
          <label>
            狀態
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as OrganizationStatus | '');
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
            <button type="button" className="secondary-button" onClick={() => void loadOrganizations()} disabled={loading}>
              重新整理
            </button>
          </div>
        </form>
      </section>

      {notice ? <div className="form-success">{notice}</div> : null}
      {error ? <div className="form-error" role="alert">{error}</div> : null}

      <section className="data-panel">
        {loading ? (
          <div className="inline-state">載入組織中...</div>
        ) : organizations.length === 0 ? (
          <div className="inline-state">目前沒有符合條件的組織。</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>組織代碼</th>
                  <th>組織名稱</th>
                  <th>狀態</th>
                  <th>建立時間</th>
                  <th>更新時間</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((organization) => (
                  <tr key={organization.id}>
                    <td>{organization.organizationCode}</td>
                    <td>{organization.organizationName}</td>
                    <td>
                      <span className={`status-pill ${organization.status === 'disabled' ? 'is-disabled' : 'is-active'}`}>
                        {statusLabel(organization.status)}
                      </span>
                    </td>
                    <td>{formatDate(organization.createdAt)}</td>
                    <td>{formatDate(organization.updatedAt)}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="link-button" onClick={() => setDetailOrganizationId(organization.id)}>
                          查看
                        </button>
                        {canManage ? (
                          <button type="button" className="link-button" onClick={() => openEdit(organization)}>
                            編輯
                          </button>
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
            顯示 {organizations.length} 筆
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
          <section className="modal-panel" aria-label="新增組織">
            <header className="modal-header">
              <h3>新增組織</h3>
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
            <form className="stacked-form" onSubmit={handleCreateOrganization}>
              <label>
                組織代碼
                <input
                  type="text"
                  value={createForm.organizationCode}
                  onChange={(event) => setCreateForm((current) => ({ ...current, organizationCode: event.target.value }))}
                  placeholder="task031-org"
                  required
                />
              </label>
              <label>
                組織名稱
                <input
                  type="text"
                  value={createForm.organizationName}
                  onChange={(event) => setCreateForm((current) => ({ ...current, organizationName: event.target.value }))}
                  required
                />
              </label>
              <label>
                狀態
                <select
                  value={createForm.status}
                  onChange={(event) => setCreateForm((current) => ({ ...current, status: event.target.value as OrganizationStatus }))}
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

      {editingOrganization ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel" aria-label="編輯組織">
            <header className="modal-header">
              <h3>編輯組織</h3>
              <button type="button" className="link-button" onClick={() => setEditingOrganization(null)}>
                關閉
              </button>
            </header>
            <form className="stacked-form" onSubmit={handleUpdateOrganization}>
              <div className="readonly-field">
                <span>組織代碼</span>
                <strong>{editingOrganization.organizationCode}</strong>
              </div>
              <label>
                組織名稱
                <input
                  type="text"
                  value={editForm.organizationName}
                  onChange={(event) => setEditForm((current) => ({ ...current, organizationName: event.target.value }))}
                  required
                />
              </label>
              <label>
                狀態
                <select
                  value={editForm.status}
                  onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value as OrganizationStatus }))}
                >
                  <option value="active">啟用</option>
                  <option value="disabled">停用</option>
                </select>
              </label>
              {editError ? <div className="form-error" role="alert">{editError}</div> : null}
              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={() => setEditingOrganization(null)}>
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

      {detailOrganizationId ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel modal-wide" aria-label="組織詳情">
            <header className="modal-header">
              <h3>組織詳情</h3>
              <button type="button" className="link-button" onClick={() => setDetailOrganizationId('')}>
                關閉
              </button>
            </header>
            {detail.loading ? (
              <div className="inline-state">載入詳情中...</div>
            ) : detail.organization ? (
              <div className="detail-grid">
                <section className="detail-section">
                  <h4>基本資料</h4>
                  <dl>
                    <div><dt>ID</dt><dd>{detail.organization.id}</dd></div>
                    <div><dt>組織代碼</dt><dd>{detail.organization.organizationCode}</dd></div>
                    <div><dt>組織名稱</dt><dd>{detail.organization.organizationName}</dd></div>
                    <div><dt>狀態</dt><dd>{statusLabel(detail.organization.status)}</dd></div>
                    <div><dt>建立時間</dt><dd>{formatDate(detail.organization.createdAt)}</dd></div>
                    <div><dt>更新時間</dt><dd>{formatDate(detail.organization.updatedAt)}</dd></div>
                  </dl>
                </section>

                <section className="detail-section">
                  <h4>後續擴充</h4>
                  <ul className="compact-list">
                    <li>
                      <strong>使用者組織成員管理</strong>
                      <span>將於後續任務接入 membership assignment UI。</span>
                    </li>
                    <li>
                      <strong>LINE channel / notification routing</strong>
                      <span>將於後續任務接入 organization-aware provider routing。</span>
                    </li>
                    <li>
                      <strong>Organization switching</strong>
                      <span>將於後續任務設計，不在本頁直接實作。</span>
                    </li>
                  </ul>
                </section>
              </div>
            ) : (
              <div className="form-error">{detail.error || '組織詳情載入失敗。'}</div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
