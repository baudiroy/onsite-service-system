'use strict';

const ENGINEER_MOBILE_WORKBENCH_SAFE_ENVELOPE_PRESENTER_KIND = 'engineer_mobile.workbench_safe_envelope_presenter';

const DEFAULT_AVAILABLE_MESSAGE_KEY = 'engineerMobile.workbench.available';
const DEFAULT_UNAVAILABLE_MESSAGE_KEY = 'engineerMobile.workbench.unavailable';

const SAFE_STATUS_VALUES = new Set([
  'allow',
  'available',
  'deny',
  'error',
  'unavailable',
]);

const ELIGIBILITY_FIELDS = Object.freeze([
  'canOpenDetails',
  'canPrepareCompletionDraft',
  'canRecordArrival',
  'canRecordVisitResult',
  'canStartTravel',
  'canStartWork',
  'canFinishWork',
]);

const ACTION_FIELDS = Object.freeze([
  'key',
  'label',
  'enabled',
  'reasonCode',
  'messageKey',
]);

const WORK_ORDER_FIELDS = Object.freeze([
  'serviceType',
  'productSummary',
  'issueSummary',
  'serviceSummary',
  'publicCustomerNotes',
  'priorityLabel',
]);

const UNSAFE_VALUE_PATTERNS = Object.freeze([
  /authorization/i,
  /bearer\s+[a-z0-9._-]+/i,
  /cookie/i,
  /password/i,
  /postgres(?:ql)?:\/\//i,
  /raw[_-]/i,
  /secret/i,
  /select\s+\*/i,
  /should_not_leak/i,
  /token/i,
]);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeText(value, maxLength = 256) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const text = typeof value === 'string' ? value.trim() : String(value).trim();

  if (!text || text.length > maxLength) {
    return undefined;
  }

  if (UNSAFE_VALUE_PATTERNS.some((pattern) => pattern.test(text))) {
    return undefined;
  }

  return text;
}

function safeCode(value) {
  const text = safeText(value, 128);

  if (!text || !/^[a-zA-Z0-9_.:-]+$/.test(text)) {
    return undefined;
  }

  return text;
}

function compactRecord(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
}

function readFirst(source, keys) {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== '') {
      return source[key];
    }
  }

  return undefined;
}

function safeStatus(value, fallback) {
  const status = safeCode(value);

  return status && SAFE_STATUS_VALUES.has(status) ? status : fallback;
}

function safeMessageKey(value, fallback) {
  return safeCode(value) || fallback;
}

function safeReference(source, keys) {
  return safeText(readFirst(source, keys), 128);
}

function safeCustomerDisplay(source) {
  const customer = isObject(source.customerDisplay) ? source.customerDisplay : {};
  const display = compactRecord({
    displayName: safeText(readFirst(customer, ['displayName', 'name', 'customerDisplayName']), 128)
      || safeText(readFirst(source, ['customerDisplayName', 'customerNameMasked']), 128),
    nameMasked: safeText(readFirst(customer, ['nameMasked', 'customerNameMasked']), 128)
      || safeText(source.customerNameMasked, 128),
    phoneMasked: safeText(readFirst(customer, ['phoneMasked', 'customerPhoneMasked']), 64)
      || safeText(source.customerPhoneMasked, 64),
  });

  return Object.keys(display).length > 0 ? display : undefined;
}

function safeLocationSummary(source) {
  const location = isObject(source.locationSummary) ? source.locationSummary : {};
  const summary = compactRecord({
    label: safeText(readFirst(location, ['label', 'locationLabel']), 160)
      || safeText(source.locationLabel, 160),
    addressSummary: safeText(readFirst(location, ['addressSummary']), 256)
      || safeText(source.addressSummary, 256),
    navigationHint: safeText(readFirst(location, ['navigationHint']), 256),
  });

  return Object.keys(summary).length > 0 ? summary : undefined;
}

function safeChecklistItem(item) {
  if (typeof item === 'string') {
    const label = safeText(item, 160);

    return label ? { label } : undefined;
  }

  if (!isObject(item)) {
    return undefined;
  }

  const entry = compactRecord({
    key: safeCode(item.key),
    label: safeText(readFirst(item, ['label', 'title', 'name']), 160),
    status: safeCode(readFirst(item, ['status', 'state'])),
  });

  return Object.keys(entry).length > 0 ? entry : undefined;
}

function safeChecklistPreview(value) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value
    .map(safeChecklistItem)
    .filter(Boolean)
    .slice(0, 10);

  return items.length > 0 ? items : undefined;
}

function safeWorkOrderSummary(source) {
  const workOrder = isObject(source.workOrderSummary) ? source.workOrderSummary : {};
  const summary = {};

  for (const field of WORK_ORDER_FIELDS) {
    summary[field] = safeText(
      readFirst(workOrder, [field]) !== undefined ? workOrder[field] : source[field],
      field === 'publicCustomerNotes' || field === 'serviceSummary' ? 512 : 256,
    );
  }

  summary.checklistPreview = safeChecklistPreview(workOrder.checklistPreview || source.checklistPreview);

  const compacted = compactRecord(summary);

  return Object.keys(compacted).length > 0 ? compacted : undefined;
}

function safeEligibility(source) {
  const eligibility = isObject(source.eligibility) ? source.eligibility : source;
  const safe = {};

  for (const field of ELIGIBILITY_FIELDS) {
    if (eligibility[field] !== undefined) {
      safe[field] = eligibility[field] === true;
    }
  }

  const reasonCode = safeCode(eligibility.reasonCode);
  const messageKey = safeCode(eligibility.messageKey);

  if (reasonCode) {
    safe.reasonCode = reasonCode;
  }
  if (messageKey) {
    safe.messageKey = messageKey;
  }

  return Object.keys(safe).length > 0 ? safe : undefined;
}

function safeAction(action) {
  if (!isObject(action)) {
    return undefined;
  }

  const safe = {};

  for (const field of ACTION_FIELDS) {
    if (field === 'enabled' && action[field] !== undefined) {
      safe.enabled = action[field] === true;
      continue;
    }

    if (field === 'key' || field === 'reasonCode' || field === 'messageKey') {
      safe[field] = safeCode(action[field]);
      continue;
    }

    safe[field] = safeText(action[field], 160);
  }

  const compacted = compactRecord(safe);

  return compacted.key ? compacted : undefined;
}

function safeActions(source) {
  const actions = Array.isArray(source.actions) ? source.actions : [];
  const safe = actions
    .map(safeAction)
    .filter(Boolean)
    .slice(0, 12);

  return safe.length > 0 ? safe : [];
}

function isUnavailable(source) {
  if (!isObject(source)) {
    return true;
  }

  if (Object.keys(source).length === 0) {
    return true;
  }

  const status = safeCode(source.status);

  return source.ok === false || status === 'deny' || status === 'unavailable' || status === 'error';
}

function presentUnavailable(source) {
  const safeSource = isObject(source) ? source : {};

  return compactRecord({
    ok: false,
    status: safeStatus(safeSource.status, 'unavailable'),
    messageKey: safeMessageKey(safeSource.messageKey, DEFAULT_UNAVAILABLE_MESSAGE_KEY),
    assignmentReference: safeReference(safeSource, ['assignmentReference']),
    caseReference: safeReference(safeSource, ['caseReference']),
    appointmentReference: safeReference(safeSource, ['appointmentReference', 'appointmentId']),
    eligibility: safeEligibility(safeSource),
    actions: [],
  });
}

function presentEngineerMobileWorkbenchSafeEnvelope(input = {}) {
  const source = isObject(input) ? input : {};

  if (isUnavailable(source)) {
    return presentUnavailable(source);
  }

  return compactRecord({
    ok: true,
    status: safeStatus(source.status, 'available'),
    messageKey: safeMessageKey(source.messageKey, DEFAULT_AVAILABLE_MESSAGE_KEY),
    assignmentReference: safeReference(source, ['assignmentReference']),
    caseReference: safeReference(source, ['caseReference']),
    appointmentReference: safeReference(source, ['appointmentReference', 'appointmentId']),
    serviceStatus: safeCode(readFirst(source, ['serviceStatus', 'status'])),
    appointmentWindow: safeText(source.appointmentWindow, 256),
    customerDisplay: safeCustomerDisplay(source),
    locationSummary: safeLocationSummary(source),
    workOrderSummary: safeWorkOrderSummary(source),
    eligibility: safeEligibility(source),
    actions: safeActions(source),
  });
}

module.exports = {
  ENGINEER_MOBILE_WORKBENCH_SAFE_ENVELOPE_PRESENTER_KIND,
  presentEngineerMobileWorkbenchSafeEnvelope,
};
