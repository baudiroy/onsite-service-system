'use strict';

const DENY_RESPONSE = {
  statusCode: 403,
  body: {
    status: 'deny',
    code: 'ENGINEER_MOBILE_WORKBENCH_COMPLETION_SUBMISSION_DENIED',
    message: 'Engineer mobile workbench completion submission is unavailable.'
  }
};

const MAX_SAFE_TEXT_LENGTH = 120;
const MAX_NOTE_LENGTH = 1000;
const MAX_REF_LIST_LENGTH = 20;

const ALLOWED_RESULT_STATUSES = new Set([
  'completed',
  'pending_parts',
  'quote_required',
  'customer_not_home',
  'unable_to_complete',
  'follow_up_required'
]);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeText(value, maxLength = MAX_SAFE_TEXT_LENGTH) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue || trimmedValue.length > maxLength) {
    return null;
  }

  return trimmedValue;
}

function sanitizeResultStatus(value) {
  const status = sanitizeText(value);
  return ALLOWED_RESULT_STATUSES.has(status) ? status : null;
}

function sanitizeRefList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!isObject(entry)) {
        return null;
      }

      const id = sanitizeText(entry.id);
      const type = sanitizeText(entry.type);

      if (!id || !type) {
        return null;
      }

      return {
        id,
        type,
        label: sanitizeText(entry.label)
      };
    })
    .filter(Boolean)
    .slice(0, MAX_REF_LIST_LENGTH);
}

function buildCompletionSubmissionInput(req = {}) {
  const auth = isObject(req.auth) ? req.auth : {};
  const body = isObject(req.body) ? req.body : {};
  const organizationId = sanitizeText(auth.organizationId);
  const engineerId = sanitizeText(auth.engineerId);
  const taskId = sanitizeText(req.params && (req.params.taskId || req.params.appointmentId));
  const resultStatus = sanitizeResultStatus(body.resultStatus);

  if (!organizationId || !engineerId || !taskId || !resultStatus) {
    return null;
  }

  return {
    organizationId,
    engineerId,
    userId: sanitizeText(auth.userId),
    taskId,
    resultStatus,
    clientRequestId: sanitizeText(body.clientRequestId),
    engineerNote: sanitizeText(body.engineerNote, MAX_NOTE_LENGTH),
    customerSignatureStatus: sanitizeText(body.customerSignatureStatus),
    signatureExceptionReason: sanitizeText(body.signatureExceptionReason),
    photoRefs: sanitizeRefList(body.photoRefs),
    partRefs: sanitizeRefList(body.partRefs),
    signatureRefs: sanitizeRefList(body.signatureRefs)
  };
}

function pickSubmissionProvider(options = {}) {
  if (!isObject(options)) {
    return null;
  }

  if (isObject(options.completionSubmissionProvider)) {
    return options.completionSubmissionProvider;
  }

  if (isObject(options.submissionProvider)) {
    return options.submissionProvider;
  }

  if (isObject(options.engineerMobileWorkbenchCompletionSubmission)) {
    return options.engineerMobileWorkbenchCompletionSubmission;
  }

  return null;
}

async function executeSubmission(provider, input) {
  if (!provider) {
    return null;
  }

  if (typeof provider.createCompletionSubmission === 'function') {
    return provider.createCompletionSubmission(input);
  }

  if (typeof provider.submitCompletion === 'function') {
    return provider.submitCompletion(input);
  }

  if (typeof provider.execute === 'function') {
    return provider.execute(input);
  }

  return null;
}

function sanitizeSubmissionResult(input, providerResult = {}) {
  const result = isObject(providerResult) ? providerResult : {};

  return {
    taskId: input.taskId,
    resultStatus: input.resultStatus,
    status: sanitizeText(result.status) || 'accepted',
    submissionId: sanitizeText(result.submissionId),
    receivedAt: sanitizeText(result.receivedAt),
    messageKey: sanitizeText(result.messageKey)
  };
}

async function buildEngineerMobileWorkbenchCompletionSubmissionResponseAsync(
  req = {},
  options = {}
) {
  const input = buildCompletionSubmissionInput(req);

  if (!input) {
    return DENY_RESPONSE;
  }

  try {
    const providerResult = await executeSubmission(pickSubmissionProvider(options), input);

    if (!providerResult) {
      return DENY_RESPONSE;
    }

    return {
      statusCode: 200,
      body: {
        status: 'allow',
        submission: sanitizeSubmissionResult(input, providerResult)
      }
    };
  } catch (error) {
    return DENY_RESPONSE;
  }
}

module.exports = {
  ALLOWED_RESULT_STATUSES,
  buildCompletionSubmissionInput,
  buildEngineerMobileWorkbenchCompletionSubmissionResponseAsync,
  sanitizeSubmissionResult
};
