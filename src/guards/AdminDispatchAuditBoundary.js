'use strict';

const ADMIN_DISPATCH_AUDIT_BOUNDARY_KIND = 'admin_dispatch.operations_audit_boundary';

const FORBIDDEN_AUDIT_INPUT_KEYS = new Set([
  'rawDbRow',
  'raw_db_row',
  'rawCustomerData',
  'raw_customer_data',
  'rawPhone',
  'rawAddress',
  'providerPayload',
  'provider_payload',
  'token',
  'secret',
  'DATABASE_URL',
  'JWT_SECRET',
  'stack',
  'sql',
  'billingInternals',
  'aiProviderOutput',
  'completionReport',
  'fieldServiceReport',
  'finalAppointmentId',
  'customerVisibleReportBody',
]);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return undefined;
}

function compactRecord(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
}

function firstString(...values) {
  return values.map(stringValue).find(Boolean);
}

function actorIdFrom(input = {}) {
  const actor = isObject(input.actor) ? input.actor : {};
  const user = isObject(input.user) ? input.user : {};

  return firstString(
    input.adminActorId,
    input.dispatcherActorId,
    input.actorId,
    actor.id,
    actor.userId,
    user.id,
    user.userId,
  );
}

function organizationIdFrom(input = {}) {
  const actor = isObject(input.actor) ? input.actor : {};
  const user = isObject(input.user) ? input.user : {};
  const context = isObject(input.context) ? input.context : {};

  return firstString(input.organizationId, actor.organizationId, user.organizationId, context.organizationId);
}

function requestIdFrom(input = {}) {
  const context = isObject(input.context) ? input.context : {};

  return firstString(input.requestId, context.requestId);
}

function safeMetadata(input = {}) {
  return compactRecord({
    actionType: firstString(input.actionType, input.action, input.eventType),
    organizationId: organizationIdFrom(input),
    assignmentId: firstString(input.assignmentId, input.dispatchAssignmentId),
    appointmentId: firstString(input.appointmentId),
    caseId: firstString(input.caseId),
    adminActorId: firstString(input.adminActorId, input.actorId, input.actor && input.actor.id),
    dispatcherActorId: firstString(input.dispatcherActorId),
    requestId: requestIdFrom(input),
    permissionDecision: firstString(input.permissionDecision),
    assignmentIntentStatus: firstString(input.assignmentIntentStatus, input.intentStatus),
    transitionIntentStatus: firstString(input.transitionIntentStatus),
    occurredAt: firstString(input.occurredAt),
  });
}

function hasForbiddenInput(input = {}) {
  return Object.keys(input).some((key) => FORBIDDEN_AUDIT_INPUT_KEYS.has(key));
}

function failure(reasonCode, context = {}) {
  return compactRecord({
    ok: false,
    auditRecorded: false,
    boundaryKind: ADMIN_DISPATCH_AUDIT_BOUNDARY_KIND,
    reasonCode,
    requestId: requestIdFrom(context),
  });
}

function success(auditEvent, context = {}) {
  return compactRecord({
    ok: true,
    auditRecorded: true,
    boundaryKind: ADMIN_DISPATCH_AUDIT_BOUNDARY_KIND,
    reasonCode: 'admin_dispatch_audit_recorded',
    requestId: requestIdFrom(context),
    auditEvent,
  });
}

function buildAdminDispatchAuditEvent(input = {}) {
  const source = isObject(input) ? input : {};
  const requestId = requestIdFrom(source);
  const organizationId = organizationIdFrom(source);
  const actorId = actorIdFrom(source);
  const action = firstString(source.actionType, source.action, source.eventType);

  if (!action) {
    return failure('audit_action_required', { requestId });
  }

  if (!organizationId) {
    return failure('organization_id_required', { requestId });
  }

  if (!actorId) {
    return failure('admin_actor_required', { requestId });
  }

  if (hasForbiddenInput(source)) {
    return failure('audit_payload_forbidden_fields', { requestId });
  }

  const auditEvent = {
    eventKind: 'admin_dispatch.operations_audit_event',
    action,
    entityType: 'dispatch_assignment',
    entityId: firstString(source.assignmentId, source.dispatchAssignmentId) || null,
    actorType: firstString(source.actorType) || 'admin',
    actorId,
    organizationId,
    internalOnly: true,
    customerVisible: false,
    metadata: safeMetadata(source),
  };

  return success(auditEvent, source);
}

function resolveAuditWriter(options = {}) {
  if (!isObject(options)) {
    return undefined;
  }

  if (typeof options.auditWriter === 'function') {
    return options.auditWriter;
  }

  if (isObject(options.auditWriter) && typeof options.auditWriter.write === 'function') {
    return options.auditWriter.write.bind(options.auditWriter);
  }

  if (isObject(options.auditWriter) && typeof options.auditWriter.record === 'function') {
    return options.auditWriter.record.bind(options.auditWriter);
  }

  return undefined;
}

function createAdminDispatchAuditBoundary(options = {}) {
  const auditWriter = resolveAuditWriter(options);

  return {
    kind: ADMIN_DISPATCH_AUDIT_BOUNDARY_KIND,

    async record(input = {}) {
      if (typeof auditWriter !== 'function') {
        return failure('audit_writer_required', input);
      }

      const buildResult = buildAdminDispatchAuditEvent(input);

      if (!buildResult.ok) {
        return buildResult;
      }

      try {
        await auditWriter(buildResult.auditEvent);

        return buildResult;
      } catch (error) {
        return failure('admin_dispatch_audit_writer_failed', input);
      }
    },
  };
}

module.exports = {
  ADMIN_DISPATCH_AUDIT_BOUNDARY_KIND,
  buildAdminDispatchAuditEvent,
  createAdminDispatchAuditBoundary,
};
