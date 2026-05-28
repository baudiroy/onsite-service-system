'use strict';

const {
  planEngineerMobileVisitActionCommand,
} = require('./engineerMobileVisitActionCommandPlanner');
const {
  normalizeEngineerMobileVisitActionWriterResult,
} = require('./engineerMobileVisitActionWriterResultNormalizer');

const ENGINEER_MOBILE_VISIT_ACTION_APPLICATION_SERVICE_KIND = 'engineer_mobile.visit_action_application_service';

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

function clonePlain(value) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value));
}

function safeEnvelopeFrom(plan, overrides = {}) {
  return compactRecord({
    ok: Boolean(plan.ok),
    allowed: Boolean(plan.allowed),
    serviceKind: ENGINEER_MOBILE_VISIT_ACTION_APPLICATION_SERVICE_KIND,
    action: stringValue(plan.action),
    reasonCode: stringValue(plan.reasonCode),
    actorId: stringValue(plan.actorId),
    appointmentId: stringValue(plan.appointmentId),
    caseId: stringValue(plan.caseId),
    organizationId: stringValue(plan.organizationId),
    transitionIntent: clonePlain(plan.transitionIntent),
    auditIntent: clonePlain(plan.auditIntent),
    ...overrides,
  });
}


function hasTransitionWrite(transitionWriter) {
  return isObject(transitionWriter) && typeof transitionWriter.write === 'function';
}

function hasAuditRecord(auditWriter) {
  return isObject(auditWriter) && typeof auditWriter.record === 'function';
}

function transitionWriterRequired(plan) {
  return safeEnvelopeFrom(plan, {
    ok: false,
    allowed: true,
    reasonCode: 'transition_writer_required',
    transitionApplied: false,
    auditRecorded: false,
  });
}

function transitionWriteFailed(plan) {
  return safeEnvelopeFrom(plan, {
    ok: false,
    allowed: true,
    reasonCode: 'transition_write_failed',
    transitionApplied: false,
    auditRecorded: false,
  });
}

function auditWriteFailed(plan) {
  return safeEnvelopeFrom(plan, {
    ok: false,
    allowed: true,
    reasonCode: 'audit_write_failed',
    transitionApplied: true,
    auditRecorded: false,
  });
}

function appliedResult(plan, auditRecorded) {
  return safeEnvelopeFrom(plan, {
    ok: true,
    allowed: true,
    reasonCode: 'applied',
    transitionApplied: true,
    auditRecorded,
  });
}

function deniedResult(plan) {
  return safeEnvelopeFrom(plan, {
    ok: false,
    allowed: false,
    transitionApplied: false,
    auditRecorded: false,
  });
}

function createEngineerMobileVisitActionApplicationService(options = {}) {
  const source = isObject(options) ? options : {};
  const transitionWriter = source.transitionWriter;
  const auditWriter = source.auditWriter;

  function handleEngineerMobileVisitAction(command = {}) {
    const request = isObject(command) ? command : {};
    const plan = planEngineerMobileVisitActionCommand({
      action: request.action,
      actor: request.actor,
      appointment: request.appointment,
      visitResult: request.visitResult,
      now: request.now,
    });

    if (!plan.allowed) {
      return deniedResult(plan);
    }

    if (!hasTransitionWrite(transitionWriter)) {
      return transitionWriterRequired(plan);
    }

    try {
      const transitionResult = transitionWriter.write(clonePlain(plan.transitionIntent));
      const normalizedTransitionResult = normalizeEngineerMobileVisitActionWriterResult({
        writerKind: 'transition',
        result: transitionResult,
      });

      if (!normalizedTransitionResult.ok) {
        return transitionWriteFailed(plan);
      }
    } catch (error) {
      return transitionWriteFailed(plan);
    }

    if (!hasAuditRecord(auditWriter)) {
      return appliedResult(plan, false);
    }

    try {
      const auditResult = auditWriter.record(clonePlain(plan.auditIntent));
      const normalizedAuditResult = normalizeEngineerMobileVisitActionWriterResult({
        writerKind: 'audit',
        result: auditResult,
      });

      if (!normalizedAuditResult.ok) {
        return auditWriteFailed(plan);
      }
    } catch (error) {
      return auditWriteFailed(plan);
    }

    return appliedResult(plan, true);
  }

  return {
    kind: ENGINEER_MOBILE_VISIT_ACTION_APPLICATION_SERVICE_KIND,
    handleEngineerMobileVisitAction,
  };
}

module.exports = {
  createEngineerMobileVisitActionApplicationService,
  ENGINEER_MOBILE_VISIT_ACTION_APPLICATION_SERVICE_KIND,
};
