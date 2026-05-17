import { FormEvent, useEffect, useState } from 'react';
import {
  CustomerInquiryResponse,
  CustomerVisibleAttachment,
  inquiryByCaseNoAndMobile,
  inquiryByLineUser
} from '../api/customerInquiry';
import { LineChannel, listLineChannels } from '../api/lineChannels';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../lib/apiClient';

type InquiryFormState = {
  caseNo: string;
  mobile: string;
};

type LineInquiryFormState = {
  channelCode: string;
  caseNo: string;
  lineUserId: string;
};

const GENERIC_FAILURE_MESSAGE = 'Unable to verify the case with the provided information.';

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

function formatBytes(value?: number | null) {
  if (value === null || value === undefined) return '-';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const requestId = import.meta.env.DEV && error.requestId ? `（requestId: ${error.requestId}）` : '';
    return `${error.message || '查詢失敗，請稍後再試。'}${requestId}`;
  }

  return '查詢失敗，請稍後再試。';
}

function lineChannelErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const requestId = import.meta.env.DEV && error.requestId ? `（requestId: ${error.requestId}）` : '';
    return `${error.message || '無法載入 LINE channel 清單，請手動輸入 channelCode。'}${requestId}`;
  }

  return '無法載入 LINE channel 清單，請手動輸入 channelCode。';
}

function isAdminLike(userType?: string, hasRole?: (roleKey: string) => boolean) {
  return Boolean(userType === 'system' || hasRole?.('admin') || hasRole?.('system'));
}

function attachmentTypeLabel(type?: string | null) {
  const labels: Record<string, string> = {
    fault_photo: '故障照片',
    serial_photo: '序號照片',
    invoice_photo: '發票照片',
    product_photo: '產品照片',
    issue_photo: '問題照片',
    completion_photo: '完修照片',
    signature: '簽名',
    other: '其他'
  };
  return type ? labels[type] || type : '-';
}

function renderAttachment(attachment: CustomerVisibleAttachment, index: number) {
  return (
    <article key={`${attachment.originalFilename || 'attachment'}-${index}`} className="attachment-card">
      <div className="attachment-card-header">
        <div>
          <span className="timeline-type">{attachmentTypeLabel(attachment.attachmentType)}</span>
          <h5>{attachment.originalFilename || '未命名附件'}</h5>
          <p className="timeline-meta">{attachment.contentType || '-'} / {formatBytes(attachment.byteSize)}</p>
        </div>
      </div>
      <dl className="attachment-meta-grid">
        <div><dt>建立時間</dt><dd>{formatDate(attachment.createdAt)}</dd></div>
      </dl>
    </article>
  );
}

function lineChannelOptionLabel(channel: LineChannel) {
  const organization = channel.organizationName || channel.organizationId || '未指定 organization';
  const status = channel.enabled === false ? '停用' : '啟用';
  return `${channel.channelName || '未命名 channel'} / ${channel.channelCode} / ${organization} / ${status}`;
}

export function CustomerInquiryPreviewPage() {
  const { currentUser, hasPermission, hasRole } = useAuth();
  const adminLike = isAdminLike(currentUser?.userType, hasRole);
  const canPreview = hasPermission('cases.read') || adminLike;
  const canReadLineChannels = hasPermission('line.read') || adminLike;
  const [activeMode, setActiveMode] = useState<'mobile' | 'line'>('mobile');
  const [form, setForm] = useState<InquiryFormState>({ caseNo: '', mobile: '' });
  const [lineForm, setLineForm] = useState<LineInquiryFormState>({ channelCode: '', caseNo: '', lineUserId: '' });
  const [prefillMessage, setPrefillMessage] = useState('');
  const [linePrefillMessage, setLinePrefillMessage] = useState('');
  const [lineChannels, setLineChannels] = useState<LineChannel[]>([]);
  const [lineChannelsLoading, setLineChannelsLoading] = useState(false);
  const [lineChannelsLoaded, setLineChannelsLoaded] = useState(false);
  const [lineChannelsError, setLineChannelsError] = useState('');
  const [result, setResult] = useState<CustomerInquiryResponse | null>(null);
  const [lineResult, setLineResult] = useState<CustomerInquiryResponse | null>(null);
  const [error, setError] = useState('');
  const [lineError, setLineError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [lineValidationError, setLineValidationError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lineSubmitting, setLineSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode')?.trim() || '';
    const caseNo = params.get('caseNo')?.trim() || '';
    const mobile = params.get('mobile')?.trim() || '';
    const channelCode = params.get('channelCode')?.trim() || '';

    if (mode === 'line' || channelCode) {
      setActiveMode('line');
      setLineForm((current) => ({ ...current, channelCode, caseNo: caseNo || current.caseNo }));
      setLineResult(null);
      setLineError('');
      setLineValidationError('');
      setLinePrefillMessage(
        channelCode
          ? '已從 LINE Channel 管理帶入 channelCode，請確認案件編號與 lineUserId 後送出。'
          : '已切換至 LINE 查詢預覽，請選擇或輸入 channelCode。'
      );
      return;
    }

    if (!caseNo && !mobile) return;

    setForm({ caseNo, mobile });
    setResult(null);
    setError('');
    setValidationError('');
    setPrefillMessage(
      mobile
        ? '已從案件詳情帶入查詢條件，請確認後送出。'
        : '已從案件詳情帶入案件編號；此案件沒有可預填的手機號碼，請手動輸入。'
    );
  }, []);

  useEffect(() => {
    if (!canPreview || !canReadLineChannels || activeMode !== 'line' || lineChannelsLoaded || lineChannelsLoading) return;

    let cancelled = false;

    async function loadLineChannels() {
      setLineChannelsLoading(true);
      setLineChannelsError('');

      try {
        const response = await listLineChannels({ limit: 100, offset: 0 });
        if (cancelled) return;
        setLineChannels(response.data);
        setLineChannelsLoaded(true);
      } catch (err) {
        if (cancelled) return;
        setLineChannelsError(lineChannelErrorMessage(err));
        setLineChannels([]);
        setLineChannelsLoaded(true);
      } finally {
        if (!cancelled) setLineChannelsLoading(false);
      }
    }

    void loadLineChannels();

    return () => {
      cancelled = true;
    };
  }, [activeMode, canPreview, canReadLineChannels, lineChannelsLoaded, lineChannelsLoading]);

  async function refreshLineChannels() {
    if (!canReadLineChannels) return;

    setLineChannelsLoading(true);
    setLineChannelsError('');

    try {
      const response = await listLineChannels({ limit: 100, offset: 0 });
      setLineChannels(response.data);
      setLineChannelsLoaded(true);
    } catch (err) {
      setLineChannelsError(lineChannelErrorMessage(err));
      setLineChannels([]);
      setLineChannelsLoaded(true);
    } finally {
      setLineChannelsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canPreview) return;

    const caseNo = form.caseNo.trim();
    const mobile = form.mobile.trim();
    setError('');
    setValidationError('');

    if (!caseNo) {
      setValidationError('請輸入案件編號。');
      return;
    }

    if (!mobile) {
      setValidationError('請輸入手機。');
      return;
    }

    setSubmitting(true);

    try {
      const inquiryResult = await inquiryByCaseNoAndMobile({ caseNo, mobile });
      setResult(inquiryResult);
    } catch (err) {
      setError(errorMessage(err));
      setResult(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLineSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canPreview) return;

    const channelCode = lineForm.channelCode.trim();
    const caseNo = lineForm.caseNo.trim();
    const lineUserId = lineForm.lineUserId.trim();
    setLineError('');
    setLineValidationError('');

    if (!channelCode) {
      setLineValidationError('請輸入 channelCode。');
      return;
    }

    if (!caseNo) {
      setLineValidationError('請輸入案件編號。');
      return;
    }

    if (!lineUserId) {
      setLineValidationError('請輸入 lineUserId。');
      return;
    }

    setLineSubmitting(true);

    try {
      const inquiryResult = await inquiryByLineUser({ channelCode, caseNo, lineUserId });
      setLineResult(inquiryResult);
    } catch (err) {
      setLineError(errorMessage(err));
      setLineResult(null);
    } finally {
      setLineSubmitting(false);
    }
  }

  function clearForm() {
    setForm({ caseNo: '', mobile: '' });
    setResult(null);
    setError('');
    setValidationError('');
    setPrefillMessage('');
    if (window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }

  function clearLineForm() {
    setLineForm({ channelCode: '', caseNo: '', lineUserId: '' });
    setLineResult(null);
    setLineError('');
    setLineValidationError('');
    setLinePrefillMessage('');
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const hadLinePrefill = params.has('mode') || params.has('channelCode');
      params.delete('mode');
      params.delete('channelCode');
      if (hadLinePrefill) {
        const query = params.toString();
        window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
      }
    }
  }

  function renderResultPanel(inquiryResult: CustomerInquiryResponse | null, failureContext: 'mobile' | 'line') {
    const visibleCase = inquiryResult?.case;

    return (
      <section className="info-panel">
        <h3>Customer-visible Result</h3>
        {!inquiryResult ? (
          <div className="inline-state">尚未查詢。</div>
        ) : !inquiryResult.verified ? (
          <div className="inline-state">
            <strong>驗證失敗</strong>
            <p>{inquiryResult.message || GENERIC_FAILURE_MESSAGE}</p>
            <p className="form-hint">
              {failureContext === 'line'
                ? '不推論 channelCode、案件或 lineUserId 哪一項不符合。'
                : '不推論案件是否存在，也不推論手機是否符合。'}
            </p>
          </div>
        ) : visibleCase ? (
          <>
            <dl>
              <div><dt>案件編號</dt><dd>{visibleCase.caseNo || '-'}</dd></div>
              <div><dt>客戶可見狀態</dt><dd>{visibleCase.customerVisibleStatus || '-'}</dd></div>
              <div><dt>Status code</dt><dd>{visibleCase.status || '-'}</dd></div>
              <div><dt>品牌</dt><dd>{visibleCase.brand || '-'}</dd></div>
              <div><dt>產品類型</dt><dd>{visibleCase.productType || '-'}</dd></div>
              <div><dt>型號</dt><dd>{visibleCase.modelNo || '-'}</dd></div>
              <div><dt>偏好到府時間</dt><dd>{formatDate(visibleCase.preferredVisitTime)}</dd></div>
              <div><dt>建立時間</dt><dd>{formatDate(visibleCase.createdAt)}</dd></div>
              <div><dt>更新時間</dt><dd>{formatDate(visibleCase.updatedAt)}</dd></div>
            </dl>

            <div className="sub-panel">
              <h4>Latest Customer-visible Message</h4>
              {visibleCase.latestCustomerVisibleMessage ? (
                <dl>
                  <div><dt>類型</dt><dd>{visibleCase.latestCustomerVisibleMessage.messageType || '-'}</dd></div>
                  <div><dt>內容</dt><dd>{visibleCase.latestCustomerVisibleMessage.bodyText || '-'}</dd></div>
                  <div><dt>時間</dt><dd>{formatDate(visibleCase.latestCustomerVisibleMessage.createdAt)}</dd></div>
                </dl>
              ) : (
                <div className="inline-state">目前沒有客戶可見訊息。</div>
              )}
            </div>

            <div className="sub-panel">
              <h4>Customer-visible Attachments</h4>
              {visibleCase.customerVisibleAttachments?.length ? (
                <div className="attachment-list">
                  {visibleCase.customerVisibleAttachments.map(renderAttachment)}
                </div>
              ) : (
                <div className="inline-state">目前沒有客戶可見附件。</div>
              )}
              <p className="form-hint">此頁只顯示 public response 的安全 metadata，不產生 admin download URL。</p>
            </div>
          </>
        ) : (
          <div className="inline-state">查詢已通過，但 response 未包含可顯示的案件資料。</div>
        )}
      </section>
    );
  }

  return (
    <div className="dashboard-grid">
      <section className="page-hero">
        <p className="eyebrow">Customer Inquiry Preview</p>
        <h2>客戶查詢預覽</h2>
        <p>
          用後台視角確認 public customer inquiry API 只會回傳客戶可見欄位。此頁不是正式客戶入口，
          不顯示內部備註、audit log、AI/OCR raw output、billing 或工程師備註。
        </p>
      </section>

      {!canPreview ? (
        <section className="info-panel">
          <h3>權限不足</h3>
          <p>此 preview 目前以 cases.read 作為可見權限。</p>
        </section>
      ) : (
        <>
          <section className="info-panel">
            <h3>查詢模式</h3>
            <div className="workflow-actions">
              <button
                type="button"
                className={activeMode === 'mobile' ? 'primary-button' : 'secondary-button'}
                onClick={() => setActiveMode('mobile')}
              >
                案件編號 + 手機
              </button>
              <button
                type="button"
                className={activeMode === 'line' ? 'primary-button' : 'secondary-button'}
                onClick={() => setActiveMode('line')}
              >
                LINE 查詢預覽
              </button>
            </div>
          </section>

          {activeMode === 'mobile' ? (
            <>
          <section className="info-panel">
            <h3>Case No + Mobile 查詢</h3>
            {prefillMessage ? <div className="inline-state">{prefillMessage}</div> : null}
            <form className="stacked-form" onSubmit={handleSubmit}>
              <label>
                案件編號
                <input
                  type="text"
                  value={form.caseNo}
                  onChange={(event) => setForm((current) => ({ ...current, caseNo: event.target.value }))}
                  placeholder="TW-20260514-000001"
                  required
                />
              </label>
              <label>
                手機
                <input
                  type="text"
                  value={form.mobile}
                  onChange={(event) => setForm((current) => ({ ...current, mobile: event.target.value }))}
                  placeholder="0912345678"
                  required
                />
              </label>
              <p className="form-hint">此表單呼叫 public endpoint，不帶 Bearer token；送出時不記錄 mobile 或完整 payload。</p>
              {validationError ? <div className="form-error" role="alert">{validationError}</div> : null}
              {error ? <div className="form-error" role="alert">{error}</div> : null}
              <div className="form-actions">
                <button type="button" className="secondary-button" disabled={submitting} onClick={clearForm}>
                  清除
                </button>
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? '查詢中...' : '查詢預覽'}
                </button>
              </div>
            </form>
          </section>

          {renderResultPanel(result, 'mobile')}
            </>
          ) : (
            <>
              <section className="info-panel">
                <h3>LINE 查詢預覽</h3>
                <p className="form-hint">使用 channelCode + caseNo + lineUserId 測試 public LINE inquiry endpoint。</p>
                <div className="inline-state">
                  lineUserId 不是全域身分，必須搭配 channelCode 與案件編號；本頁不顯示 LINE channel secret / access token。
                </div>
                {linePrefillMessage ? <div className="inline-state">{linePrefillMessage}</div> : null}
                <form className="stacked-form" onSubmit={handleLineSubmit}>
                  {canReadLineChannels ? (
                    <div className="sub-panel">
                      <div className="panel-title-row">
                        <h4>channelCode picker</h4>
                        <button
                          type="button"
                          className="secondary-button"
                          disabled={lineChannelsLoading}
                          onClick={() => void refreshLineChannels()}
                        >
                          {lineChannelsLoading ? '載入中...' : '重新載入'}
                        </button>
                      </div>
                      {lineChannelsLoading ? <div className="inline-state">載入 LINE channel 清單中...</div> : null}
                      {lineChannelsError ? (
                        <div className="inline-state">
                          無法載入 LINE channel 清單，請手動輸入 channelCode。
                          <p className="form-hint">{lineChannelsError}</p>
                        </div>
                      ) : null}
                      {!lineChannelsLoading && !lineChannelsError && lineChannelsLoaded && lineChannels.length === 0 ? (
                        <div className="inline-state">目前尚無 LINE channel，可手動輸入 channelCode。</div>
                      ) : null}
                      {lineChannels.length > 0 ? (
                        <label>
                          選擇 LINE channel
                          <select
                            value={lineForm.channelCode}
                            onChange={(event) => {
                              setLineForm((current) => ({ ...current, channelCode: event.target.value }));
                              setLineValidationError('');
                            }}
                          >
                            <option value="">請選擇 LINE channel，或改用下方手動輸入</option>
                            {lineChannels.map((channel) => (
                              <option key={channel.id} value={channel.channelCode}>
                                {lineChannelOptionLabel(channel)}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}
                      <p className="form-hint">Picker 只顯示 channelName、channelCode、organization 與啟用狀態；停用 channel 會標註停用但仍可手動測試。</p>
                    </div>
                  ) : (
                    <div className="inline-state">無法載入 LINE channel 清單，請手動輸入 channelCode。</div>
                  )}
                  <label>
                    手動 channelCode
                    <input
                      type="text"
                      value={lineForm.channelCode}
                      onChange={(event) => setLineForm((current) => ({ ...current, channelCode: event.target.value }))}
                      placeholder="client-a"
                      required
                    />
                  </label>
                  <label>
                    案件編號
                    <input
                      type="text"
                      value={lineForm.caseNo}
                      onChange={(event) => setLineForm((current) => ({ ...current, caseNo: event.target.value }))}
                      placeholder="TW-20260514-000001"
                      required
                    />
                  </label>
                  <label>
                    lineUserId
                    <input
                      type="text"
                      value={lineForm.lineUserId}
                      onChange={(event) => setLineForm((current) => ({ ...current, lineUserId: event.target.value }))}
                      placeholder="Uxxxxxxxxxxxxxxxx"
                      required
                    />
                  </label>
                  <p className="form-hint">lineUserId 不會放進 query string、localStorage 或 sessionStorage；送出時不記錄 lineUserId 或完整 payload。</p>
                  {lineValidationError ? <div className="form-error" role="alert">{lineValidationError}</div> : null}
                  {lineError ? <div className="form-error" role="alert">{lineError}</div> : null}
                  <div className="form-actions">
                    <button type="button" className="secondary-button" disabled={lineSubmitting} onClick={clearLineForm}>
                      清除 LINE 查詢
                    </button>
                    <button type="submit" className="primary-button" disabled={lineSubmitting}>
                      {lineSubmitting ? '查詢中...' : '查詢 LINE 預覽'}
                    </button>
                  </div>
                </form>
              </section>

              {renderResultPanel(lineResult, 'line')}
            </>
          )}

          <section className="info-panel">
            <h3>安全邊界</h3>
            <ul className="compact-list">
              <li><strong>不顯示</strong><span>internal notes、audit logs、AI/OCR raw output、billing data、dispatch rules、engineer notes。</span></li>
              <li><strong>不推論</strong><span>驗證失敗時不判斷案件是否存在或手機是否不符。</span></li>
              <li><strong>LINE route</strong><span>LINE 查詢使用 public line-case-inquiry endpoint；channelCode picker 只顯示安全欄位。</span></li>
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
