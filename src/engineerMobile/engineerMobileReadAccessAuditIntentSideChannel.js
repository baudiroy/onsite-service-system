'use strict';

const {
  buildEngineerMobileReadAccessAuditIntent,
} = require('./engineerMobileReadAccessAuditIntentBuilder');
const {
  buildEngineerMobileTaskDetail,
  buildEngineerMobileTaskDetailAsync,
} = require('./engineerMobileTaskDetailService');
const {
  buildEngineerMobileTaskList,
  buildEngineerMobileTaskListAsync,
} = require('./engineerMobileTaskListService');

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readString(source, ...keys) {
  const object = isPlainObject(source) ? source : {};

  for (const key of keys) {
    const value = typeof object[key] === 'string' && object[key].trim()
      ? object[key].trim()
      : undefined;

    if (value) {
      return value;
    }
  }

  return undefined;
}

function resolveActor(input) {
  const request = isPlainObject(input) ? input : {};

  return isPlainObject(request.auth)
    ? request.auth
    : request;
}

function resolveSafeIdentifiers(input, response) {
  const request = isPlainObject(input) ? input : {};
  const identifiers = {};

  if (isPlainObject(request.safeIdentifiers)) {
    if (readString(request.safeIdentifiers, 'taskId', 'task_id')) {
      identifiers.taskId = readString(request.safeIdentifiers, 'taskId', 'task_id');
    }
    if (readString(request.safeIdentifiers, 'appointmentId', 'appointment_id')) {
      identifiers.appointmentId = readString(request.safeIdentifiers, 'appointmentId', 'appointment_id');
    }
    if (readString(request.safeIdentifiers, 'caseId', 'case_id')) {
      identifiers.caseId = readString(request.safeIdentifiers, 'caseId', 'case_id');
    }
  }

  const detail = isPlainObject(response) && isPlainObject(response.detail) ? response.detail : {};

  if (!identifiers.appointmentId) {
    identifiers.appointmentId = readString(request, 'appointmentId', 'appointment_id')
      || readString(detail, 'appointmentId', 'appointment_id');
  }

  if (!identifiers.caseId) {
    identifiers.caseId = readString(detail, 'caseId', 'case_id');
  }

  return identifiers;
}

function buildReadAccessAuditIntent({
  action,
  input,
  response,
}) {
  const request = isPlainObject(input) ? input : {};
  const allowed = isPlainObject(response) && response.status === 'allow';
  const guardDecision = isPlainObject(request.guardDecision) ? request.guardDecision : {};
  const guardReasonKey = readString(guardDecision, 'reasonKey', 'reason_key');

  return buildEngineerMobileReadAccessAuditIntent({
    action,
    actor: resolveActor(request),
    allowed,
    guardDecision,
    reasonKey: allowed
      ? 'engineer_mobile.read_access.allowed'
      : (guardReasonKey || 'engineer_mobile.read_access.denied'),
    resultStatus: allowed ? 'allowed' : 'denied',
    safeIdentifiers: resolveSafeIdentifiers(request, response),
    timestamp: readString(request, 'timestamp', 'createdAt', 'created_at'),
  });
}

function withReadAccessAuditIntent({
  action,
  input,
  response,
}) {
  return {
    auditIntent: buildReadAccessAuditIntent({
      action,
      input,
      response,
    }),
    response,
  };
}

function buildEngineerMobileTaskListReadWithAuditIntent(input, options = {}) {
  return withReadAccessAuditIntent({
    action: 'task_list',
    input,
    response: buildEngineerMobileTaskList(input, options),
  });
}

async function buildEngineerMobileTaskListReadWithAuditIntentAsync(input, options = {}) {
  return withReadAccessAuditIntent({
    action: 'task_list',
    input,
    response: await buildEngineerMobileTaskListAsync(input, options),
  });
}

function buildEngineerMobileTaskDetailReadWithAuditIntent(input, options = {}) {
  return withReadAccessAuditIntent({
    action: 'task_detail',
    input,
    response: buildEngineerMobileTaskDetail(input, options),
  });
}

async function buildEngineerMobileTaskDetailReadWithAuditIntentAsync(input, options = {}) {
  return withReadAccessAuditIntent({
    action: 'task_detail',
    input,
    response: await buildEngineerMobileTaskDetailAsync(input, options),
  });
}

module.exports = {
  buildEngineerMobileTaskDetailReadWithAuditIntent,
  buildEngineerMobileTaskDetailReadWithAuditIntentAsync,
  buildEngineerMobileTaskListReadWithAuditIntent,
  buildEngineerMobileTaskListReadWithAuditIntentAsync,
};
