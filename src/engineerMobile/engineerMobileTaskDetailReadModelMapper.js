'use strict';

const ENGINEER_MOBILE_TASK_DETAIL_FIELDS = Object.freeze([
  'organization_id',
  'case_id',
  'appointment_id',
  'assigned_engineer_id',
  'scheduled_start',
  'scheduled_end',
  'status',
  'customer_name_masked',
  'customer_phone_masked',
  'address_summary',
  'product_summary',
  'issue_summary',
  'service_type',
  'site_note_safe',
  'checklist_summary',
  'evidence_refs',
]);

const DETAIL_QUERY_NAME = 'engineerMobileTaskDetailReadModel';
const DETAIL_QUERY_REQUIRED_PARAMS = Object.freeze([
  'organizationId',
  'engineerId',
  'appointmentId',
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function emptyReadModel() {
  return {
    task: null,
  };
}

function hasRequiredRowIdentity(row) {
  return Boolean(
    safeString(row.organization_id)
    && safeString(row.case_id)
    && safeString(row.appointment_id)
    && safeString(row.assigned_engineer_id),
  );
}

function matchesInput(row, input) {
  return (
    row.organization_id === input.organizationId
    && row.assigned_engineer_id === input.engineerId
    && row.appointment_id === input.appointmentId
  );
}

function safeOptionalValue(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => (
      isPlainObject(entry) || Array.isArray(entry)
        ? JSON.parse(JSON.stringify(entry))
        : entry
    ));
  }

  if (isPlainObject(value)) {
    return JSON.parse(JSON.stringify(value));
  }

  return undefined;
}

function isUnsafeEvidenceRef(value) {
  const serialized = JSON.stringify(value || '');

  return /https?:\/\//i.test(serialized)
    || /signed/i.test(serialized)
    || /token/i.test(serialized)
    || /secret/i.test(serialized)
    || /storage[_-]?path/i.test(serialized);
}

function mapEvidenceRef(ref) {
  if (typeof ref === 'string') {
    if (!safeString(ref) || isUnsafeEvidenceRef(ref)) {
      return undefined;
    }

    return {
      id: ref.trim(),
      type: 'reference',
    };
  }

  if (!isPlainObject(ref) || isUnsafeEvidenceRef(ref)) {
    return undefined;
  }

  const safeRef = {};

  for (const field of ['id', 'type', 'label']) {
    const value = safeString(ref[field]);

    if (value) {
      safeRef[field] = value;
    }
  }

  return Object.keys(safeRef).length > 0 ? safeRef : undefined;
}

function safeEvidenceRefs(value) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const refs = value
    .map(mapEvidenceRef)
    .filter(Boolean);

  return refs.length > 0 ? refs : undefined;
}

function mapEngineerMobileTaskDetailRow(row = {}) {
  if (!isPlainObject(row) || !hasRequiredRowIdentity(row)) {
    return null;
  }

  const mapped = {
    appointmentId: row.appointment_id,
    assignedEngineerId: row.assigned_engineer_id,
    caseId: row.case_id,
    organizationId: row.organization_id,
  };

  const optionalMappings = [
    ['scheduledStart', row.scheduled_start],
    ['scheduledEnd', row.scheduled_end],
    ['status', row.status],
    ['customerNameMasked', row.customer_name_masked],
    ['customerPhoneMasked', row.customer_phone_masked],
    ['addressSummary', row.address_summary],
    ['productSummary', row.product_summary],
    ['issueSummary', row.issue_summary],
    ['serviceType', row.service_type],
    ['siteNoteSafe', row.site_note_safe],
    ['checklistSummary', row.checklist_summary],
  ];

  for (const [targetField, value] of optionalMappings) {
    const safeValue = safeOptionalValue(value);

    if (safeValue !== undefined) {
      mapped[targetField] = safeValue;
    }
  }

  const evidenceRefs = safeEvidenceRefs(row.evidence_refs);

  if (evidenceRefs) {
    mapped.evidenceRefs = evidenceRefs;
  }

  return mapped;
}

function mapEngineerMobileTaskDetailRowsToReadModel(input = {}) {
  const source = isPlainObject(input) ? input : {};
  const organizationId = safeString(source.organizationId);
  const engineerId = safeString(source.engineerId);
  const appointmentId = safeString(source.appointmentId);
  const rows = Array.isArray(source.rows) ? source.rows : [];

  if (!organizationId || !engineerId || !appointmentId || rows.length === 0) {
    return emptyReadModel();
  }

  const matchedRow = rows
    .filter(isPlainObject)
    .filter(hasRequiredRowIdentity)
    .find((row) => matchesInput(row, { organizationId, engineerId, appointmentId }));

  if (!matchedRow) {
    return emptyReadModel();
  }

  const task = mapEngineerMobileTaskDetailRow(matchedRow);

  return task ? { task } : emptyReadModel();
}

function buildFailClosedQuerySpec(reason) {
  return {
    executable: false,
    fields: [...ENGINEER_MOBILE_TASK_DETAIL_FIELDS],
    name: DETAIL_QUERY_NAME,
    ok: false,
    params: {},
    reason,
    requiredParams: [...DETAIL_QUERY_REQUIRED_PARAMS],
    sql: '',
  };
}

function buildEngineerMobileTaskDetailQuerySpec(input = {}) {
  const source = isPlainObject(input) ? input : {};
  const organizationId = safeString(source.organizationId);
  const engineerId = safeString(source.engineerId);
  const appointmentId = safeString(source.appointmentId);

  if (!organizationId || !engineerId || !appointmentId) {
    return buildFailClosedQuerySpec('missing_required_params');
  }

  return {
    executable: false,
    fields: [...ENGINEER_MOBILE_TASK_DETAIL_FIELDS],
    name: DETAIL_QUERY_NAME,
    ok: true,
    params: {
      appointmentId,
      engineerId,
      organizationId,
    },
    requiredParams: [...DETAIL_QUERY_REQUIRED_PARAMS],
    sql: [
      'SELECT',
      ENGINEER_MOBILE_TASK_DETAIL_FIELDS.join(', '),
      'FROM engineer_mobile_task_detail_read_model',
      'WHERE organization_id = $1',
      'AND assigned_engineer_id = $2',
      'AND appointment_id = $3',
      'LIMIT 1',
    ].join(' '),
  };
}

module.exports = {
  ENGINEER_MOBILE_TASK_DETAIL_FIELDS,
  buildEngineerMobileTaskDetailQuerySpec,
  mapEngineerMobileTaskDetailRow,
  mapEngineerMobileTaskDetailRowsToReadModel,
};
