'use strict';

const RESULT_STATUSES = Object.freeze({
  DENIED: 'denied',
  FAILED: 'failed',
  READY: 'result_ready',
  RECORDED: 'recorded',
});

const WRITER_STATUSES = Object.freeze({
  FAILED: 'failed',
  RECORDED: 'recorded',
  SKIPPED: 'skipped',
});

const TERMINAL_STATES = Object.freeze({
  PENDING_PARTS: 'pending_parts',
  QUOTE_REQUIRED: 'quote_required',
  CUSTOMER_NOT_HOME: 'customer_not_home',
  UNABLE_TO_COMPLETE: 'unable_to_complete',
  FOLLOW_UP_REQUIRED: 'follow_up_required',
});

const REASON_TO_TERMINAL_STATE = Object.freeze({
  customer_not_home: TERMINAL_STATES.CUSTOMER_NOT_HOME,
  missing_parts: TERMINAL_STATES.PENDING_PARTS,
  parts_unavailable: TERMINAL_STATES.PENDING_PARTS,
  pending_parts: TERMINAL_STATES.PENDING_PARTS,
  product_condition_mismatch: TERMINAL_STATES.UNABLE_TO_COMPLETE,
  product_mismatch: TERMINAL_STATES.UNABLE_TO_COMPLETE,
  quote_required: TERMINAL_STATES.QUOTE_REQUIRED,
  second_person_required: TERMINAL_STATES.FOLLOW_UP_REQUIRED,
  site_condition_mismatch: TERMINAL_STATES.UNABLE_TO_COMPLETE,
  unable_to_complete: TERMINAL_STATES.UNABLE_TO_COMPLETE,
  follow_up_required: TERMINAL_STATES.FOLLOW_UP_REQUIRED,
});

const SUPERVISOR_ROLES = new Set(['admin', 'supervisor']);
const RESULT_PERMISSIONS = new Set([
  'appointment.result.record',
  'appointment.result.override',
  'data_correction.apply',
]);

const EVIDENCE_REF_KEYS = new Set([
  'attachmentId',
  'capturedAt',
  'evidenceId',
  'fileType',
  'type',
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function hasPermission(actor) {
  if (!isPlainObject(actor) || !Array.isArray(actor.permissions)) {
    return false;
  }

  return actor.permissions.some((permission) => RESULT_PERMISSIONS.has(permission));
}

function organizationsMatch(request) {
  const organizationId = request.organizationId;
  const caseOrganizationId = request.caseContext && request.caseContext.organizationId;
  const appointmentOrganizationId = request.appointmentContext && request.appointmentContext.organizationId;

  return Boolean(
    organizationId
    && caseOrganizationId
    && organizationId === caseOrganizationId
    && (!appointmentOrganizationId || appointmentOrganizationId === organizationId)
  );
}

function isAssignedEngineer(actor, appointmentContext) {
  return normalize(actor.role) === 'engineer'
    && safeString(actor.userId)
    && safeString(appointmentContext.assignedEngineerId)
    && actor.userId === appointmentContext.assignedEngineerId;
}

function isSupervisorOrAdmin(actor) {
  return SUPERVISOR_ROLES.has(normalize(actor.role));
}

function isArrivedContext(appointmentContext) {
  return Boolean(
    appointmentContext.arrived
    || appointmentContext.inField
    || normalize(appointmentContext.status) === 'arrived'
    || normalize(appointmentContext.appointmentStatus) === 'arrived'
  );
}

function looksSensitiveString(value) {
  const trimmed = safeString(value);

  if (!trimmed) {
    return false;
  }

  const lowered = trimmed.toLowerCase();

  if (/token|secret|password|line_user|line user|lineuserid|raw_phone|raw_address|internal_note|ai_raw|final_appointment/.test(lowered)) {
    return true;
  }

  if ((trimmed.match(/\d/g) || []).length >= 8) {
    return true;
  }

  if (/[縣市區鄉鎮路街巷弄號樓]/.test(trimmed) && /\d/.test(trimmed)) {
    return true;
  }

  return trimmed.length > 500;
}

function sanitizeNote(value) {
  const trimmed = safeString(value);

  if (!trimmed || looksSensitiveString(trimmed)) {
    return undefined;
  }

  return trimmed;
}

function isSafeRefString(value) {
  const trimmed = safeString(value);

  return Boolean(trimmed) && /^[A-Za-z0-9_-]+$/.test(trimmed) && !looksSensitiveString(trimmed);
}

function sanitizeEvidenceRef(ref) {
  if (isSafeRefString(ref)) {
    return safeString(ref);
  }

  if (!isPlainObject(ref)) {
    return undefined;
  }

  const sanitized = {};

  for (const key of EVIDENCE_REF_KEYS) {
    const value = safeString(ref[key]);

    if (value && (key === 'capturedAt' || !looksSensitiveString(value))) {
      sanitized[key] = value;
    }
  }

  return Object.keys(sanitized).length ? sanitized : undefined;
}

function sanitizeEvidenceRefs(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(sanitizeEvidenceRef)
    .filter(Boolean)
    .slice(0, 10);
}

function callInjectedWriter(writer, payload) {
  if (!writer) {
    return {
      status: WRITER_STATUSES.SKIPPED,
    };
  }

  const write = typeof writer === 'function'
    ? writer
    : (isPlainObject(writer) && typeof writer.write === 'function' ? writer.write.bind(writer) : null);

  if (!write) {
    return {
      status: WRITER_STATUSES.SKIPPED,
    };
  }

  try {
    const result = write(payload);

    if (
      isPlainObject(result)
      && (result.ok === false || result.persisted === false || result.recorded === false)
    ) {
      return {
        status: WRITER_STATUSES.FAILED,
        reasonCode: 'WRITER_FAILED',
        safeMessageKey: 'appointmentResult.writerFailed',
      };
    }

    return {
      status: WRITER_STATUSES.RECORDED,
    };
  } catch (error) {
    return {
      status: WRITER_STATUSES.FAILED,
      reasonCode: 'WRITER_FAILED',
      safeMessageKey: 'appointmentResult.writerFailed',
    };
  }
}

function isPromiseLike(value) {
  return Boolean(value) && typeof value.then === 'function';
}

function mapWriterResult(result) {
  if (
    isPlainObject(result)
    && (result.ok === false || result.persisted === false || result.recorded === false)
  ) {
    return {
      status: WRITER_STATUSES.FAILED,
      reasonCode: 'WRITER_FAILED',
      safeMessageKey: 'appointmentResult.writerFailed',
    };
  }

  return {
    status: WRITER_STATUSES.RECORDED,
  };
}

async function callInjectedWriterAsync(writer, payload) {
  if (!writer) {
    return {
      status: WRITER_STATUSES.SKIPPED,
    };
  }

  const write = typeof writer === 'function'
    ? writer
    : (isPlainObject(writer) && typeof writer.write === 'function' ? writer.write.bind(writer) : null);

  if (!write) {
    return {
      status: WRITER_STATUSES.SKIPPED,
    };
  }

  try {
    const result = write(payload);
    return mapWriterResult(isPromiseLike(result) ? await result : result);
  } catch (error) {
    return {
      status: WRITER_STATUSES.FAILED,
      reasonCode: 'WRITER_FAILED',
      safeMessageKey: 'appointmentResult.writerFailed',
    };
  }
}

function hasWriterFailure(writerResults) {
  return Object.values(writerResults).some((result) => (
    result && result.status === WRITER_STATUSES.FAILED
  ));
}

function hasRecordedWriter(writerResults) {
  return Object.values(writerResults).some((result) => (
    result && result.status === WRITER_STATUSES.RECORDED
  ));
}

function deny(reasonCode, overrides = {}) {
  return {
    status: RESULT_STATUSES.DENIED,
    allowed: false,
    reasonCode,
    appointmentResultReady: false,
    appointmentResultRecorded: false,
    fieldServiceReportCreated: false,
    followUpAppointmentCreated: false,
    followUpRecommended: false,
    safeMessageKey: 'appointmentResult.unavailable',
    writerResults: {},
    ...overrides,
  };
}

function resolveTerminalState(result) {
  const reasonCode = normalize(result.reasonCode);
  const terminalState = normalize(result.terminalState);
  const mappedState = REASON_TO_TERMINAL_STATE[reasonCode];

  if (!reasonCode || !mappedState) {
    return {
      ok: false,
      reasonCode,
      terminalState,
      failureReason: 'INVALID_REASON_CODE',
    };
  }

  if (terminalState && terminalState !== mappedState) {
    return {
      ok: false,
      reasonCode,
      terminalState,
      failureReason: 'TERMINAL_STATE_REASON_MISMATCH',
    };
  }

  if (!Object.values(TERMINAL_STATES).includes(mappedState)) {
    return {
      ok: false,
      reasonCode,
      terminalState,
      failureReason: 'INVALID_TERMINAL_STATE',
    };
  }

  return {
    ok: true,
    reasonCode,
    terminalState: mappedState,
  };
}

function buildAppointmentResultPayload(input, resolved) {
  const request = isPlainObject(input) ? input : {};
  const actor = isPlainObject(request.actor) ? request.actor : {};
  const caseContext = isPlainObject(request.caseContext) ? request.caseContext : {};
  const appointmentContext = isPlainObject(request.appointmentContext)
    ? request.appointmentContext
    : {};
  const result = isPlainObject(request.result) ? request.result : {};
  const safeNote = sanitizeNote(result.note || result.safeNote);
  const evidenceRefs = sanitizeEvidenceRefs(result.evidenceRefs);
  const payload = {
    organizationId: safeString(request.organizationId),
    caseId: safeString(caseContext.caseId),
    appointmentId: safeString(appointmentContext.appointmentId),
    actor: {
      userId: safeString(actor.userId),
      role: safeString(actor.role),
    },
    terminalState: resolved.terminalState,
    reasonCode: resolved.reasonCode,
    evidenceRefs,
  };

  if (safeNote) {
    payload.safeNote = safeNote;
  }

  return payload;
}

function buildEvidencePayload(resultPayload) {
  return {
    organizationId: resultPayload.organizationId,
    caseId: resultPayload.caseId,
    appointmentId: resultPayload.appointmentId,
    actor: resultPayload.actor,
    terminalState: resultPayload.terminalState,
    reasonCode: resultPayload.reasonCode,
    evidenceRefs: resultPayload.evidenceRefs,
  };
}

function recordUnableToCompleteAppointmentResult(input, options = {}) {
  const request = isPlainObject(input) ? input : {};
  const actor = isPlainObject(request.actor) ? request.actor : {};
  const appointmentContext = isPlainObject(request.appointmentContext)
    ? request.appointmentContext
    : {};
  const result = isPlainObject(request.result) ? request.result : {};

  if (!request.organizationId || !request.caseContext || !request.caseContext.caseId || !appointmentContext.appointmentId) {
    return deny('MISSING_CONTEXT');
  }

  if (!organizationsMatch(request)) {
    return deny('ORGANIZATION_SCOPE_MISMATCH');
  }

  if (!isPlainObject(actor) || !actor.userId || !actor.role) {
    return deny('MISSING_ACTOR');
  }

  if (!isAssignedEngineer(actor, appointmentContext) && !(isSupervisorOrAdmin(actor) && hasPermission(actor))) {
    return deny('ACTOR_NOT_ALLOWED');
  }

  if (!isArrivedContext(appointmentContext)) {
    return deny('APPOINTMENT_NOT_ARRIVED', {
      status: RESULT_STATUSES.DENIED,
      safeMessageKey: 'appointmentResult.arrivalRequired',
    });
  }

  const resolved = resolveTerminalState(result);

  if (!resolved.ok) {
    return deny(resolved.failureReason, {
      safeMessageKey: 'appointmentResult.invalidTerminalResult',
    });
  }

  const resultPayload = buildAppointmentResultPayload(input, resolved);
  const evidencePayload = buildEvidencePayload(resultPayload);
  const writerResults = {
    appointmentResult: callInjectedWriter(options.appointmentResultWriter, resultPayload),
    evidence: resultPayload.evidenceRefs.length
      ? callInjectedWriter(options.evidenceWriter, evidencePayload)
      : { status: WRITER_STATUSES.SKIPPED },
    audit: callInjectedWriter(options.auditWriter, resultPayload),
  };
  const failed = hasWriterFailure(writerResults);
  const recorded = hasRecordedWriter(writerResults);

  return {
    status: failed
      ? RESULT_STATUSES.FAILED
      : (recorded ? RESULT_STATUSES.RECORDED : RESULT_STATUSES.READY),
    allowed: !failed,
    reasonCode: resolved.reasonCode,
    terminalState: resolved.terminalState,
    appointmentResultReady: true,
    appointmentResultRecorded: writerResults.appointmentResult.status === WRITER_STATUSES.RECORDED,
    fieldServiceReportCreated: false,
    followUpAppointmentCreated: false,
    followUpRecommended: true,
    safeMessageKey: failed
      ? 'appointmentResult.writerFailed'
      : 'appointmentResult.recordingReady',
    writerResults,
  };
}

async function recordUnableToCompleteAppointmentResultAsync(input, options = {}) {
  const request = isPlainObject(input) ? input : {};
  const actor = isPlainObject(request.actor) ? request.actor : {};
  const appointmentContext = isPlainObject(request.appointmentContext)
    ? request.appointmentContext
    : {};
  const result = isPlainObject(request.result) ? request.result : {};

  if (!request.organizationId || !request.caseContext || !request.caseContext.caseId || !appointmentContext.appointmentId) {
    return deny('MISSING_CONTEXT');
  }

  if (!organizationsMatch(request)) {
    return deny('ORGANIZATION_SCOPE_MISMATCH');
  }

  if (!isPlainObject(actor) || !actor.userId || !actor.role) {
    return deny('MISSING_ACTOR');
  }

  if (!isAssignedEngineer(actor, appointmentContext) && !(isSupervisorOrAdmin(actor) && hasPermission(actor))) {
    return deny('ACTOR_NOT_ALLOWED');
  }

  if (!isArrivedContext(appointmentContext)) {
    return deny('APPOINTMENT_NOT_ARRIVED', {
      status: RESULT_STATUSES.DENIED,
      safeMessageKey: 'appointmentResult.arrivalRequired',
    });
  }

  const resolved = resolveTerminalState(result);

  if (!resolved.ok) {
    return deny(resolved.failureReason, {
      safeMessageKey: 'appointmentResult.invalidTerminalResult',
    });
  }

  const resultPayload = buildAppointmentResultPayload(input, resolved);
  const evidencePayload = buildEvidencePayload(resultPayload);
  const writerResults = {
    appointmentResult: await callInjectedWriterAsync(options.appointmentResultWriter, resultPayload),
    evidence: resultPayload.evidenceRefs.length
      ? await callInjectedWriterAsync(options.evidenceWriter, evidencePayload)
      : { status: WRITER_STATUSES.SKIPPED },
    audit: await callInjectedWriterAsync(options.auditWriter, resultPayload),
  };
  const failed = hasWriterFailure(writerResults);
  const recorded = hasRecordedWriter(writerResults);

  return {
    status: failed
      ? RESULT_STATUSES.FAILED
      : (recorded ? RESULT_STATUSES.RECORDED : RESULT_STATUSES.READY),
    allowed: !failed,
    reasonCode: resolved.reasonCode,
    terminalState: resolved.terminalState,
    appointmentResultReady: true,
    appointmentResultRecorded: writerResults.appointmentResult.status === WRITER_STATUSES.RECORDED,
    fieldServiceReportCreated: false,
    followUpAppointmentCreated: false,
    followUpRecommended: true,
    safeMessageKey: failed
      ? 'appointmentResult.writerFailed'
      : 'appointmentResult.recordingReady',
    writerResults,
  };
}

module.exports = {
  REASON_TO_TERMINAL_STATE,
  RESULT_STATUSES,
  TERMINAL_STATES,
  WRITER_STATUSES,
  recordUnableToCompleteAppointmentResult,
  recordUnableToCompleteAppointmentResultAsync,
};
