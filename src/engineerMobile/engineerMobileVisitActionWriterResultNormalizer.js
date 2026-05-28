'use strict';

const ENGINEER_MOBILE_VISIT_ACTION_WRITER_RESULT_NORMALIZER_KIND = 'engineer_mobile.visit_action_writer_result_normalizer';

const WRITER_KINDS = new Set(['transition', 'audit']);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeWriterKind(writerKind) {
  if (typeof writerKind !== 'string') {
    return 'unknown';
  }

  const normalized = writerKind.trim().toLowerCase();
  return WRITER_KINDS.has(normalized) ? normalized : 'unknown';
}

function success(reasonCode, writerKind) {
  return {
    ok: true,
    writerKind,
    normalizerKind: ENGINEER_MOBILE_VISIT_ACTION_WRITER_RESULT_NORMALIZER_KIND,
    reasonCode,
  };
}

function failure(reasonCode, writerKind) {
  return {
    ok: false,
    writerKind,
    normalizerKind: ENGINEER_MOBILE_VISIT_ACTION_WRITER_RESULT_NORMALIZER_KIND,
    reasonCode,
  };
}

function hasExplicitSuccess(result) {
  return result.ok === true
    || result.success === true
    || result.accepted === true
    || result.written === true
    || result.persisted === true
    || result.recorded === true;
}

function hasExplicitFailure(result) {
  return result.ok === false
    || result.success === false
    || result.accepted === false
    || result.written === false
    || result.persisted === false
    || result.recorded === false
    || result.error !== undefined;
}

function normalizeEngineerMobileVisitActionWriterResult({ writerKind, result } = {}) {
  const normalizedWriterKind = normalizeWriterKind(writerKind);

  if (normalizedWriterKind === 'unknown') {
    return failure('unknown_writer_kind', 'unknown');
  }

  if (result === undefined || result === null || result === true) {
    return success('writer_succeeded', normalizedWriterKind);
  }

  if (result === false) {
    return failure('writer_failed', normalizedWriterKind);
  }

  if (!isObject(result)) {
    return failure('writer_result_unrecognized', normalizedWriterKind);
  }

  if (hasExplicitFailure(result)) {
    return failure('writer_failed', normalizedWriterKind);
  }

  if (hasExplicitSuccess(result)) {
    return success('writer_succeeded', normalizedWriterKind);
  }

  return failure('writer_result_unrecognized', normalizedWriterKind);
}

module.exports = {
  normalizeEngineerMobileVisitActionWriterResult,
  ENGINEER_MOBILE_VISIT_ACTION_WRITER_RESULT_NORMALIZER_KIND,
};
