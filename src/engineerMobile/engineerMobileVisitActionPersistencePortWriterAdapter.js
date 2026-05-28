'use strict';

const {
  validateEngineerMobileVisitActionPersistencePortInput,
} = require('./engineerMobileVisitActionPersistencePortContract');

const ENGINEER_MOBILE_VISIT_ACTION_PERSISTENCE_PORT_WRITER_ADAPTER_KIND = 'engineer_mobile.visit_action_persistence_port_writer_adapter';

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
    patchKind: envelope.patchKind,
    patchBuilderKind: envelope.patchBuilderKind,
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
    eventKind: envelope.eventKind,
    auditEventBuilderKind: envelope.auditEventBuilderKind,
    action: envelope.action,
    entityType: envelope.entityType,
    entityId: envelope.entityId,
    actorId: envelope.actorId,
    organizationId: envelope.organizationId,
    occurredAt: envelope.occurredAt,
    auditEvent: copyAuditEvent(envelope.auditEvent),
  });
}

function copyValidationSummary(validationResult) {
  if (!isObject(validationResult)) {
    return undefined;
  }

  return compactRecord({
    ok: validationResult.ok === true,
    valid: validationResult.valid === true,
    contractKind: validationResult.contractKind,
    reasonCode: validationResult.reasonCode,
    transitionReasonCode: validationResult.transitionReasonCode,
    auditReasonCode: validationResult.auditReasonCode,
    transitionPatch: validationResult.transitionPatch,
    auditEvent: validationResult.auditEvent,
  });
}

function contractFailureReason(validationResult) {
  if (!isObject(validationResult)) {
    return 'persistence_port_write_failed';
  }

  return validationResult.transitionReasonCode
    || validationResult.auditReasonCode
    || validationResult.reasonCode
    || 'persistence_port_write_failed';
}

function failure(reasonCode, validationResult) {
  const validationSummary = copyValidationSummary(validationResult);

  return compactRecord({
    ok: false,
    persisted: false,
    adapterKind: ENGINEER_MOBILE_VISIT_ACTION_PERSISTENCE_PORT_WRITER_ADAPTER_KIND,
    reasonCode,
    contractReasonCode: validationSummary && validationSummary.reasonCode,
    transitionReasonCode: validationSummary && validationSummary.transitionReasonCode,
    auditReasonCode: validationSummary && validationSummary.auditReasonCode,
    validation: validationSummary,
  });
}

function success(validationResult) {
  const validationSummary = copyValidationSummary(validationResult);

  return compactRecord({
    ok: true,
    persisted: true,
    adapterKind: ENGINEER_MOBILE_VISIT_ACTION_PERSISTENCE_PORT_WRITER_ADAPTER_KIND,
    reasonCode: 'persistence_port_written',
    validation: validationSummary,
  });
}

function normalizePersistencePortResult(result) {
  if (result === undefined || result === null || result === true) {
    return true;
  }

  if (result === false) {
    return false;
  }

  if (!isObject(result)) {
    return false;
  }

  if (
    result.ok === false
    || result.accepted === false
    || result.persisted === false
    || result.written === false
    || result.error !== undefined
  ) {
    return false;
  }

  return result.ok === true
    || result.accepted === true
    || result.persisted === true
    || result.written === true;
}

function createEngineerMobileVisitActionPersistencePortWriterAdapter(options = {}) {
  const source = isObject(options) ? options : {};
  const persistencePort = source.persistencePort;

  return {
    kind: ENGINEER_MOBILE_VISIT_ACTION_PERSISTENCE_PORT_WRITER_ADAPTER_KIND,

    persist(input = {}) {
      if (!isObject(persistencePort) || typeof persistencePort.persist !== 'function') {
        return failure('persistence_port_required');
      }

      const payloadSource = isObject(input) ? input : {};
      const validationResult = validateEngineerMobileVisitActionPersistencePortInput({
        transitionPatchEnvelope: payloadSource.transitionPatchEnvelope,
        auditEventEnvelope: payloadSource.auditEventEnvelope,
      });

      if (!isObject(validationResult) || validationResult.ok !== true) {
        return failure(contractFailureReason(validationResult), validationResult);
      }

      const safePayload = compactRecord({
        transitionPatchEnvelope: copyTransitionPatchEnvelope(payloadSource.transitionPatchEnvelope),
        auditEventEnvelope: copyAuditEventEnvelope(payloadSource.auditEventEnvelope),
      });

      try {
        const portResult = persistencePort.persist(safePayload);

        if (normalizePersistencePortResult(portResult) !== true) {
          return failure('persistence_port_write_failed', validationResult);
        }
      } catch (caught) {
        return failure('persistence_port_write_failed', validationResult);
      }

      return success(validationResult);
    },
  };
}

module.exports = {
  createEngineerMobileVisitActionPersistencePortWriterAdapter,
  ENGINEER_MOBILE_VISIT_ACTION_PERSISTENCE_PORT_WRITER_ADAPTER_KIND,
};
