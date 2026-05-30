'use strict';

const PUBLIC_OPEN_REPAIR_INTAKE_REQUEST_DTO_ALLOWLIST = Object.freeze([
  'customerDisplayName',
  'customerContactIntent',
  'customerContactMethod',
  'serviceCategory',
  'problemDescription',
  'preferredTimeDescription',
  'addressDescription',
  'source',
  'consentConfirmed',
]);

const PUBLIC_OPEN_REPAIR_INTAKE_REQUEST_DTO_DENYLIST = Object.freeze([
  'organizationId',
  'caseId',
  'appointmentId',
  'completionReportId',
  'finalAppointmentId',
  'status',
  'createdBy',
  'updatedBy',
  'assignedEngineerId',
  'engineerId',
  'provider',
  'providerPayload',
  'ai',
  'rag',
  'billing',
  'settlement',
  'invoice',
  'audit',
  'auditActor',
  'permission',
  'role',
  'token',
  'password',
  'raw',
  'rawBody',
  'rawInput',
  'rawRequest',
  'debug',
  'internal',
  'sql',
  'databaseUrl',
  'DATABASE_URL',
]);

const SAFE_SOURCE_PATTERN = /^[A-Za-z0-9_-]{1,80}$/;

function isPlainObject(value) {
  return Boolean(value)
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

function safeString(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

function getPath(source, path) {
  let cursor = source;

  for (const key of path) {
    if (!isPlainObject(cursor)) {
      return undefined;
    }

    cursor = cursor[key];
  }

  return cursor;
}

function firstString(source, paths) {
  for (const path of paths) {
    const value = safeString(getPath(source, path));

    if (value) {
      return value;
    }
  }

  return undefined;
}

function assignString(result, key, source, paths) {
  const value = firstString(source, paths);

  if (value) {
    result[key] = value;
  }
}

function safeSource(value) {
  const source = safeString(value);

  if (!source || !SAFE_SOURCE_PATTERN.test(source)) {
    return undefined;
  }

  return source;
}

function firstBoolean(source, paths) {
  for (const path of paths) {
    const value = getPath(source, path);

    if (typeof value === 'boolean') {
      return value;
    }
  }

  return undefined;
}

function sanitizeRepairIntakePublicOpenRequestDto(rawInput = {}) {
  if (!isPlainObject(rawInput)) {
    return {};
  }

  const result = {};

  assignString(result, 'customerDisplayName', rawInput, [
    ['customerDisplayName'],
    ['customer', 'displayName'],
    ['customer', 'name'],
    ['displayName'],
  ]);
  assignString(result, 'customerContactIntent', rawInput, [
    ['customerContactIntent'],
    ['customer', 'contactIntent'],
    ['contactIntent'],
  ]);
  assignString(result, 'customerContactMethod', rawInput, [
    ['customerContactMethod'],
    ['customer', 'contactMethod'],
    ['contactMethod'],
  ]);
  assignString(result, 'serviceCategory', rawInput, [
    ['serviceCategory'],
    ['service', 'category'],
    ['category'],
  ]);
  assignString(result, 'problemDescription', rawInput, [
    ['problemDescription'],
    ['problem', 'description'],
    ['issue', 'description'],
    ['issueSummary'],
  ]);
  assignString(result, 'preferredTimeDescription', rawInput, [
    ['preferredTimeDescription'],
    ['preferredTime', 'description'],
    ['schedule', 'preferredTimeDescription'],
    ['visit', 'preferredTimeDescription'],
  ]);
  assignString(result, 'addressDescription', rawInput, [
    ['addressDescription'],
    ['site', 'addressDescription'],
    ['visit', 'addressDescription'],
  ]);

  const source = safeSource(firstString(rawInput, [
    ['source'],
    ['metadata', 'source'],
    ['requestSource'],
  ]));

  if (source) {
    result.source = source;
  }

  const consentConfirmed = firstBoolean(rawInput, [
    ['consentConfirmed'],
    ['consent', 'confirmed'],
    ['metadata', 'consentConfirmed'],
  ]);

  if (consentConfirmed !== undefined) {
    result.consentConfirmed = consentConfirmed;
  }

  return result;
}

module.exports = {
  PUBLIC_OPEN_REPAIR_INTAKE_REQUEST_DTO_ALLOWLIST,
  PUBLIC_OPEN_REPAIR_INTAKE_REQUEST_DTO_DENYLIST,
  sanitizeRepairIntakePublicOpenRequestDto,
};
