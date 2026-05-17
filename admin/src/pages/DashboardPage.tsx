import { useCallback, useEffect, useState } from 'react';
import type { AdminCase } from '../api/cases';
import { listCases } from '../api/cases';
import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL, ApiError } from '../lib/apiClient';
import { getCaseLinkAvailability } from '../utils/caseLinks';
import { getCaseStatusLabel } from '../utils/caseWorkflow';

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
    return `${error.message || '載入失敗，請稍後再試。'}${requestId}`;
  }

  return '載入失敗，請稍後再試。';
}

function isAdminLikeUser(currentUser: ReturnType<typeof useAuth>['currentUser'], hasRole: (roleKey: string) => boolean) {
  return Boolean(currentUser?.userType === 'system' || hasRole('admin') || hasRole('system'));
}

export function DashboardPage() {
  const { currentUser, hasPermission, hasRole } = useAuth();
  const adminLike = isAdminLikeUser(currentUser, hasRole);
  const canReadCases = hasPermission('cases.read') || adminLike;

  const [recentCases, setRecentCases] = useState<AdminCase[]>([]);
  const [recentCasesLoading, setRecentCasesLoading] = useState(false);
  const [recentCasesError, setRecentCasesError] = useState('');

  const loadRecentCases = useCallback(async () => {
    if (!canReadCases) return;

    try {
      setRecentCasesLoading(true);
      setRecentCasesError('');
      const result = await listCases({ limit: 5, offset: 0, sort: 'createdAtDesc' });
      setRecentCases(result.data);
    } catch (error) {
      setRecentCasesError(errorMessage(error));
    } finally {
      setRecentCasesLoading(false);
    }
  }, [canReadCases]);

  useEffect(() => {
    void loadRecentCases();
  }, [loadRecentCases]);

  return (
    <div className="dashboard-grid">
      <section className="page-hero">
        <p className="eyebrow">Dashboard</p>
        <h2>到府服務系統後台</h2>
        <p>登入與 API 連線已建立。這裡先保留為營運首頁，後續再逐步接入案件、派工、服務紀錄與帳務模組。</p>
      </section>

      <section className="info-panel">
        <h3>目前使用者</h3>
        <dl>
          <div>
            <dt>名稱</dt>
            <dd>{currentUser?.displayName || '-'}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{currentUser?.email || '-'}</dd>
          </div>
          <div>
            <dt>使用者類型</dt>
            <dd>{currentUser?.userType || '-'}</dd>
          </div>
          <div>
            <dt>狀態</dt>
            <dd>{currentUser?.status || '-'}</dd>
          </div>
        </dl>
      </section>

      <section className="info-panel">
        <h3>API 狀態</h3>
        <dl>
          <div>
            <dt>Base URL</dt>
            <dd>{API_BASE_URL || 'same-origin'}</dd>
          </div>
          <div>
            <dt>Current User</dt>
            <dd>已載入</dd>
          </div>
          <div>
            <dt>Roles</dt>
            <dd>{currentUser?.roles?.length ? currentUser.roles.join(', ') : '未提供或空陣列'}</dd>
          </div>
          <div>
            <dt>Permissions</dt>
            <dd>{currentUser?.permissions?.length || 0} 筆</dd>
          </div>
        </dl>
      </section>

      <section className="info-panel page-hero">
        <div className="panel-title-row">
          <div>
            <h3>最近案件</h3>
            <p className="form-hint">使用既有案件列表 API 載入最近建立的 5 筆案件，查看會導向案件詳情 deep link。</p>
          </div>
          {canReadCases ? (
            <button
              type="button"
              className="secondary-button"
              disabled={recentCasesLoading}
              onClick={() => void loadRecentCases()}
            >
              {recentCasesLoading ? '載入中...' : '重新整理'}
            </button>
          ) : null}
        </div>

        {!canReadCases ? (
          <div className="inline-state">你需要 cases.read 權限才能查看最近案件。</div>
        ) : recentCasesError ? (
          <div className="form-error">{recentCasesError}</div>
        ) : recentCasesLoading ? (
          <div className="inline-state">載入最近案件中...</div>
        ) : recentCases.length === 0 ? (
          <div className="inline-state">目前沒有最近案件。</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>案件編號</th>
                  <th>狀態</th>
                  <th>客戶</th>
                  <th>品牌</th>
                  <th>產品</th>
                  <th>優先度</th>
                  <th>建立時間</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {recentCases.map((adminCase) => {
                  const caseLink = getCaseLinkAvailability({
                    caseId: adminCase.id,
                    caseNo: adminCase.caseNo
                  });
                  return (
                    <tr key={adminCase.id || adminCase.caseNo}>
                      <td>{adminCase.caseNo || '-'}</td>
                      <td>{getCaseStatusLabel(adminCase.status)}</td>
                      <td>{adminCase.customerSummary?.name || '-'}</td>
                      <td>{adminCase.brand || '-'}</td>
                      <td>{adminCase.productType || '-'}</td>
                      <td>{adminCase.priority || '-'}</td>
                      <td>{formatDate(adminCase.createdAt)}</td>
                      <td>
                        {caseLink.href ? (
                          <div className="table-actions">
                            <a className="link-button" href={caseLink.href}>查看</a>
                            <span className="form-hint">
                              {caseLink.mode === 'detail' ? '開啟案件詳情' : '依案件編號篩選'}
                            </span>
                          </div>
                        ) : (
                          <span className="form-hint">{caseLink.label}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
