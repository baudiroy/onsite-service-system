'use strict';

const ENGINEER_MOBILE_READ_ACCESS_AUDIT_ACTIONS = Object.freeze({
  TASK_DETAIL: 'task_detail',
  TASK_LIST: 'task_list',
});

const ENGINEER_MOBILE_READ_ACCESS_AUDIT_RESULTS = Object.freeze({
  ALLOWED: 'allowed',
  DENIED: 'denied',
  MALFORMED: 'malformed',
});

const ENGINEER_MOBILE_READ_ACCESS_AUDIT_EVENT_TYPES = Object.freeze({
  TASK_DETAIL_READ_ALLOWED: 'engineer_mobile_task_detail_read_allowed',
  TASK_DETAIL_READ_DENIED: 'engineer_mobile_task_detail_read_denied',
  TASK_LIST_READ_ALLOWED: 'engineer_mobile_task_list_read_allowed',
  TASK_LIST_READ_DENIED: 'engineer_mobile_task_list_read_denied',
  TASK_READ_DENIED_MALFORMED: 'engineer_mobile_task_read_denied_malformed',
});

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function pickObject(...values) {
  return values.find(isPlainObject) || {};
}

function readString(source, ...keys) {
  const object = isPlainObject(source) ? source : {};

  for (const key of keys) {
    const value = safeString(object[key]);

    if (value) {
      return value;
    }
  }

  return undefined;
}

function readBoolean(source, ...keys) {
  const object = isPlainObject(source) ? source : {};

  for (const key of keys) {
    if (typeof object[key] === 'boolean') {
      return object[key];
    }
  }

  return undefined;
}

function normalizeAction(value) {
  const action = safeString(value);

  if (!action) {
    return undefined;
  }

  return Object.values(ENGINEER_MOBILE_READ_ACCESS_AUDIT_ACTIONS).includes(action)
    ? action
    : undefined;
}

function normalizeResult(value, allowed) {
  const normalized = String(value || '').trim().toLowerCase();

  if (['allow', 'allowed', 'success'].includes(normalized) || allowed === true) {
    return ENGINEER_MOBILE_READ_ACCESS_AUDIT_RESULTS.ALLOWED;
  }

  if (['deny', 'denied', 'failure', 'failed'].includes(normalized) || allowed === false) {
    return ENGINEER_MOBILE_READ_ACCESS_AUDIT_RESULTS.DENIED;
  }

  return ENGINEER_MOBILE_READ_ACCESS_AUDIT_RESULTS.MALFORMED;
}

function eventTypeFor(action, resultStatus) {
  if (action === ENGINEER_MOBILE_READ_ACCESS_AUDIT_ACTIONS.TASK_LIST) {
    return resultStatus === ENGINEER_MOBILE_READ_ACCESS_AUDIT_RESULTS.ALLOWED
      ? ENGINEER_MOBILE_READ_ACCESS_AUDIT_EVENT_TYPES.TASK_LIST_READ_ALLOWED
      : ENGINEER_MOBILE_READ_ACCESS_AUDIT_EVENT_TYPES.TASK_LIST_READ_DENIED;
  }

  if (action === ENGINEER_MOBILE_READ_ACCESS_AUDIT_ACTIONS.TASK_DETAIL) {
    return resultStatus === ENGINEER_MOBILE_READ_ACCESS_AUDIT_RESULTS.ALLOWED
      ? ENGINEER_MOBILE_READ_ACCESS_AUDIT_EVENT_TYPES.TASK_DETAIL_READ_ALLOWED
      : ENGINEER_MOBILE_READ_ACCESS_AUDIT_EVENT_TYPES.TASK_DETAIL_READ_DENIED;
  }

  return ENGINEER_MOBILE_READ_ACCESS_AUDIT_EVENT_TYPES.TASK_READ_DENIED_MALFORMED;
}

function extractGuardDecision(request) {
  return pickObject(
    request.guardDecision,
    request.permissionAssignmentDecision,
    request.permissionDecision,
    request.decision,
  );
}

function extractAuditMetadata(request, guardDecision) {
  return pickObject(
    request.auditIntent,
    request.auditMetadata,
    guardDecision.auditIntent,
  );
}

function extractActor(request, auditMetadata) {
  return pickObject(
    request.actor,
    request.auth,
    request.permissionContext,
    request.context,
    auditMetadata,
  );
}

function extractTarget(request) {
  return pickObject(
    request.safeIdentifiers,
    request.target,
    request.resource,
  );
}

function baseMalformedIntent(timestamp) {
  const intent = {
    auditWritten: false,
    eventType: ENGINEER_MOBILE_READ_ACCESS_AUDIT_EVENT_TYPES.TASK_READ_DENIED_MALFORMED,
    reasonKey: 'engineer_mobile.read_access.malformed',
    resultStatus: ENGINEER_MOBILE_READ_ACCESS_AUDIT_RESULTS.MALFORMED,
  };

  if (timestamp) {
    intent.timestamp = timestamp;
  }

  return intent;
}

function buildEngineerMobileReadAccessAuditIntent(input = {}) {
  const request = isPlainObject(input) ? input : {};
  const guardDecision = extractGuardDecision(request);
  const auditMetadata = extractAuditMetadata(request, guardDecision);
  const actor = extractActor(request, auditMetadata);
  const target = extractTarget(request);
  const timestamp = readString(request, 'timestamp', 'createdAt', 'created_at');

  const action = normalizeAction(
    readString(request, 'action')
      || readString(guardDecision, 'action')
      || readString(auditMetadata, 'action'),
  );
  const resultStatus = normalizeResult(
    readString(request, 'resultStatus', 'result', 'decision')
      || readString(guardDecision, 'resultStatus', 'result', 'decision')
      || readString(auditMetadata, 'resultStatus', 'result', 'decision'),
    readBoolean(request, 'allowed') ?? readBoolean(guardDecision, 'allowed'),
  );
  const organizationId = readString(
    request,
    'organization_id',
    'organizationId',
  ) || readString(actor, 'organization_id', 'organizationId') || readString(
    auditMetadata,
    'organization_id',
    'organizationId',
  );
  const actorId = readString(
    request,
    'actorId',
    'actor_id',
    'userId',
    'user_id',
  ) || readString(actor, 'actorId', 'actor_id', 'userId', 'user_id');
  const reasonKey = readString(
    request,
    'reasonKey',
    'reason_key',
  ) || readString(guardDecision, 'reasonKey', 'reason_key') || readString(
    auditMetadata,
    'reasonKey',
    'reason_key',
  );

  if (!action || !organizationId || !actorId || resultStatus === ENGINEER_MOBILE_READ_ACCESS_AUDIT_RESULTS.MALFORMED) {
    return baseMalformedIntent(timestamp);
  }

  const intent = {
    action,
    actorId,
    auditWritten: false,
    eventType: eventTypeFor(action, resultStatus),
    organization_id: organizationId,
    reasonKey: reasonKey || 'engineer_mobile.read_access.unknown',
    resultStatus,
  };

  const actorRole = readString(request, 'actorRole', 'role') || readString(actor, 'actorRole', 'role');
  const engineerId = readString(request, 'engineerId', 'engineer_id') || readString(actor, 'engineerId', 'engineer_id');
  const taskId = readString(target, 'taskId', 'task_id');
  const appointmentId = readString(target, 'appointmentId', 'appointment_id');
  const caseId = readString(target, 'caseId', 'case_id');

  if (actorRole) {
    intent.actorRole = actorRole;
  }

  if (engineerId) {
    intent.engineerId = engineerId;
  }

  if (taskId) {
    intent.taskId = taskId;
  }

  if (appointmentId) {
    intent.appointmentId = appointmentId;
  }

  if (caseId) {
    intent.caseId = caseId;
  }

  if (timestamp) {
    intent.timestamp = timestamp;
  }

  return intent;
}

module.exports = {
  ENGINEER_MOBILE_READ_ACCESS_AUDIT_ACTIONS,
  ENGINEER_MOBILE_READ_ACCESS_AUDIT_EVENT_TYPES,
  ENGINEER_MOBILE_READ_ACCESS_AUDIT_RESULTS,
  buildEngineerMobileReadAccessAuditIntent,
};
