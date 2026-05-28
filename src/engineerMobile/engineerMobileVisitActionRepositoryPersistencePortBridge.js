'use strict';

const {
  normalizeEngineerMobileVisitActionRepositoryResult,
  validateEngineerMobileVisitActionRepositoryInput,
} = require('./engineerMobileVisitActionRepositoryContract');

const ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_PERSISTENCE_PORT_BRIDGE_KIND = 'engineer_mobile.visit_action_repository_persistence_port_bridge';
const TRANSITION_PATCH_KIND = 'engineer_mobile.visit_action_transition_patch';
const AUDIT_EVENT_KIND = 'engineer_mobile.visit_action_audit_event';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function compactRecord(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
}

function copyTransitionPatch(patch) {
  if (!isObject(patch)) {
    return undefined;
  }

  return compactRecord({
    mobileVisitStatus: patch.mobileVisitStatus,
    visitResult: patch.visitResult,
    updatedBy: patch.updatedBy,
    updatedAt: patch.updatedAt,
  });
}

function copyAuditContext(auditContext) {
  if (!isObject(auditContext)) {
    return undefined;
  }

  return compactRecord({
    actorId: auditContext.actorId,
    caseId: auditContext.caseId,
    appointmentId: auditContext.appointmentId,
    requestId: auditContext.requestId,
  });
}

function copyTransitionPatchEnvelope(envelope) {
  if (!isObject(envelope)) {
    return undefined;
  }

  return compactRecord({
    patchKind: envelope.patchKind || (envelope.patchBuilderKind ? TRANSITION_PATCH_KIND : undefined),
    entityType: envelope.entityType,
    entityId: envelope.entityId,
    organizationId: envelope.organizationId,
    action: envelope.action,
    patch: copyTransitionPatch(envelope.patch),
    auditContext: copyAuditContext(envelope.auditContext),
  });
}

function copyAuditEvent(auditEvent) {
  if (!isObject(auditEvent)) {
    return undefined;
  }

  return compactRecord({
    action: auditEvent.action,
    entityType: auditEvent.entityType,
    entityId: auditEvent.entityId,
    actorId: auditEvent.actorId,
    organizationId: auditEvent.organizationId,
    occurredAt: auditEvent.occurredAt,
    caseId: auditEvent.caseId,
    appointmentId: auditEvent.appointmentId,
    requestId: auditEvent.requestId,
  });
}

function copyAuditEventEnvelope(envelope) {
  if (!isObject(envelope)) {
    return undefined;
  }

  return compactRecord({
    eventKind: envelope.eventKind || (envelope.auditEventBuilderKind ? AUDIT_EVENT_KIND : undefined),
    action: envelope.action,
    entityType: envelope.entityType,
    entityId: envelope.entityId,
    actorId: envelope.actorId,
    organizationId: envelope.organizationId,
    occurredAt: envelope.occurredAt,
    auditEvent: copyAuditEvent(envelope.auditEvent),
  });
}

function repositoryPayloadFrom(input) {
  const source = isObject(input) ? input : {};

  return compactRecord({
    transitionPatchEnvelope: copyTransitionPatchEnvelope(source.transitionPatchEnvelope),
    auditEventEnvelope: copyAuditEventEnvelope(source.auditEventEnvelope),
  });
}

function transitionEnvelopeForValidation(envelope) {
  if (!isObject(envelope)) {
    return envelope;
  }

  const { patchBuilderKind, ...rest } = envelope;

  return {
    ...rest,
    patchKind: envelope.patchKind || (patchBuilderKind ? TRANSITION_PATCH_KIND : undefined),
  };
}

function auditEventEnvelopeForValidation(envelope) {
  if (!isObject(envelope)) {
    return envelope;
  }

  const { auditEventBuilderKind, ...rest } = envelope;

  return {
    ...rest,
    eventKind: envelope.eventKind || (auditEventBuilderKind ? AUDIT_EVENT_KIND : undefined),
  };
}

function validationPayloadFrom(input) {
  const source = isObject(input) ? input : {};

  return compactRecord({
    transitionPatchEnvelope: transitionEnvelopeForValidation(source.transitionPatchEnvelope),
    auditEventEnvelope: auditEventEnvelopeForValidation(source.auditEventEnvelope),
  });
}

function failure(reasonCode, validation) {
  return compactRecord({
    ok: false,
    persisted: false,
    bridgeKind: ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_PERSISTENCE_PORT_BRIDGE_KIND,
    reasonCode,
    validationReasonCode: validation && validation.reasonCode,
  });
}

function success(repositoryResult, validation) {
  return compactRecord({
    ok: true,
    persisted: true,
    bridgeKind: ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_PERSISTENCE_PORT_BRIDGE_KIND,
    reasonCode: 'persistence_port_written',
    repositoryReasonCode: repositoryResult.reasonCode,
    transitionPersisted: repositoryResult.transitionPersisted === true,
    auditRecorded: repositoryResult.auditRecorded,
    validationReasonCode: validation.reasonCode,
  });
}

function normalizeRepositoryAdapterResult(result, validation) {
  const normalized = normalizeEngineerMobileVisitActionRepositoryResult(result);

  if (!isObject(normalized) || normalized.ok !== true) {
    return failure('repository_adapter_write_failed', validation);
  }

  return success(normalized, validation);
}

function createEngineerMobileVisitActionRepositoryPersistencePortBridge(options = {}) {
  const source = isObject(options) ? options : {};
  const repositoryAdapter = source.repositoryAdapter;

  return {
    kind: ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_PERSISTENCE_PORT_BRIDGE_KIND,

    persist(input = {}) {
      if (!isObject(repositoryAdapter) || typeof repositoryAdapter.persist !== 'function') {
        return failure('repository_adapter_required');
      }

      const validationPayload = validationPayloadFrom(input);
      const repositoryPayload = repositoryPayloadFrom(input);
      const validation = validateEngineerMobileVisitActionRepositoryInput(validationPayload);

      if (!isObject(validation) || validation.ok !== true) {
        return failure(validation && validation.reasonCode
          ? validation.reasonCode
          : 'repository_adapter_write_failed', validation);
      }

      try {
        const repositoryResult = repositoryAdapter.persist(repositoryPayload);

        return normalizeRepositoryAdapterResult(repositoryResult, validation);
      } catch (caught) {
        return failure('repository_adapter_write_failed', validation);
      }
    },
  };
}

module.exports = {
  createEngineerMobileVisitActionRepositoryPersistencePortBridge,
  ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_PERSISTENCE_PORT_BRIDGE_KIND,
};
