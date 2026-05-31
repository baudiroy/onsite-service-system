import { FormEvent, useMemo, useState } from 'react';
import {
  DepotWorkshopAssignmentIntentPreviewResponse,
  previewDepotWorkshopAssignmentIntent
} from '../api/depotWorkshop';
import { ApiError } from '../lib/apiClient';

type PreviewFormState = {
  depotIntakeId: string;
  requestId: string;
};

type SummaryValue = string | number | boolean | null | undefined | Record<string, unknown> | unknown[];

const BLOCKERS = [
  'Route write scope is blocked by depot_repair_route_write_scope_not_approved.',
  'DB dry-run has not been completed.',
  'Write action is not available from this preview.'
];

const SUMMARY_FIELDS = [
  'repairOrderDraftSummary',
  'repairOrderTransitionPlanSummary',
  'repairOrderAuditIntentSummary',
  'repairOrderCustomerProjectionPreview'
] as const;

const UNSAFE_FIELD_MARKERS = [
  'address',
  'billing',
  'contact',
  'customeraddress',
  'customercontact',
  'customeremail',
  'customername',
  'customerphone',
  'database',
  'debug',
  'email',
  'fieldservicereport',
  'finalappointmentid',
  'password',
  'phone',
  'provider',
  'rag',
  'raw',
  'secret',
  'signature',
  'sql',
  'stack',
  'token'
];

function normalizeFieldName(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function fieldIsSafe(fieldName: string) {
  const normalized = normalizeFieldName(fieldName);
  return !UNSAFE_FIELD_MARKERS.some((marker) => normalized.includes(marker));
}

function formatPreviewValue(value: SummaryValue): string {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `${value.length} items`;
  return 'summary available';
}

function safeEntries(summary?: Record<string, unknown> | null) {
  if (!summary) return [];

  return Object.entries(summary)
    .filter(([key]) => fieldIsSafe(key))
    .map(([key, value]) => [key, formatPreviewValue(value as SummaryValue)] as const);
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const requestId = import.meta.env.DEV && error.requestId ? ` (requestId: ${error.requestId})` : '';
    return `${error.message || 'Unable to load Depot Workshop preview.'}${requestId}`;
  }

  return 'Unable to load Depot Workshop preview.';
}

function buildPayload(form: PreviewFormState) {
  const requestId = form.requestId.trim();

  return requestId ? { requestId } : {};
}

function SummaryPanel({
  title,
  summary
}: {
  title: string;
  summary?: Record<string, unknown> | null;
}) {
  const entries = safeEntries(summary);

  return (
    <section className="detail-section">
      <h4>{title}</h4>
      {entries.length > 0 ? (
        <dl>
          {entries.map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="muted">No admin-safe summary fields are available.</p>
      )}
    </section>
  );
}

export function DepotWorkshopAssignmentIntentPreviewPage() {
  const [form, setForm] = useState<PreviewFormState>({ depotIntakeId: '', requestId: '' });
  const [preview, setPreview] = useState<DepotWorkshopAssignmentIntentPreviewResponse | null>(null);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const depotRepair = preview?.data?.depotRepair || null;
  const requestId = preview?.meta?.requestId || preview?.requestId || '-';
  const writtenLabel = preview?.meta?.written === false ? 'false' : '-';
  const writeRequiredLabel = depotRepair?.writeRequired === false ? 'false' : '-';
  const canSubmit = useMemo(() => form.depotIntakeId.trim().length > 0 && !submitting, [form.depotIntakeId, submitting]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const depotIntakeId = form.depotIntakeId.trim();
    setError('');
    setValidationError('');
    setPreview(null);

    if (!depotIntakeId) {
      setValidationError('Depot intake ID is required.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await previewDepotWorkshopAssignmentIntent(depotIntakeId, buildPayload(form));
      setPreview(response);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Depot / Workshop</span>
          <h2>Assignment Intent Preview</h2>
          <p>Read-only preview of the accepted admin-safe assignment intent response.</p>
        </div>
      </section>

      <section className="message-composer">
        <form className="toolbar-form" onSubmit={handleSubmit}>
          <label>
            Depot intake ID
            <input
              value={form.depotIntakeId}
              onChange={(event) => setForm((current) => ({ ...current, depotIntakeId: event.target.value }))}
              placeholder="depotIntakeId"
            />
          </label>
          <label>
            Request ID
            <input
              value={form.requestId}
              onChange={(event) => setForm((current) => ({ ...current, requestId: event.target.value }))}
              placeholder="optional"
            />
          </label>
          <button className="primary-button" type="submit" disabled={!canSubmit}>
            {submitting ? 'Loading preview' : 'Load preview'}
          </button>
        </form>
        {validationError ? <p className="inline-note danger-link">{validationError}</p> : null}
        {error ? <p className="inline-note danger-link">{error}</p> : null}
      </section>

      <section className="detail-section">
        <h4>Blocked behavior</h4>
        <ul className="compact-list">
          {BLOCKERS.map((blocker) => (
            <li key={blocker}>
              <strong>{blocker}</strong>
              <span>Disabled for this read-only preview.</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="detail-section">
        <h4>Preview metadata</h4>
        <dl>
          <div><dt>requestId</dt><dd>{requestId}</dd></div>
          <div><dt>meta.written</dt><dd>{writtenLabel}</dd></div>
          <div><dt>writeRequired</dt><dd>{writeRequiredLabel}</dd></div>
        </dl>
      </section>

      <div className="detail-grid">
        {SUMMARY_FIELDS.map((fieldName) => (
          <SummaryPanel
            key={fieldName}
            title={fieldName}
            summary={depotRepair?.[fieldName]}
          />
        ))}
      </div>
    </div>
  );
}
