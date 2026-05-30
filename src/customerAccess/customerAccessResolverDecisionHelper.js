'use strict';

const DENY_MESSAGE_KEY = 'customerAccess.unavailable';
const ALLOW_MESSAGE_KEY = 'customerAccess.allowed';

const PROJECTION_KEYS = Object.freeze([
  'customerReportReference',
  'caseReference',
  'serviceStatus',
  'appointmentWindow',
  'engineerDisplayName',
  'serviceSummary',
  'completionTime',
]);

const PUBLIC_ATTACHMENT_KEYS = Object.freeze([
  'attachmentId',
  'label',
  'mimeType',
]);

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  if (
    value instanceof Date ||
    value instanceof Error ||
    (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) ||
    typeof value.then === 'function'
  ) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function safeProperty(value, key) {
  try {
    return value ? value[key] : undefined;
  } catch (error) {
    return undefined;
  }
}

function safeIdentifier(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  if (
    !trimmed ||
    trimmed.length > 128 ||
    /(?:['"`;=]|--|\/\*|\*\/|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bunion\b|\bbearer\b|\bauthorization\b|\bcookie\b|\bset-cookie\b|\btoken\b|\bjwt\b|\bapi[-_ ]?key\b|\bheader\b|\bpassword\b|\bsecret\b)/i
      .test(trimmed)
  ) {
    return undefined;
  }

  return /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(trimmed) ? trimmed : undefined;
}

function safeDisplayString(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  if (
    !trimmed ||
    /(?:['"`]|--|\/\*|\*\/|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bunion\b|\bbearer\b|\bauthorization\b|\bcookie\b|\bset-cookie\b|\btoken\b|\bjwt\b|\bapi[-_ ]?key\b|\bpassword\b|\bsecret\b|\bstack\b|\bat\s+\w+\s*\()/i
      .test(trimmed)
  ) {
    return undefined;
  }

  return trimmed;
}

function buildCustomerAccessResolverDenyDecision() {
  return {
    allowed: false,
    status: 'deny',
    messageKey: DENY_MESSAGE_KEY,
  };
}

function normalizedContext(input) {
  const context = isPlainObject(input) && isPlainObject(input.customerAccessContext)
    ? input.customerAccessContext
    : undefined;

  if (!context) {
    return undefined;
  }

  const params = isPlainObject(context.params) ? context.params : {};
  const auth = isPlainObject(context.auth) ? context.auth : {};
  const access = isPlainObject(context.access) ? context.access : {};
  const organizationId = safeIdentifier(safeProperty(auth, 'organizationId'));
  const customerId = safeIdentifier(safeProperty(auth, 'customerId'));
  const caseId = safeIdentifier(safeProperty(params, 'caseId'));
  const reportId = safeIdentifier(safeProperty(params, 'reportId'));
  const topLevelCaseId = safeIdentifier(safeProperty(context, 'caseId'));
  const topLevelReportId = safeIdentifier(safeProperty(context, 'reportId'));

  if (!organizationId || !customerId || !caseId) {
    return undefined;
  }

  if ((topLevelCaseId && topLevelCaseId !== caseId) || (topLevelReportId && reportId && topLevelReportId !== reportId)) {
    return undefined;
  }

  if (
    safeProperty(auth, 'customerIdentityVerified') !== true ||
    safeProperty(access, 'organizationScopeMatched') !== true ||
    safeProperty(access, 'caseLinkedToCustomer') !== true ||
    safeProperty(access, 'publicationAllowed') !== true ||
    safeProperty(access, 'customerVisiblePolicyPassed') !== true
  ) {
    return undefined;
  }

  return {
    organizationId,
    customerId,
    caseId,
    ...(reportId ? { reportId } : {}),
  };
}

function projectionSource(input) {
  if (!isPlainObject(input)) {
    return undefined;
  }

  const lookup = isPlainObject(input.projectionLookup)
    ? input.projectionLookup
    : isPlainObject(input.lookupResult)
      ? input.lookupResult
      : undefined;

  if (
    (lookup && (lookup.status === 'deny' || lookup.status === 'not_found' || lookup.available === false)) ||
    input.status === 'deny'
  ) {
    return undefined;
  }

  if (isPlainObject(input.projection)) {
    return input.projection;
  }

  if (lookup && isPlainObject(lookup.projection)) {
    return lookup.projection;
  }

  if (lookup && isPlainObject(lookup.customerVisibleProjection)) {
    return lookup.customerVisibleProjection;
  }

  return undefined;
}

function safeAttachment(input) {
  if (!isPlainObject(input)) {
    return undefined;
  }

  const attachment = {};

  for (const key of PUBLIC_ATTACHMENT_KEYS) {
    const value = safeDisplayString(safeProperty(input, key));

    if (value) {
      attachment[key] = value;
    }
  }

  return Object.keys(attachment).length > 0 ? attachment : undefined;
}

function safeAttachments(input) {
  if (!Array.isArray(input)) {
    return undefined;
  }

  const attachments = input.map(safeAttachment).filter(Boolean);

  return attachments.length > 0 ? attachments : undefined;
}

function safeProjection(input) {
  const source = projectionSource(input);

  if (!source) {
    return undefined;
  }

  const projection = {};

  for (const key of PROJECTION_KEYS) {
    const value = safeDisplayString(safeProperty(source, key));

    if (value) {
      projection[key] = value;
    }
  }

  const publicAttachments = safeAttachments(safeProperty(source, 'publicAttachments'));

  if (publicAttachments) {
    projection.publicAttachments = publicAttachments;
  }

  return Object.keys(projection).length > 0 ? projection : undefined;
}

function buildCustomerAccessResolverDecision(input) {
  const context = normalizedContext(input);
  const projection = safeProjection(input);

  if (!context || !projection) {
    return buildCustomerAccessResolverDenyDecision();
  }

  return {
    allowed: true,
    status: 'allow',
    messageKey: ALLOW_MESSAGE_KEY,
    projection,
  };
}

module.exports = {
  buildCustomerAccessResolverDecision,
  buildCustomerAccessResolverDenyDecision,
};
