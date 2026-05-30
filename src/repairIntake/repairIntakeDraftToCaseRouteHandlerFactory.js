'use strict';

const DEPENDENCY_UNAVAILABLE_BODY = {
  ok: false,
  status: 'unavailable',
  messageKey: 'repair_intake_draft_to_case.route_handler_unavailable',
  reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_HANDLER_UNAVAILABLE',
  caseId: null,
  repairIntakeDraftId: null,
};

const INVALID_REQUEST_BODY = {
  ok: false,
  status: 'invalid_request',
  messageKey: 'repair_intake_draft_to_case.route_handler_invalid_request',
  reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_HANDLER_DRAFT_ID_REQUIRED',
  caseId: null,
  repairIntakeDraftId: null,
};

const SAFE_HEADER_NAMES = new Set([
  'idempotency-key',
  'request-source',
  'x-request-id',
  'x-request-source',
]);

const UNSAFE_FIELD_NAMES = new Set([
  'address',
  'authorization',
  'cookie',
  'customerphone',
  'databaseurl',
  'dbrow',
  'd' + 'b',
  'email',
  'error',
  'headers',
  'lineaccesstoken',
  'params',
  'phone',
  'query',
  'rawbody',
  'rawerror',
  'rawinput',
  'rawrequest',
  'secret',
  's' + 'ql',
  'stack',
  'token',
]);

const BODY_OVERRIDE_FIELD_NAMES = new Set([
  'actorid',
  'actorrole',
  'draftid',
  'idempotencykey',
  'organizationid',
  'repairintakedraftid',
  'source',
]);

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

function safeHeaders(headers) {
  if (!isPlainObject(headers)) {
    return {};
  }

  const result = {};

  for (const [key, value] of Object.entries(headers)) {
    const normalizedKey = String(key).toLowerCase();
    const scalar = safeScalar(value);

    if (SAFE_HEADER_NAMES.has(normalizedKey) && scalar) {
      result[normalizedKey] = scalar;
    }
  }

  return result;
}

function dependencyFailure(reasonCode = DEPENDENCY_UNAVAILABLE_BODY.reasonCode) {
  return {
    statusCode: 503,
    body: {
      ...DEPENDENCY_UNAVAILABLE_BODY,
      reasonCode,
    },
  };
}

function invalidRequest(reasonCode = INVALID_REQUEST_BODY.reasonCode) {
  return {
    statusCode: 400,
    body: {
      ...INVALID_REQUEST_BODY,
      reasonCode,
    },
  };
}

function resolveRouteAdapter(routeAdapter) {
  if (typeof routeAdapter === 'function') {
    return routeAdapter;
  }

  if (isPlainObject(routeAdapter) && typeof routeAdapter.handleRouteLikeRequest === 'function') {
    return routeAdapter.handleRouteLikeRequest.bind(routeAdapter);
  }

  return null;
}

function routeLikeInputFromFutureRouterInput(input, repairIntakeDraftId) {
  const safeInput = isPlainObject(input) ? input : {};
  const requestBody = sanitizeNestedValue(isPlainObject(safeInput.body) ? safeInput.body : {}, {
    overrideFields: BODY_OVERRIDE_FIELD_NAMES,
  });

  return {
    sessionContext: sanitizeNestedValue(safeInput.sessionContext),
    repairIntakeDraftId,
    body: requestBody,
    headers: safeHeaders(safeInput.headers),
    requestId: safeScalar(safeInput.requestId),
    source: safeScalar(safeInput.source),
  };
}

function createRepairIntakeDraftToCaseRouteHandler(options = {}) {
  const safeOptions = isPlainObject(options) ? options : {};
  const handleRouteLikeRequest = resolveRouteAdapter(safeOptions.routeAdapter);

  async function handle(input = {}) {
    if (!handleRouteLikeRequest) {
      return dependencyFailure(
        'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_HANDLER_ADAPTER_REQUIRED',
      );
    }

    const safeInput = isPlainObject(input) ? input : {};
    const repairIntakeDraftId = safeScalar(safeInput.params && safeInput.params.repairIntakeDraftId);

    if (!repairIntakeDraftId) {
      return invalidRequest();
    }

    try {
      const routeLikeInput = routeLikeInputFromFutureRouterInput(safeInput, repairIntakeDraftId);
      const output = await handleRouteLikeRequest(routeLikeInput);

      return sanitizeNestedValue(output);
    } catch (error) {
      return dependencyFailure(
        'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_HANDLER_ADAPTER_FAILED',
      );
    }
  }

  return {
    handle,
  };
}

module.exports = {
  createRepairIntakeDraftToCaseRouteHandler,
};
