'use strict';

const {
  normalizeEngineerMobileVisitActionRepositoryResult,
  validateEngineerMobileVisitActionRepositoryInput,
} = require('./engineerMobileVisitActionRepositoryContract');

const ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_ADAPTER_KIND = 'engineer_mobile.visit_action_repository_adapter';
const ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_OPERATION_KIND = 'engineer_mobile.visit_action_repository.operation_intent';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function compactRecord(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
}

function failure(reasonCode, validation) {
  return compactRecord({
    ok: false,
    adapterKind: ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_ADAPTER_KIND,
    reasonCode,
    validationReasonCode: validation && validation.reasonCode,
  });
}

function copyTransitionPatch(transitionPatch) {
  if (!isObject(transitionPatch)) {
    return undefined;
  }

  return compactRecord({
    patchKind: transitionPatch.patchKind,
    entityType: transitionPatch.entityType,
    entityId: transitionPatch.entityId,
    organizationId: transitionPatch.organizationId,
    action: transitionPatch.action,
    mobileVisitStatus: transitionPatch.mobileVisitStatus,
    visitResult: transitionPatch.visitResult,
    updatedBy: transitionPatch.updatedBy,
    updatedAt: transitionPatch.updatedAt,
  });
}

function copyAuditEvent(auditEvent) {
  if (!isObject(auditEvent)) {
    return undefined;
  }

  return compactRecord({
    eventKind: auditEvent.eventKind,
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

function buildOperationIntent(validation) {
  const transitionPatch = copyTransitionPatch(validation.transitionPatch);
  const auditEvent = copyAuditEvent(validation.auditEvent);

  return compactRecord({
    operationKind: ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_OPERATION_KIND,
    operationName: 'persist_engineer_mobile_visit_action',
    entityType: transitionPatch.entityType,
    entityId: transitionPatch.entityId,
    organizationId: transitionPatch.organizationId,
    action: transitionPatch.action,
    parameters: compactRecord({
      mobileVisitStatus: transitionPatch.mobileVisitStatus,
      visitResult: transitionPatch.visitResult,
      updatedBy: transitionPatch.updatedBy,
      updatedAt: transitionPatch.updatedAt,
      auditEvent,
    }),
  });
}

function normalizeExecuteResult(result, auditEvent) {
  if (result === undefined || result === null || result === true) {
    return normalizeEngineerMobileVisitActionRepositoryResult({
      ok: true,
      auditRecorded: auditEvent ? true : undefined,
    });
  }

  if (!isObject(result)) {
    return failure('repository_write_failed');
  }

  if (
    result.ok === false
    || result.accepted === false
    || result.persisted === false
    || result.written === false
    || result.appointmentUpdated === false
    || result.error !== undefined
  ) {
    return failure('repository_write_failed');
  }

  if (
    result.ok === true
    || result.accepted === true
    || result.persisted === true
    || result.written === true
    || result.appointmentUpdated === true
  ) {
    return normalizeEngineerMobileVisitActionRepositoryResult({
      ok: true,
      persisted: true,
      auditRecorded: auditEvent ? true : undefined,
    });
  }

  return failure('repository_write_failed');
}

function createEngineerMobileVisitActionRepositoryAdapter(options = {}) {
  const source = isObject(options) ? options : {};
  const dbClient = source.dbClient;

  return {
    kind: ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_ADAPTER_KIND,

    persist(input = {}) {
      if (!isObject(dbClient) || typeof dbClient.execute !== 'function') {
        return failure('db_client_required');
      }

      const validation = validateEngineerMobileVisitActionRepositoryInput(input);

      if (!isObject(validation) || validation.ok !== true) {
        return failure(validation && validation.reasonCode
          ? validation.reasonCode
          : 'repository_write_failed', validation);
      }

      const operationIntent = buildOperationIntent(validation);

      try {
        const executeResult = dbClient.execute(operationIntent);

        return compactRecord({
          adapterKind: ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_ADAPTER_KIND,
          ...normalizeExecuteResult(executeResult, validation.auditEvent),
        });
      } catch (caught) {
        return failure('repository_write_failed', validation);
      }
    },
  };
}

module.exports = {
  createEngineerMobileVisitActionRepositoryAdapter,
  ENGINEER_MOBILE_VISIT_ACTION_REPOSITORY_ADAPTER_KIND,
};
