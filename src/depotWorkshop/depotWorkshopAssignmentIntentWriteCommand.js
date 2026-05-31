'use strict';

const {
  buildDepotWorkshopRepairOrderAuditEvent,
} = require('./depotWorkshopRepairOrderAuditEvent');
const {
  buildDepotWorkshopRepairOrderCustomerProjection,
} = require('./depotWorkshopRepairOrderCustomerProjection');
const {
  planDepotWorkshopRepairOrderStatusTransition,
} = require('./depotWorkshopRepairOrderTransitionPolicy');

const DEPOT_WORKSHOP_ASSIGNMENT_INTENT_WRITE_ACTION = 'depot_workshop.assignment_intent.write';

const FORBIDDEN_WRITE_COMMAND_KEYS = new Set([
  'finalAppointmentId',
  'final_appointment_id',
  'completionReport',
  'completion_report',
  'completionReportId',
  'completion_report_id',
  'fieldServiceReport',
  'field_service_report',
  'fieldServiceReportId',
  'field_service_report_id',
  'customerAddress',
  'customer_address',
  'customerContact',
  'customer_contact',
  'customerPhone',
  'customer_phone',
  'customerSignature',
  'customer_signature',
  'customerPhoto',
  'customer_photo',
  'providerPayload',
  'provider_payload',
  'billing',
  'billingInternals',
  'billing_internals',
  'invoice',
  'settlement',
  'payment',
  'aiOutput',
  'ai_output',
  'openAiTrace',
  'openai_trace',
  'vectorTrace',
  'vector_trace',
  'DATABASE_URL',
  'JWT_SECRET',
  'token',
  'password',
  'secret',
  'sql',
  'stack',
]);

const UNSAFE_WRITE_COMMAND_TEXT_PATTERNS = Object.freeze([
  /database[_\s-]*url/i,
  /jwt[_\s-]*secret/i,
  /provider\s*payload/i,
  /\braw(?:\s|_|-)*(?:db|row|rows|customer|phone|address|payload|error|input)?\b/i,
  /\b(?:sql|stack|token|secret|password)\b/i,
  /\b(?:billing|invoice|charge|settlement|payment)\b/i,
  /\b(?:openai|ai\s*output|rag|vector)\b/i,
  /\b(?:final\s*appointment|field\s*service\s*report|completion\s*report|fsr)\b/i,
  /\b(?:phone|tel|address|signature|photo)\b/i,
]);

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function compactRecord(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
}

function safeScalar(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed || UNSAFE_WRITE_COMMAND_TEXT_PATTERNS.some((pattern) => pattern.test(trimmed))) {
      return undefined;
    }

    return trimmed;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  return undefined;
}

function firstSafeValue(...values) {
  return values.map(safeScalar).find((value) => value !== undefined);
}

function normalizedFieldName(value) {
  return String(value).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function fieldIsForbidden(fieldName) {
  return FORBIDDEN_WRITE_COMMAND_KEYS.has(fieldName)
    || normalizedFieldName(fieldName).startsWith('raw');
}

function hasForbiddenInput(value) {
  if (Array.isArray(value)) {
    return value.some((item) => hasForbiddenInput(item));
  }

  if (!isPlainObject(value)) {
    return false;
  }

  return Object.entries(value).some(([fieldName, fieldValue]) => (
    fieldIsForbidden(fieldName) || hasForbiddenInput(fieldValue)
  ));
}

function sourceIntentFrom(input = {}) {
  if (isPlainObject(input.assignmentIntent)) {
    return input.assignmentIntent;
  }

  if (isPlainObject(input.preparedAssignmentIntent)) {
    return input.preparedAssignmentIntent;
  }

  if (isPlainObject(input.depotRepair)) {
    return input.depotRepair;
  }

  if (isPlainObject(input.intent)) {
    return input.intent;
  }

  if (isPlainObject(input.result) && isPlainObject(input.result.assignmentIntent)) {
    return input.result.assignmentIntent;
  }

  return undefined;
}

function scopeFrom(input = {}, intent = {}) {
  const trustedScope = isPlainObject(input.trustedScope) ? input.trustedScope : {};
  const context = isPlainObject(input.context) ? input.context : {};

  return {
    ...intent,
    ...context,
    ...trustedScope,
    permissionContext: {
      ...(isPlainObject(input.permissionContext) ? input.permissionContext : {}),
      ...(isPlainObject(context.permissionContext) ? context.permissionContext : {}),
      ...(isPlainObject(trustedScope.permissionContext) ? trustedScope.permissionContext : {}),
    },
  };
}

function permissionAllowed(input = {}, scope = {}) {
  const permissionContext = isPlainObject(scope.permissionContext) ? scope.permissionContext : {};
  const permissions = Array.isArray(permissionContext.permissions) ? permissionContext.permissions : [];

  return input.writeAuthorized === true
    || scope.writeAuthorized === true
    || permissionContext.canWriteAssignmentIntent === true
    || permissionContext.permission === DEPOT_WORKSHOP_ASSIGNMENT_INTENT_WRITE_ACTION
    || permissions.includes(DEPOT_WORKSHOP_ASSIGNMENT_INTENT_WRITE_ACTION);
}

function baseCommandFields(scope = {}) {
  return compactRecord({
    organizationId: firstSafeValue(scope.organizationId, scope.organization_id),
    tenantId: firstSafeValue(scope.tenantId, scope.tenant_id),
    caseId: firstSafeValue(scope.caseId, scope.case_id),
    depotIntakeId: firstSafeValue(scope.depotIntakeId, scope.depot_intake_id, scope.draftId, scope.draft_id),
    repairOrderId: firstSafeValue(scope.repairOrderId, scope.repair_order_id),
    brandId: firstSafeValue(scope.brandId, scope.brand_id),
    serviceProviderId: firstSafeValue(scope.serviceProviderId, scope.service_provider_id, scope.providerId),
    workshopId: firstSafeValue(scope.workshopId, scope.workshop_id),
    workshopTeamId: firstSafeValue(scope.workshopTeamId, scope.workshop_team_id),
    assignedTechnicianId: firstSafeValue(scope.assignedTechnicianId, scope.assigned_technician_id),
    subcontractorOrganizationId: firstSafeValue(scope.subcontractorOrganizationId, scope.subcontractor_organization_id),
    assignmentRelationship: firstSafeValue(scope.assignmentRelationship, scope.assignment_relationship),
    actorId: firstSafeValue(scope.actorId, scope.actor_id, scope.assignedByActorId, scope.assigned_by_actor_id),
    actorRole: firstSafeValue(scope.actorRole, scope.actor_role),
    depotStatus: firstSafeValue(scope.depotStatus, scope.depot_status, scope.status),
    targetDepotStatus: firstSafeValue(scope.targetDepotStatus, scope.target_depot_status, scope.targetStatus, scope.target_status),
    requestId: firstSafeValue(scope.requestId, scope.request_id),
  });
}

function failure(reasonCode, requestId) {
  return compactRecord({
    ok: false,
    status: 'rejected',
    reasonCode,
    action: DEPOT_WORKSHOP_ASSIGNMENT_INTENT_WRITE_ACTION,
    requestId,
  });
}

function subcontractorScopeValid(command = {}, scope = {}) {
  const trustedSubcontractorId = firstSafeValue(
    scope.trustedSubcontractorOrganizationId,
    scope.trusted_subcontractor_organization_id,
    scope.scopeSubcontractorOrganizationId,
    scope.scope_subcontractor_organization_id,
  );

  if (trustedSubcontractorId && command.subcontractorOrganizationId && trustedSubcontractorId !== command.subcontractorOrganizationId) {
    return false;
  }

  if ((command.actorRole === 'subcontractor' || command.subcontractorOrganizationId) && !command.assignmentRelationship) {
    return false;
  }

  return true;
}

function buildTransitionPlan(command = {}) {
  if (!command.targetDepotStatus) {
    return { ok: true, transitionPlan: undefined };
  }

  const result = planDepotWorkshopRepairOrderStatusTransition({
    ...command,
    fromStatus: command.depotStatus,
    toStatus: command.targetDepotStatus,
  });

  if (!result.ok) {
    return { ok: false, reasonCode: result.reasonCode };
  }

  return {
    ok: true,
    transitionPlan: { ...result.plannedTransition },
  };
}

function buildAuditIntent(command = {}, transitionPlan) {
  const result = buildDepotWorkshopRepairOrderAuditEvent({
    ...command,
    eventType: 'depot_workshop_repair_assignment_intent_prepared',
    assignmentStatus: 'write_command_prepared',
    transitionReasonCode: transitionPlan ? 'depot_workshop_repair_order_transition_planned' : undefined,
    projectionStatus: 'preview',
    auditStatus: 'prepared',
    dataProfile: 'depot_internal',
  });

  if (!result.ok) {
    return { ok: false, reasonCode: result.reasonCode };
  }

  return {
    ok: true,
    auditIntent: { ...result.auditEvent, metadata: { ...result.auditEvent.metadata } },
  };
}

function buildCustomerProjectionPreview(intent = {}, command = {}) {
  const source = isPlainObject(intent.repairOrderCustomerProjection)
    ? intent.repairOrderCustomerProjection
    : {
      repairOrderReference: intent.repairOrderReference || command.repairOrderId || command.depotIntakeId,
      caseReference: intent.caseReference || command.caseId,
      depotStatus: intent.depotStatus || command.depotStatus,
      statusLabelKey: intent.statusLabelKey,
      lastUpdatedAt: intent.lastUpdatedAt,
      customerMessageKey: intent.customerMessageKey,
      estimatedReadyAt: intent.estimatedReadyAt,
      returnMethod: intent.returnMethod,
      publicNotes: intent.publicNotes,
    };

  const result = buildDepotWorkshopRepairOrderCustomerProjection({ source });

  return { ...result.projection };
}

function buildDepotWorkshopAssignmentIntentWriteCommand(input = {}) {
  if (!isPlainObject(input)) {
    return failure('depot_workshop_assignment_intent_write_command_plain_object_required');
  }

  if (hasForbiddenInput(input)) {
    return failure('depot_workshop_assignment_intent_write_command_forbidden_fields', firstSafeValue(input.requestId, input.request_id));
  }

  const intent = sourceIntentFrom(input);

  if (!isPlainObject(intent)) {
    return failure('depot_workshop_assignment_intent_write_command_prepared_intent_required', firstSafeValue(input.requestId, input.request_id));
  }

  const scope = scopeFrom(input, intent);
  const command = baseCommandFields(scope);

  if (!command.organizationId) {
    return failure('organization_id_required', command.requestId);
  }

  if (!command.caseId) {
    return failure('case_id_required', command.requestId);
  }

  if (!command.depotIntakeId && !command.repairOrderId) {
    return failure('repair_order_source_reference_required', command.requestId);
  }

  if (!command.actorId || !permissionAllowed(input, scope)) {
    return failure('depot_workshop_assignment_intent_write_authorization_required', command.requestId);
  }

  if (!subcontractorScopeValid(command, scope)) {
    return failure('depot_workshop_assignment_intent_write_subcontractor_scope_mismatch', command.requestId);
  }

  const transitionResult = buildTransitionPlan(command);

  if (!transitionResult.ok) {
    return failure(transitionResult.reasonCode, command.requestId);
  }

  const auditResult = buildAuditIntent(command, transitionResult.transitionPlan);

  if (!auditResult.ok) {
    return failure(auditResult.reasonCode, command.requestId);
  }

  const safeCommand = compactRecord({
    action: DEPOT_WORKSHOP_ASSIGNMENT_INTENT_WRITE_ACTION,
    ...command,
    transitionPlan: transitionResult.transitionPlan,
  });

  return {
    ok: true,
    status: 'ready',
    reasonCode: 'depot_workshop_assignment_intent_write_command_built',
    action: DEPOT_WORKSHOP_ASSIGNMENT_INTENT_WRITE_ACTION,
    command: { ...safeCommand },
    auditIntent: auditResult.auditIntent,
    customerProjectionPreview: buildCustomerProjectionPreview(intent, command),
  };
}

module.exports = {
  DEPOT_WORKSHOP_ASSIGNMENT_INTENT_WRITE_ACTION,
  buildDepotWorkshopAssignmentIntentWriteCommand,
};
