'use strict';

const ACTION = 'repair_intake_contact_role_dto_guard';

const CONTACT_ROLE_FIELDS = Object.freeze({
  reporterRef: 'reporter',
  customerRef: 'customer',
  billingContactRef: 'billing_contact',
  onSiteContactOverrideRef: 'on_site_contact_override',
});

const SAFE_REF_FIELDS = Object.freeze([
  'id',
  'refId',
  'referenceId',
  'source',
  'sourceRef',
  'externalRef',
  'reviewStatus',
]);

const SAFE_CONTACT_SUMMARY_FIELDS = Object.freeze([
  'displayName',
  'maskedAddress',
  'maskedEmail',
  'maskedPhone',
  'normalizedAddressRef',
]);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizedRole(value) {
  const raw = stringValue(value);

  return raw ? raw.toLowerCase() : undefined;
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function sanitizeSafeContactSummary(value) {
  if (!isObject(value)) {
    return undefined;
  }

  const result = {};

  for (const key of SAFE_CONTACT_SUMMARY_FIELDS) {
    const safe = stringValue(value[key]);

    if (safe) {
      result[key] = safe;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

function sanitizeRoleRef(value, expectedRole) {
  if (typeof value === 'string') {
    const refId = stringValue(value);

    return refId ? { refId } : null;
  }

  if (!isObject(value)) {
    return null;
  }

  const result = {};

  for (const key of SAFE_REF_FIELDS) {
    const safe = stringValue(value[key]);

    if (safe) {
      result[key] = safe;
    }
  }

  const inputRole = normalizedRole(firstDefined(value.role, value.type));
  const inputType = stringValue(value.type);
  const inputRoleText = stringValue(value.role);

  if (inputType) {
    result.type = inputRole === expectedRole ? inputType : expectedRole;
  }

  if (inputRoleText) {
    result.role = inputRole === expectedRole ? inputRoleText : expectedRole;
  }

  const safeContactSummary = sanitizeSafeContactSummary(value.safeContactSummary || value.contactSummary);

  if (safeContactSummary) {
    result.safeContactSummary = safeContactSummary;
  }

  return Object.keys(result).length > 0 ? result : null;
}

function pickRoleInput(input, camelKey) {
  const snakeKey = camelKey.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

  return firstDefined(input[camelKey], input[snakeKey]);
}

function normalizeRepairIntakeContactRoleDto(input = {}) {
  const safeInput = isObject(input) ? input : {};
  const roles = {};

  for (const [fieldName, expectedRole] of Object.entries(CONTACT_ROLE_FIELDS)) {
    roles[fieldName] = sanitizeRoleRef(pickRoleInput(safeInput, fieldName), expectedRole);
  }

  return {
    ok: true,
    action: ACTION,
    ...roles,
    requiredActions: [],
  };
}

module.exports = {
  ACTION,
  CONTACT_ROLE_FIELDS,
  normalizeRepairIntakeContactRoleDto,
};
