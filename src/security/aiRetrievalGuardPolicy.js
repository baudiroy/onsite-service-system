'use strict';

const {
  DATA_CLASSIFICATIONS,
  classifyField,
  isAtLeastClassification,
} = require('./dataClassificationPolicy');
const {
  FIELD_VISIBILITY_PURPOSES,
  FIELD_VISIBILITY_REASON_KEYS,
  FIELD_VISIBILITY_ROLES,
  evaluateFieldVisibility,
} = require('./fieldVisibilityPolicy');

const AI_RETRIEVAL_PURPOSES = Object.freeze({
  CUSTOMER_SUPPORT_AI: 'customer_support_ai',
  DISPATCHER_AI: 'dispatcher_ai',
  ENGINEER_AI: 'engineer_ai',
  AUDITOR_AI: 'auditor_ai',
});

const AI_RETRIEVAL_ROLES = Object.freeze({
  CUSTOMER_SUPPORT_AI: 'customerSupportAi',
  DISPATCHER: FIELD_VISIBILITY_ROLES.DISPATCHER,
  ENGINEER: FIELD_VISIBILITY_ROLES.ENGINEER,
  AUDITOR: FIELD_VISIBILITY_ROLES.AUDITOR,
  AI_RETRIEVAL: FIELD_VISIBILITY_ROLES.AI_RETRIEVAL,
});

const AI_RETRIEVAL_DECISIONS = Object.freeze({
  ALLOW: 'allow',
  DENY: 'deny',
});

const AI_RETRIEVAL_REASON_KEYS = Object.freeze({
  ALLOWED: 'aiRetrieval.allowed',
  UNKNOWN_ROLE: 'aiRetrieval.denied.unknownRole',
  UNKNOWN_PURPOSE: 'aiRetrieval.denied.unknownPurpose',
  MISSING_SCOPE: 'aiRetrieval.denied.missingScope',
  CROSS_SCOPE: 'aiRetrieval.denied.crossScope',
  MISSING_PERMISSION_CONTEXT: 'aiRetrieval.denied.missingPermissionContext',
  CUSTOMER_SUPPORT_DENIED: 'aiRetrieval.denied.customerSupport',
  ENGINEER_DENIED: 'aiRetrieval.denied.engineer',
  DISPATCHER_DENIED: 'aiRetrieval.denied.dispatcher',
  AUDITOR_DENIED: 'aiRetrieval.denied.auditor',
  RESTRICTED_OR_SECRET_DENIED: 'aiRetrieval.denied.restrictedOrSecret',
});

const KNOWN_ROLES = Object.freeze(new Set(Object.values(AI_RETRIEVAL_ROLES)));
const KNOWN_PURPOSES = Object.freeze(new Set(Object.values(AI_RETRIEVAL_PURPOSES)));

function safeString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizeIdentifier(value) {
  const safeValue = safeString(value);

  if (!safeValue) {
    return undefined;
  }

  return safeValue
    .replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`)
    .replace(/[^a-z0-9:_-]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function hasTenantScope(context) {
  return Boolean(safeString(context && (context.organizationId || context.tenantId)));
}

function isCrossScope(context) {
  const organizationId = safeString(context && context.organizationId);
  const resourceOrganizationId = safeString(context && context.resourceOrganizationId);

  return Boolean(organizationId && resourceOrganizationId && organizationId !== resourceOrganizationId);
}

function hasPermissionContext(context) {
  return Boolean(
    context
    && context.permissionContext
    && context.permissionContext.aiRetrievalAllowed === true
  );
}

function resolveClassification(input) {
  const explicitClassification = safeString(input.classification || input.fieldClassification);

  if (explicitClassification && Object.values(DATA_CLASSIFICATIONS).includes(explicitClassification)) {
    return explicitClassification;
  }

  return classifyField(input.fieldKey);
}

function buildAuditIntent(purpose, classification, allowed) {
  return Object.freeze({
    required: true,
    eventType: 'ai_retrieval_policy_evaluated',
    safeSummary: Object.freeze({
      purpose,
      classification,
      allowed,
    }),
  });
}

function buildDecision({ allowed, reasonKey, purpose, classification, fieldKey, documentId, chunkId }) {
  return Object.freeze({
    allowed,
    decision: allowed ? AI_RETRIEVAL_DECISIONS.ALLOW : AI_RETRIEVAL_DECISIONS.DENY,
    reasonKey: allowed ? AI_RETRIEVAL_REASON_KEYS.ALLOWED : reasonKey,
    classification,
    fieldKey,
    documentId,
    chunkId,
    auditIntent: buildAuditIntent(purpose, classification, allowed),
  });
}

function deny(reasonKey, context) {
  return buildDecision({
    allowed: false,
    reasonKey,
    purpose: context.purpose,
    classification: context.classification,
    fieldKey: context.fieldKey,
    documentId: context.documentId,
    chunkId: context.chunkId,
  });
}

function allow(context) {
  return buildDecision({
    allowed: true,
    reasonKey: AI_RETRIEVAL_REASON_KEYS.ALLOWED,
    purpose: context.purpose,
    classification: context.classification,
    fieldKey: context.fieldKey,
    documentId: context.documentId,
    chunkId: context.chunkId,
  });
}

function isRestrictedOrSecret(classification) {
  return isAtLeastClassification(classification, DATA_CLASSIFICATIONS.RESTRICTED);
}

function canCustomerSupportRetrieve(context) {
  return context.role === AI_RETRIEVAL_ROLES.CUSTOMER_SUPPORT_AI
    && (
      context.classification === DATA_CLASSIFICATIONS.PUBLIC
      || context.classification === DATA_CLASSIFICATIONS.CUSTOMER_VISIBLE
    );
}

function canEngineerRetrieve(context, input) {
  if (context.role !== AI_RETRIEVAL_ROLES.ENGINEER) {
    return false;
  }

  if (input.caseRelationship !== 'assigned_engineer') {
    return false;
  }

  if (context.fieldKey) {
    return evaluateFieldVisibility({
      organizationId: input.organizationId,
      tenantId: input.tenantId,
      resourceOrganizationId: input.resourceOrganizationId,
      role: FIELD_VISIBILITY_ROLES.ENGINEER,
      purpose: FIELD_VISIBILITY_PURPOSES.ENGINEER_TASK,
      fieldKey: context.fieldKey,
      caseRelationship: input.caseRelationship,
    }).allowed;
  }

  return input.taskVisible === true
    && (
      context.classification === DATA_CLASSIFICATIONS.PUBLIC
      || context.classification === DATA_CLASSIFICATIONS.CUSTOMER_VISIBLE
      || context.classification === DATA_CLASSIFICATIONS.INTERNAL
    );
}

function canDispatcherRetrieve(context, input) {
  if (context.role !== AI_RETRIEVAL_ROLES.DISPATCHER && context.role !== AI_RETRIEVAL_ROLES.AI_RETRIEVAL) {
    return false;
  }

  if (context.fieldKey) {
    return evaluateFieldVisibility({
      organizationId: input.organizationId,
      tenantId: input.tenantId,
      resourceOrganizationId: input.resourceOrganizationId,
      role: FIELD_VISIBILITY_ROLES.DISPATCHER,
      purpose: FIELD_VISIBILITY_PURPOSES.RAG_RETRIEVAL,
      fieldKey: context.fieldKey,
    }).allowed;
  }

  return !isRestrictedOrSecret(context.classification);
}

function canAuditorRetrieve(context) {
  return context.role === AI_RETRIEVAL_ROLES.AUDITOR
    && !isRestrictedOrSecret(context.classification);
}

function evaluateAiRetrievalGuard(input = {}) {
  const role = safeString(input.role);
  const purpose = safeString(input.purpose);
  const fieldKey = normalizeIdentifier(input.fieldKey);
  const documentId = normalizeIdentifier(input.documentId);
  const chunkId = normalizeIdentifier(input.chunkId);
  const classification = resolveClassification(input);
  const context = {
    role,
    purpose,
    fieldKey,
    documentId,
    chunkId,
    classification,
  };

  if (!KNOWN_ROLES.has(role)) {
    return deny(AI_RETRIEVAL_REASON_KEYS.UNKNOWN_ROLE, context);
  }

  if (!KNOWN_PURPOSES.has(purpose)) {
    return deny(AI_RETRIEVAL_REASON_KEYS.UNKNOWN_PURPOSE, context);
  }

  if (!hasTenantScope(input)) {
    return deny(AI_RETRIEVAL_REASON_KEYS.MISSING_SCOPE, context);
  }

  if (isCrossScope(input)) {
    return deny(AI_RETRIEVAL_REASON_KEYS.CROSS_SCOPE, context);
  }

  if (!hasPermissionContext(input)) {
    return deny(AI_RETRIEVAL_REASON_KEYS.MISSING_PERMISSION_CONTEXT, context);
  }

  if (isRestrictedOrSecret(classification)) {
    return deny(AI_RETRIEVAL_REASON_KEYS.RESTRICTED_OR_SECRET_DENIED, context);
  }

  if (purpose === AI_RETRIEVAL_PURPOSES.CUSTOMER_SUPPORT_AI) {
    return canCustomerSupportRetrieve(context)
      ? allow(context)
      : deny(AI_RETRIEVAL_REASON_KEYS.CUSTOMER_SUPPORT_DENIED, context);
  }

  if (purpose === AI_RETRIEVAL_PURPOSES.ENGINEER_AI) {
    return canEngineerRetrieve(context, input)
      ? allow(context)
      : deny(AI_RETRIEVAL_REASON_KEYS.ENGINEER_DENIED, context);
  }

  if (purpose === AI_RETRIEVAL_PURPOSES.DISPATCHER_AI) {
    return canDispatcherRetrieve(context, input)
      ? allow(context)
      : deny(AI_RETRIEVAL_REASON_KEYS.DISPATCHER_DENIED, context);
  }

  if (purpose === AI_RETRIEVAL_PURPOSES.AUDITOR_AI) {
    return canAuditorRetrieve(context)
      ? allow(context)
      : deny(AI_RETRIEVAL_REASON_KEYS.AUDITOR_DENIED, context);
  }

  return deny(AI_RETRIEVAL_REASON_KEYS.UNKNOWN_PURPOSE, context);
}

module.exports = Object.freeze({
  AI_RETRIEVAL_PURPOSES,
  AI_RETRIEVAL_ROLES,
  AI_RETRIEVAL_DECISIONS,
  AI_RETRIEVAL_REASON_KEYS,
  evaluateAiRetrievalGuard,
});
