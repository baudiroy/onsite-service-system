'use strict';

const READ_PERMISSION = 'engineer_mobile.assigned_appointments.read';
const SAFE_DENY_MESSAGE_KEY = 'engineerMobile.workbenchRequestContext.unavailable';
const ALLOW_MESSAGE_KEY = 'engineerMobile.workbenchRequestContext.available';
const ENGINEER_ROLES = new Set([
  'engineer',
  'field_engineer',
  'field-service-engineer',
  'field_service_engineer',
  'onsite_engineer',
  'service_engineer',
  'technician',
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

function safeIdentifier(value) {
  const text = stringFromAny(value);

  if (!text || text.length > 128 || !/^[a-zA-Z0-9_.:-]+$/.test(text)) {
    return undefined;
  }

  return text;
}

function firstSafeIdentifier(...values) {
  for (const value of values) {
    const identifier = safeIdentifier(value);

    if (identifier) {
      return identifier;
    }
  }

  return undefined;
}

function safeMetadataValue(value) {
  const text = stringFromAny(value);

  if (!text || text.length > 128 || !/^[a-zA-Z0-9_.:-]+$/.test(text)) {
    return undefined;
  }

  return text;
}

function arrayValues(value) {
  if (Array.isArray(value)) {
    return value;
  }

  return value === undefined ? [] : [value];
}

function normalizedStrings(values) {
  return arrayValues(values)
    .map((value) => stringFromAny(value))
    .filter(Boolean);
}

function lowerStrings(values) {
  return normalizedStrings(values).map((value) => value.toLowerCase());
}

function objectOrEmpty(value) {
  return isObject(value) ? value : {};
}

function malformedNestedObject(request) {
  for (const key of ['context', 'auth', 'session', 'user', 'access', 'headers']) {
    if (request[key] !== undefined && !isObject(request[key])) {
      return true;
    }
  }

  return false;
}

function uniqueIdentifiers(values) {
  return Array.from(new Set(values.map(safeIdentifier).filter(Boolean)));
}

function hasConflict(values) {
  return uniqueIdentifiers(values).length > 1;
}

function permissionArrayFrom(source) {
  const permissions = [];

  for (const key of ['permissions', 'scopes', 'allowances']) {
    permissions.push(...normalizedStrings(source[key]));
  }

  return permissions;
}

function sourceReadAllowed(source) {
  const access = objectOrEmpty(source.access);
  const permissions = permissionArrayFrom(source);

  return source.assignedAppointmentsReadAllowed === true
    || source.engineerMobileAssignedAppointmentsReadAllowed === true
    || access.assignedAppointmentsReadAllowed === true
    || access.engineerMobileAssignedAppointmentsReadAllowed === true
    || permissions.includes(READ_PERMISSION);
}

function hasReadAllowance({ context, auth, session, user }) {
  return sourceReadAllowed(context)
    || sourceReadAllowed(auth)
    || sourceReadAllowed(session)
    || sourceReadAllowed(user);
}

function rolesFromSource(source) {
  return [
    ...lowerStrings(source.role),
    ...lowerStrings(source.roles),
  ];
}

function roleSummary({ context, auth, session, user }) {
  const roles = [
    ...rolesFromSource(context),
    ...rolesFromSource(auth),
    ...rolesFromSource(session),
    ...rolesFromSource(user),
  ];

  return {
    roles,
    hasExplicitRole: roles.length > 0,
    hasEngineerRole: roles.some((role) => ENGINEER_ROLES.has(role)),
  };
}

function headerValue(headers, name) {
  if (!isObject(headers)) {
    return undefined;
  }

  if (typeof headers.get === 'function') {
    return headers.get(name) || headers.get(name.toLowerCase());
  }

  return headers[name] || headers[name.toLowerCase()];
}

function safeRequestMetadata(request, now) {
  const context = objectOrEmpty(request.context);
  const headers = objectOrEmpty(request.headers);
  const metadata = {};
  const requestId = firstSafeIdentifier(
    request.requestId,
    request.id,
    context.requestId,
    headerValue(headers, 'x-request-id'),
  );
  const traceId = firstSafeIdentifier(
    request.traceId,
    context.traceId,
    headerValue(headers, 'x-trace-id'),
  );
  const correlationId = firstSafeIdentifier(
    request.correlationId,
    context.correlationId,
    headerValue(headers, 'x-correlation-id'),
  );
  const resolvedAt = safeMetadataValue(now);

  if (requestId) {
    metadata.requestId = requestId;
  }

  if (traceId) {
    metadata.traceId = traceId;
  }

  if (correlationId) {
    metadata.correlationId = correlationId;
  }

  if (resolvedAt) {
    metadata.resolvedAt = resolvedAt;
  }

  return metadata;
}

function buildSafeDenyEnvelope(reason, requestMetadata = {}) {
  return {
    status: 'deny',
    messageKey: SAFE_DENY_MESSAGE_KEY,
    engineerMobileVisible: false,
    context: null,
    requestMetadata,
    error: {
      messageKey: SAFE_DENY_MESSAGE_KEY,
      reason,
    },
  };
}

function buildAllowEnvelope({ organizationId, engineerUserId, requestMetadata }) {
  return {
    status: 'allow',
    messageKey: ALLOW_MESSAGE_KEY,
    engineerMobileVisible: true,
    context: {
      organizationId,
      engineerUserId,
      assignedAppointmentsReadAllowed: true,
      permissions: [READ_PERMISSION],
      requestMetadata,
    },
    requestMetadata,
  };
}

function resolveEngineerMobileWorkbenchRequestContext(input = {}) {
  const source = isObject(input) ? input : {};
  const request = source.request;

  if (!isObject(request)) {
    return buildSafeDenyEnvelope('missing_request');
  }

  const requestMetadata = safeRequestMetadata(request, source.now);

  if (malformedNestedObject(request)) {
    return buildSafeDenyEnvelope('malformed_context', requestMetadata);
  }

  const context = objectOrEmpty(request.context);
  const auth = objectOrEmpty(request.auth);
  const session = objectOrEmpty(request.session);
  const user = objectOrEmpty(request.user);
  const roles = roleSummary({ context, auth, session, user });
  const readAllowed = hasReadAllowance({ context, auth, session, user });
  const organizationCandidates = [
    context.organizationId,
    auth.organizationId,
    session.organizationId,
  ];
  const engineerCandidates = [
    context.engineerUserId,
    context.engineerId,
    auth.engineerUserId,
    auth.engineerId,
    session.engineerUserId,
    session.engineerId,
  ];

  if (readAllowed || roles.hasEngineerRole) {
    engineerCandidates.push(user.engineerUserId, user.engineerId, user.id);
  }

  if (hasConflict(organizationCandidates)) {
    return buildSafeDenyEnvelope('conflicting_organization', requestMetadata);
  }

  if (hasConflict(engineerCandidates)) {
    return buildSafeDenyEnvelope('conflicting_engineer_identity', requestMetadata);
  }

  if (roles.hasExplicitRole && !roles.hasEngineerRole) {
    return buildSafeDenyEnvelope('unsupported_role', requestMetadata);
  }

  const organizationId = uniqueIdentifiers(organizationCandidates)[0];
  const engineerUserId = uniqueIdentifiers(engineerCandidates)[0];

  if (!organizationId) {
    return buildSafeDenyEnvelope('missing_organization', requestMetadata);
  }

  if (!engineerUserId) {
    return buildSafeDenyEnvelope('missing_engineer_identity', requestMetadata);
  }

  if (!readAllowed) {
    return buildSafeDenyEnvelope('missing_read_permission', requestMetadata);
  }

  return buildAllowEnvelope({
    organizationId,
    engineerUserId,
    requestMetadata,
  });
}

function nowFromClock(clock) {
  try {
    if (typeof clock === 'function') {
      return clock();
    }

    if (isObject(clock) && typeof clock.now === 'function') {
      return clock.now();
    }
  } catch (error) {
    return undefined;
  }

  return undefined;
}

async function emitSafeAuditIntent(auditLogger, metadata) {
  if (!auditLogger) {
    return;
  }

  try {
    if (typeof auditLogger === 'function') {
      await auditLogger(metadata);
      return;
    }

    if (isObject(auditLogger) && typeof auditLogger.record === 'function') {
      await auditLogger.record(metadata);
      return;
    }

    if (isObject(auditLogger) && typeof auditLogger.log === 'function') {
      await auditLogger.log(metadata);
      return;
    }

    if (isObject(auditLogger) && typeof auditLogger.write === 'function') {
      await auditLogger.write(metadata);
    }
  } catch (error) {
    // Optional audit intent logging must never widen request context access.
  }
}

function auditMetadataFromResult(result) {
  return {
    event: 'engineerMobile.workbenchRequestContext.resolve',
    outcome: result.status,
    reason: result.error && result.error.reason,
    organizationId: result.context && result.context.organizationId,
    engineerUserId: result.context && result.context.engineerUserId,
    requestMetadata: result.requestMetadata || {},
  };
}

function createEngineerMobileWorkbenchRequestContextResolver(options = {}) {
  const dependencies = isObject(options) ? options : {};

  return async function engineerMobileWorkbenchRequestContextResolver(input = {}) {
    const source = isObject(input) ? input : {};
    const result = resolveEngineerMobileWorkbenchRequestContext({
      request: source.request,
      now: source.now || nowFromClock(dependencies.clock),
    });

    await emitSafeAuditIntent(dependencies.auditLogger, auditMetadataFromResult(result));

    return result;
  };
}

module.exports = {
  READ_PERMISSION,
  createEngineerMobileWorkbenchRequestContextResolver,
  resolveEngineerMobileWorkbenchRequestContext,
};
