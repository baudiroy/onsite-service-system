'use strict';

const {
  DATA_ACCESS_PURPOSES,
  DATA_CLASSIFICATIONS,
  classifyField,
  isAtLeastClassification,
} = require('./dataClassificationPolicy');

const FIELD_VISIBILITY_ROLES = Object.freeze({
  CUSTOMER: 'customer',
  ENGINEER: 'engineer',
  DISPATCHER: 'dispatcher',
  ADMIN: 'admin',
  AUDITOR: 'auditor',
  BRAND: 'brand',
  SERVICE_PROVIDER: 'serviceProvider',
  SUBCONTRACTOR: 'subcontractor',
  AI_RETRIEVAL: 'aiRetrieval',
});

const FIELD_VISIBILITY_PURPOSES = Object.freeze({
  CUSTOMER_VISIBLE: DATA_ACCESS_PURPOSES.CUSTOMER_VISIBLE,
  ENGINEER_TASK: 'engineer_task',
  INTERNAL_VIEW: 'internal_view',
  EXPORT: DATA_ACCESS_PURPOSES.EXPORT,
  RAG_RETRIEVAL: DATA_ACCESS_PURPOSES.RAG_RETRIEVAL,
});

const FIELD_VISIBILITY_DECISIONS = Object.freeze({
  ALLOW: 'allow',
  DENY: 'deny',
});

const FIELD_VISIBILITY_REASON_KEYS = Object.freeze({
  ALLOWED: 'fieldVisibility.allowed',
  UNKNOWN_ROLE: 'fieldVisibility.denied.unknownRole',
  UNKNOWN_PURPOSE: 'fieldVisibility.denied.unknownPurpose',
  MISSING_SCOPE: 'fieldVisibility.denied.missingScope',
  CROSS_SCOPE: 'fieldVisibility.denied.crossScope',
  CUSTOMER_VISIBLE_DENIED: 'fieldVisibility.denied.customerVisible',
  ENGINEER_TASK_DENIED: 'fieldVisibility.denied.engineerTask',
  EXPORT_DENIED: 'fieldVisibility.denied.export',
  RAG_DENIED: 'fieldVisibility.denied.rag',
  INTERNAL_VIEW_DENIED: 'fieldVisibility.denied.internalView',
});

const ENGINEER_TASK_VISIBLE_FIELDS = Object.freeze(new Set([
  'appointment_window',
  'case_no',
  'case_number',
  'customer_facing_status',
  'issue_summary',
  'product_model',
  'product_type',
  'service_attention_note',
]));

const INTERNAL_VIEW_ROLES = Object.freeze(new Set([
  FIELD_VISIBILITY_ROLES.ADMIN,
  FIELD_VISIBILITY_ROLES.AUDITOR,
  FIELD_VISIBILITY_ROLES.DISPATCHER,
  FIELD_VISIBILITY_ROLES.SERVICE_PROVIDER,
]));

const EXPORT_ROLES = Object.freeze(new Set([
  FIELD_VISIBILITY_ROLES.ADMIN,
  FIELD_VISIBILITY_ROLES.AUDITOR,
  FIELD_VISIBILITY_ROLES.DISPATCHER,
  FIELD_VISIBILITY_ROLES.SERVICE_PROVIDER,
  FIELD_VISIBILITY_ROLES.BRAND,
]));

const RAG_ROLES = Object.freeze(new Set([
  FIELD_VISIBILITY_ROLES.ADMIN,
  FIELD_VISIBILITY_ROLES.DISPATCHER,
  FIELD_VISIBILITY_ROLES.SERVICE_PROVIDER,
  FIELD_VISIBILITY_ROLES.AI_RETRIEVAL,
]));

function safeString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizeFieldKey(fieldKey) {
  const safeFieldKey = safeString(fieldKey);

  if (!safeFieldKey) {
    return '';
  }

  return safeFieldKey
    .replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`)
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function deny(reasonKey, classification) {
  return Object.freeze({
    allowed: false,
    decision: FIELD_VISIBILITY_DECISIONS.DENY,
    reasonKey,
    classification,
  });
}

function allow(classification) {
  return Object.freeze({
    allowed: true,
    decision: FIELD_VISIBILITY_DECISIONS.ALLOW,
    reasonKey: FIELD_VISIBILITY_REASON_KEYS.ALLOWED,
    classification,
  });
}

function hasTenantScope(context) {
  return Boolean(safeString(context && (context.organizationId || context.tenantId)));
}

function isCrossScope(context) {
  const organizationId = safeString(context && context.organizationId);
  const resourceOrganizationId = safeString(context && context.resourceOrganizationId);

  return Boolean(organizationId && resourceOrganizationId && organizationId !== resourceOrganizationId);
}

function isKnownRole(role) {
  return Object.values(FIELD_VISIBILITY_ROLES).includes(role);
}

function isKnownPurpose(purpose) {
  return Object.values(FIELD_VISIBILITY_PURPOSES).includes(purpose);
}

function canExposeForCustomerVisible(classification) {
  return classification === DATA_CLASSIFICATIONS.PUBLIC
    || classification === DATA_CLASSIFICATIONS.CUSTOMER_VISIBLE;
}

function canExposeForExportOrRag(classification) {
  return !isAtLeastClassification(classification, DATA_CLASSIFICATIONS.RESTRICTED);
}

function evaluateFieldVisibility(input = {}) {
  const role = safeString(input.role);
  const purpose = safeString(input.purpose);
  const fieldKey = normalizeFieldKey(input.fieldKey);
  const classification = classifyField(fieldKey);

  if (!isKnownRole(role)) {
    return deny(FIELD_VISIBILITY_REASON_KEYS.UNKNOWN_ROLE, classification);
  }

  if (!isKnownPurpose(purpose)) {
    return deny(FIELD_VISIBILITY_REASON_KEYS.UNKNOWN_PURPOSE, classification);
  }

  if (!hasTenantScope(input)) {
    return deny(FIELD_VISIBILITY_REASON_KEYS.MISSING_SCOPE, classification);
  }

  if (isCrossScope(input)) {
    return deny(FIELD_VISIBILITY_REASON_KEYS.CROSS_SCOPE, classification);
  }

  if (purpose === FIELD_VISIBILITY_PURPOSES.CUSTOMER_VISIBLE) {
    return role === FIELD_VISIBILITY_ROLES.CUSTOMER && canExposeForCustomerVisible(classification)
      ? allow(classification)
      : deny(FIELD_VISIBILITY_REASON_KEYS.CUSTOMER_VISIBLE_DENIED, classification);
  }

  if (purpose === FIELD_VISIBILITY_PURPOSES.ENGINEER_TASK) {
    return role === FIELD_VISIBILITY_ROLES.ENGINEER
      && ENGINEER_TASK_VISIBLE_FIELDS.has(fieldKey)
      && !isAtLeastClassification(classification, DATA_CLASSIFICATIONS.RESTRICTED)
      ? allow(classification)
      : deny(FIELD_VISIBILITY_REASON_KEYS.ENGINEER_TASK_DENIED, classification);
  }

  if (purpose === FIELD_VISIBILITY_PURPOSES.EXPORT) {
    return EXPORT_ROLES.has(role) && canExposeForExportOrRag(classification)
      ? allow(classification)
      : deny(FIELD_VISIBILITY_REASON_KEYS.EXPORT_DENIED, classification);
  }

  if (purpose === FIELD_VISIBILITY_PURPOSES.RAG_RETRIEVAL) {
    return RAG_ROLES.has(role) && canExposeForExportOrRag(classification)
      ? allow(classification)
      : deny(FIELD_VISIBILITY_REASON_KEYS.RAG_DENIED, classification);
  }

  if (purpose === FIELD_VISIBILITY_PURPOSES.INTERNAL_VIEW) {
    return INTERNAL_VIEW_ROLES.has(role)
      && classification !== DATA_CLASSIFICATIONS.SECRET
      ? allow(classification)
      : deny(FIELD_VISIBILITY_REASON_KEYS.INTERNAL_VIEW_DENIED, classification);
  }

  return deny(FIELD_VISIBILITY_REASON_KEYS.UNKNOWN_PURPOSE, classification);
}

module.exports = Object.freeze({
  FIELD_VISIBILITY_ROLES,
  FIELD_VISIBILITY_PURPOSES,
  FIELD_VISIBILITY_DECISIONS,
  FIELD_VISIBILITY_REASON_KEYS,
  ENGINEER_TASK_VISIBLE_FIELDS,
  evaluateFieldVisibility,
});
