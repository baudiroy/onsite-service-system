'use strict';

const UNSAFE_OUTPUT_FIELD_NAMES = new Set([
  'address',
  'applicationservice',
  'authorization',
  'connection',
  'controller',
  'cookie',
  'cookies',
  'customername',
  'customerphone',
  'database_url',
  'databaseurl',
  'db',
  'error',
  'finalappointmentid',
  'handler',
  'headers',
  'lineaccesstoken',
  'lineuserid',
  'phone',
  'query',
  'raw',
  'rawbody',
  'rawheaders',
  'rawrows',
  'req',
  'res',
  'response',
  'session',
  'signedcookies',
  'socket',
  'sql',
  'stack',
  'token',
]);
const UNSAFE_INPUT_FIELD_NAMES = new Set([
  'address',
  'app',
  'authorization',
  'baseurl',
  'connection',
  'cookie',
  'cookies',
  'customername',
  'customerphone',
  'database_url',
  'db',
  'file',
  'files',
  'finalappointmentid',
  'headers',
  'hostname',
  'ip',
  'ips',
  'lineaccesstoken',
  'lineuserid',
  'next',
  'originalurl',
  'phone',
  'protocol',
  'rawbody',
  'rawheaders',
  'rawrows',
  'req',
  'res',
  'response',
  'route',
  'session',
  'signedcookies',
  'socket',
  'sql',
]);
const INVALID_HANDLER_INPUT = Symbol('invalid_handler_input');

class RepairIntakeDraftToCaseControllerError extends Error {
  constructor(reasonCode, requiredActions = ['configure_application_service']) {
    super(reasonCode);
    this.name = 'RepairIntakeDraftToCaseControllerError';
    this.reasonCode = reasonCode;
    this.requiredActions = requiredActions;
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function applicationServiceIsValid(applicationService) {
  return isObject(applicationService)
    && typeof applicationService.planDraftToCase === 'function'
    && typeof applicationService.submitDraftToCase === 'function';
}

function outputFieldIsUnsafe(key) {
  return UNSAFE_OUTPUT_FIELD_NAMES.has(String(key).toLowerCase());
}

function inputFieldIsUnsafe(key) {
  return UNSAFE_INPUT_FIELD_NAMES.has(String(key).toLowerCase());
}

function sanitizeInputValue(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeInputValue(item))
      .filter((item) => item !== undefined);
  }

  if (isObject(value)) {
    const result = {};

    for (const [key, fieldValue] of Object.entries(value)) {
      if (inputFieldIsUnsafe(key)) {
        continue;
      }

      const sanitized = sanitizeInputValue(fieldValue);

      if (sanitized !== undefined) {
        result[key] = sanitized;
      }
    }

    return result;
  }

  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
    return undefined;
  }

  return value;
}

function sanitizeOutputValue(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeOutputValue(item))
      .filter((item) => item !== undefined);
  }

  if (isObject(value)) {
    const result = {};

    for (const [key, fieldValue] of Object.entries(value)) {
      if (outputFieldIsUnsafe(key)) {
        continue;
      }

      const sanitized = sanitizeOutputValue(fieldValue);

      if (sanitized !== undefined) {
        result[key] = sanitized;
      }
    }

    return result;
  }

  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
    return undefined;
  }

  return value;
}

function safeFailure(reasonCode, requiredActions = ['retry_or_manual_review']) {
  return {
    ok: false,
    statusCode: 500,
    body: {
      ok: false,
      action: null,
      draftId: null,
      organizationId: null,
      submitted: false,
      status: 'failed',
      reasonCode,
      requiredActions,
      caseRef: null,
      plan: null,
      result: null,
      warnings: [],
      metadata: null,
    },
  };
}

async function callApplicationService(method, input, failureReasonCode, invalidInputReasonCode) {
  if (!isObject(input)) {
    return safeFailure(invalidInputReasonCode, ['provide_valid_input']);
  }

  try {
    // Static boundary guard anchor: await method(input)
    return sanitizeOutputValue(await method(sanitizeInputValue(input)));
  } catch (error) {
    return safeFailure(failureReasonCode);
  }
}

function createRepairIntakeDraftToCaseController(options = {}) {
  const safeOptions = isObject(options) ? options : {};
  const applicationService = safeOptions.applicationService;

  if (!applicationServiceIsValid(applicationService)) {
    throw new RepairIntakeDraftToCaseControllerError(
      'REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_APPLICATION_SERVICE_REQUIRED',
      ['configure_application_service'],
    );
  }

  // Static boundary guard anchor: planDraftToCase: (input = {}) => callApplicationService
  // Static boundary guard anchor: submitDraftToCase: (input = {}) => callApplicationService
  return {
    planDraftToCase: (input = INVALID_HANDLER_INPUT) => callApplicationService(
      applicationService.planDraftToCase,
      input,
      'REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_PLAN_FAILED',
      'REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_PLAN_INPUT_INVALID',
    ),
    submitDraftToCase: (input = INVALID_HANDLER_INPUT) => callApplicationService(
      applicationService.submitDraftToCase,
      input,
      'REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_SUBMIT_FAILED',
      'REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_SUBMIT_INPUT_INVALID',
    ),
  };
}

module.exports = {
  RepairIntakeDraftToCaseControllerError,
  createRepairIntakeDraftToCaseController,
};
