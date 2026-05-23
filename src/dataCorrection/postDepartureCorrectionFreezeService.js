'use strict';

const {
  processDataCorrectionRequest,
} = require('./dataCorrectionRequestService');
const {
  DATA_CORRECTION_DECISIONS,
} = require('./dataCorrectionPolicyEngine');

const FREEZE_STATUSES = Object.freeze({
  MANUAL_HANDLING_REQUIRED: 'manual_handling_required',
  MANUAL_HANDLING_RECORDED: 'manual_handling_recorded',
  NOT_APPLICABLE: 'not_applicable',
  FAILED: 'failed',
});

const WRITER_STATUSES = Object.freeze({
  RECORDED: 'recorded',
  SKIPPED: 'skipped',
  FAILED: 'failed',
});

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function manualHandlingType(appointmentContext) {
  if (appointmentContext && appointmentContext.routeStarted) {
    return 'route_started_manual_dispatch_contact_required';
  }

  if (appointmentContext && appointmentContext.engineerDeparted) {
    return 'engineer_departed_manual_dispatch_contact_required';
  }

  return 'post_departure_manual_dispatch_contact_required';
}

function buildSafeFreezePayload(input, decision) {
  const request = isPlainObject(input) ? input : {};
  const actor = isPlainObject(request.actor) ? request.actor : {};
  const caseContext = isPlainObject(request.caseContext) ? request.caseContext : {};
  const appointmentContext = isPlainObject(request.appointmentContext)
    ? request.appointmentContext
    : {};
  const correction = isPlainObject(request.correction) ? request.correction : {};
  const payload = {
    organizationId: safeString(request.organizationId),
    caseId: safeString(caseContext.caseId),
    appointmentId: safeString(appointmentContext.appointmentId),
    actor: {
      userId: safeString(actor.userId),
      role: safeString(actor.role),
    },
    correction: {
      fieldKey: safeString(correction.fieldKey),
      fieldGroup: safeString(correction.fieldGroup),
    },
    decision: decision.decision,
    reasonCode: decision.reasonCode,
    safeMessageKey: decision.safeMessageKey,
    manualHandlingType: manualHandlingType(appointmentContext),
  };
  const timestamp = safeString(request.timestamp || request.requestedAt || request.createdAt);

  if (timestamp) {
    payload.timestamp = timestamp;
  }

  return payload;
}

function buildSafeEngineerNotificationPayload(payload) {
  return {
    organizationId: payload.organizationId,
    caseId: payload.caseId,
    appointmentId: payload.appointmentId,
    actor: payload.actor,
    notificationIntentType: 'post_departure_correction_manual_reconfirm',
    manualHandlingType: payload.manualHandlingType,
    decision: payload.decision,
    reasonCode: payload.reasonCode,
    safeMessageKey: payload.safeMessageKey,
    timestamp: payload.timestamp,
  };
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
        safeMessageKey: 'dataCorrection.writerFailed',
      };
    }

    return {
      status: WRITER_STATUSES.RECORDED,
    };
  } catch (error) {
    return {
      status: WRITER_STATUSES.FAILED,
      reasonCode: 'WRITER_FAILED',
      safeMessageKey: 'dataCorrection.writerFailed',
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
      safeMessageKey: 'dataCorrection.writerFailed',
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
      safeMessageKey: 'dataCorrection.writerFailed',
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

function buildNotApplicableResponse(decision) {
  return {
    status: FREEZE_STATUSES.NOT_APPLICABLE,
    allowed: false,
    decision: decision.decision,
    reasonCode: decision.reasonCode,
    phoneReverificationRequired: Boolean(decision.phoneReverificationRequired),
    manualHandlingRequired: false,
    engineerEvidenceRequired: Boolean(decision.engineerEvidenceRequired),
    engineerNotificationQueued: false,
    safeMessageKey: decision.safeMessageKey,
    writerResults: {},
  };
}

function isPostDepartureFreezeDecision(decision) {
  return Boolean(
    decision
    && decision.decision === DATA_CORRECTION_DECISIONS.MANUAL_DISPATCH_CONTACT_REQUIRED
    && decision.manualHandlingRequired
    && !decision.phoneReverificationRequired
    && !decision.engineerEvidenceRequired
  );
}

function handlePostDepartureCorrectionFreeze(input, options = {}) {
  const decision = processDataCorrectionRequest(input);

  if (!isPostDepartureFreezeDecision(decision)) {
    return buildNotApplicableResponse(decision);
  }

  const payload = buildSafeFreezePayload(input, decision);
  const writerResults = {
    audit: callInjectedWriter(options.auditWriter, payload),
    contactLog: callInjectedWriter(options.contactLogWriter, payload),
    dispatchNote: callInjectedWriter(options.dispatchNoteWriter, payload),
  };

  if (options.engineerNotificationWriter) {
    writerResults.engineerNotification = callInjectedWriter(
      options.engineerNotificationWriter,
      buildSafeEngineerNotificationPayload(payload),
    );
  }

  return {
    status: hasWriterFailure(writerResults)
      ? FREEZE_STATUSES.FAILED
      : (hasRecordedWriter(writerResults)
        ? FREEZE_STATUSES.MANUAL_HANDLING_RECORDED
        : FREEZE_STATUSES.MANUAL_HANDLING_REQUIRED),
    allowed: false,
    decision: decision.decision,
    reasonCode: decision.reasonCode,
    phoneReverificationRequired: false,
    manualHandlingRequired: true,
    engineerEvidenceRequired: false,
    engineerNotificationQueued: Boolean(
      writerResults.engineerNotification
      && writerResults.engineerNotification.status === WRITER_STATUSES.RECORDED,
    ),
    safeMessageKey: hasWriterFailure(writerResults)
      ? 'dataCorrection.writerFailed'
      : 'dataCorrection.manualDispatchContactRequired',
    writerResults,
  };
}

async function handlePostDepartureCorrectionFreezeAsync(input, options = {}) {
  const decision = processDataCorrectionRequest(input);

  if (!isPostDepartureFreezeDecision(decision)) {
    return buildNotApplicableResponse(decision);
  }

  const payload = buildSafeFreezePayload(input, decision);
  const writerResults = {
    audit: await callInjectedWriterAsync(options.auditWriter, payload),
    contactLog: await callInjectedWriterAsync(options.contactLogWriter, payload),
    dispatchNote: await callInjectedWriterAsync(options.dispatchNoteWriter, payload),
  };

  if (options.engineerNotificationWriter) {
    writerResults.engineerNotification = await callInjectedWriterAsync(
      options.engineerNotificationWriter,
      buildSafeEngineerNotificationPayload(payload),
    );
  }

  return {
    status: hasWriterFailure(writerResults)
      ? FREEZE_STATUSES.FAILED
      : (hasRecordedWriter(writerResults)
        ? FREEZE_STATUSES.MANUAL_HANDLING_RECORDED
        : FREEZE_STATUSES.MANUAL_HANDLING_REQUIRED),
    allowed: false,
    decision: decision.decision,
    reasonCode: decision.reasonCode,
    phoneReverificationRequired: false,
    manualHandlingRequired: true,
    engineerEvidenceRequired: false,
    engineerNotificationQueued: Boolean(
      writerResults.engineerNotification
      && writerResults.engineerNotification.status === WRITER_STATUSES.RECORDED,
    ),
    safeMessageKey: hasWriterFailure(writerResults)
      ? 'dataCorrection.writerFailed'
      : 'dataCorrection.manualDispatchContactRequired',
    writerResults,
  };
}

module.exports = {
  FREEZE_STATUSES,
  WRITER_STATUSES,
  handlePostDepartureCorrectionFreeze,
  handlePostDepartureCorrectionFreezeAsync,
};
