'use strict';

const PROPOSAL_STATUSES = Object.freeze({
  DENIED: 'denied',
  FAILED: 'failed',
  READY: 'proposal_ready',
  RECORDED: 'proposal_recorded',
});

const WRITER_STATUSES = Object.freeze({
  FAILED: 'failed',
  RECORDED: 'recorded',
  SKIPPED: 'skipped',
});

const FOLLOW_UP_TERMINAL_STATES = Object.freeze({
  PENDING_PARTS: 'pending_parts',
  QUOTE_REQUIRED: 'quote_required',
  CUSTOMER_NOT_HOME: 'customer_not_home',
  UNABLE_TO_COMPLETE: 'unable_to_complete',
  FOLLOW_UP_REQUIRED: 'follow_up_required',
});

const FOLLOW_UP_PROPOSAL_TYPES = Object.freeze({
  FOLLOW_UP_APPOINTMENT: 'follow_up_appointment',
  SECOND_DISPATCH: 'second_dispatch',
  PARTS_RETURN_VISIT: 'parts_return_visit',
  QUOTE_REVISIT: 'quote_revisit',
  CUSTOMER_RESCHEDULE: 'customer_reschedule',
});

const FOLLOW_UP_REASON_CODES = new Set(Object.values(FOLLOW_UP_TERMINAL_STATES));
const FOLLOW_UP_PERMISSIONS = new Set([
  'appointment.follow_up.propose',
  'dispatch.follow_up.propose',
  'data_correction.apply',
]);
const FOLLOW_UP_ROLES = new Set([
  'admin',
  'customer_service',
  'dispatch_assistant',
  'supervisor',
]);
const PART_REF_KEYS = new Set([
  'partCode',
  'partId',
  'partName',
  'quantity',
  'source',
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

  return actor.permissions.some((permission) => FOLLOW_UP_PERMISSIONS.has(permission));
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

function sanitizePartRef(ref) {
  if (isSafeRefString(ref)) {
    return safeString(ref);
  }

  if (!isPlainObject(ref)) {
    return undefined;
  }

  const sanitized = {};

  for (const key of PART_REF_KEYS) {
    const value = ref[key];

    if (key === 'quantity' && typeof value === 'number' && Number.isFinite(value)) {
      sanitized.quantity = value;
      continue;
    }

    const safeValue = safeString(value);

    if (safeValue && !looksSensitiveString(safeValue)) {
      sanitized[key] = safeValue;
    }
  }

  return Object.keys(sanitized).length ? sanitized : undefined;
}

function sanitizeRequiredPartsRefs(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(sanitizePartRef)
    .filter(Boolean)
    .slice(0, 20);
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
        safeMessageKey: 'followUpProposal.writerFailed',
      };
    }

    return {
      status: WRITER_STATUSES.RECORDED,
    };
  } catch (error) {
    return {
      status: WRITER_STATUSES.FAILED,
      reasonCode: 'WRITER_FAILED',
      safeMessageKey: 'followUpProposal.writerFailed',
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
      safeMessageKey: 'followUpProposal.writerFailed',
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
      safeMessageKey: 'followUpProposal.writerFailed',
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
    status: PROPOSAL_STATUSES.DENIED,
    allowed: false,
    reasonCode,
    proposalReady: false,
    followUpDraftRecorded: false,
    formalAppointmentCreated: false,
    fieldServiceReportCreated: false,
    finalAppointmentIdChanged: false,
    safeMessageKey: 'followUpProposal.unavailable',
    writerResults: {},
    ...overrides,
  };
}

function validateProposal(request) {
  const actor = isPlainObject(request.actor) ? request.actor : {};
  const appointmentContext = isPlainObject(request.appointmentContext)
    ? request.appointmentContext
    : {};
  const proposal = isPlainObject(request.proposal) ? request.proposal : {};
  const role = normalize(actor.role);
  const terminalState = normalize(appointmentContext.terminalState || request.terminalState);
  const proposalType = normalize(proposal.proposalType);
  const reasonCode = normalize(proposal.reasonCode || terminalState);

  if (!request.organizationId || !request.caseContext || !request.caseContext.caseId || !appointmentContext.appointmentId) {
    return deny('MISSING_CONTEXT');
  }

  if (!organizationsMatch(request)) {
    return deny('ORGANIZATION_SCOPE_MISMATCH');
  }

  if (!isPlainObject(actor) || !actor.userId || !actor.role) {
    return deny('MISSING_ACTOR');
  }

  if (!FOLLOW_UP_ROLES.has(role)) {
    return deny('ACTOR_NOT_ALLOWED');
  }

  if (!hasPermission(actor)) {
    return deny('MISSING_PERMISSION');
  }

  if (!Object.values(FOLLOW_UP_TERMINAL_STATES).includes(terminalState)) {
    return deny('UNSUPPORTED_TERMINAL_STATE');
  }

  if (!Object.values(FOLLOW_UP_PROPOSAL_TYPES).includes(proposalType)) {
    return deny('INVALID_PROPOSAL_TYPE');
  }

  if (!FOLLOW_UP_REASON_CODES.has(reasonCode)) {
    return deny('INVALID_REASON_CODE');
  }

  return {
    ok: true,
    proposalType,
    reasonCode,
    terminalState,
  };
}

function buildProposalPayload(input, validated) {
  const request = isPlainObject(input) ? input : {};
  const actor = isPlainObject(request.actor) ? request.actor : {};
  const caseContext = isPlainObject(request.caseContext) ? request.caseContext : {};
  const appointmentContext = isPlainObject(request.appointmentContext)
    ? request.appointmentContext
    : {};
  const proposal = isPlainObject(request.proposal) ? request.proposal : {};
  const safeNote = sanitizeNote(proposal.note || proposal.safeNote);
  const requiredPartsSource = proposal.requiredPartsRefs === undefined
    ? proposal.requiredParts
    : proposal.requiredPartsRefs;
  const requiredPartsRefs = sanitizeRequiredPartsRefs(requiredPartsSource);
  const payload = {
    organizationId: safeString(request.organizationId),
    caseId: safeString(caseContext.caseId),
    sourceAppointmentId: safeString(appointmentContext.appointmentId),
    actor: {
      userId: safeString(actor.userId),
      role: safeString(actor.role),
    },
    terminalState: validated.terminalState,
    proposalType: validated.proposalType,
    reasonCode: validated.reasonCode,
    requiredPartsRefs,
  };

  if (safeNote) {
    payload.safeNote = safeNote;
  }

  return payload;
}

function proposeFollowUpAppointment(input, options = {}) {
  const request = isPlainObject(input) ? input : {};
  const validation = validateProposal(request);

  if (!validation.ok) {
    return validation;
  }

  const payload = buildProposalPayload(input, validation);
  const writerResults = {
    followUpDraft: callInjectedWriter(options.followUpDraftWriter, payload),
    dispatchNote: callInjectedWriter(options.dispatchNoteWriter, payload),
    audit: callInjectedWriter(options.auditWriter, payload),
  };
  const failed = hasWriterFailure(writerResults);
  const recorded = hasRecordedWriter(writerResults);

  return {
    status: failed
      ? PROPOSAL_STATUSES.FAILED
      : (recorded ? PROPOSAL_STATUSES.RECORDED : PROPOSAL_STATUSES.READY),
    allowed: !failed,
    proposalReady: true,
    proposalType: validation.proposalType,
    reasonCode: validation.reasonCode,
    terminalState: validation.terminalState,
    followUpDraftRecorded: writerResults.followUpDraft.status === WRITER_STATUSES.RECORDED,
    formalAppointmentCreated: false,
    fieldServiceReportCreated: false,
    finalAppointmentIdChanged: false,
    safeMessageKey: failed
      ? 'followUpProposal.writerFailed'
      : 'followUpProposal.ready',
    writerResults,
  };
}

async function proposeFollowUpAppointmentAsync(input, options = {}) {
  const request = isPlainObject(input) ? input : {};
  const validation = validateProposal(request);

  if (!validation.ok) {
    return validation;
  }

  const payload = buildProposalPayload(input, validation);
  const writerResults = {
    followUpDraft: await callInjectedWriterAsync(options.followUpDraftWriter, payload),
    dispatchNote: await callInjectedWriterAsync(options.dispatchNoteWriter, payload),
    audit: await callInjectedWriterAsync(options.auditWriter, payload),
  };
  const failed = hasWriterFailure(writerResults);
  const recorded = hasRecordedWriter(writerResults);

  return {
    status: failed
      ? PROPOSAL_STATUSES.FAILED
      : (recorded ? PROPOSAL_STATUSES.RECORDED : PROPOSAL_STATUSES.READY),
    allowed: !failed,
    proposalReady: true,
    proposalType: validation.proposalType,
    reasonCode: validation.reasonCode,
    terminalState: validation.terminalState,
    followUpDraftRecorded: writerResults.followUpDraft.status === WRITER_STATUSES.RECORDED,
    formalAppointmentCreated: false,
    fieldServiceReportCreated: false,
    finalAppointmentIdChanged: false,
    safeMessageKey: failed
      ? 'followUpProposal.writerFailed'
      : 'followUpProposal.ready',
    writerResults,
  };
}

module.exports = {
  FOLLOW_UP_PROPOSAL_TYPES,
  FOLLOW_UP_TERMINAL_STATES,
  PROPOSAL_STATUSES,
  WRITER_STATUSES,
  proposeFollowUpAppointment,
  proposeFollowUpAppointmentAsync,
};
