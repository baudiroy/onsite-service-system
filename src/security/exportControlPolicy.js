'use strict';

const {
  DATA_CLASSIFICATIONS,
  classifyField,
} = require('./dataClassificationPolicy');
const {
  FIELD_VISIBILITY_PURPOSES,
  FIELD_VISIBILITY_REASON_KEYS,
  FIELD_VISIBILITY_ROLES,
  evaluateFieldVisibility,
} = require('./fieldVisibilityPolicy');

const EXPORT_CONTROL_DECISIONS = Object.freeze({
  ALLOW: 'allow',
  DENY: 'deny',
});

const EXPORT_CONTROL_REASON_KEYS = Object.freeze({
  ALLOWED: 'exportControl.allowed',
  UNKNOWN_PURPOSE: 'exportControl.denied.unknownPurpose',
  EMPTY_FIELDS: 'exportControl.denied.emptyFields',
  VISIBILITY_DENIED: 'exportControl.denied.visibility',
  RESTRICTED_BY_DEFAULT: 'exportControl.denied.restrictedByDefault',
  SECRET_NEVER_EXPORTABLE: 'exportControl.denied.secretNeverExportable',
});

const EXPORT_CONTROL_PURPOSES = Object.freeze({
  EXPORT: FIELD_VISIBILITY_PURPOSES.EXPORT,
});

const ELEVATED_RESTRICTED_EXPORT_ROLES = Object.freeze(new Set([
  FIELD_VISIBILITY_ROLES.ADMIN,
  FIELD_VISIBILITY_ROLES.AUDITOR,
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

function extractFieldKey(field) {
  if (typeof field === 'string') {
    return normalizeFieldKey(field);
  }

  if (!field || typeof field !== 'object' || Array.isArray(field)) {
    return '';
  }

  return normalizeFieldKey(field.fieldKey || field.key || field.name);
}

function compactFieldSummary(fieldKey, classification, reasonKey) {
  return Object.freeze({
    fieldKey,
    classification,
    reasonKey,
  });
}

function buildAuditIntent(allowedFields, deniedFields, elevatedRestrictedExport) {
  return Object.freeze({
    required: true,
    eventType: 'export_policy_evaluated',
    safeSummary: Object.freeze({
      allowedFieldCount: allowedFields.length,
      deniedFieldCount: deniedFields.length,
      elevatedRestrictedExport: Boolean(elevatedRestrictedExport),
    }),
  });
}

function buildDecision({ allowedFields, deniedFields, reasonKey, elevatedRestrictedExport }) {
  const allowed = deniedFields.length === 0;

  return Object.freeze({
    allowed,
    decision: allowed ? EXPORT_CONTROL_DECISIONS.ALLOW : EXPORT_CONTROL_DECISIONS.DENY,
    reasonKey: allowed ? EXPORT_CONTROL_REASON_KEYS.ALLOWED : reasonKey,
    allowedFields: Object.freeze(allowedFields),
    deniedFields: Object.freeze(deniedFields),
    auditIntent: buildAuditIntent(allowedFields, deniedFields, elevatedRestrictedExport),
  });
}

function canUseElevatedRestrictedExport(role, elevatedRestrictedExport) {
  return Boolean(elevatedRestrictedExport && ELEVATED_RESTRICTED_EXPORT_ROLES.has(role));
}

function evaluateExportControl(input = {}) {
  const role = safeString(input.role);
  const purpose = safeString(input.purpose || EXPORT_CONTROL_PURPOSES.EXPORT);
  const elevatedRestrictedExport = Boolean(input.elevatedRestrictedExport);
  const rawFields = Array.isArray(input.fields) ? input.fields : [];
  const fieldKeys = rawFields.map(extractFieldKey).filter(Boolean);
  const allowedFields = [];
  const deniedFields = [];

  if (purpose !== EXPORT_CONTROL_PURPOSES.EXPORT) {
    return buildDecision({
      allowedFields,
      deniedFields: fieldKeys.map((fieldKey) => compactFieldSummary(
        fieldKey,
        classifyField(fieldKey),
        EXPORT_CONTROL_REASON_KEYS.UNKNOWN_PURPOSE,
      )),
      reasonKey: EXPORT_CONTROL_REASON_KEYS.UNKNOWN_PURPOSE,
      elevatedRestrictedExport,
    });
  }

  if (fieldKeys.length === 0) {
    return buildDecision({
      allowedFields,
      deniedFields: [compactFieldSummary('fields', DATA_CLASSIFICATIONS.INTERNAL, EXPORT_CONTROL_REASON_KEYS.EMPTY_FIELDS)],
      reasonKey: EXPORT_CONTROL_REASON_KEYS.EMPTY_FIELDS,
      elevatedRestrictedExport,
    });
  }

  for (const fieldKey of fieldKeys) {
    const classification = classifyField(fieldKey);
    const visibility = evaluateFieldVisibility({
      organizationId: input.organizationId,
      tenantId: input.tenantId,
      resourceOrganizationId: input.resourceOrganizationId,
      role,
      purpose: FIELD_VISIBILITY_PURPOSES.EXPORT,
      fieldKey,
    });

    if (classification === DATA_CLASSIFICATIONS.SECRET) {
      deniedFields.push(compactFieldSummary(
        fieldKey,
        classification,
        EXPORT_CONTROL_REASON_KEYS.SECRET_NEVER_EXPORTABLE,
      ));
      continue;
    }

    if (classification === DATA_CLASSIFICATIONS.RESTRICTED) {
      if (canUseElevatedRestrictedExport(role, elevatedRestrictedExport)) {
        allowedFields.push(compactFieldSummary(fieldKey, classification, EXPORT_CONTROL_REASON_KEYS.ALLOWED));
      } else {
        deniedFields.push(compactFieldSummary(
          fieldKey,
          classification,
          EXPORT_CONTROL_REASON_KEYS.RESTRICTED_BY_DEFAULT,
        ));
      }
      continue;
    }

    if (visibility.allowed) {
      allowedFields.push(compactFieldSummary(fieldKey, classification, EXPORT_CONTROL_REASON_KEYS.ALLOWED));
    } else {
      deniedFields.push(compactFieldSummary(
        fieldKey,
        classification,
        visibility.reasonKey || EXPORT_CONTROL_REASON_KEYS.VISIBILITY_DENIED,
      ));
    }
  }

  return buildDecision({
    allowedFields,
    deniedFields,
    reasonKey: deniedFields[0]
      ? deniedFields[0].reasonKey
      : EXPORT_CONTROL_REASON_KEYS.ALLOWED,
    elevatedRestrictedExport,
  });
}

module.exports = Object.freeze({
  EXPORT_CONTROL_DECISIONS,
  EXPORT_CONTROL_PURPOSES,
  EXPORT_CONTROL_REASON_KEYS,
  ELEVATED_RESTRICTED_EXPORT_ROLES,
  evaluateExportControl,
});
