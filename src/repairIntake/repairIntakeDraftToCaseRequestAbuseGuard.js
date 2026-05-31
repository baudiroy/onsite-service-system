'use strict';

const SAFE_REQUEST_INPUT_FIELDS = new Set([
  'actor',
  'body',
  'context',
  'idempotencyKey',
  'organizationId',
  'params',
  'query',
  'requestId',
  'tenantId',
]);

const UNSAFE_FIELD_NAMES = new Set([
  'address',
  'ai',
  'app',
  'auditinternal',
  'authorization',
  'billing',
  'connection',
  'contact',
  'cookie',
  'cookies',
  'customeraddress',
  'customercontact',
  'customerprivate',
  'customerphone',
  'database_url',
  'databaseurl',
  'debug',
  'draftinput',
  'env',
  'file',
  'files',
  'finalappointmentid',
  'fulladdress',
  'headers',
  'invoice',
  'openai',
  'password',
  'payment',
  'photo',
  'providerpayload',
  'rag',
  'raw',
  'rawbody',
  'rawdraft',
  'rawdraftinput',
  'rawheaders',
  'rawinput',
  'rawrequest',
  'secret',
  'session',
  'signature',
  'sql',
  'stack',
  'token',
  'vector',
]);

const UNSAFE_TEXT_MARKERS = [
  'ai/rag',
  'audit internal',
  'billing',
  'customer address',
  'customer contact',
  'customer private',
  'database_url',
  'full address',
  'invoice',
  'openai',
  'payment',
  'password',
  'postgres://',
  'postgresql://',
  'provider payload',
  'rag',
  'raw body',
  'raw draft',
  'raw request',
  'secret',
  'select *',
  'settlement',
  'stack trace',
  'token',
  'vector',
];

const DEFAULT_LIMITS = Object.freeze({
  maxArrayItems: 32,
  maxDepth: 6,
  maxObjectKeys: 64,
  maxSafeSerializedLength: 8192,
  maxStringLength: 1024,
});

const FAILURE = Object.freeze({
  ok: false,
  reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_ABUSE_REJECTED',
  requiredActions: ['submit_safe_request'],
});

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function fail() {
  return {
    ok: FAILURE.ok,
    reasonCode: FAILURE.reasonCode,
    requiredActions: [...FAILURE.requiredActions],
  };
}

function pass() {
  return {
    ok: true,
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_ABUSE_ACCEPTED',
    requiredActions: [],
  };
}

function unsafeFieldName(key) {
  return UNSAFE_FIELD_NAMES.has(String(key).toLowerCase());
}

function unsafeText(value) {
  const normalized = value.toLowerCase();

  return UNSAFE_TEXT_MARKERS.some((marker) => normalized.includes(marker));
}

function inspectValue(value, state) {
  const { limits } = state;

  if (state.depth > limits.maxDepth) {
    return { ok: false };
  }

  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
    return { ok: true, value: undefined };
  }

  if (typeof value === 'bigint') {
    return { ok: false };
  }

  if (typeof value === 'string') {
    if (value.length > limits.maxStringLength) {
      return { ok: false };
    }

    if (unsafeText(value)) {
      return { ok: true, value: undefined };
    }

    return { ok: true, value };
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? { ok: true, value } : { ok: false };
  }

  if (value === null || typeof value === 'boolean') {
    return { ok: true, value };
  }

  if (Array.isArray(value)) {
    if (value.length > limits.maxArrayItems) {
      return { ok: false };
    }

    const items = [];

    for (const item of value) {
      const inspected = inspectValue(item, {
        ...state,
        depth: state.depth + 1,
      });

      if (!inspected.ok) {
        return inspected;
      }

      if (inspected.value !== undefined) {
        items.push(inspected.value);
      }
    }

    return { ok: true, value: items };
  }

  if (!isObject(value)) {
    return { ok: false };
  }

  if (state.seen.has(value)) {
    return { ok: false };
  }

  state.seen.add(value);

  const entries = Object.entries(value).filter(([key]) => !unsafeFieldName(key));

  if (entries.length > limits.maxObjectKeys) {
    return { ok: false };
  }

  const result = {};

  for (const [key, fieldValue] of entries) {
    const inspected = inspectValue(fieldValue, {
      ...state,
      depth: state.depth + 1,
    });

    if (!inspected.ok) {
      return inspected;
    }

    if (inspected.value !== undefined) {
      result[key] = inspected.value;
    }
  }

  state.seen.delete(value);

  return { ok: true, value: result };
}

function safeRequestPayload(requestLike, limits) {
  const result = {};

  for (const key of SAFE_REQUEST_INPUT_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(requestLike, key)) {
      continue;
    }

    const inspected = inspectValue(requestLike[key], {
      depth: 0,
      limits,
      seen: new WeakSet(),
    });

    if (!inspected.ok) {
      return inspected;
    }

    if (inspected.value !== undefined) {
      result[key] = inspected.value;
    }
  }

  return { ok: true, value: result };
}

function guardRepairIntakeDraftToCaseRequest(requestLike, options = {}) {
  if (!isObject(requestLike)) {
    return fail();
  }

  const limits = {
    ...DEFAULT_LIMITS,
    ...(isObject(options.limits) ? options.limits : {}),
  };
  const inspected = safeRequestPayload(requestLike, limits);

  if (!inspected.ok) {
    return fail();
  }

  let serialized;

  try {
    serialized = JSON.stringify(inspected.value);
  } catch (error) {
    return fail();
  }

  if (typeof serialized !== 'string' || serialized.length > limits.maxSafeSerializedLength) {
    return fail();
  }

  return pass();
}

module.exports = {
  DEFAULT_REPAIR_INTAKE_DRAFT_TO_CASE_REQUEST_ABUSE_LIMITS: DEFAULT_LIMITS,
  guardRepairIntakeDraftToCaseRequest,
};
