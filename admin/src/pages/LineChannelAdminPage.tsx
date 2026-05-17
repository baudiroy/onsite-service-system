import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { LineChannel, listLineChannels } from '../api/lineChannels';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../lib/apiClient';

const DEFAULT_LIMIT = 50;

type EnabledFilter = '' | 'true' | 'false';

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

function enabledLabel(channel: LineChannel) {
  if (channel.enabled === false || channel.status === 'disabled') return '停用';
  return '啟用';
}

function enabledClass(channel: LineChannel) {
  return channel.enabled === false || channel.status === 'disabled' ? 'is-disabled' : 'is-active';
}

function lineInquiryPreviewHref(channelCode: string) {
  const params = new URLSearchParams({
    mode: 'line',
    channelCode
  });
  return `/customer-inquiries?${params.toString()}`;
}

export function LineChannelAdminPage() {
  const { currentUser, hasPermission, hasRole } = useAuth();
  const canRead = hasPermission('line.read') || isAdminLikeUser(currentUser, hasRole);
  const canManage = hasPermission('line.manage') || isAdminLikeUser(currentUser, hasRole);

  const [channels, setChannels] = useState<LineChannel[]>([]);
  const [total, setTotal] = useState<number | undefined>();
  const [limit] = useState(DEFAULT_LIMIT);
  const [offset, setOffset] = useState(0);
  const [channelCodeQuery, setChannelCodeQuery] = useState('');
  const [appliedChannelCode, setAppliedChannelCode] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [appliedOrganizationId, setAppliedOrganizationId] = useState('');
  const [enabledFilter, setEnabledFilter] = useState<EnabledFilter>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [detailChannel, setDetailChannel] = useState<LineChannel | null>(null);
  const [copyMessage, setCopyMessage] = useState('');

  const hasNextPage = useMemo(() => {
    if (typeof total === 'number') return offset + limit < total;
    return channels.length === limit;
  }, [channels.length, limit, offset, total]);

  const hasPreviousPage = offset > 0;

  const loadChannels = useCallback(async () => {
    if (!canRead) return;

    setLoading(true);
    setError('');

    try {
      const result = await listLineChannels({
        channelCode: appliedChannelCode.trim() || undefined,
        organizationId: appliedOrganizationId.trim() || undefined,
        enabled: enabledFilter === '' ? '' : enabledFilter === 'true',
        limit,
        offset
      });
      setChannels(result.data);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [appliedChannelCode, appliedOrganizationId, canRead, enabledFilter, limit, offset]);

  useEffect(() => {
    void loadChannels();
  }, [loadChannels]);

  function applyFilters(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setOffset(0);
    setAppliedChannelCode(channelCodeQuery);
    setAppliedOrganizationId(organizationId);
  }

  async function copyChannelCode(channelCode: string) {
    setCopyMessage('');

    if (!navigator.clipboard?.writeText) {
      setCopyMessage('此瀏覽器不支援自動複製，請手動選取 channelCode。');
      return;
    }

    try {
      await navigator.clipboard.writeText(channelCode);
      setCopyMessage('已複製 channelCode。');
    } catch {
      setCopyMessage('無法自動複製，請手動選取 channelCode。');
    }
  }

  if (!canRead) {
    return (
      <section className="page-hero">
        <p className="eyebrow">Permission Required</p>
        <h2>LINE Channel 管理</h2>
        <p>你需要 line.read 權限才能查看 LINE Channel 管理頁。</p>
      </section>
    );
  }

  return (
    <div className="admin-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">LINE Channel Admin</p>
          <h2>LINE Channel 管理</h2>
          <p>查看各 organization 的 LINE channel 設定與 channelCode；本頁不顯示 channel secret 或 access token。</p>
        </div>
      </section>

      <section className="toolbar-panel">
        <form className="toolbar-form" onSubmit={applyFilters}>
          <label>
            channelCode
            <input
              type="search"
              value={channelCodeQuery}
              onChange={(event) => setChannelCodeQuery(event.target.value)}
              placeholder="client-a"
            />
          </label>
          <label>
            organizationId
            <input
              type="text"
              value={organizationId}
              onChange={(event) => setOrganizationId(event.target.value)}
              placeholder="optional UUID"
            />
          </label>
          <label>
            狀態
            <select
              value={enabledFilter}
              onChange={(event) => {
                setEnabledFilter(event.target.value as EnabledFilter);
                setOffset(0);
              }}
            >
              <option value="">全部</option>
              <option value="true">啟用</option>
              <option value="false">停用</option>
            </select>
          </label>
          <div className="toolbar-actions">
            <button type="submit" className="secondary-button">搜尋</button>
            <button type="button" className="secondary-button" onClick={() => void loadChannels()} disabled={loading}>
              重新整理
            </button>
          </div>
        </form>
      </section>

      <section className="info-panel">
        <h3>安全提醒</h3>
        <ul className="compact-list">
          <li><strong>可使用</strong><span>channelCode 可用於 /customer-inquiries 的 LINE 查詢預覽。</span></li>
          <li><strong>不顯示</strong><span>channelSecret、channelAccessToken、raw credentials 或任何 secret-like value。</span></li>
          <li><strong>後續</strong><span>Create / update secret UI、webhook setup、Rich Menu、LIFF 與 LINE Push 留到後續任務。</span></li>
        </ul>
      </section>

      {notice ? <div className="form-success">{notice}</div> : null}
      {copyMessage ? <div className="form-success">{copyMessage}</div> : null}
      {error ? <div className="form-error" role="alert">{error}</div> : null}
      {!canManage ? <p className="form-hint">目前頁面為 read/list/detail foundation；create/update 需要 line.manage，且本任務不開放 secret 編輯 UI。</p> : null}

      <section className="data-panel">
        {loading ? (
          <div className="inline-state">載入 LINE channels 中...</div>
        ) : channels.length === 0 ? (
          <div className="inline-state">目前沒有符合條件的 LINE channels。</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>channelCode</th>
                  <th>channelName</th>
                  <th>Organization</th>
                  <th>channelId</th>
                  <th>狀態</th>
                  <th>建立時間</th>
                  <th>更新時間</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((channel) => (
                  <tr key={channel.id}>
                    <td>{channel.channelCode}</td>
                    <td>{channel.channelName}</td>
                    <td>{channel.organizationName || channel.organizationId || '-'}</td>
                    <td>{channel.channelId || '-'}</td>
                    <td>
                      <span className={`status-pill ${enabledClass(channel)}`}>
                        {enabledLabel(channel)}
                      </span>
                    </td>
                    <td>{formatDate(channel.createdAt)}</td>
                    <td>{formatDate(channel.updatedAt)}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="link-button" onClick={() => setDetailChannel(channel)}>
                          查看
                        </button>
                        <button type="button" className="link-button" onClick={() => void copyChannelCode(channel.channelCode)}>
                          複製 channelCode
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
            顯示 {channels.length} 筆
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

      {detailChannel ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel modal-wide" aria-label="LINE Channel 詳情">
            <header className="modal-header">
              <h3>LINE Channel 詳情</h3>
              <button type="button" className="link-button" onClick={() => setDetailChannel(null)}>
                關閉
              </button>
            </header>
            <div className="detail-grid">
              <section className="detail-section">
                <h4>安全欄位</h4>
                <dl>
                  <div><dt>ID</dt><dd>{detailChannel.id}</dd></div>
                  <div><dt>Organization</dt><dd>{detailChannel.organizationName || detailChannel.organizationId || '-'}</dd></div>
                  <div><dt>channelCode</dt><dd>{detailChannel.channelCode}</dd></div>
                  <div><dt>channelName</dt><dd>{detailChannel.channelName}</dd></div>
                  <div><dt>channelId</dt><dd>{detailChannel.channelId || '-'}</dd></div>
                  <div><dt>狀態</dt><dd>{enabledLabel(detailChannel)}</dd></div>
                  <div><dt>建立時間</dt><dd>{formatDate(detailChannel.createdAt)}</dd></div>
                  <div><dt>更新時間</dt><dd>{formatDate(detailChannel.updatedAt)}</dd></div>
                </dl>
                <div className="form-actions">
                  <button type="button" className="secondary-button" onClick={() => void copyChannelCode(detailChannel.channelCode)}>
                    複製 channelCode
                  </button>
                  <a className="secondary-button" href={lineInquiryPreviewHref(detailChannel.channelCode)}>
                    用此 channelCode 測試 LINE 查詢
                  </a>
                </div>
              </section>

              <section className="detail-section">
                <h4>後續擴充</h4>
                <ul className="compact-list">
                  <li><strong>LINE webhook setup</strong><span>將於後續任務加入，不在本頁設定 secrets。</span></li>
                  <li><strong>LINE Push provider</strong><span>將於後續通知任務加入。</span></li>
                  <li><strong>Rich Menu / LIFF</strong><span>保留為未來 LINE UX task。</span></li>
                  <li><strong>Inquiry picker</strong><span>可前往 LINE 查詢預覽使用此 channelCode；不會帶入 lineUserId，也不會自動送出。</span></li>
                </ul>
              </section>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
