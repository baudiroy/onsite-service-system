'use strict';

const {
  buildEngineerMobileVisitActionTransitionPatch,
} = require('./engineerMobileVisitActionTransitionPatchBuilder');
const {
  buildEngineerMobileVisitActionAuditEvent,
} = require('./engineerMobileVisitActionAuditEventBuilder');
const {
  createEngineerMobileVisitActionPersistencePortWriterAdapter,
} = require('./engineerMobileVisitActionPersistencePortWriterAdapter');

const ENGINEER_MOBILE_VISIT_ACTION_INTEGRATED_PERSISTENCE_WRITER_KIND = 'engineer_mobile.visit_action_integrated_persistence_writer';

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

function transitionPatchEnvelopeFromBuild(buildResult) {
  return compactRecord({
    patchBuilderKind: buildResult.patchBuilderKind,
    entityType: 'appointment',
    entityId: buildResult.appointmentId,
    organizationId: buildResult.organizationId,
    action: buildResult.action,
    patch: copyTransitionPatch(buildResult.patch),
    auditContext: compactRecord({
      actorId: buildResult.actorId,
      caseId: buildResult.caseId,
      appointmentId: buildResult.appointmentId,
      requestId: buildResult.requestId,
    }),
  });
}

function copyAuditEvent(event) {
  if (!isObject(event)) {
    return undefined;
  }

  return compactRecord({
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId,
    actorId: event.actorId,
    organizationId: event.organizationId,
    occurredAt: event.occurredAt,
    caseId: event.caseId,
    appointmentId: event.appointmentId,
    requestId: event.requestId,
  });
}

function auditEventEnvelopeFromBuild(buildResult) {
  return compactRecord({
    auditEventBuilderKind: buildResult.auditEventBuilderKind,
    action: buildResult.action,
    entityType: buildResult.entityType,
    entityId: buildResult.entityId,
    actorId: buildResult.actorId,
    organizationId: buildResult.organizationId,
    occurredAt: buildResult.auditEvent && buildResult.auditEvent.occurredAt,
    auditEvent: copyAuditEvent(buildResult.auditEvent),
  });
}

function failure(reasonCode, extra = {}) {
  return compactRecord({
    ok: false,
    persisted: false,
    writerKind: ENGINEER_MOBILE_VISIT_ACTION_INTEGRATED_PERSISTENCE_WRITER_KIND,
    reasonCode,
    ...extra,
  });
}

function withWriterKind(result) {
  if (!isObject(result)) {
    return failure('persistence_port_write_failed');
  }

  return compactRecord({
    ok: result.ok === true,
    persisted: result.persisted === true,
    writerKind: ENGINEER_MOBILE_VISIT_ACTION_INTEGRATED_PERSISTENCE_WRITER_KIND,
    reasonCode: result.reasonCode,
    adapterKind: result.adapterKind,
    contractReasonCode: result.contractReasonCode,
    transitionReasonCode: result.transitionReasonCode,
    auditReasonCode: result.auditReasonCode,
    validation: result.validation,
  });
}

function createEngineerMobileVisitActionIntegratedPersistenceWriter(options = {}) {
  const source = isObject(options) ? options : {};
  const persistenceWriter = createEngineerMobileVisitActionPersistencePortWriterAdapter({
    persistencePort: source.persistencePort,
  });
  const now = source.now;

  return {
    kind: ENGINEER_MOBILE_VISIT_ACTION_INTEGRATED_PERSISTENCE_WRITER_KIND,

    write(input = {}) {
      const payloadSource = isObject(input) ? input : {};
      const transitionBuildResult = buildEngineerMobileVisitActionTransitionPatch({
        transitionIntent: payloadSource.transitionIntent,
        now,
      });

      if (!isObject(transitionBuildResult) || transitionBuildResult.ok !== true) {
        return failure(
          transitionBuildResult && transitionBuildResult.reasonCode
            ? transitionBuildResult.reasonCode
            : 'transition_patch_build_failed',
        );
      }

      const transitionPatchEnvelope = transitionPatchEnvelopeFromBuild(transitionBuildResult);
      let auditEventEnvelope;

      if (payloadSource.auditIntent !== undefined) {
        const auditBuildResult = buildEngineerMobileVisitActionAuditEvent({
          auditIntent: payloadSource.auditIntent,
          now,
        });

        if (!isObject(auditBuildResult) || auditBuildResult.ok !== true) {
          return failure(
            auditBuildResult && auditBuildResult.reasonCode
              ? auditBuildResult.reasonCode
              : 'audit_event_build_failed',
          );
        }

        auditEventEnvelope = auditEventEnvelopeFromBuild(auditBuildResult);
      }

      return withWriterKind(persistenceWriter.persist({
        transitionPatchEnvelope,
        auditEventEnvelope,
      }));
    },
  };
}

module.exports = {
  createEngineerMobileVisitActionIntegratedPersistenceWriter,
  ENGINEER_MOBILE_VISIT_ACTION_INTEGRATED_PERSISTENCE_WRITER_KIND,
};
