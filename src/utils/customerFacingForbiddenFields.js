const CUSTOMER_FACING_FORBIDDEN_FIELD_NAME_PATTERNS = Object.freeze([
  'internal',
  'token',
  'secret',
  'lineid',
  'lineuserid',
  'line_user_id',
  'provider',
  'providerpayload',
  'provider_payload',
  'organizationid',
  'organization_id',
  'customerid',
  'customer_id',
  'caseid',
  'case_id',
  'appointmentid',
  'appointment_id',
  'reportid',
  'report_id',
  'phone',
  'mobile',
  'tel',
  'address',
  'audit',
  'auditreason',
  'audit_reason',
  'auditlog',
  'audit_log',
  'airawpayload',
  'ai_raw_payload',
  'internaldenialreason',
  'internal_denial_reason',
  'raw',
  'rawpayload',
  'raw_payload',
  'billingsettlementrules',
  'inventoryinternals',
  'supervisornotes',
  'engineerinternalcomments',
  'metadata',
  'debug',
  'source'
]);

function normalizeCustomerFacingFieldName(value) {
  return String(value).replace(/[^A-Za-z0-9_]/g, '').toLowerCase();
}

function isCustomerFacingForbiddenFieldName(fieldName) {
  const normalizedFieldName = normalizeCustomerFacingFieldName(fieldName);

  return CUSTOMER_FACING_FORBIDDEN_FIELD_NAME_PATTERNS.some((pattern) =>
    normalizedFieldName.includes(pattern)
  );
}

module.exports = {
  CUSTOMER_FACING_FORBIDDEN_FIELD_NAME_PATTERNS,
  isCustomerFacingForbiddenFieldName
};
