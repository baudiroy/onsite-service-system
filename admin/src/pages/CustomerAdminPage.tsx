import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import type { AdminCase, CaseSource } from '../api/cases';
import {
  Customer,
  createCustomer,
  getCustomer,
  listCustomerCases,
  listCustomers,
  updateCustomer
} from '../api/customers';
import { Organization, listOrganizations } from '../api/organizations';
import { useAuth } from '../auth/AuthContext';
import { CustomerLineIdentitiesPanel } from '../components/CustomerLineIdentitiesPanel';
import { ApiError } from '../lib/apiClient';
import { buildCaseDetailUrl, getCaseLinkAvailability } from '../utils/caseLinks';
import { getCaseStatusLabel } from '../utils/caseWorkflow';

type CustomerFormState = {
  organizationId: string;
  customerName: string;
  mobile: string;
  tel: string;
  city: string;
  address: string;
  source: CaseSource;
};

type DetailState = {
  customer: Customer | null;
  loading: boolean;
  error: string;
};

const DEFAULT_LIMIT = 20;
const SOURCE_OPTIONS: CaseSource[] = ['admin', 'phone', 'line', 'website', 'email', 'api', 'migration'];

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

function initialCustomerForm(): CustomerFormState {
  return {
    organizationId: '',
    customerName: '',
    mobile: '',
    tel: '',
    city: '',
    address: '',
    source: 'admin'
  };
}

function customerFormFromCustomer(customer: Customer): CustomerFormState {
  return {
    organizationId: customer.organizationId || '',
    customerName: customer.customerName || '',
    mobile: customer.mobile || '',
    tel: customer.tel || '',
    city: customer.city || '',
    address: customer.address || '',
    source: customer.source || 'admin'
  };
}

function validateCustomerForm(form: CustomerFormState, includeOrganization = false) {
  if (includeOrganization && !form.organizationId.trim()) return '請選擇 organization。';
  if (!form.customerName.trim()) return '請輸入客戶姓名。';
  if (!form.mobile.trim()) return '請輸入手機。';
  if (!form.city.trim()) return '請輸入城市。';
  if (!form.address.trim()) return '請輸入地址。';
  return '';
}

function customerOrganizationLabel(customer: Customer, organizations: Organization[]) {
  const summaryName = customer.organizationSummary?.name || customer.organizationSummary?.code;
  if (summaryName) return summaryName;
  const organization = organizations.find((item) => item.id === customer.organizationId);
  if (organization) return organization.organizationName;
  return customer.organizationId || '-';
}

function caseHref(adminCase: AdminCase) {
  return buildCaseDetailUrl({
    caseId: adminCase.id,
    caseNo: adminCase.caseNo,
    preserveCaseNo: true
  });
}

function caseLinkHint(adminCase: AdminCase) {
  const caseLink = getCaseLinkAvailability({
    caseId: adminCase.id,
    caseNo: adminCase.caseNo
  });

  if (caseLink.mode === 'detail') return '直接開啟案件詳情';
  if (caseLink.mode === 'filter') return '依案件編號篩選';
  return caseLink.label;
}

export function CustomerAdminPage() {
  const { currentUser, hasPermission, hasRole } = useAuth();
  const adminLike = isAdminLikeUser(currentUser, hasRole);
  const canRead = hasPermission('customers.read') || adminLike;
  const canCreate = hasPermission('customers.create') || adminLike;
  const canUpdate = hasPermission('customers.update') || adminLike;
  const canReadCases = hasPermission('cases.read') || adminLike;
  const canReadOrganizations = hasPermission('organizations.read') || adminLike;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState<number | undefined>();
  const [limit] = useState(DEFAULT_LIMIT);
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [mobileFilter, setMobileFilter] = useState('');
  const [appliedMobile, setAppliedMobile] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [appliedCity, setAppliedCity] = useState('');
  const [sourceFilter, setSourceFilter] = useState<CaseSource | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);
  const [organizationsError, setOrganizationsError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CustomerFormState>(initialCustomerForm);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState<CustomerFormState>(initialCustomerForm);
  const [editError, setEditError] = useState('');
  const [updating, setUpdating] = useState(false);

  const [detailCustomerId, setDetailCustomerId] = useState('');
  const [detail, setDetail] = useState<DetailState>({
    customer: null,
    loading: false,
    error: ''
  });
  const [customerCases, setCustomerCases] = useState<AdminCase[]>([]);
  const [customerCasesTotal, setCustomerCasesTotal] = useState<number | undefined>();
  const [customerCasesOffset, setCustomerCasesOffset] = useState(0);
  const [customerCasesLoading, setCustomerCasesLoading] = useState(false);
  const [customerCasesError, setCustomerCasesError] = useState('');

  const hasNextPage = useMemo(() => {
    if (typeof total === 'number') return offset + limit < total;
    return customers.length === limit;
  }, [customers.length, limit, offset, total]);
  const hasPreviousPage = offset > 0;

  const hasNextCustomerCasesPage = useMemo(() => {
    if (typeof customerCasesTotal === 'number') return customerCasesOffset + limit < customerCasesTotal;
    return customerCases.length === limit;
  }, [customerCases.length, customerCasesOffset, customerCasesTotal, limit]);

  const loadCustomers = useCallback(async () => {
    if (!canRead) return;

    setLoading(true);
    setError('');

    try {
      const response = await listCustomers({
        q: appliedQuery.trim() || undefined,
        mobile: appliedMobile.trim() || undefined,
        city: appliedCity.trim() || undefined,
        source: sourceFilter,
        limit,
        offset,
        sort: 'createdAtDesc'
      });
      setCustomers(response.data);
      setTotal(response.pagination.total);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [appliedCity, appliedMobile, appliedQuery, canRead, limit, offset, sourceFilter]);

  const loadOrganizations = useCallback(async () => {
    if (!canReadOrganizations) return;

    setOrganizationsLoading(true);
    setOrganizationsError('');

    try {
      const response = await listOrganizations({ status: 'active', limit: 100, offset: 0, sort: 'nameAsc' });
      setOrganizations(response.data);
    } catch (err) {
      setOrganizations([]);
      setOrganizationsError(errorMessage(err));
    } finally {
      setOrganizationsLoading(false);
    }
  }, [canReadOrganizations]);

  const loadCustomerCases = useCallback(async (customerId: string, nextOffset = customerCasesOffset) => {
    if (!canReadCases) return;

    setCustomerCasesLoading(true);
    setCustomerCasesError('');

    try {
      const response = await listCustomerCases(customerId, {
        limit,
        offset: nextOffset,
        sort: 'createdAtDesc'
      });
      setCustomerCases(response.data);
      setCustomerCasesTotal(response.pagination.total);
      setCustomerCasesOffset(nextOffset);
    } catch (err) {
      setCustomerCases([]);
      setCustomerCasesError(errorMessage(err));
    } finally {
      setCustomerCasesLoading(false);
    }
  }, [canReadCases, customerCasesOffset, limit]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    void loadOrganizations();
  }, [loadOrganizations]);

  useEffect(() => {
    if (!detailCustomerId) {
      setDetail({ customer: null, loading: false, error: '' });
      setCustomerCases([]);
      setCustomerCasesTotal(undefined);
      setCustomerCasesOffset(0);
      setCustomerCasesError('');
      return;
    }

    let active = true;

    async function loadDetail() {
      setDetail({ customer: null, loading: true, error: '' });

      try {
        const customer = await getCustomer(detailCustomerId);
        if (!active) return;
        setDetail({ customer, loading: false, error: '' });
        void loadCustomerCases(customer.id, 0);
      } catch (err) {
        if (!active) return;
        setDetail({ customer: null, loading: false, error: errorMessage(err) });
      }
    }

    void loadDetail();

    return () => {
      active = false;
    };
  }, [detailCustomerId, loadCustomerCases]);

  function applyFilters(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setOffset(0);
    setAppliedQuery(query);
    setAppliedMobile(mobileFilter);
    setAppliedCity(cityFilter);
  }

  function resetFilters() {
    setQuery('');
    setAppliedQuery('');
    setMobileFilter('');
    setAppliedMobile('');
    setCityFilter('');
    setAppliedCity('');
    setSourceFilter('');
    setOffset(0);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCreate) return;

    const validation = validateCustomerForm(createForm);
    setCreateError('');

    if (validation) {
      setCreateError(validation);
      return;
    }

    setCreating(true);

    try {
      const created = await createCustomer({
        organizationId: createForm.organizationId.trim() || undefined,
        customerName: createForm.customerName.trim(),
        mobile: createForm.mobile.trim(),
        tel: createForm.tel.trim() || undefined,
        city: createForm.city.trim(),
        address: createForm.address.trim(),
        source: createForm.source
      });
      setCreateForm(initialCustomerForm());
      setShowCreate(false);
      setNotice('客戶已建立。');
      setDetailCustomerId(created.id);
      await loadCustomers();
    } catch (err) {
      setCreateError(errorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingCustomer || !canUpdate) return;

    const validation = validateCustomerForm(editForm);
    setEditError('');

    if (validation) {
      setEditError(validation);
      return;
    }

    setUpdating(true);

    try {
      const updated = await updateCustomer(editingCustomer.id, {
        customerName: editForm.customerName.trim(),
        mobile: editForm.mobile.trim(),
        tel: editForm.tel.trim() || undefined,
        city: editForm.city.trim(),
        address: editForm.address.trim(),
        source: editForm.source
      });
      setEditingCustomer(null);
      setNotice('客戶資料已更新。');
      await loadCustomers();
      if (detailCustomerId === updated.id) {
        setDetail({ customer: updated, loading: false, error: '' });
      }
    } catch (err) {
      setEditError(errorMessage(err));
    } finally {
      setUpdating(false);
    }
  }

  function startEdit(customer: Customer) {
    setEditingCustomer(customer);
    setEditForm(customerFormFromCustomer(customer));
    setEditError('');
  }

  function renderCustomerForm(
    form: CustomerFormState,
    setForm: (updater: (current: CustomerFormState) => CustomerFormState) => void,
    mode: 'create' | 'edit'
  ) {
    return (
      <>
        {mode === 'create' && canReadOrganizations ? (
          <label>
            Organization
            <select
              value={form.organizationId}
              onChange={(event) => setForm((current) => ({ ...current, organizationId: event.target.value }))}
              disabled={organizationsLoading}
            >
              <option value="">依登入者 scope / backend 決定</option>
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.organizationName} / {organization.organizationCode}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {mode === 'create' && organizationsError ? <div className="form-error">{organizationsError}</div> : null}
        <label>
          客戶姓名
          <input
            type="text"
            value={form.customerName}
            onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))}
            required
          />
        </label>
        <label>
          手機
          <input
            type="text"
            value={form.mobile}
            onChange={(event) => setForm((current) => ({ ...current, mobile: event.target.value }))}
            required
          />
        </label>
        <label>
          市話
          <input
            type="text"
            value={form.tel}
            onChange={(event) => setForm((current) => ({ ...current, tel: event.target.value }))}
          />
        </label>
        <label>
          城市
          <input
            type="text"
            value={form.city}
            onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
            required
          />
        </label>
        <label>
          地址
          <input
            type="text"
            value={form.address}
            onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
            required
          />
        </label>
        <label>
          來源
          <select
            value={form.source}
            onChange={(event) => setForm((current) => ({ ...current, source: event.target.value as CaseSource }))}
          >
            {SOURCE_OPTIONS.map((source) => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        </label>
        {mode === 'edit' ? (
          <p className="form-hint">此表單不直接修改 organizationId 或 raw lineUserId；LINE 身分請在 detail panel 管理。</p>
        ) : (
          <p className="form-hint">此表單不輸入 raw lineUserId；LINE 身分請在 customer detail 中管理。</p>
        )}
      </>
    );
  }

  function renderCustomerCases(customer: Customer) {
    if (!canReadCases) {
      return (
        <section className="detail-section">
          <h4>客戶案件歷史</h4>
          <div className="inline-state">你需要 cases.read 權限才能查看客戶案件歷史。</div>
        </section>
      );
    }

    return (
      <section className="detail-section">
        <div className="panel-title-row">
          <h4>客戶案件歷史</h4>
          <button
            type="button"
            className="secondary-button"
            disabled={customerCasesLoading}
            onClick={() => void loadCustomerCases(customer.id, customerCasesOffset)}
          >
            {customerCasesLoading ? '載入中...' : '重新整理'}
          </button>
        </div>
        {customerCasesError ? <div className="form-error">{customerCasesError}</div> : null}
        {customerCasesLoading ? (
          <div className="inline-state">載入客戶案件中...</div>
        ) : customerCases.length === 0 ? (
          <div className="inline-state">此客戶目前沒有案件紀錄。</div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>案件編號</th>
                  <th>狀態</th>
                  <th>品牌</th>
                  <th>產品</th>
                  <th>案件類型</th>
                  <th>優先度</th>
                  <th>建立時間</th>
                  <th>更新時間</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {customerCases.map((adminCase) => {
                  const href = caseHref(adminCase);
                  return (
                    <tr key={adminCase.id}>
                      <td>{adminCase.caseNo}</td>
                      <td>{getCaseStatusLabel(adminCase.status)}</td>
                      <td>{adminCase.brand || '-'}</td>
                      <td>{adminCase.productType || '-'}</td>
                      <td>{adminCase.caseType || '-'}</td>
                      <td>{adminCase.priority || '-'}</td>
                      <td>{formatDate(adminCase.createdAt)}</td>
                      <td>{formatDate(adminCase.updatedAt)}</td>
                      <td>
                        {href ? (
                          <div className="table-actions">
                            <a className="link-button" href={href}>查看案件</a>
                            <span className="form-hint">{caseLinkHint(adminCase)}</span>
                          </div>
                        ) : (
                          <span className="form-hint">缺少案件識別資料</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="pagination-row">
          <button
            type="button"
            className="secondary-button"
            disabled={customerCasesLoading || customerCasesOffset === 0}
            onClick={() => void loadCustomerCases(customer.id, Math.max(customerCasesOffset - limit, 0))}
          >
            Previous
          </button>
          <span>
            顯示 {customerCases.length} 筆
            {typeof customerCasesTotal === 'number' ? ` / 共 ${customerCasesTotal} 筆` : ''}
          </span>
          <button
            type="button"
            className="secondary-button"
            disabled={customerCasesLoading || !hasNextCustomerCasesPage}
            onClick={() => void loadCustomerCases(customer.id, customerCasesOffset + limit)}
          >
            Next
          </button>
        </div>
      </section>
    );
  }

  if (!canRead) {
    return (
      <section className="info-panel">
        <h2>權限不足</h2>
        <p>你需要 customers.read 權限才能查看客戶管理頁。</p>
      </section>
    );
  }

  return (
    <div className="dashboard-grid">
      <section className="page-hero">
        <p className="eyebrow">Customer Admin</p>
        <h2>客戶管理</h2>
        <p>管理客戶基本資料、聯絡資訊、LINE 身分與案件歷史。</p>
      </section>

      {notice ? <div className="inline-state">{notice}</div> : null}

      <section className="info-panel">
        <div className="panel-title-row">
          <h3>客戶列表</h3>
          <div className="form-actions">
            {canCreate ? (
              <button type="button" className="primary-button" onClick={() => setShowCreate(true)}>
                新增客戶
              </button>
            ) : null}
            <button type="button" className="secondary-button" disabled={loading} onClick={() => void loadCustomers()}>
              {loading ? '載入中...' : '重新整理'}
            </button>
          </div>
        </div>

        <form className="toolbar-form cases-toolbar-form" onSubmit={applyFilters}>
          <input
            type="search"
            placeholder="搜尋姓名 / 電話 / 地址"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <input
            type="search"
            placeholder="手機"
            value={mobileFilter}
            onChange={(event) => setMobileFilter(event.target.value)}
          />
          <input
            type="search"
            placeholder="城市"
            value={cityFilter}
            onChange={(event) => setCityFilter(event.target.value)}
          />
          <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as CaseSource | '')}>
            <option value="">全部來源</option>
            {SOURCE_OPTIONS.map((source) => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
          <button type="submit" className="primary-button">搜尋</button>
          <button type="button" className="secondary-button" onClick={resetFilters}>清除</button>
        </form>

        {error ? <div className="form-error">{error}</div> : null}
        {loading ? (
          <div className="inline-state">載入客戶中...</div>
        ) : customers.length === 0 ? (
          <div className="inline-state">目前沒有符合條件的客戶。</div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>手機</th>
                  <th>市話</th>
                  <th>城市</th>
                  <th>地址</th>
                  <th>來源</th>
                  <th>LINE</th>
                  <th>建立時間</th>
                  <th>更新時間</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.customerName}</td>
                    <td>{customer.mobile}</td>
                    <td>{customer.tel || '-'}</td>
                    <td>{customer.city || '-'}</td>
                    <td>{customer.address || '-'}</td>
                    <td>{customer.source}</td>
                    <td>{customer.lineUserIdMasked || '-'}</td>
                    <td>{formatDate(customer.createdAt)}</td>
                    <td>{formatDate(customer.updatedAt)}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="link-button" onClick={() => setDetailCustomerId(customer.id)}>
                          查看
                        </button>
                        {canUpdate ? (
                          <button type="button" className="link-button" onClick={() => startEdit(customer)}>
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

        <div className="pagination-row">
          <button
            type="button"
            className="secondary-button"
            disabled={loading || !hasPreviousPage}
            onClick={() => setOffset((current) => Math.max(current - limit, 0))}
          >
            Previous
          </button>
          <span>
            顯示 {customers.length} 筆
            {typeof total === 'number' ? ` / 共 ${total} 筆` : ''}
          </span>
          <button
            type="button"
            className="secondary-button"
            disabled={loading || !hasNextPage}
            onClick={() => setOffset((current) => current + limit)}
          >
            Next
          </button>
        </div>
      </section>

      {showCreate ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel modal-wide" aria-label="新增客戶">
            <header className="modal-header">
              <h3>新增客戶</h3>
              <button type="button" className="link-button" onClick={() => setShowCreate(false)}>關閉</button>
            </header>
            <form className="stacked-form" onSubmit={handleCreate}>
              {renderCustomerForm(createForm, setCreateForm, 'create')}
              {createError ? <div className="form-error">{createError}</div> : null}
              <div className="form-actions">
                <button type="button" className="secondary-button" disabled={creating} onClick={() => setCreateForm(initialCustomerForm())}>
                  清除
                </button>
                <button type="submit" className="primary-button" disabled={creating}>
                  {creating ? '建立中...' : '建立客戶'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {editingCustomer ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel modal-wide" aria-label="編輯客戶">
            <header className="modal-header">
              <h3>編輯客戶</h3>
              <button type="button" className="link-button" onClick={() => setEditingCustomer(null)}>關閉</button>
            </header>
            <form className="stacked-form" onSubmit={handleUpdate}>
              {renderCustomerForm(editForm, setEditForm, 'edit')}
              {editError ? <div className="form-error">{editError}</div> : null}
              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={() => setEditingCustomer(null)}>
                  取消
                </button>
                <button type="submit" className="primary-button" disabled={updating}>
                  {updating ? '更新中...' : '更新客戶'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {detailCustomerId ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel modal-wide" aria-label="客戶詳情">
            <header className="modal-header">
              <h3>客戶詳情</h3>
              <button type="button" className="link-button" onClick={() => setDetailCustomerId('')}>關閉</button>
            </header>
            {detail.loading ? (
              <div className="inline-state">載入客戶詳情中...</div>
            ) : detail.error ? (
              <div className="form-error">{detail.error}</div>
            ) : detail.customer ? (
              <div className="detail-grid">
                <section className="detail-section">
                  <h4>基本資料</h4>
                  <dl>
                    <div><dt>ID</dt><dd>{detail.customer.id}</dd></div>
                    <div><dt>Organization</dt><dd>{customerOrganizationLabel(detail.customer, organizations)}</dd></div>
                    <div><dt>姓名</dt><dd>{detail.customer.customerName}</dd></div>
                    <div><dt>手機</dt><dd>{detail.customer.mobile}</dd></div>
                    <div><dt>市話</dt><dd>{detail.customer.tel || '-'}</dd></div>
                    <div><dt>城市</dt><dd>{detail.customer.city || '-'}</dd></div>
                    <div><dt>地址</dt><dd>{detail.customer.address || '-'}</dd></div>
                    <div><dt>來源</dt><dd>{detail.customer.source}</dd></div>
                    <div><dt>LINE</dt><dd>{detail.customer.lineUserIdMasked || '-'}</dd></div>
                    <div><dt>建立時間</dt><dd>{formatDate(detail.customer.createdAt)}</dd></div>
                    <div><dt>更新時間</dt><dd>{formatDate(detail.customer.updatedAt)}</dd></div>
                  </dl>
                  {canUpdate ? (
                    <div className="form-actions">
                      <button type="button" className="secondary-button" onClick={() => startEdit(detail.customer as Customer)}>
                        編輯客戶
                      </button>
                    </div>
                  ) : null}
                </section>

                <CustomerLineIdentitiesPanel
                  customerId={detail.customer.id}
                  organizationId={detail.customer.organizationId}
                  onChanged={() => setNotice('Customer LINE 身分綁定已更新。')}
                />

                {renderCustomerCases(detail.customer)}
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
