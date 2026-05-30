'use strict';

const PUBLIC_FIELD_NAMES = [
  'ok',
  'status',
  'messageKey',
  'reasonCode',
  'caseId',
  'repairIntakeDraftId',
];

const STATUS_CODE_BY_STATUS = {
  created: 201,
  success: 201,
  submitted: 201,
  denied: 403,
  forbidden: 403,
  invalid_context: 400,
  invalid_input: 400,
  invalid_request: 400,
  not_created: 202,
  skipped: 202,
  failed: 503,
  invalid_dependency: 503,
  unavailable: 503,
};

const DEFAULT_PUBLIC_RESULT = {
  ok: false,
  status: 'unavailable',
  messageKey: 'repair_intake_draft_to_case.unavailable',
  reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_RESULT_MAPPER_INVALID_RESULT',
  caseId: null,
  repairIntakeDraftId: null,
};

const UNSAFE_VALUE_MARKERS = [
  'address',
  'audit',
  'authorization',
  'billing',
  'cookie',
  'customer',
  'database',
  'database_url',
  'dbrow',
  'debug',
  'email',
  'internal',
  'invoice',
  'openai',
  'password',
  'permission',
  'phone',
  'postgres://',
  'postgresql://',
  'process.env',
  'provider',
  'query',
  'rag',
  'raw',
  'secret',
  'select ',
  'settlement',
  'stack',
  'token',
  'vector',
];

function isPlainObject(value) {
  return Boolean(value)
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

function stringLooksUnsafe(value) {
  const normalized = value.toLowerCase();

  return UNSAFE_VALUE_MARKERS.some((marker) => normalized.includes(marker));
}

function safePublicString(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  if (
    trimmed.length === 0
    || trimmed.length > 160
    || !/^[a-zA-Z0-9_.:-]+$/.test(trimmed)
    || stringLooksUnsafe(trimmed)
  ) {
    return null;
  }

  return trimmed;
}

function normalizeStatus(publicResult) {
  const status = safePublicString(publicResult.status);

  return Object.prototype.hasOwnProperty.call(STATUS_CODE_BY_STATUS, status) ? status : 'unavailable';
}

function normalizeBody(publicResult) {
  if (!isPlainObject(publicResult)) {
    return { ...DEFAULT_PUBLIC_RESULT };
  }

  const safeResult = publicResult;
  const status = normalizeStatus(safeResult);
  const messageKey = safePublicString(safeResult.messageKey);
  const reasonCode = safePublicString(safeResult.reasonCode);
  const successStatus = STATUS_CODE_BY_STATUS[status] === 201;

  if (safeResult.ok === true && successStatus && (!messageKey || !reasonCode)) {
    return { ...DEFAULT_PUBLIC_RESULT };
  }

  return {
    ok: safeResult.ok === true && successStatus,
    status,
    messageKey: messageKey || DEFAULT_PUBLIC_RESULT.messageKey,
    reasonCode: reasonCode || DEFAULT_PUBLIC_RESULT.reasonCode,
    caseId: safePublicString(safeResult.caseId),
    repairIntakeDraftId: safePublicString(safeResult.repairIntakeDraftId),
  };
}

function mapRepairIntakeDraftToCasePublicResultToHttpResponse(publicResult) {
  const body = normalizeBody(publicResult);

  return {
    statusCode: STATUS_CODE_BY_STATUS[body.status] || STATUS_CODE_BY_STATUS.unavailable,
    body,
  };
}

module.exports = {
  PUBLIC_FIELD_NAMES,
  mapRepairIntakeDraftToCasePublicResultToHttpResponse,
};
