'use strict';

const {
  buildDepotWorkshopRepairOrderAuditEvent,
} = require('../depotWorkshop/depotWorkshopRepairOrderAuditEvent');
const {
  buildDepotWorkshopRepairOrderDraft,
} = require('../depotWorkshop/depotWorkshopRepairOrderContract');
const {
  buildDepotWorkshopRepairOrderCustomerProjection,
} = require('../depotWorkshop/depotWorkshopRepairOrderCustomerProjection');
const {
  planDepotWorkshopRepairOrderStatusTransition,
} = require('../depotWorkshop/depotWorkshopRepairOrderTransitionPolicy');
const {
  buildDepotWorkshopAssignmentIntentWriteCommand,
} = require('../depotWorkshop/depotWorkshopAssignmentIntentWriteCommand');
const {
  normalizeDepotWorkshopRepairOrderRepositoryResult,
} = require('../depotWorkshop/depotWorkshopRepairOrderRepositoryContract');

const WORKSHOP_ASSIGNMENT_SERVICE_KIND = 'depot_workshop.workshop_assignment_service';
const WORKSHOP_ASSIGN_PERMISSION = 'workshop.assign';

const ASSIGNABLE_DEPOT_STATUSES = new Set([
  'intake_received',
  'diagnosis_pending',
  'diagnosis_completed',
  'quote_pending',
  'quote_approved',
  'repair_in_progress',
  'quality_check',
]);

const DEPOT_WORKFLOW_TYPES = new Set([
  'depot',
  'carry_in',
  'mail_in',
  'pickup_delivery',
]);

const FORBIDDEN_INPUT_KEYS = new Set([
  'rawDbRow',
  'raw_db_row',
  'rawCustomerData',
  'raw_customer_data',
  'customerName',
  'customer_name',
  'customerPhone',
  'customer_phone',
  'phone',
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

function actorRoleFrom(input = {}) {
  const actor = isObject(input.actor) ? input.actor : {};
  const user = isObject(input.user) ? input.user : {};

  return firstString(input.actorRole, input.role, actor.role, actor.actorRole, user.role);
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

function permissionContextFrom(input = {}) {
  const context = isObject(input.context) ? input.context : {};
  const contextPermission = isObject(context.permissionContext) ? context.permissionContext : {};
  const directPermission = isObject(input.permissionContext) ? input.permissionContext : {};

  return {
    ...contextPermission,
    ...directPermission,
  };
}

function hasWorkshopAssignPermission(input = {}) {
  const permissionContext = permissionContextFrom(input);

  if (permissionContext.canAssignWorkshop === true) {
    return true;
  }

  if (permissionContext.permission === WORKSHOP_ASSIGN_PERMISSION) {
    return true;
  }

  if (Array.isArray(permissionContext.permissions)) {
    return permissionContext.permissions.includes(WORKSHOP_ASSIGN_PERMISSION);
  }

  return false;
}

function hasForbiddenInput(input = {}) {
  return Object.keys(input).some((key) => FORBIDDEN_INPUT_KEYS.has(key));
}

function hasExplicitSubcontractorAssignmentScope(input = {}) {
  const context = isObject(input.context) ? input.context : {};

  return input.subcontractorAssignmentApproved === true
    || context.subcontractorAssignmentApproved === true
    || firstString(input.assignmentRelationship, context.assignmentRelationship, context.caseRelationship) === 'assigned_executor';
}

function assignmentRelationshipFrom(input = {}) {
  const context = isObject(input.context) ? input.context : {};

  return firstString(input.assignmentRelationship, context.assignmentRelationship, context.caseRelationship);
}

function targetDepotStatusFrom(input = {}) {
  return firstString(
    input.targetDepotStatus,
    input.target_depot_status,
    input.targetStatus,
    input.target_status,
    input.nextStatus,
    input.next_status,
  );
}

function resolveDepotIntakeRepository(options = {}) {
  if (!isObject(options)) {
    return undefined;
  }

  return options.depotIntakeRepository
    || options.depotRepository
    || options.repository;
}

function resolveRepairOrderRepository(options = {}) {
  if (!isObject(options)) {
    return undefined;
  }

  if (options.repairOrderRepository) {
    return options.repairOrderRepository;
  }

  if (isObject(options.depotWorkshop) && options.depotWorkshop.repairOrderRepository) {
    return options.depotWorkshop.repairOrderRepository;
  }

  return undefined;
}

function repairOrderWriterFrom(repository) {
  if (isObject(repository) && typeof repository.writeRepairOrder === 'function') {
    return repository.writeRepairOrder.bind(repository);
  }

  return undefined;
}

function failure(reasonCode, context = {}) {
  return compactRecord({
    ok: false,
    prepared: false,
    written: false,
    serviceKind: WORKSHOP_ASSIGNMENT_SERVICE_KIND,
    reasonCode,
    requestId: requestIdFrom(context),
  });
}

function success(assignmentIntent, context = {}) {
  return compactRecord({
    ok: true,
    prepared: true,
    written: false,
    serviceKind: WORKSHOP_ASSIGNMENT_SERVICE_KIND,
    reasonCode: 'workshop_assignment_intent_prepared',
    requestId: requestIdFrom(context),
    assignmentIntent,
  });
}

function writeSuccess(repositoryResult, context = {}) {
  return compactRecord({
    ok: true,
    prepared: true,
    written: repositoryResult.written === true,
    serviceKind: WORKSHOP_ASSIGNMENT_SERVICE_KIND,
    reasonCode: repositoryResult.reasonCode || 'workshop_assignment_intent_write_succeeded',
    requestId: repositoryResult.requestId || requestIdFrom(context),
    repairOrderResult: compactRecord({
      repositoryKind: repositoryResult.repositoryKind,
      repairOrderReference: repositoryResult.repairOrderReference,
      organizationId: repositoryResult.organizationId,
      tenantId: repositoryResult.tenantId,
      caseId: repositoryResult.caseId,
      depotIntakeId: repositoryResult.depotIntakeId,
      repairOrderId: repositoryResult.repairOrderId,
      written: repositoryResult.written === true,
      requestId: repositoryResult.requestId,
    }),
  });
}

function draftIdFrom(input = {}) {
  return firstString(input.depotIntakeId, input.depot_intake_id, input.draftId, input.draft_id, input.intakeDraftId);
}

function assignmentFieldsFrom(input = {}) {
  return {
    workshopId: stringValue(input.workshopId || input.workshop_id),
    workshopTeamId: stringValue(input.workshopTeamId || input.workshop_team_id),
    assignedTechnicianId: stringValue(input.assignedTechnicianId || input.assigned_technician_id),
    subcontractorOrganizationId: stringValue(input.subcontractorOrganizationId || input.subcontractor_organization_id),
    assignmentNote: stringValue(input.assignmentNote || input.assignment_note) || null,
  };
}

function hasAssignmentIntent(fields) {
  return Boolean(
    fields.workshopId
    || fields.workshopTeamId
    || fields.assignedTechnicianId
    || fields.subcontractorOrganizationId
    || fields.assignmentNote,
  );
}

function validateCommand(input = {}) {
  const requestId = requestIdFrom(input);
  const actorId = actorIdFrom(input);
  const actorRole = actorRoleFrom(input);
  const organizationId = organizationIdFrom(input);
  const draftId = draftIdFrom(input);
  const tenantId = stringValue(input.tenantId || input.tenant_id);
  const brandId = stringValue(input.brandId || input.brand_id);
  const serviceProviderId = stringValue(input.serviceProviderId || input.service_provider_id || input.providerId);
  const subcontractorId = stringValue(input.subcontractorId || input.subcontractor_id);
  const assignmentRelationship = assignmentRelationshipFrom(input);
  const targetDepotStatus = targetDepotStatusFrom(input);
  const assignmentFields = assignmentFieldsFrom(input);

  if (input.writeRequested === true || input.writeApproved === true || input.persist === true) {
    return { ok: false, reasonCode: 'workshop_assignment_write_scope_not_approved', requestId };
  }

  if (hasForbiddenInput(input)) {
    return { ok: false, reasonCode: 'workshop_assignment_payload_forbidden_fields', requestId };
  }

  if (!draftId) {
    return { ok: false, reasonCode: 'depot_intake_required', requestId };
  }

  if (!organizationId) {
    return { ok: false, reasonCode: 'organization_id_required', requestId };
  }

  if (!actorId) {
    return { ok: false, reasonCode: 'workshop_assignment_actor_required', requestId };
  }

  if (!hasWorkshopAssignPermission(input)) {
    return { ok: false, reasonCode: 'workshop_assignment_permission_required', requestId };
  }

  if (!hasAssignmentIntent(assignmentFields)) {
    return { ok: false, reasonCode: 'workshop_assignment_intent_required', requestId };
  }

  const subcontractorScoped = actorRole === 'subcontractor'
    || Boolean(subcontractorId)
    || Boolean(assignmentFields.subcontractorOrganizationId);

  if (subcontractorScoped && !hasExplicitSubcontractorAssignmentScope(input)) {
    return { ok: false, reasonCode: 'workshop_assignment_subcontractor_scope_required', requestId };
  }

  return {
    ok: true,
    draftId,
    organizationId,
    tenantId,
    brandId,
    serviceProviderId,
    subcontractorId,
    actorId,
    actorRole,
    assignmentRelationship,
    targetDepotStatus,
    requestId,
    assignmentFields,
  };
}

function depotIntakeFromResult(result) {
  if (!isObject(result)) {
    return undefined;
  }

  if (isObject(result.depotIntake)) {
    return result.depotIntake;
  }

  if (result.ok === true && isObject(result.assignment)) {
    return result.assignment;
  }

  return undefined;
}

function normalizeDepotIntake(depotIntake) {
  if (!isObject(depotIntake)) {
    return undefined;
  }

  return compactRecord({
    draftId: firstString(depotIntake.draftId, depotIntake.depotIntakeId),
    organizationId: stringValue(depotIntake.organizationId),
    tenantId: stringValue(depotIntake.tenantId) || null,
    caseId: stringValue(depotIntake.caseId || depotIntake.case_id),
    repairOrderId: stringValue(depotIntake.repairOrderId || depotIntake.repair_order_id),
    workflowType: firstString(depotIntake.workflowType, depotIntake.serviceType),
    depotStatus: firstString(depotIntake.depotStatus, depotIntake.status),
    brandId: stringValue(depotIntake.brandId) || null,
    serviceProviderId: stringValue(depotIntake.serviceProviderId) || null,
    itemRef: stringValue(depotIntake.itemRef) || null,
    productRef: stringValue(depotIntake.productRef) || null,
    issueSummaryRef: stringValue(depotIntake.issueSummaryRef) || null,
    repairOrderReference: stringValue(depotIntake.repairOrderReference || depotIntake.customerRepairReference),
    caseReference: stringValue(depotIntake.caseReference || depotIntake.customerCaseReference),
    statusLabelKey: stringValue(depotIntake.statusLabelKey),
    lastUpdatedAt: stringValue(depotIntake.lastUpdatedAt || depotIntake.customerFacingUpdatedAt),
    customerMessageKey: stringValue(depotIntake.customerMessageKey),
    estimatedReadyAt: stringValue(depotIntake.estimatedReadyAt || depotIntake.customerEstimatedReadyAt),
    returnMethod: stringValue(depotIntake.returnMethod),
    publicNotes: stringValue(depotIntake.publicNotes || depotIntake.customerPublicNotes),
  });
}

function depotIntakeVisible(depotIntake, validation) {
  if (!depotIntake) {
    return false;
  }

  if (depotIntake.organizationId !== validation.organizationId) {
    return false;
  }

  if (validation.tenantId && depotIntake.tenantId !== validation.tenantId) {
    return false;
  }

  if (validation.brandId && depotIntake.brandId !== validation.brandId) {
    return false;
  }

  if (validation.serviceProviderId && depotIntake.serviceProviderId !== validation.serviceProviderId) {
    return false;
  }

  return true;
}

function depotIntakeEligible(depotIntake) {
  return Boolean(depotIntake)
    && DEPOT_WORKFLOW_TYPES.has(depotIntake.workflowType)
    && ASSIGNABLE_DEPOT_STATUSES.has(depotIntake.depotStatus);
}

function buildRepositoryLookup(validation) {
  return compactRecord({
    draftId: validation.draftId,
    organizationId: validation.organizationId,
    tenantId: validation.tenantId,
    brandId: validation.brandId,
    serviceProviderId: validation.serviceProviderId,
    requestId: validation.requestId,
  });
}

function buildRepairOrderHelperInput(depotIntake, validation) {
  return compactRecord({
    repairOrderId: depotIntake.repairOrderId,
    caseId: depotIntake.caseId,
    depotIntakeId: depotIntake.draftId,
    organizationId: validation.organizationId,
    tenantId: validation.tenantId || depotIntake.tenantId || null,
    workflowType: depotIntake.workflowType,
    depotStatus: depotIntake.depotStatus,
    workshopId: validation.assignmentFields.workshopId || null,
    workshopTeamId: validation.assignmentFields.workshopTeamId || null,
    assignedTechnicianId: validation.assignmentFields.assignedTechnicianId || null,
    subcontractorOrganizationId: validation.assignmentFields.subcontractorOrganizationId || null,
    assignmentRelationship: validation.assignmentRelationship || null,
    itemRef: depotIntake.itemRef || null,
    productRef: depotIntake.productRef || null,
    issueSummaryRef: depotIntake.issueSummaryRef || null,
    requestId: validation.requestId || null,
    createdByActorId: validation.actorId,
    updatedByActorId: validation.actorId,
    actorId: validation.actorId,
    actorRole: validation.actorRole || null,
  });
}

function buildRepairOrderTransitionPlan(helperInput, validation) {
  if (!validation.targetDepotStatus) {
    return undefined;
  }

  const transitionResult = planDepotWorkshopRepairOrderStatusTransition({
    ...helperInput,
    fromStatus: helperInput.depotStatus,
    toStatus: validation.targetDepotStatus,
  });

  return transitionResult.ok ? { ...transitionResult.plannedTransition } : undefined;
}

function buildRepairOrderAuditIntent(helperInput, transitionPlan) {
  const auditResult = buildDepotWorkshopRepairOrderAuditEvent({
    ...helperInput,
    eventType: 'depot_workshop_repair_assignment_intent_prepared',
    assignmentStatus: 'prepared',
    transitionReasonCode: transitionPlan ? 'depot_workshop_repair_order_transition_planned' : undefined,
    projectionStatus: 'prepared',
    auditStatus: 'prepared',
    dataProfile: 'depot_internal',
  });

  return auditResult.ok ? { ...auditResult.auditEvent, metadata: { ...auditResult.auditEvent.metadata } } : undefined;
}

function buildRepairOrderCustomerProjection(depotIntake) {
  const projectionResult = buildDepotWorkshopRepairOrderCustomerProjection({
    source: {
      repairOrderReference: depotIntake.repairOrderReference || depotIntake.draftId,
      caseReference: depotIntake.caseReference || depotIntake.caseId,
      depotStatus: depotIntake.depotStatus,
      statusLabelKey: depotIntake.statusLabelKey,
      lastUpdatedAt: depotIntake.lastUpdatedAt,
      customerMessageKey: depotIntake.customerMessageKey,
      estimatedReadyAt: depotIntake.estimatedReadyAt,
      returnMethod: depotIntake.returnMethod,
      publicNotes: depotIntake.publicNotes,
    },
  });

  if (!projectionResult.ok || Object.keys(projectionResult.projection).length === 0) {
    return undefined;
  }

  return { ...projectionResult.projection };
}

function buildRepairOrderHelperSections(depotIntake, validation) {
  const helperInput = buildRepairOrderHelperInput(depotIntake, validation);
  const draftResult = buildDepotWorkshopRepairOrderDraft(helperInput);

  if (!draftResult.ok) {
    return {};
  }

  const transitionPlan = buildRepairOrderTransitionPlan(helperInput, validation);
  const auditIntent = buildRepairOrderAuditIntent(helperInput, transitionPlan);
  const customerProjection = buildRepairOrderCustomerProjection(depotIntake);

  return compactRecord({
    repairOrderDraft: { ...draftResult.draft },
    repairOrderTransitionPlan: transitionPlan,
    repairOrderAuditIntent: auditIntent,
    repairOrderCustomerProjection: customerProjection,
  });
}

function buildAssignmentIntent(depotIntake, validation) {
  return compactRecord({
    depotIntakeId: depotIntake.draftId,
    organizationId: validation.organizationId,
    tenantId: validation.tenantId || null,
    workflowType: depotIntake.workflowType,
    depotStatus: depotIntake.depotStatus,
    brandId: depotIntake.brandId || null,
    serviceProviderId: depotIntake.serviceProviderId || null,
    itemRef: depotIntake.itemRef || null,
    productRef: depotIntake.productRef || null,
    issueSummaryRef: depotIntake.issueSummaryRef || null,
    workshopId: validation.assignmentFields.workshopId || null,
    workshopTeamId: validation.assignmentFields.workshopTeamId || null,
    assignedTechnicianId: validation.assignmentFields.assignedTechnicianId || null,
    subcontractorOrganizationId: validation.assignmentFields.subcontractorOrganizationId || null,
    assignmentNote: validation.assignmentFields.assignmentNote,
    assignedByActorId: validation.actorId,
    actorRole: validation.actorRole || null,
    permission: WORKSHOP_ASSIGN_PERMISSION,
    writeRequired: false,
    requestId: validation.requestId || null,
    ...buildRepairOrderHelperSections(depotIntake, validation),
  });
}

function createWorkshopAssignmentService(options = {}) {
  const depotIntakeRepository = resolveDepotIntakeRepository(options);
  const repairOrderRepository = resolveRepairOrderRepository(options);

  return {
    kind: WORKSHOP_ASSIGNMENT_SERVICE_KIND,

    async prepareAssignmentIntent(input = {}) {
      if (!depotIntakeRepository || typeof depotIntakeRepository.findDepotIntakeState !== 'function') {
        return failure('depot_intake_repository_required', input);
      }

      const validation = validateCommand(input);

      if (!validation.ok) {
        return failure(validation.reasonCode, validation);
      }

      try {
        const readResult = await depotIntakeRepository.findDepotIntakeState(buildRepositoryLookup(validation));
        const depotIntake = normalizeDepotIntake(depotIntakeFromResult(readResult));

        if (!readResult || readResult.ok !== true || !depotIntakeVisible(depotIntake, validation)) {
          return failure('depot_intake_not_found_or_denied', validation);
        }

        if (!depotIntakeEligible(depotIntake)) {
          return failure('workshop_assignment_depot_status_ineligible', validation);
        }

        return success(buildAssignmentIntent(depotIntake, validation), validation);
      } catch (caught) {
        return failure('workshop_assignment_service_failed', validation);
      }
    },

    async writePreparedAssignmentIntent(input = {}) {
      const writeRepairOrder = repairOrderWriterFrom(repairOrderRepository);

      if (!writeRepairOrder) {
        return failure('repair_order_repository_required', input);
      }

      const commandEnvelope = buildDepotWorkshopAssignmentIntentWriteCommand(input);

      if (!commandEnvelope.ok) {
        return failure(commandEnvelope.reasonCode, {
          ...input,
          requestId: commandEnvelope.requestId || requestIdFrom(input),
        });
      }

      try {
        const repositoryResult = await writeRepairOrder({
          ...commandEnvelope,
          command: { ...commandEnvelope.command },
          auditIntent: commandEnvelope.auditIntent ? { ...commandEnvelope.auditIntent } : undefined,
          customerProjectionPreview: commandEnvelope.customerProjectionPreview
            ? { ...commandEnvelope.customerProjectionPreview }
            : undefined,
        });
        const normalizedResult = normalizeDepotWorkshopRepairOrderRepositoryResult({
          result: repositoryResult,
          trustedScope: commandEnvelope.command,
        });

        if (!normalizedResult.ok) {
          return failure(normalizedResult.reasonCode, commandEnvelope.command);
        }

        return writeSuccess(normalizedResult, commandEnvelope.command);
      } catch (caught) {
        return failure('repair_order_repository_write_failed', commandEnvelope.command);
      }
    },
  };
}

module.exports = {
  WORKSHOP_ASSIGNMENT_SERVICE_KIND,
  WORKSHOP_ASSIGN_PERMISSION,
  ASSIGNABLE_DEPOT_STATUSES,
  createWorkshopAssignmentService,
};
