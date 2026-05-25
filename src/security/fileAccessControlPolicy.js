'use strict';

const {
  DATA_CLASSIFICATIONS,
} = require('./dataClassificationPolicy');
const {
  FIELD_VISIBILITY_ROLES,
} = require('./fieldVisibilityPolicy');

const FILE_ACCESS_ACTIONS = Object.freeze({
  PREVIEW: 'preview',
  DOWNLOAD: 'download',
  DELETE: 'delete',
});

const FILE_ACCESS_DECISIONS = Object.freeze({
  ALLOW: 'allow',
  DENY: 'deny',
});

const FILE_ACCESS_REASON_KEYS = Object.freeze({
  ALLOWED: 'fileAccess.allowed',
  UNKNOWN_ROLE: 'fileAccess.denied.unknownRole',
  UNKNOWN_ACTION: 'fileAccess.denied.unknownAction',
  UNKNOWN_CLASSIFICATION: 'fileAccess.denied.unknownClassification',
  MISSING_SCOPE: 'fileAccess.denied.missingScope',
  CROSS_SCOPE: 'fileAccess.denied.crossScope',
  NOT_ASSIGNED: 'fileAccess.denied.notAssigned',
  CUSTOMER_DENIED: 'fileAccess.denied.customer',
  SECRET_NEVER_DOWNLOADABLE: 'fileAccess.denied.secretNeverDownloadable',
  DELETE_DENIED: 'fileAccess.denied.delete',
  RESTRICTED_DENIED: 'fileAccess.denied.restricted',
});

const KNOWN_ROLES = Object.freeze(new Set([
  FIELD_VISIBILITY_ROLES.CUSTOMER,
  FIELD_VISIBILITY_ROLES.ENGINEER,
  FIELD_VISIBILITY_ROLES.DISPATCHER,
  FIELD_VISIBILITY_ROLES.ADMIN,
  FIELD_VISIBILITY_ROLES.AUDITOR,
  FIELD_VISIBILITY_ROLES.BRAND,
  FIELD_VISIBILITY_ROLES.SERVICE_PROVIDER,
  FIELD_VISIBILITY_ROLES.SUBCONTRACTOR,
]));

const CUSTOMER_ALLOWED_CLASSIFICATIONS = Object.freeze(new Set([
  DATA_CLASSIFICATIONS.PUBLIC,
  DATA_CLASSIFICATIONS.CUSTOMER_VISIBLE,
]));

const INTERNAL_DOWNLOAD_ROLES = Object.freeze(new Set([
  FIELD_VISIBILITY_ROLES.ADMIN,
  FIELD_VISIBILITY_ROLES.AUDITOR,
  FIELD_VISIBILITY_ROLES.DISPATCHER,
  FIELD_VISIBILITY_ROLES.SERVICE_PROVIDER,
  FIELD_VISIBILITY_ROLES.BRAND,
]));

const ASSIGNED_EXECUTOR_ROLES = Object.freeze(new Set([
  FIELD_VISIBILITY_ROLES.ENGINEER,
  FIELD_VISIBILITY_ROLES.SUBCONTRACTOR,
]));

const DELETE_ROLES = Object.freeze(new Set([
  FIELD_VISIBILITY_ROLES.ADMIN,
  FIELD_VISIBILITY_ROLES.AUDITOR,
]));

function safeString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function isKnownClassification(classification) {
  return Object.values(DATA_CLASSIFICATIONS).includes(classification);
}

function hasTenantScope(context) {
  return Boolean(safeString(context && (context.organizationId || context.tenantId)));
}

function isCrossScope(context) {
  const organizationId = safeString(context && context.organizationId);
  const resourceOrganizationId = safeString(context && context.resourceOrganizationId);

  return Boolean(organizationId && resourceOrganizationId && organizationId !== resourceOrganizationId);
}

function hasAssignmentScope(role, context) {
  if (role === FIELD_VISIBILITY_ROLES.CUSTOMER) {
    return safeString(context.caseRelationship) === 'customer_self';
  }

  if (role === FIELD_VISIBILITY_ROLES.ENGINEER) {
    return safeString(context.caseRelationship) === 'assigned_engineer';
  }

  if (role === FIELD_VISIBILITY_ROLES.SUBCONTRACTOR) {
    return safeString(context.caseRelationship) === 'assigned_executor';
  }

  return true;
}

function buildAuditIntent(action, classification, allowed) {
  return Object.freeze({
    required: true,
    eventType: 'file_access_policy_evaluated',
    safeSummary: Object.freeze({
      action,
      classification,
      allowed,
    }),
  });
}

function buildDecision({ allowed, reasonKey, action, classification }) {
  return Object.freeze({
    allowed,
    decision: allowed ? FILE_ACCESS_DECISIONS.ALLOW : FILE_ACCESS_DECISIONS.DENY,
    reasonKey: allowed ? FILE_ACCESS_REASON_KEYS.ALLOWED : reasonKey,
    action,
    classification,
    auditIntent: buildAuditIntent(action, classification, allowed),
  });
}

function deny(reasonKey, action, classification) {
  return buildDecision({
    allowed: false,
    reasonKey,
    action,
    classification,
  });
}

function allow(action, classification) {
  return buildDecision({
    allowed: true,
    reasonKey: FILE_ACCESS_REASON_KEYS.ALLOWED,
    action,
    classification,
  });
}

function canPreviewOrDownload(role, classification, action, context) {
  if (classification === DATA_CLASSIFICATIONS.SECRET) {
    return deny(FILE_ACCESS_REASON_KEYS.SECRET_NEVER_DOWNLOADABLE, action, classification);
  }

  if (!hasAssignmentScope(role, context)) {
    return deny(FILE_ACCESS_REASON_KEYS.NOT_ASSIGNED, action, classification);
  }

  if (role === FIELD_VISIBILITY_ROLES.CUSTOMER) {
    return CUSTOMER_ALLOWED_CLASSIFICATIONS.has(classification)
      ? allow(action, classification)
      : deny(FILE_ACCESS_REASON_KEYS.CUSTOMER_DENIED, action, classification);
  }

  if (ASSIGNED_EXECUTOR_ROLES.has(role)) {
    return classification === DATA_CLASSIFICATIONS.PUBLIC
      || classification === DATA_CLASSIFICATIONS.CUSTOMER_VISIBLE
      || classification === DATA_CLASSIFICATIONS.INTERNAL
      ? allow(action, classification)
      : deny(FILE_ACCESS_REASON_KEYS.RESTRICTED_DENIED, action, classification);
  }

  if (classification === DATA_CLASSIFICATIONS.RESTRICTED) {
    return role === FIELD_VISIBILITY_ROLES.ADMIN || role === FIELD_VISIBILITY_ROLES.AUDITOR
      ? allow(action, classification)
      : deny(FILE_ACCESS_REASON_KEYS.RESTRICTED_DENIED, action, classification);
  }

  return INTERNAL_DOWNLOAD_ROLES.has(role)
    ? allow(action, classification)
    : deny(FILE_ACCESS_REASON_KEYS.CUSTOMER_DENIED, action, classification);
}

function canDelete(role, classification, action, context) {
  if (classification === DATA_CLASSIFICATIONS.SECRET) {
    return deny(FILE_ACCESS_REASON_KEYS.SECRET_NEVER_DOWNLOADABLE, action, classification);
  }

  if (!DELETE_ROLES.has(role) || !context.elevatedFileDelete) {
    return deny(FILE_ACCESS_REASON_KEYS.DELETE_DENIED, action, classification);
  }

  return allow(action, classification);
}

function evaluateFileAccess(input = {}) {
  const role = safeString(input.role);
  const action = safeString(input.action);
  const classification = safeString(input.classification || input.fileClassification);

  if (!KNOWN_ROLES.has(role)) {
    return deny(FILE_ACCESS_REASON_KEYS.UNKNOWN_ROLE, action, classification);
  }

  if (!Object.values(FILE_ACCESS_ACTIONS).includes(action)) {
    return deny(FILE_ACCESS_REASON_KEYS.UNKNOWN_ACTION, action, classification);
  }

  if (!isKnownClassification(classification)) {
    return deny(FILE_ACCESS_REASON_KEYS.UNKNOWN_CLASSIFICATION, action, classification);
  }

  if (!hasTenantScope(input)) {
    return deny(FILE_ACCESS_REASON_KEYS.MISSING_SCOPE, action, classification);
  }

  if (isCrossScope(input)) {
    return deny(FILE_ACCESS_REASON_KEYS.CROSS_SCOPE, action, classification);
  }

  if (action === FILE_ACCESS_ACTIONS.DELETE) {
    return canDelete(role, classification, action, input);
  }

  return canPreviewOrDownload(role, classification, action, input);
}

module.exports = Object.freeze({
  FILE_ACCESS_ACTIONS,
  FILE_ACCESS_DECISIONS,
  FILE_ACCESS_REASON_KEYS,
  evaluateFileAccess,
});
