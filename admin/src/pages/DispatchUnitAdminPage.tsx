import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  DispatchUnit,
  DispatchUnitStatus,
  createDispatchUnit,
  disableDispatchUnit,
  getDispatchUnit,
  listDispatchUnits,
  updateDispatchUnit
} from '../api/dispatchUnits';
import { Organization, listOrganizations } from '../api/organizations';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../lib/apiClient';

type DispatchUnitFormState = {
  organizationId: string;
  name: string;
  code: string;
  serviceRegion: string;
  status: DispatchUnitStatus;
  city: string;
  productTypes: string;
  priority: string;
  routingRules: string;
};

type DetailState = {
  dispatchUnit: DispatchUnit | null;
  loading: boolean;
  error: string;
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

function getInitialForm(): DispatchUnitFormState {
  return {
    organizationId: '',
    name: '',
    code: '',
    serviceRegion: '',
    status: 'active',
    city: '',
    productTypes: '',
    priority: '100',
    routingRules: ''
  };
}

function productTypeList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseRoutingRules(value: string): Record<string, unknown> | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = JSON.parse(trimmed) as unknown;
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error('routingRules must be an object.');
  }
  return parsed as Record<string, unknown>;
}

function stringifyRoutingRules(value?: Record<string, unknown> | null) {
  if (!value || Object.keys(value).length === 0) return '';
  return JSON.stringify(value, null, 2);
}

function validateForm(form: DispatchUnitFormState, requireOrganization: boolean) {
  if (requireOrganization && !form.organizationId.trim()) return '請選擇或輸入 organizationId。';
  if (!form.name.trim()) return '請輸入派工單位名稱。';
  if (!form.code.trim()) return '請輸入派工單位代碼。';

  const priority = Number(form.priority);
  if (!Number.isInteger(priority) || priority < 0) return '優先順序必須是 0 以上的整數。';

  try {
    parseRoutingRules(form.routingRules);
  } catch {
    return 'Routing rules 必須是有效的 JSON object。';
  }

  return '';
}

function buildPayload(form: DispatchUnitFormState) {
  const routingRules = parseRoutingRules(form.routingRules);

  return {
    name: form.name.trim(),
    code: form.code.trim(),
    serviceRegion: form.serviceRegion.trim() || undefined,
    status: form.status,
    city: form.city.trim() || undefined,
    productTypes: productTypeList(form.productTypes),
    priority: Number(form.priority),
    routingRules
  };
}

function organizationLabel(organizations: Organization[], organizationId?: string | null) {
  if (!organizationId) return '-';
  const organization = organizations.find((item) => item.id === organizationId);
  if (!organization) return organizationId;
  return `${organization.organizationName} (${organization.organizationCode})`;
}

export function DispatchUnitAdminPage() {
  const { currentUser, hasPermission, hasRole } = useAuth();
  const adminLike = isAdminLikeUser(currentUser, hasRole);
  const canManage = hasPermission('dispatch_units.manage') || adminLike;
  const canReadOrganizations = hasPermission('organizations.read') || adminLike;

  const [dispatchUnits, setDispatchUnits] = useState<DispatchUnit[]>([]);
  const [total, setTotal] = useState<number | undefined>();
  const [limit] = useState(DEFAULT_LIMIT);
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DispatchUnitStatus | ''>('');
  const [organizationFilter, setOrganizationFilter] = useState('');
  const [serviceRegionFilter, setServiceRegionFilter] = useState('');
  const [appliedServiceRegionFilter, setAppliedServiceRegionFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationLoadError, setOrganizationLoadError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<DispatchUnitFormState>(getInitialForm);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingDispatchUnit, setEditingDispatchUnit] = useState<DispatchUnit | null>(null);
  const [editForm, setEditForm] = useState<DispatchUnitFormState>(getInitialForm);
  const [editError, setEditError] = useState('');
  const [updating, setUpdating] = useState(false);

  const [pendingDisableDispatchUnit, setPendingDisableDispatchUnit] = useState<DispatchUnit | null>(null);
  const [disablingDispatchUnitId, setDisablingDispatchUnitId] = useState('');

  const [detailDispatchUnitId, setDetailDispatchUnitId] = useState('');
  const [detail, setDetail] = useState<DetailState>({
    dispatchUnit: null,
    loading: false,
    error: ''
  });

  const hasNextPage = useMemo(() => {
    if (typeof total === 'number') return offset + limit < total;
    return dispatchUnits.length === limit;
  }, [dispatchUnits.length, limit, offset, total]);

  const hasPreviousPage = offset > 0;

  const loadDispatchUnits = useCallback(async () => {
    if (!canManage) return;

    setLoading(true);
    setError('');

    try {
      const result = await listDispatchUnits({
        q: appliedQuery.trim() || undefined,
        status: statusFilter,
        organizationId: organizationFilter.trim() || undefined,
        serviceRegion: appliedServiceRegionFilter.trim() || undefined,
        limit,
        offset,
        sort: 'createdAtDesc'
      });
      setDispatchUnits(result.data);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [appliedQuery, appliedServiceRegionFilter, canManage, limit, offset, organizationFilter, statusFilter]);

  useEffect(() => {
    void loadDispatchUnits();
  }, [loadDispatchUnits]);

  useEffect(() => {
    if (!canReadOrganizations) return;

    let active = true;

    async function loadOrganizations() {
      setOrganizationLoadError('');

      try {
        const result = await listOrganizations({ limit: 100, offset: 0, sort: 'nameAsc', status: 'active' });
        if (!active) return;
        setOrganizations(result.data);
      } catch (err) {
        if (!active) return;
        setOrganizationLoadError(errorMessage(err));
      }
    }

    void loadOrganizations();

    return () => {
      active = false;
    };
  }, [canReadOrganizations]);

  useEffect(() => {
    if (!detailDispatchUnitId) return;

    let active = true;

    async function loadDetail() {
      setDetail({
        dispatchUnit: null,
        loading: true,
        error: ''
      });

      try {
        const dispatchUnit = await getDispatchUnit(detailDispatchUnitId);
        if (!active) return;
        setDetail({
          dispatchUnit,
          loading: false,
          error: ''
        });
      } catch (err) {
        if (!active) return;
        setDetail({
          dispatchUnit: null,
          loading: false,
          error: errorMessage(err)
        });
      }
    }

    void loadDetail();

    return () => {
      active = false;
    };
  }, [detailDispatchUnitId]);

  function applyFilters(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setOffset(0);
    setAppliedQuery(query);
    setAppliedServiceRegionFilter(serviceRegionFilter);
  }

  function resetCreateForm() {
    setCreateForm(getInitialForm());
    setCreateError('');
  }

  async function handleCreateDispatchUnit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError('');

    const validationError = validateForm(createForm, true);
    if (validationError) {
      setCreateError(validationError);
      return;
    }

    setCreating(true);

    try {
      await createDispatchUnit({
        organizationId: createForm.organizationId.trim(),
        ...buildPayload(createForm)
      });
      setShowCreate(false);
      resetCreateForm();
      setNotice('派工單位已建立。');
      setOffset(0);
      await loadDispatchUnits();
    } catch (err) {
      setCreateError(errorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  function openEdit(dispatchUnit: DispatchUnit) {
    setEditingDispatchUnit(dispatchUnit);
    setEditForm({
      organizationId: dispatchUnit.organizationId,
      name: dispatchUnit.name || '',
      code: dispatchUnit.code || '',
      serviceRegion: dispatchUnit.serviceRegion || '',
      status: dispatchUnit.status,
      city: dispatchUnit.city || '',
      productTypes: dispatchUnit.productTypes.join(', '),
      priority: String(dispatchUnit.priority ?? 100),
      routingRules: stringifyRoutingRules(dispatchUnit.routingRules)
    });
    setEditError('');
  }

  async function handleUpdateDispatchUnit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingDispatchUnit) return;

    setEditError('');

    const validationError = validateForm(editForm, false);
    if (validationError) {
      setEditError(validationError);
      return;
    }

    setUpdating(true);

    try {
      await updateDispatchUnit(editingDispatchUnit.id, buildPayload(editForm));
      setEditingDispatchUnit(null);
      setNotice('派工單位已更新。');
      await loadDispatchUnits();
      if (detailDispatchUnitId === editingDispatchUnit.id) {
        setDetailDispatchUnitId('');
      }
    } catch (err) {
      setEditError(errorMessage(err));
    } finally {
      setUpdating(false);
    }
  }

  async function handleDisableDispatchUnit() {
    if (!pendingDisableDispatchUnit) return;

    setDisablingDispatchUnitId(pendingDisableDispatchUnit.id);
    setError('');

    try {
      await disableDispatchUnit(pendingDisableDispatchUnit.id);
      setNotice('派工單位已停用。');
      setPendingDisableDispatchUnit(null);
      await loadDispatchUnits();
      if (detailDispatchUnitId === pendingDisableDispatchUnit.id) {
        setDetailDispatchUnitId('');
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDisablingDispatchUnitId('');
    }
  }

  if (!canManage) {
    return (
      <section className="page-hero">
        <p className="eyebrow">Permission Required</p>
        <h2>派工單位管理</h2>
        <p>你需要 dispatch_units.manage 權限才能查看派工單位管理頁。</p>
      </section>
    );
  }

  return (
    <div className="admin-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Dispatch Unit Admin</p>
          <h2>派工單位管理</h2>
          <p>管理各 organization 底下可派工的團隊、區域、產品類型與啟用狀態。</p>
        </div>
        <button type="button" className="primary-button" onClick={() => setShowCreate(true)}>
          新增派工單位
        </button>
      </section>

      <section className="toolbar-panel">
        <form className="toolbar-form toolbar-form-wide" onSubmit={applyFilters}>
          <label>
            搜尋
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="名稱 / 代碼 / 城市 / 區域"
            />
          </label>
          <label>
            組織
            {organizations.length > 0 ? (
              <select
                value={organizationFilter}
                onChange={(event) => {
                  setOrganizationFilter(event.target.value);
                  setOffset(0);
                }}
              >
                <option value="">全部可見組織</option>
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.organizationName}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={organizationFilter}
                onChange={(event) => {
                  setOrganizationFilter(event.target.value);
                  setOffset(0);
                }}
                placeholder="organizationId"
              />
            )}
          </label>
          <label>
            區域
            <input
              type="text"
              value={serviceRegionFilter}
              onChange={(event) => setServiceRegionFilter(event.target.value)}
              placeholder="north"
            />
          </label>
          <label>
            狀態
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as DispatchUnitStatus | '');
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
            <button type="button" className="secondary-button" onClick={() => void loadDispatchUnits()} disabled={loading}>
              重新整理
            </button>
          </div>
        </form>
        {organizationLoadError ? <p className="form-hint">組織清單載入失敗，可改以 organizationId 篩選。</p> : null}
      </section>

      {notice ? <div className="form-success">{notice}</div> : null}
      {error ? <div className="form-error" role="alert">{error}</div> : null}

      <section className="data-panel">
        {loading ? (
          <div className="inline-state">載入派工單位中...</div>
        ) : dispatchUnits.length === 0 ? (
          <div className="inline-state">目前沒有符合條件的派工單位。</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>代碼</th>
                  <th>名稱</th>
                  <th>組織</th>
                  <th>區域 / 城市</th>
                  <th>產品類型</th>
                  <th>優先順序</th>
                  <th>狀態</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {dispatchUnits.map((dispatchUnit) => (
                  <tr key={dispatchUnit.id}>
                    <td>{dispatchUnit.code}</td>
                    <td>{dispatchUnit.name}</td>
                    <td>{organizationLabel(organizations, dispatchUnit.organizationId)}</td>
                    <td>
                      <div>{dispatchUnit.serviceRegion || '-'}</div>
                      <span className="muted">{dispatchUnit.city || '-'}</span>
                    </td>
                    <td>{dispatchUnit.productTypes.length > 0 ? dispatchUnit.productTypes.join(', ') : '-'}</td>
                    <td>{dispatchUnit.priority}</td>
                    <td>
                      <span className={`status-pill ${dispatchUnit.status === 'disabled' ? 'is-disabled' : 'is-active'}`}>
                        {statusLabel(dispatchUnit.status)}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="link-button" onClick={() => setDetailDispatchUnitId(dispatchUnit.id)}>
                          查看
                        </button>
                        <button type="button" className="link-button" onClick={() => openEdit(dispatchUnit)}>
                          編輯
                        </button>
                        <button
                          type="button"
                          className="link-button danger"
                          disabled={dispatchUnit.status === 'disabled'}
                          onClick={() => setPendingDisableDispatchUnit(dispatchUnit)}
                        >
                          停用
                        </button>
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
            顯示 {dispatchUnits.length} 筆
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
          <section className="modal-panel" aria-label="新增派工單位">
            <header className="modal-header">
              <h3>新增派工單位</h3>
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
            <form className="stacked-form" onSubmit={handleCreateDispatchUnit}>
              <label>
                組織
                {organizations.length > 0 ? (
                  <select
                    value={createForm.organizationId}
                    onChange={(event) => setCreateForm((current) => ({ ...current, organizationId: event.target.value }))}
                    required
                  >
                    <option value="">請選擇組織</option>
                    {organizations.map((organization) => (
                      <option key={organization.id} value={organization.id}>
                        {organization.organizationName} ({organization.organizationCode})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={createForm.organizationId}
                    onChange={(event) => setCreateForm((current) => ({ ...current, organizationId: event.target.value }))}
                    placeholder="organizationId"
                    required
                  />
                )}
              </label>
              <label>
                派工單位名稱
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </label>
              <label>
                派工單位代碼
                <input
                  type="text"
                  value={createForm.code}
                  onChange={(event) => setCreateForm((current) => ({ ...current, code: event.target.value }))}
                  placeholder="NORTH-TV"
                  required
                />
              </label>
              <label>
                區域
                <input
                  type="text"
                  value={createForm.serviceRegion}
                  onChange={(event) => setCreateForm((current) => ({ ...current, serviceRegion: event.target.value }))}
                  placeholder="north"
                />
              </label>
              <label>
                城市
                <input
                  type="text"
                  value={createForm.city}
                  onChange={(event) => setCreateForm((current) => ({ ...current, city: event.target.value }))}
                  placeholder="Taipei"
                />
              </label>
              <label>
                產品類型
                <input
                  type="text"
                  value={createForm.productTypes}
                  onChange={(event) => setCreateForm((current) => ({ ...current, productTypes: event.target.value }))}
                  placeholder="TV, Appliance"
                />
              </label>
              <label>
                優先順序
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={createForm.priority}
                  onChange={(event) => setCreateForm((current) => ({ ...current, priority: event.target.value }))}
                  required
                />
              </label>
              <label>
                狀態
                <select
                  value={createForm.status}
                  onChange={(event) => setCreateForm((current) => ({ ...current, status: event.target.value as DispatchUnitStatus }))}
                >
                  <option value="active">啟用</option>
                  <option value="disabled">停用</option>
                </select>
              </label>
              <label>
                Routing rules
                <textarea
                  value={createForm.routingRules}
                  onChange={(event) => setCreateForm((current) => ({ ...current, routingRules: event.target.value }))}
                  placeholder='{"default": true}'
                  rows={4}
                />
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

      {editingDispatchUnit ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel" aria-label="編輯派工單位">
            <header className="modal-header">
              <h3>編輯派工單位</h3>
              <button type="button" className="link-button" onClick={() => setEditingDispatchUnit(null)}>
                關閉
              </button>
            </header>
            <form className="stacked-form" onSubmit={handleUpdateDispatchUnit}>
              <div className="readonly-field">
                <span>組織</span>
                <strong>{organizationLabel(organizations, editingDispatchUnit.organizationId)}</strong>
              </div>
              <label>
                派工單位名稱
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </label>
              <label>
                派工單位代碼
                <input
                  type="text"
                  value={editForm.code}
                  onChange={(event) => setEditForm((current) => ({ ...current, code: event.target.value }))}
                  required
                />
              </label>
              <label>
                區域
                <input
                  type="text"
                  value={editForm.serviceRegion}
                  onChange={(event) => setEditForm((current) => ({ ...current, serviceRegion: event.target.value }))}
                />
              </label>
              <label>
                城市
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(event) => setEditForm((current) => ({ ...current, city: event.target.value }))}
                />
              </label>
              <label>
                產品類型
                <input
                  type="text"
                  value={editForm.productTypes}
                  onChange={(event) => setEditForm((current) => ({ ...current, productTypes: event.target.value }))}
                />
              </label>
              <label>
                優先順序
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={editForm.priority}
                  onChange={(event) => setEditForm((current) => ({ ...current, priority: event.target.value }))}
                  required
                />
              </label>
              <label>
                狀態
                <select
                  value={editForm.status}
                  onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value as DispatchUnitStatus }))}
                >
                  <option value="active">啟用</option>
                  <option value="disabled">停用</option>
                </select>
              </label>
              <label>
                Routing rules
                <textarea
                  value={editForm.routingRules}
                  onChange={(event) => setEditForm((current) => ({ ...current, routingRules: event.target.value }))}
                  rows={4}
                />
              </label>
              {editError ? <div className="form-error" role="alert">{editError}</div> : null}
              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={() => setEditingDispatchUnit(null)}>
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

      {pendingDisableDispatchUnit ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel" aria-label="停用派工單位">
            <header className="modal-header">
              <h3>停用派工單位</h3>
              <button type="button" className="link-button" onClick={() => setPendingDisableDispatchUnit(null)}>
                關閉
              </button>
            </header>
            <p className="modal-copy">
              確定要停用「{pendingDisableDispatchUnit.name}」嗎？停用後不會刪除歷史案件參照。
            </p>
            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={() => setPendingDisableDispatchUnit(null)}>
                取消
              </button>
              <button
                type="button"
                className="primary-button danger-button"
                disabled={disablingDispatchUnitId === pendingDisableDispatchUnit.id}
                onClick={() => void handleDisableDispatchUnit()}
              >
                {disablingDispatchUnitId === pendingDisableDispatchUnit.id ? '停用中...' : '確認停用'}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {detailDispatchUnitId ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel modal-wide" aria-label="派工單位詳情">
            <header className="modal-header">
              <h3>派工單位詳情</h3>
              <button type="button" className="link-button" onClick={() => setDetailDispatchUnitId('')}>
                關閉
              </button>
            </header>
            {detail.loading ? (
              <div className="inline-state">載入詳情中...</div>
            ) : detail.dispatchUnit ? (
              <div className="detail-grid">
                <section className="detail-section">
                  <h4>基本資料</h4>
                  <dl>
                    <div><dt>ID</dt><dd>{detail.dispatchUnit.id}</dd></div>
                    <div><dt>組織</dt><dd>{organizationLabel(organizations, detail.dispatchUnit.organizationId)}</dd></div>
                    <div><dt>代碼</dt><dd>{detail.dispatchUnit.code}</dd></div>
                    <div><dt>名稱</dt><dd>{detail.dispatchUnit.name}</dd></div>
                    <div><dt>區域</dt><dd>{detail.dispatchUnit.serviceRegion || '-'}</dd></div>
                    <div><dt>城市</dt><dd>{detail.dispatchUnit.city || '-'}</dd></div>
                    <div><dt>產品類型</dt><dd>{detail.dispatchUnit.productTypes.join(', ') || '-'}</dd></div>
                    <div><dt>優先順序</dt><dd>{detail.dispatchUnit.priority}</dd></div>
                    <div><dt>狀態</dt><dd>{statusLabel(detail.dispatchUnit.status)}</dd></div>
                    <div><dt>建立時間</dt><dd>{formatDate(detail.dispatchUnit.createdAt)}</dd></div>
                    <div><dt>更新時間</dt><dd>{formatDate(detail.dispatchUnit.updatedAt)}</dd></div>
                  </dl>
                </section>

                <section className="detail-section">
                  <h4>Routing rules</h4>
                  <pre className="json-preview">
                    {stringifyRoutingRules(detail.dispatchUnit.routingRules) || '{}'}
                  </pre>
                </section>
              </div>
            ) : (
              <div className="form-error">{detail.error || '派工單位詳情載入失敗。'}</div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
