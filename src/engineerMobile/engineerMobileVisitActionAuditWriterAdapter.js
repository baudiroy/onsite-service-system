'use strict';

const {
  buildEngineerMobileVisitActionAuditEvent,
} = require('./engineerMobileVisitActionAuditEventBuilder');

const ENGINEER_MOBILE_VISIT_ACTION_AUDIT_WRITER_ADAPTER_KIND = 'engineer_mobile.visit_action_audit_writer_adapter';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function compactRecord(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
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

function copyAuditEventEnvelope(auditEventEnvelope) {
  if (!isObject(auditEventEnvelope)) {
    return undefined;
  }

  return compactRecord({
    ok: auditEventEnvelope.ok === true,
    auditEventBuilt: auditEventEnvelope.auditEventBuilt === true,
    auditEventBuilderKind: auditEventEnvelope.auditEventBuilderKind,
    reasonCode: auditEventEnvelope.reasonCode,
    action: auditEventEnvelope.action,
    entityType: auditEventEnvelope.entityType,
    entityId: auditEventEnvelope.entityId,
    actorId: auditEventEnvelope.actorId,
    organizationId: auditEventEnvelope.organizationId,
    caseId: auditEventEnvelope.caseId,
    appointmentId: auditEventEnvelope.appointmentId,
    requestId: auditEventEnvelope.requestId,
    auditEvent: copyAuditEvent(auditEventEnvelope.auditEvent),
  });
}

function failure(reasonCode, auditEventEnvelope) {
  return compactRecord({
    ok: false,
    recorded: false,
    adapterKind: ENGINEER_MOBILE_VISIT_ACTION_AUDIT_WRITER_ADAPTER_KIND,
    reasonCode,
    auditEventEnvelope: copyAuditEventEnvelope(auditEventEnvelope),
  });
}

function success(auditEventEnvelope) {
  const safeAuditEventEnvelope = copyAuditEventEnvelope(auditEventEnvelope);

  return compactRecord({
    ok: true,
    recorded: true,
    adapterKind: ENGINEER_MOBILE_VISIT_ACTION_AUDIT_WRITER_ADAPTER_KIND,
    reasonCode: 'audit_event_recorded',
    action: safeAuditEventEnvelope.action,
    entityType: safeAuditEventEnvelope.entityType,
    entityId: safeAuditEventEnvelope.entityId,
    actorId: safeAuditEventEnvelope.actorId,
    organizationId: safeAuditEventEnvelope.organizationId,
    caseId: safeAuditEventEnvelope.caseId,
    appointmentId: safeAuditEventEnvelope.appointmentId,
    requestId: safeAuditEventEnvelope.requestId,
    auditEventEnvelope: safeAuditEventEnvelope,
  });
}

function normalizeAuditEventWriterResult(result) {
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
    || result.recorded === false
    || result.persisted === false
    || result.error !== undefined
  ) {
    return false;
  }

  return result.ok === true
    || result.accepted === true
    || result.recorded === true
    || result.persisted === true;
}

function createEngineerMobileVisitActionAuditWriterAdapter(options = {}) {
  const source = isObject(options) ? options : {};
  const auditEventWriter = source.auditEventWriter;

  return {
    kind: ENGINEER_MOBILE_VISIT_ACTION_AUDIT_WRITER_ADAPTER_KIND,

    record(auditIntent) {
      if (!isObject(auditEventWriter) || typeof auditEventWriter.record !== 'function') {
        return failure('audit_event_writer_required');
      }

      const auditEventEnvelope = buildEngineerMobileVisitActionAuditEvent({
        auditIntent,
        now: source.now,
      });

      if (!isObject(auditEventEnvelope) || auditEventEnvelope.ok !== true) {
        return failure(auditEventEnvelope && auditEventEnvelope.reasonCode
          ? auditEventEnvelope.reasonCode
          : 'audit_event_write_failed', auditEventEnvelope);
      }

      const safeAuditEventEnvelope = copyAuditEventEnvelope(auditEventEnvelope);

      try {
        const writerResult = auditEventWriter.record(copyAuditEventEnvelope(safeAuditEventEnvelope));

        if (normalizeAuditEventWriterResult(writerResult) !== true) {
          return failure('audit_event_write_failed', safeAuditEventEnvelope);
        }
      } catch (error) {
        return failure('audit_event_write_failed', safeAuditEventEnvelope);
      }

      return success(safeAuditEventEnvelope);
    },
  };
}

module.exports = {
  createEngineerMobileVisitActionAuditWriterAdapter,
  ENGINEER_MOBILE_VISIT_ACTION_AUDIT_WRITER_ADAPTER_KIND,
};
