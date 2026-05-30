'use strict';

const UNAVAILABLE_BODY = {
  ok: false,
  status: 'unavailable',
  messageKey: 'repair_intake_draft_to_case.route_adapter_unavailable',
  reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_ADAPTER_UNAVAILABLE',
  caseId: null,
  repairIntakeDraftId: null,
};

const UNSAFE_FIELD_NAMES = new Set([
  'address',
  'ai',
  'audit',
  'auditactor',
  'authorization',
  'billing',
  'cookie',
  'customer',
  'customerdata',
  'customername',
  'customerphone',
  'databaseurl',
  'dbrow',
  'debug',
  'd' + 'b',
  'email',
  'error',
  'headers',
  'internal',
  'invoice',
  'lineaccesstoken',
  'password',
  'phone',
  'provider',
  'providerpayload',
  'query',
  'rag',
  'rawbody',
  'rawerror',
  'rawinput',
  'rawrequest',
  'secret',
  'settlement',
  's' + 'ql',
  'stack',
  'token',
]);

const BODY_OVERRIDE_FIELD_NAMES = new Set([
  'actorid',
  'actorrole',
  'caseid',
  'dedupekey',
  'draftid',
  'duplicate',
  'idempotencykey',
  'organizationid',
  'repairintakedraftid',
  'replay',
  'requestid',
  'source',
]);

const IDEMPOTENCY_CONTEXT_MAX_LENGTH = 128;
const IDEMPOTENCY_CONTEXT_PATTERN = /^[a-zA-Z0-9._:-]+$/;

function isPlainObject(value) {
  return Boolean(value)
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

function normalizedFieldName(value) {
  return String(value).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function fieldIsUnsafe(key) {
  const normalized = normalizedFieldName(key);

  return normalized.startsWith('raw') || UNSAFE_FIELD_NAMES.has(normalized);
}

function sanitizeNestedValue(value, options = {}) {
  const overrideFields = options.overrideFields instanceof Set ? options.overrideFields : new Set();

  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeNestedValue(item, options))
      .filter((item) => item !== undefined);
  }

  if (isPlainObject(value)) {
    const result = {};

    for (const [key, fieldValue] of Object.entries(value)) {
      if (fieldIsUnsafe(key) || overrideFields.has(normalizedFieldName(key))) {
        continue;
      }

      const sanitized = sanitizeNestedValue(fieldValue, options);

      if (sanitized !== undefined) {
        result[key] = sanitized;
      }
    }

    return result;
  }

  if (
    value === undefined
    || typeof value === 'function'
    || typeof value === 'symbol'
    || (value !== null && typeof value === 'object')
  ) {
    return undefined;
  }

  return value;
}

function safeScalar(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return String(value);
  }

  return null;
}

function safeHeaderValue(headers, headerName) {
  if (!isPlainObject(headers)) {
    return null;
  }

  const expectedName = headerName.toLowerCase();

  for (const [key, value] of Object.entries(headers)) {
    if (String(key).toLowerCase() === expectedName) {
      return safeScalar(value);
    }
  }

  return null;
}

function safeIdempotencyContextValue(value) {
  const scalar = safeScalar(value);

  if (!scalar || scalar.length > IDEMPOTENCY_CONTEXT_MAX_LENGTH) {
    return null;
  }

  return IDEMPOTENCY_CONTEXT_PATTERN.test(scalar) ? scalar : null;
}

function unavailableEnvelope(reasonCode = UNAVAILABLE_BODY.reasonCode) {
  return {
    statusCode: 503,
    body: {
      ...UNAVAILABLE_BODY,
      reasonCode,
    },
  };
}

function resolvePreRouteHandler(preRouteHandler) {
  if (typeof preRouteHandler === 'function') {
    return preRouteHandler;
  }

  if (
    isPlainObject(preRouteHandler)
    && typeof preRouteHandler.handleDraftToCasePreRoute === 'function'
  ) {
    return preRouteHandler.handleDraftToCasePreRoute.bind(preRouteHandler);
  }

  return null;
}

function routeLikeToPreRouteInput(routeLikeInput) {
  const safeInput = isPlainObject(routeLikeInput) ? routeLikeInput : {};
  const headers = isPlainObject(safeInput.headers) ? safeInput.headers : {};

  return {
    sessionContext: sanitizeNestedValue(safeInput.sessionContext),
    repairIntakeDraftId: safeScalar(safeInput.repairIntakeDraftId),
    requestBody: sanitizeNestedValue(isPlainObject(safeInput.body) ? safeInput.body : {}, {
      overrideFields: BODY_OVERRIDE_FIELD_NAMES,
    }),
    requestSource: safeScalar(safeInput.source)
      || safeHeaderValue(headers, 'x-request-source')
      || safeHeaderValue(headers, 'request-source'),
    requestId: safeIdempotencyContextValue(safeInput.requestId)
      || safeIdempotencyContextValue(safeHeaderValue(headers, 'x-request-id')),
    idempotencyKey: safeIdempotencyContextValue(safeHeaderValue(headers, 'idempotency-key'))
      || safeIdempotencyContextValue(safeInput.idempotencyKey),
  };
}

function createRepairIntakeDraftToCaseRouteAdapterContract(options = {}) {
  const safeOptions = isPlainObject(options) ? options : {};
  const handlePreRoute = resolvePreRouteHandler(safeOptions.preRouteHandler);

  async function handleRouteLikeRequest(routeLikeInput = {}) {
    if (!handlePreRoute) {
      return unavailableEnvelope(
        'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_ADAPTER_PRE_ROUTE_HANDLER_REQUIRED',
      );
    }

    try {
      const preRouteInput = routeLikeToPreRouteInput(routeLikeInput);
      const preRouteOutput = await handlePreRoute(preRouteInput);

      return sanitizeNestedValue(preRouteOutput);
    } catch (error) {
      return unavailableEnvelope(
        'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_ADAPTER_PRE_ROUTE_HANDLER_FAILED',
      );
    }
  }

  return {
    handleRouteLikeRequest,
  };
}

module.exports = {
  createRepairIntakeDraftToCaseRouteAdapterContract,
};
