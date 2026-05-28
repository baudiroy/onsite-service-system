'use strict';

const {
  buildEngineerMobileVisitActionTransitionPatch,
} = require('./engineerMobileVisitActionTransitionPatchBuilder');

const ENGINEER_MOBILE_VISIT_ACTION_TRANSITION_WRITER_ADAPTER_KIND = 'engineer_mobile.visit_action_transition_writer_adapter';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function compactRecord(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
}

function copyPatch(patch) {
  if (!isObject(patch)) {
    return undefined;
  }

  return compactRecord({
    appointmentId: patch.appointmentId,
    caseId: patch.caseId,
    organizationId: patch.organizationId,
    mobileVisitStatus: patch.mobileVisitStatus,
    visitResult: patch.visitResult,
    updatedAt: patch.updatedAt,
    updatedBy: patch.updatedBy,
  });
}

function copyPatchEnvelope(patchEnvelope) {
  if (!isObject(patchEnvelope)) {
    return undefined;
  }

  return compactRecord({
    ok: patchEnvelope.ok === true,
    patchBuilt: patchEnvelope.patchBuilt === true,
    patchBuilderKind: patchEnvelope.patchBuilderKind,
    reasonCode: patchEnvelope.reasonCode,
    action: patchEnvelope.action,
    actorId: patchEnvelope.actorId,
    appointmentId: patchEnvelope.appointmentId,
    caseId: patchEnvelope.caseId,
    organizationId: patchEnvelope.organizationId,
    patch: copyPatch(patchEnvelope.patch),
  });
}

function failure(reasonCode, patchEnvelope) {
  return compactRecord({
    ok: false,
    written: false,
    adapterKind: ENGINEER_MOBILE_VISIT_ACTION_TRANSITION_WRITER_ADAPTER_KIND,
    reasonCode,
    patchEnvelope: copyPatchEnvelope(patchEnvelope),
  });
}

function success(patchEnvelope) {
  const safePatchEnvelope = copyPatchEnvelope(patchEnvelope);

  return compactRecord({
    ok: true,
    written: true,
    adapterKind: ENGINEER_MOBILE_VISIT_ACTION_TRANSITION_WRITER_ADAPTER_KIND,
    reasonCode: 'patch_written',
    action: safePatchEnvelope.action,
    actorId: safePatchEnvelope.actorId,
    appointmentId: safePatchEnvelope.appointmentId,
    caseId: safePatchEnvelope.caseId,
    organizationId: safePatchEnvelope.organizationId,
    patchEnvelope: safePatchEnvelope,
  });
}

function normalizePatchWriterResult(result) {
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
    || result.written === false
    || result.persisted === false
    || result.error !== undefined
  ) {
    return false;
  }

  return result.ok === true
    || result.accepted === true
    || result.written === true
    || result.persisted === true;
}

function createEngineerMobileVisitActionTransitionWriterAdapter(options = {}) {
  const source = isObject(options) ? options : {};
  const patchWriter = source.patchWriter;

  return {
    kind: ENGINEER_MOBILE_VISIT_ACTION_TRANSITION_WRITER_ADAPTER_KIND,

    write(transitionIntent) {
      if (!isObject(patchWriter) || typeof patchWriter.write !== 'function') {
        return failure('patch_writer_required');
      }

      const patchEnvelope = buildEngineerMobileVisitActionTransitionPatch({
        transitionIntent,
        now: source.now,
      });

      if (!isObject(patchEnvelope) || patchEnvelope.ok !== true) {
        return failure(patchEnvelope && patchEnvelope.reasonCode
          ? patchEnvelope.reasonCode
          : 'patch_write_failed', patchEnvelope);
      }

      const safePatchEnvelope = copyPatchEnvelope(patchEnvelope);

      try {
        const writerResult = patchWriter.write(copyPatchEnvelope(safePatchEnvelope));

        if (normalizePatchWriterResult(writerResult) !== true) {
          return failure('patch_write_failed', safePatchEnvelope);
        }
      } catch (error) {
        return failure('patch_write_failed', safePatchEnvelope);
      }

      return success(safePatchEnvelope);
    },
  };
}

module.exports = {
  createEngineerMobileVisitActionTransitionWriterAdapter,
  ENGINEER_MOBILE_VISIT_ACTION_TRANSITION_WRITER_ADAPTER_KIND,
};
