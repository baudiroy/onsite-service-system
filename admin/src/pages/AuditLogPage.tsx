import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AuditLog, getSafeMetadataKeys, listAuditLogs } from '../api/auditLogs';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../lib/apiClient';
import { buildCaseDetailUrl } from '../utils/caseLinks';

type AuditLogFilters = {
  action: string;
  entityType: string;
  entityId: string;
  actorUserId: string;
  organizationId: string;
  requestId: string;
  createdFrom: string;
  createdTo: string;
  sort: 'createdAtDesc' | 'createdAtAsc';
};

type CaseAuditLink = {
  href: string;
  label: string;
  hint: string;
};

const DEFAULT_LIMIT = 50;

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

function initialFilters(): AuditLogFilters {
  return {
    action: '',
    entityType: '',
    entityId: '',
    actorUserId: '',
    organizationId: '',
    requestId: '',
    createdFrom: '',
    createdTo: '',
    sort: 'createdAtDesc'
  };
}

function readMetadataString(metadata: AuditLog['metadata'], key: string) {
  const value = metadata?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function buildCaseAuditLink(auditLog: AuditLog): CaseAuditLink | null {
  const entityType = auditLog.entityType?.trim();
  const entityId = auditLog.entityId?.trim();
  const metadataCaseNo = readMetadataString(auditLog.metadata, 'caseNo');
  const metadataCaseId = readMetadataString(auditLog.metadata, 'caseId');

  if (entityType === 'case' && entityId) {
    const href = buildCaseDetailUrl({ caseId: entityId });
    return href ? { href, label: '查看案件', hint: '依 entityId 開啟案件詳情' } : null;
  }

  if (metadataCaseId) {
    const href = buildCaseDetailUrl({
      caseId: metadataCaseId,
      caseNo: metadataCaseNo,
      preserveCaseNo: Boolean(metadataCaseNo)
    });
    return href ? { href, label: '查看案件', hint: metadataCaseNo ? '依 metadata caseId + caseNo 開啟' : '依 metadata.caseId 開啟' } : null;
  }

  if (entityType === 'case' && metadataCaseNo) {
    const href = buildCaseDetailUrl({ caseNo: metadataCaseNo });
    return href ? { href, label: '依案件編號查看', hint: '依 metadata.caseNo 篩選案件' } : null;
  }

  return null;
}

export function AuditLogPage() {
  const { currentUser, hasPermission, hasRole } = useAuth();
  const adminLike = isAdminLikeUser(currentUser, hasRole);
  const canReadAuditLogs = hasPermission('audit_logs.read') || adminLike;
  const canReadCases = hasPermission('cases.read') || adminLike;

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState<number | undefined>();
  const [limit] = useState(DEFAULT_LIMIT);
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState<AuditLogFilters>(() => initialFilters());
  const [appliedFilters, setAppliedFilters] = useState<AuditLogFilters>(() => initialFilters());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasNextPage = useMemo(() => {
    if (typeof total === 'number') return offset + limit < total;
    return auditLogs.length === limit;
  }, [auditLogs.length, limit, offset, total]);

  const hasPreviousPage = offset > 0;

  const loadAuditLogs = useCallback(async () => {
    if (!canReadAuditLogs) return;

    setLoading(true);
    setError('');

    try {
      const result = await listAuditLogs({
        action: appliedFilters.action.trim() || undefined,
        entityType: appliedFilters.entityType.trim() || undefined,
        entityId: appliedFilters.entityId.trim() || undefined,
        actorUserId: appliedFilters.actorUserId.trim() || undefined,
        organizationId: appliedFilters.organizationId.trim() || undefined,
        requestId: appliedFilters.requestId.trim() || undefined,
        createdFrom: appliedFilters.createdFrom.trim() || undefined,
        createdTo: appliedFilters.createdTo.trim() || undefined,
        sort: appliedFilters.sort,
        limit,
        offset
      });
      setAuditLogs(result.data);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, canReadAuditLogs, limit, offset]);

  useEffect(() => {
    void loadAuditLogs();
  }, [loadAuditLogs]);

  function updateFilter<K extends keyof AuditLogFilters>(key: K, value: AuditLogFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function applyFilters(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setOffset(0);
    setAppliedFilters(filters);
  }

  function resetFilters() {
    const nextFilters = initialFilters();
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setOffset(0);
  }

  if (!canReadAuditLogs) {
    return (
      <div className="admin-page">
        <section className="page-hero">
          <p className="eyebrow">Audit Logs</p>
          <h2>Audit Logs</h2>
          <p>你需要 audit_logs.read 權限才能查看系統重要操作紀錄。</p>
        </section>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <section className="page-hero">
        <p className="eyebrow">Audit Logs</p>
        <h2>Audit Logs</h2>
        <p>查看系統重要操作紀錄；case 相關紀錄可安全連到案件詳情，metadata 只顯示 key-level 摘要。</p>
      </section>

      <section className="toolbar-panel">
        <form className="toolbar-form audit-log-toolbar-form" onSubmit={applyFilters}>
          <label>
            Action
            <input value={filters.action} onChange={(event) => updateFilter('action', event.target.value)} placeholder="case.closed" />
          </label>
          <label>
            Entity Type
            <input value={filters.entityType} onChange={(event) => updateFilter('entityType', event.target.value)} placeholder="case" />
          </label>
          <label>
            Entity ID
            <input value={filters.entityId} onChange={(event) => updateFilter('entityId', event.target.value)} placeholder="UUID" />
          </label>
          <label>
            Actor User ID
            <input value={filters.actorUserId} onChange={(event) => updateFilter('actorUserId', event.target.value)} placeholder="UUID" />
          </label>
          <label>
            Organization ID
            <input value={filters.organizationId} onChange={(event) => updateFilter('organizationId', event.target.value)} placeholder="UUID" />
          </label>
          <label>
            Request ID
            <input value={filters.requestId} onChange={(event) => updateFilter('requestId', event.target.value)} placeholder="request id" />
          </label>
          <label>
            Created From
            <input value={filters.createdFrom} onChange={(event) => updateFilter('createdFrom', event.target.value)} placeholder="2026-05-16T00:00:00+08:00" />
          </label>
          <label>
            Created To
            <input value={filters.createdTo} onChange={(event) => updateFilter('createdTo', event.target.value)} placeholder="2026-05-16T23:59:59+08:00" />
          </label>
          <label>
            Sort
            <select value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value as AuditLogFilters['sort'])}>
              <option value="createdAtDesc">最新優先</option>
              <option value="createdAtAsc">最舊優先</option>
            </select>
          </label>
          <div className="toolbar-actions">
            <button type="submit" disabled={loading}>{loading ? '查詢中...' : '查詢'}</button>
            <button type="button" className="secondary-button" disabled={loading} onClick={resetFilters}>清除</button>
            <button type="button" className="secondary-button" disabled={loading} onClick={() => void loadAuditLogs()}>
              重新整理
            </button>
          </div>
        </form>
      </section>

      <section className="data-panel">
        <div className="panel-title-row">
          <div>
            <h3>稽核事件列表</h3>
            <p className="form-hint">metadata 不顯示 raw values；case link 僅使用 caseId / caseNo。</p>
          </div>
          <span className="form-hint">{typeof total === 'number' ? `共 ${total} 筆` : `目前 ${auditLogs.length} 筆`}</span>
        </div>

        {error ? <div className="form-error">{error}</div> : null}
        {loading ? (
          <div className="inline-state">載入 audit logs 中...</div>
        ) : auditLogs.length === 0 ? (
          <div className="inline-state">目前沒有 audit log 紀錄。</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>時間</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Actor</th>
                  <th>Organization</th>
                  <th>Request ID</th>
                  <th>Metadata Keys</th>
                  <th>相關連結</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((auditLog) => {
                  const caseLink = buildCaseAuditLink(auditLog);
                  const safeMetadataKeys = getSafeMetadataKeys(auditLog.metadata);

                  return (
                    <tr key={auditLog.id}>
                      <td>{formatDate(auditLog.createdAt)}</td>
                      <td>{auditLog.action || '-'}</td>
                      <td>
                        <div>{auditLog.entityType || '-'}</div>
                        <span className="form-hint">{auditLog.entityId || '-'}</span>
                      </td>
                      <td>
                        <div>{auditLog.actorDisplayName || auditLog.actorType || '-'}</div>
                        <span className="form-hint">{auditLog.actorUserId || '-'}</span>
                      </td>
                      <td>{auditLog.organizationId || '-'}</td>
                      <td>{auditLog.requestId || '-'}</td>
                      <td>
                        {safeMetadataKeys.length > 0 ? (
                          <span className="form-hint">{safeMetadataKeys.join(', ')}</span>
                        ) : (
                          <span className="form-hint">無安全 metadata keys</span>
                        )}
                      </td>
                      <td>
                        {caseLink && canReadCases ? (
                          <div className="table-actions">
                            <a className="link-button" href={caseLink.href}>{caseLink.label}</a>
                            <span className="form-hint">{caseLink.hint}</span>
                          </div>
                        ) : caseLink ? (
                          <span className="form-hint">需要 cases.read 才能開啟案件</span>
                        ) : (
                          <span className="form-hint">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="pagination-bar">
          <span>
            第 {Math.floor(offset / limit) + 1} 頁
            {typeof total === 'number' ? ` / ${Math.max(Math.ceil(total / limit), 1)} 頁` : ''}
          </span>
          <div>
            <button
              type="button"
              className="secondary-button"
              disabled={loading || !hasPreviousPage}
              onClick={() => setOffset(Math.max(offset - limit, 0))}
            >
              上一頁
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={loading || !hasNextPage}
              onClick={() => setOffset(offset + limit)}
            >
              下一頁
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
