'use strict';

const DEPOT_WORKSHOP_AUDIT_BOUNDARY_KIND = 'depot_workshop.audit_boundary';

const FORBIDDEN_AUDIT_INPUT_KEYS = new Set([
  'rawDbRow',
  'raw_db_row',
  'rawRows',
  'raw_rows',
  'rawCustomerData',
  'raw_customer_data',
  'customerPhone',
  'customer_phone',
  'rawPhone',
  'rawAddress',
  'address',
  'providerPayload',
  'provider_payload',
  'token',
  'secret',
  'DATABASE_URL',
  'JWT_SECRET',
  'stack',
  'sql',
  'billingInternals',
  'billing_internals',
  'aiOutput',
  'ai_output',
  'aiProviderOutput',
  'ai_provider_output',
  'completionReport',
  'completion_report',
  'fieldServiceReport',
  'field_service_report',
  'finalAppointmentId',
  'final_appointment_id',
  'customerVisibleReportBody',
  'customer_visible_report_body',
  'customerVisiblePublication',
  'customer_visible_publication',
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

  return firstString(input.actorId, actor.id, actor.userId, actor.sub, user.id, user.userId, user.sub);
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

function hasForbiddenInput(input = {}) {
  return Object.keys(input).some((key) => FORBIDDEN_AUDIT_INPUT_KEYS.has(key));
}

function safeMetadata(input = {}) {
  return compactRecord({
    actionType: firstString(input.actionType, input.action, input.eventType),
    organizationId: organizationIdFrom(input),
    depotIntakeId: firstString(input.depotIntakeId, input.depot_intake_id),
    depotRepairId: firstString(input.depotRepairId, input.depot_repair_id),
    caseId: firstString(input.caseId, input.case_id),
    draftId: firstString(input.draftId, input.draft_id),
    brandId: firstString(input.brandId, input.brand_id),
    serviceProviderId: firstString(input.serviceProviderId, input.service_provider_id, input.providerId),
    subcontractorId: firstString(input.subcontractorId, input.subcontractor_id, input.subcontractorOrganizationId),
    actorId: actorIdFrom(input),
    requestId: requestIdFrom(input),
    depotStatus: firstString(input.depotStatus, input.status),
    assignmentStatus: firstString(input.assignmentStatus, input.assignmentIntentStatus),
    accessDecision: firstString(input.accessDecision, input.accessResult),
    permissionDecision: firstString(input.permissionDecision),
    routeDecision: firstString(input.routeDecision),
    dataProfile: firstString(input.dataProfile),
    occurredAt: firstString(input.occurredAt),
  });
}

function failure(reasonCode, context = {}) {
  return compactRecord({
    ok: false,
    auditRecorded: false,
    boundaryKind: DEPOT_WORKSHOP_AUDIT_BOUNDARY_KIND,
    reasonCode,
    requestId: requestIdFrom(context),
  });
}

function success(auditEvent, context = {}) {
  return compactRecord({
    ok: true,
    auditRecorded: true,
    boundaryKind: DEPOT_WORKSHOP_AUDIT_BOUNDARY_KIND,
    reasonCode: 'depot_workshop_audit_recorded',
    requestId: requestIdFrom(context),
    auditEvent,
  });
}

function buildDepotWorkshopAuditEvent(input = {}) {
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
    return failure('audit_actor_required', { requestId });
  }

  if (hasForbiddenInput(source)) {
    return failure('audit_payload_forbidden_fields', { requestId });
  }

  const metadata = safeMetadata(source);
  const auditEvent = {
    eventKind: 'depot_workshop.audit_event',
    action,
    entityType: 'depot_workshop',
    entityId: firstString(source.depotRepairId, source.depotIntakeId, source.draftId) || null,
    actorType: firstString(source.actorType) || 'internal',
    actorId,
    organizationId,
    internalOnly: true,
    customerVisible: false,
    metadata,
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

function createDepotWorkshopAuditBoundary(options = {}) {
  const auditWriter = resolveAuditWriter(options);

  return {
    kind: DEPOT_WORKSHOP_AUDIT_BOUNDARY_KIND,

    async record(input = {}) {
      if (typeof auditWriter !== 'function') {
        return failure('audit_writer_required', input);
      }

      const buildResult = buildDepotWorkshopAuditEvent(input);

      if (!buildResult.ok) {
        return buildResult;
      }

      try {
        await auditWriter(buildResult.auditEvent);

        return buildResult;
      } catch (error) {
        return failure('depot_workshop_audit_writer_failed', input);
      }
    },
  };
}

module.exports = {
  DEPOT_WORKSHOP_AUDIT_BOUNDARY_KIND,
  buildDepotWorkshopAuditEvent,
  createDepotWorkshopAuditBoundary,
};
