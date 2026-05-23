'use strict';

const DECISION_AUDIT_WRITER_RESULT_STATUSES = Object.freeze({
  FAILED: 'failed',
  RECORDED: 'recorded',
  SKIPPED: 'skipped',
});

const DECISION_AUDIT_WRITER_FAILURE_RESULT = Object.freeze({
  status: DECISION_AUDIT_WRITER_RESULT_STATUSES.FAILED,
  reasonCode: 'DECISION_AUDIT_WRITER_FAILED',
  safeMessageKey: 'dataCorrection.decisionAuditWriterFailed',
});

const DECISION_AUDIT_WRITER_RECORDED_RESULT = Object.freeze({
  status: DECISION_AUDIT_WRITER_RESULT_STATUSES.RECORDED,
});

const DECISION_AUDIT_WRITER_SKIPPED_RESULT = Object.freeze({
  status: DECISION_AUDIT_WRITER_RESULT_STATUSES.SKIPPED,
});

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeDecisionAuditWriterFailureResult() {
  return {
    ...DECISION_AUDIT_WRITER_FAILURE_RESULT,
  };
}

function normalizeDecisionAuditWriterRecordedResult() {
  return {
    ...DECISION_AUDIT_WRITER_RECORDED_RESULT,
  };
}

function normalizeDecisionAuditWriterSkippedResult() {
  return {
    ...DECISION_AUDIT_WRITER_SKIPPED_RESULT,
  };
}

function normalizeDecisionAuditWriterResult(result) {
  if (
    isPlainObject(result)
    && (
      result.ok === false
      || result.persisted === false
      || result.recorded === false
      || result.auditWritten === false
    )
  ) {
    return normalizeDecisionAuditWriterFailureResult();
  }

  return normalizeDecisionAuditWriterRecordedResult();
}

module.exports = {
  DECISION_AUDIT_WRITER_RESULT_STATUSES,
  normalizeDecisionAuditWriterFailureResult,
  normalizeDecisionAuditWriterRecordedResult,
  normalizeDecisionAuditWriterResult,
  normalizeDecisionAuditWriterSkippedResult,
};
