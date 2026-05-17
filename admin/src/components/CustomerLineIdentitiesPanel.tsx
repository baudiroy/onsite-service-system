import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  CustomerLineIdentity,
  linkCustomerLineIdentity,
  listCustomerLineIdentities,
  unlinkCustomerLineIdentity
} from '../api/customerLineIdentities';
import { LineChannel, listLineChannels } from '../api/lineChannels';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../lib/apiClient';

type CustomerLineIdentitiesPanelProps = {
  customerId?: string | null;
  organizationId?: string | null;
  readonly?: boolean;
  onChanged?: () => void;
};

type LinkFormState = {
  lineChannelId: string;
  lineUserId: string;
  displayName: string;
};

function isAdminLike(userType?: string, hasRole?: (roleKey: string) => boolean) {
  return Boolean(userType === 'system' || hasRole?.('admin') || hasRole?.('system'));
}

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

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const requestId = import.meta.env.DEV && error.requestId ? `（requestId: ${error.requestId}）` : '';
    return `${error.message || fallback}${requestId}`;
  }

  return fallback;
}

function lineChannelOptionLabel(channel: LineChannel) {
  const organization = channel.organizationName || channel.organizationId || '未指定 organization';
  const status = channel.enabled === false ? '停用' : '啟用';
  return `${channel.channelName || '未命名 channel'} / ${channel.channelCode} / ${organization} / ${status}`;
}

function lineInquiryHref(channelCode?: string | null) {
  const params = new URLSearchParams();
  params.set('mode', 'line');
  if (channelCode) params.set('channelCode', channelCode);
  return `/customer-inquiries?${params.toString()}`;
}

export function CustomerLineIdentitiesPanel({
  customerId,
  organizationId,
  readonly = false,
  onChanged
}: CustomerLineIdentitiesPanelProps) {
  const { currentUser, hasPermission, hasRole } = useAuth();
  const adminLike = isAdminLike(currentUser?.userType, hasRole);
  const canRead = hasPermission('line.read') || adminLike;
  const canManage = !readonly && (hasPermission('line.manage') || adminLike);
  const [identities, setIdentities] = useState<CustomerLineIdentity[]>([]);
  const [identitiesLoading, setIdentitiesLoading] = useState(false);
  const [identitiesError, setIdentitiesError] = useState('');
  const [channels, setChannels] = useState<LineChannel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [channelsError, setChannelsError] = useState('');
  const [linkForm, setLinkForm] = useState<LinkFormState>({
    lineChannelId: '',
    lineUserId: '',
    displayName: ''
  });
  const [linkError, setLinkError] = useState('');
  const [linking, setLinking] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState('');
  const [notice, setNotice] = useState('');

  const filteredChannels = useMemo(() => {
    if (!organizationId) return channels;
    return channels.filter((channel) => channel.organizationId === organizationId);
  }, [channels, organizationId]);

  const loadIdentities = useCallback(async () => {
    if (!customerId || !canRead) return;

    setIdentitiesLoading(true);
    setIdentitiesError('');

    try {
      const response = await listCustomerLineIdentities(customerId);
      setIdentities(response);
    } catch (err) {
      setIdentities([]);
      setIdentitiesError(errorMessage(err, '無法載入 LINE 身分綁定。'));
    } finally {
      setIdentitiesLoading(false);
    }
  }, [canRead, customerId]);

  const loadChannels = useCallback(async () => {
    if (!canManage) return;

    setChannelsLoading(true);
    setChannelsError('');

    try {
      const response = await listLineChannels({
        organizationId: organizationId || undefined,
        limit: 100,
        offset: 0
      });
      setChannels(response.data);
    } catch (err) {
      setChannels([]);
      setChannelsError(errorMessage(err, '無法載入 LINE channel 清單。'));
    } finally {
      setChannelsLoading(false);
    }
  }, [canManage, organizationId]);

  useEffect(() => {
    void loadIdentities();
  }, [loadIdentities]);

  useEffect(() => {
    void loadChannels();
  }, [loadChannels]);

  async function handleLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customerId || !canManage) return;

    const lineChannelId = linkForm.lineChannelId.trim();
    const lineUserId = linkForm.lineUserId.trim();
    const displayName = linkForm.displayName.trim();
    setLinkError('');
    setNotice('');

    if (!lineChannelId) {
      setLinkError('請選擇 LINE channel。');
      return;
    }

    if (!lineUserId) {
      setLinkError('請輸入 lineUserId。');
      return;
    }

    const existingIds = new Set(identities.map((identity) => identity.id));
    setLinking(true);

    try {
      const linkedIdentity = await linkCustomerLineIdentity(customerId, {
        lineChannelId,
        lineUserId,
        displayName: displayName || undefined
      });
      setLinkForm({ lineChannelId, lineUserId: '', displayName: '' });
      await loadIdentities();
      onChanged?.();
      setNotice(existingIds.has(linkedIdentity.id) ? '此 LINE 身分已綁定，已重新整理列表。' : 'LINE 身分已建立綁定。');
    } catch (err) {
      setLinkError(errorMessage(err, '無法建立 LINE 身分綁定。'));
    } finally {
      setLinking(false);
    }
  }

  async function handleUnlink(identity: CustomerLineIdentity) {
    if (!customerId || !canManage) return;
    const confirmed = window.confirm(`確定要解除 ${identity.channelCode || identity.channelName || '此 LINE channel'} 的 LINE 身分綁定嗎？`);
    if (!confirmed) return;

    setUnlinkingId(identity.id);
    setIdentitiesError('');
    setNotice('');

    try {
      await unlinkCustomerLineIdentity(customerId, identity.id);
      await loadIdentities();
      onChanged?.();
      setNotice('LINE 身分已解除綁定。');
    } catch (err) {
      setIdentitiesError(errorMessage(err, '無法解除 LINE 身分綁定。'));
    } finally {
      setUnlinkingId('');
    }
  }

  if (!customerId) {
    return (
      <section className="detail-section">
        <h4>LINE 身分綁定</h4>
        <div className="inline-state">此案件未提供 customerId，無法管理 LINE 身分。</div>
        <p className="form-hint">不會從手機、姓名、internal notes 或 messages 推測 customerId。</p>
      </section>
    );
  }

  if (!canRead) {
    return (
      <section className="detail-section">
        <h4>LINE 身分綁定</h4>
        <div className="inline-state">你需要 line.read 權限才能查看 customer LINE 身分綁定。</div>
      </section>
    );
  }

  return (
    <section className="detail-section">
      <div className="panel-title-row">
        <h4>LINE 身分綁定</h4>
        <button type="button" className="secondary-button" disabled={identitiesLoading} onClick={() => void loadIdentities()}>
          {identitiesLoading ? '載入中...' : '重新整理'}
        </button>
      </div>
      {notice ? <div className="inline-state">{notice}</div> : null}
      {identitiesError ? <div className="form-error" role="alert">{identitiesError}</div> : null}
      {identitiesLoading ? (
        <div className="inline-state">載入 LINE 身分綁定中...</div>
      ) : identities.length === 0 ? (
        <div className="inline-state">此客戶尚未綁定 LINE 身分。</div>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>channelCode</th>
                <th>channelName</th>
                <th>LINE User</th>
                <th>Display name</th>
                <th>Linked at</th>
                <th>Created at</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {identities.map((identity) => (
                <tr key={identity.id}>
                  <td>{identity.channelCode || '-'}</td>
                  <td>{identity.channelName || '-'}</td>
                  <td>{identity.lineUserIdMasked || '-'}</td>
                  <td>{identity.displayName || '-'}</td>
                  <td>{formatDate(identity.linkedAt)}</td>
                  <td>{formatDate(identity.createdAt)}</td>
                  <td>
                    <div className="table-actions">
                      {identity.channelCode ? (
                        <a className="link-button" href={lineInquiryHref(identity.channelCode)}>
                          測試查詢
                        </a>
                      ) : null}
                      {canManage ? (
                        <button
                          type="button"
                          className="link-button danger"
                          disabled={unlinkingId === identity.id}
                          onClick={() => void handleUnlink(identity)}
                        >
                          {unlinkingId === identity.id ? '解除中...' : '解除綁定'}
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

      {canManage ? (
        <div className="sub-panel">
          <div className="panel-title-row">
            <h5>新增 LINE 身分綁定</h5>
            <button type="button" className="secondary-button" disabled={channelsLoading} onClick={() => void loadChannels()}>
              {channelsLoading ? '載入中...' : '重新載入 channels'}
            </button>
          </div>
          {channelsLoading ? <div className="inline-state">載入 LINE channel 清單中...</div> : null}
          {channelsError ? <div className="form-error" role="alert">{channelsError}</div> : null}
          {!channelsLoading && !channelsError && filteredChannels.length === 0 ? (
            <div className="inline-state">目前沒有可選擇的 LINE channel；不提供手動 lineChannelId，避免錯綁。</div>
          ) : null}
          <form className="stacked-form" onSubmit={handleLink}>
            <label>
              LINE channel
              <select
                value={linkForm.lineChannelId}
                onChange={(event) => {
                  setLinkForm((current) => ({ ...current, lineChannelId: event.target.value }));
                  setLinkError('');
                }}
                required
              >
                <option value="">請選擇 LINE channel</option>
                {filteredChannels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {lineChannelOptionLabel(channel)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              lineUserId
              <input
                type="text"
                value={linkForm.lineUserId}
                onChange={(event) => setLinkForm((current) => ({ ...current, lineUserId: event.target.value }))}
                placeholder="Uxxxxxxxxxxxxxxxx"
                required
              />
            </label>
            <label>
              Display name
              <input
                type="text"
                value={linkForm.displayName}
                onChange={(event) => setLinkForm((current) => ({ ...current, displayName: event.target.value }))}
                placeholder="optional display name"
              />
            </label>
            <p className="form-hint">
              lineUserId 只存在本表單 state，送出成功後會清空；不會放進 query string、localStorage 或 sessionStorage。
            </p>
            {organizationId ? (
              <p className="form-hint">已依此案件 organization 篩選 LINE channels；backend 仍會檢查 customer 與 channel organization scope。</p>
            ) : (
              <p className="form-hint">案件缺少 organizationId 時會顯示可載入的 channels；backend 仍是 scope 檢查來源。</p>
            )}
            {linkError ? <div className="form-error" role="alert">{linkError}</div> : null}
            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={linking}
                onClick={() => {
                  setLinkForm((current) => ({ ...current, lineUserId: '', displayName: '' }));
                  setLinkError('');
                }}
              >
                清除輸入
              </button>
              <button type="submit" className="primary-button" disabled={linking || filteredChannels.length === 0}>
                {linking ? '綁定中...' : '建立綁定'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <p className="form-hint">你可以查看 LINE 身分；建立或解除綁定需要 line.manage 權限。</p>
      )}
    </section>
  );
}
