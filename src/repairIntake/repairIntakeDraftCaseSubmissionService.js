'use strict';

const {
  normalizeRepairIntakeDraftCaseSubmissionResult,
} = require('./repairIntakeDraftCaseSubmissionResultNormalizer');
const {
  validateRepairIntakeDraftCaseSubmissionCommand,
} = require('./repairIntakeDraftCaseSubmissionCommandGuard');
const {
  normalizeRepairIntakeDraftCaseCreatorInput,
} = require('./repairIntakeDraftCaseCreatorInputNormalizer');
const {
  buildRepairIntakeDraftCaseSubmissionAuditEvent,
} = require('./repairIntakeDraftCaseSubmissionAuditEventBuilder');
const {
  normalizeRepairIntakeDraftCaseSubmissionIdempotencyResult,
} = require('./repairIntakeDraftCaseSubmissionIdempotencyResultNormalizer');
const {
  ACTION,
  normalizeRepairIntakeDraftCaseSubmissionEnvelope,
} = require('./repairIntakeDraftCaseSubmissionEnvelopeNormalizer');

const AUDIT_ATTACHMENT_REVIEW_ACTION = 'REVIEW_AUDIT_EVENT_ATTACHMENT';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function safeArray(value, fallback = []) {
  return Array.isArray(value) ? value.slice() : fallback.slice();
}

function sanitizedInput(input) {
  return {
    draftId: stringValue(input.draftId),
    organizationId: stringValue(input.organizationId),
    actorId: stringValue(input.actorId),
    requestId: stringValue(input.requestId),
    idempotencyKey: stringValue(input.idempotencyKey),
  };
}

function envelope({
  ok = false,
  draftId = null,
  organizationId = null,
  submitted = false,
  caseCreationAllowed = false,
  candidateReady = false,
  reasonCode,
  requiredActions = [],
  caseRef = null,
  auditEvent = null,
}) {
  return normalizeRepairIntakeDraftCaseSubmissionEnvelope({
    ok,
    draftId,
    organizationId,
    submitted,
    caseCreationAllowed,
    candidateReady,
    reasonCode,
    requiredActions,
    caseRef,
    auditEvent,
  });
}

function withAuditAttachment(baseEnvelope, auditEventBuilder, auditInput, { auditRequiredAction = false } = {}) {
  try {
    const auditResult = auditEventBuilder(auditInput);

    if (isObject(auditResult) && auditResult.ok === true && isObject(auditResult.auditEvent)) {
      return {
        ...baseEnvelope,
        auditEvent: auditResult.auditEvent,
      };
    }
  } catch (error) {
    // Audit candidate attachment must never change submission control flow.
  }

  if (!auditRequiredAction) {
    return {
      ...baseEnvelope,
      auditEvent: null,
    };
  }

  const requiredActions = safeArray(baseEnvelope.requiredActions);

  if (!requiredActions.includes(AUDIT_ATTACHMENT_REVIEW_ACTION)) {
    requiredActions.push(AUDIT_ATTACHMENT_REVIEW_ACTION);
  }

  return {
    ...baseEnvelope,
    requiredActions,
    auditEvent: null,
  };
}

function resolvePlanner(planner) {
  if (typeof planner === 'function') {
    return planner;
  }

  if (isObject(planner) && typeof planner.planDraftToCase === 'function') {
    return planner.planDraftToCase.bind(planner);
  }

  return undefined;
}

function resolveCaseCreator(caseCreator) {
  if (typeof caseCreator === 'function') {
    return caseCreator;
  }

  if (isObject(caseCreator) && typeof caseCreator.createCaseFromCandidate === 'function') {
    return caseCreator.createCaseFromCandidate.bind(caseCreator);
  }

  if (isObject(caseCreator) && typeof caseCreator.create === 'function') {
    return caseCreator.create.bind(caseCreator);
  }

  return undefined;
}

function resolveIdempotencyChecker(idempotencyChecker) {
  if (typeof idempotencyChecker === 'function') {
    return idempotencyChecker;
  }

  if (isObject(idempotencyChecker) && typeof idempotencyChecker.checkDraftToCaseSubmission === 'function') {
    return idempotencyChecker.checkDraftToCaseSubmission.bind(idempotencyChecker);
  }

  if (isObject(idempotencyChecker) && typeof idempotencyChecker.check === 'function') {
    return idempotencyChecker.check.bind(idempotencyChecker);
  }

  return undefined;
}

function createRepairIntakeDraftCaseSubmissionService(options = {}) {
  const planDraftToCase = resolvePlanner(isObject(options) ? options.planner : undefined);
  const createCase = resolveCaseCreator(isObject(options) ? options.caseCreator : undefined);
  const checkIdempotency = resolveIdempotencyChecker(isObject(options) ? options.idempotencyChecker : undefined);
  const commandGuard = isObject(options) && typeof options.commandGuard === 'function'
    ? options.commandGuard
    : validateRepairIntakeDraftCaseSubmissionCommand;
  const auditEventBuilder = isObject(options) && typeof options.auditEventBuilder === 'function'
    ? options.auditEventBuilder
    : buildRepairIntakeDraftCaseSubmissionAuditEvent;
  const idempotencyResultNormalizer = isObject(options) && typeof options.idempotencyResultNormalizer === 'function'
    ? options.idempotencyResultNormalizer
    : normalizeRepairIntakeDraftCaseSubmissionIdempotencyResult;

  async function submitDraftToCase(input = {}) {
    const guardResult = commandGuard(isObject(input) ? input : {});
    const safeInput = sanitizedInput(isObject(guardResult && guardResult.sanitizedCommand)
      ? guardResult.sanitizedCommand
      : isObject(input) ? input : {});

    if (!isObject(guardResult) || guardResult.ok !== true) {
      return envelope({
        draftId: safeInput.draftId || null,
        organizationId: safeInput.organizationId || null,
        reasonCode: stringValue(guardResult && guardResult.reasonCode) || 'SUBMISSION_COMMAND_BLOCKED',
        requiredActions: safeArray(guardResult && guardResult.requiredActions, ['resolve_submission_command']),
        auditEvent: null,
      });
    }

    if (!checkIdempotency) {
      return withAuditAttachment(envelope({
        draftId: safeInput.draftId || null,
        organizationId: safeInput.organizationId || null,
        reasonCode: 'IDEMPOTENCY_CHECKER_NOT_CONFIGURED',
        requiredActions: ['configure_idempotency_checker'],
      }), auditEventBuilder, {
        sanitizedCommand: safeInput,
        submissionResult: {
          reasonCode: 'IDEMPOTENCY_CHECKER_NOT_CONFIGURED',
          requiredActions: ['configure_idempotency_checker'],
        },
        outcome: 'blocked',
      });
    }

    let idempotencyCheck;

    try {
      idempotencyCheck = await checkIdempotency(safeInput);
    } catch (error) {
      return withAuditAttachment(envelope({
        draftId: safeInput.draftId || null,
        organizationId: safeInput.organizationId || null,
        reasonCode: 'IDEMPOTENCY_CHECK_FAILED',
        requiredActions: ['retry_or_manual_review'],
      }), auditEventBuilder, {
        sanitizedCommand: safeInput,
        submissionResult: {
          reasonCode: 'IDEMPOTENCY_CHECK_FAILED',
          requiredActions: ['retry_or_manual_review'],
        },
        outcome: 'blocked',
      });
    }

    let idempotencyResult;

    try {
      idempotencyResult = idempotencyResultNormalizer({
        sanitizedCommand: safeInput,
        checkerResult: idempotencyCheck,
      });
    } catch (error) {
      idempotencyResult = {
        ok: false,
        decision: 'failed',
        reasonCode: 'IDEMPOTENCY_RESULT_NORMALIZATION_FAILED',
        requiredActions: ['retry_or_manual_review'],
        caseRef: null,
      };
    }

    if (!isObject(idempotencyResult) || idempotencyResult.ok !== true) {
      const reasonCode = stringValue(idempotencyResult && idempotencyResult.reasonCode) || 'IDEMPOTENCY_CHECK_FAILED';
      const requiredActions = safeArray(idempotencyResult && idempotencyResult.requiredActions, ['retry_or_manual_review']);
      const caseRef = isObject(idempotencyResult && idempotencyResult.caseRef) ? idempotencyResult.caseRef : null;

      return withAuditAttachment(envelope({
        draftId: safeInput.draftId || null,
        organizationId: safeInput.organizationId || null,
        reasonCode,
        requiredActions,
        caseRef,
      }), auditEventBuilder, {
        sanitizedCommand: safeInput,
        submissionResult: {
          reasonCode,
          requiredActions,
          caseRef,
        },
        outcome: 'blocked',
      });
    }

    if (!planDraftToCase) {
      return withAuditAttachment(envelope({
        draftId: safeInput.draftId || null,
        organizationId: safeInput.organizationId || null,
        reasonCode: 'PLANNER_NOT_CONFIGURED',
        requiredActions: ['configure_planner'],
      }), auditEventBuilder, {
        sanitizedCommand: safeInput,
        planResult: {
          reasonCode: 'PLANNER_NOT_CONFIGURED',
          requiredActions: ['configure_planner'],
        },
        outcome: 'blocked',
      });
    }

    let plan;

    try {
      plan = await planDraftToCase(safeInput);
    } catch (error) {
      return withAuditAttachment(envelope({
        draftId: safeInput.draftId || null,
        organizationId: safeInput.organizationId || null,
        reasonCode: 'PLANNER_FAILED',
        requiredActions: ['retry_or_manual_review'],
      }), auditEventBuilder, {
        sanitizedCommand: safeInput,
        submissionResult: {
          reasonCode: 'PLANNER_FAILED',
          requiredActions: ['retry_or_manual_review'],
        },
        outcome: 'failed',
      });
    }

    const draftId = stringValue(plan && plan.draftId) || safeInput.draftId || null;
    const organizationId = stringValue(plan && plan.organizationId) || safeInput.organizationId || null;
    const caseCreationAllowed = Boolean(plan && plan.caseCreationAllowed === true);
    const candidateReady = Boolean(plan && plan.candidateReady === true);
    const normalizedCreatorInput = normalizeRepairIntakeDraftCaseCreatorInput({
      sanitizedCommand: safeInput,
      planResult: plan,
    });

    if (!normalizedCreatorInput.ok) {
      return withAuditAttachment(envelope({
        draftId,
        organizationId,
        caseCreationAllowed,
        candidateReady,
        reasonCode: normalizedCreatorInput.reasonCode,
        requiredActions: normalizedCreatorInput.requiredActions,
      }), auditEventBuilder, {
        sanitizedCommand: safeInput,
        planResult: {
          ...plan,
          reasonCode: normalizedCreatorInput.reasonCode,
          requiredActions: normalizedCreatorInput.requiredActions,
        },
        outcome: 'blocked',
      });
    }

    if (!createCase) {
      return withAuditAttachment(envelope({
        draftId,
        organizationId,
        caseCreationAllowed,
        candidateReady,
        reasonCode: 'CASE_CREATOR_NOT_CONFIGURED',
        requiredActions: ['configure_case_creator'],
      }), auditEventBuilder, {
        sanitizedCommand: safeInput,
        planResult: {
          ...plan,
          reasonCode: 'CASE_CREATOR_NOT_CONFIGURED',
          requiredActions: ['configure_case_creator'],
        },
        creatorInput: normalizedCreatorInput.creatorInput,
        outcome: 'blocked',
      });
    }

    let created;

    try {
      created = await createCase(normalizedCreatorInput.creatorInput);
    } catch (error) {
      return withAuditAttachment(envelope({
        draftId,
        organizationId,
        caseCreationAllowed,
        candidateReady,
        reasonCode: 'CASE_CREATOR_FAILED',
        requiredActions: ['retry_or_manual_review'],
      }), auditEventBuilder, {
        sanitizedCommand: safeInput,
        planResult: plan,
        creatorInput: normalizedCreatorInput.creatorInput,
        submissionResult: {
          reasonCode: 'CASE_CREATOR_FAILED',
          requiredActions: ['retry_or_manual_review'],
        },
        outcome: 'failed',
      });
    }

    const normalizedResult = normalizeRepairIntakeDraftCaseSubmissionResult({
      draftId,
      organizationId,
      sourceDraftId: normalizedCreatorInput.creatorInput.caseCandidate.sourceDraftId,
      creatorResult: created,
    });

    if (!normalizedResult.ok) {
      return withAuditAttachment(envelope({
        draftId,
        organizationId,
        caseCreationAllowed,
        candidateReady,
        reasonCode: normalizedResult.reasonCode,
        requiredActions: normalizedResult.requiredActions,
      }), auditEventBuilder, {
        sanitizedCommand: safeInput,
        planResult: plan,
        creatorInput: normalizedCreatorInput.creatorInput,
        submissionResult: normalizedResult,
        outcome: 'failed',
      });
    }

    return withAuditAttachment(envelope({
      ok: true,
      draftId,
      organizationId,
      submitted: true,
      caseCreationAllowed,
      candidateReady,
      reasonCode: 'CASE_SUBMITTED',
      requiredActions: [],
      caseRef: normalizedResult.caseRef,
    }), auditEventBuilder, {
      sanitizedCommand: safeInput,
      planResult: plan,
      creatorInput: normalizedCreatorInput.creatorInput,
      submissionResult: normalizedResult,
      outcome: 'submitted',
    }, {
      auditRequiredAction: true,
    });
  }

  return {
    submitDraftToCase,
  };
}

module.exports = {
  ACTION,
  AUDIT_ATTACHMENT_REVIEW_ACTION,
  createRepairIntakeDraftCaseSubmissionService,
};
