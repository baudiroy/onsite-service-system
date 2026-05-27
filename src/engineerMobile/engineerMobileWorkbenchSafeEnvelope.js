'use strict';

const SAFE_METADATA_KEYS = new Set([
  'appointmentId',
  'engineerUserId',
  'organizationId',
  'reason',
  'reasonCode',
  'requestId',
  'statusCode',
  'traceId',
]);

const UNSAFE_KEYS = new Set([
  'authorization',
  'authorizationHeader',
  'cookie',
  'cookies',
  'debug',
  'debugPayload',
  'dbRow',
  'dbRows',
  'dispatcherNote',
  'fieldServiceReportId',
  'finalAppointmentId',
  'fullAddress',
  'internalNote',
  'lineUserId',
  'password',
  'phone',
  'providerDebug',
  'providerRawPayload',
  'rawDbRow',
  'rawDbRows',
  'rawError',
  'rawRows',
  'rawSession',
  'rawSql',
  'rawUser',
  'secret',
  'session',
  'stack',
  'token',
  'where',
]);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function stringFromAny(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    return stringValue(value);
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }

  return undefined;
}

function safeCode(value) {
  const text = stringFromAny(value);

  if (!text || text.length > 128 || !/^[a-zA-Z0-9_.:-]+$/.test(text)) {
    return undefined;
  }

  return text;
}

function unsafeKey(key) {
  return UNSAFE_KEYS.has(key) || UNSAFE_KEYS.has(key.replace(/[_-]([a-z])/g, (_, char) => char.toUpperCase()));
}

function sanitizeArray(values) {
  return values
    .map((value) => sanitizeWorkbenchPayload(value))
    .filter((value) => value !== undefined);
}

function sanitizeObject(source) {
  const sanitized = {};

  for (const [key, value] of Object.entries(source)) {
    if (unsafeKey(key) || value instanceof Error) {
      continue;
    }

    const sanitizedValue = sanitizeWorkbenchPayload(value);

    if (sanitizedValue !== undefined) {
      sanitized[key] = sanitizedValue;
    }
  }

  return sanitized;
}

function sanitizeWorkbenchPayload(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return sanitizeArray(value);
  }

  if (isObject(value)) {
    return sanitizeObject(value);
  }

  return undefined;
}

function sanitizeWorkbenchMetadata(metadata = {}) {
  const source = isObject(metadata) ? metadata : {};
  const sanitized = {};

  for (const key of SAFE_METADATA_KEYS) {
    const value = safeCode(source[key]);

    if (value) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function appendMetadata(envelope, metadata) {
  const safeMetadata = sanitizeWorkbenchMetadata(metadata);

  if (Object.keys(safeMetadata).length > 0) {
    envelope.metadata = safeMetadata;
  }

  return envelope;
}

function createEngineerMobileWorkbenchSuccessEnvelope({
  data = {},
  messageKey,
  metadata,
}) {
  return appendMetadata({
    status: 'allow',
    messageKey,
    engineerMobileVisible: true,
    data: sanitizeWorkbenchPayload(data) || {},
  }, metadata);
}

function createEngineerMobileWorkbenchDenyEnvelope({
  data = {},
  messageKey,
  metadata,
  reason,
}) {
  const error = {
    messageKey,
  };
  const safeReason = safeCode(reason);

  if (safeReason) {
    error.reason = safeReason;
  }

  return appendMetadata({
    status: 'deny',
    messageKey,
    engineerMobileVisible: false,
    data: sanitizeWorkbenchPayload(data) || {},
    error,
  }, metadata);
}

function createEngineerMobileWorkbenchErrorEnvelope({
  data = {},
  messageKey,
  metadata,
  reason,
}) {
  const error = {
    messageKey,
  };
  const safeReason = safeCode(reason);

  if (safeReason) {
    error.reason = safeReason;
  }

  return appendMetadata({
    status: 'error',
    messageKey,
    engineerMobileVisible: false,
    data: sanitizeWorkbenchPayload(data) || {},
    error,
  }, metadata);
}

module.exports = {
  createEngineerMobileWorkbenchDenyEnvelope,
  createEngineerMobileWorkbenchErrorEnvelope,
  createEngineerMobileWorkbenchSuccessEnvelope,
  sanitizeWorkbenchMetadata,
  sanitizeWorkbenchPayload,
};
