'use strict';

const SAFE_DENY_MESSAGE_KEY = 'customerAccess.unavailable';
const ALLOW_MESSAGE_KEY = 'customerAccess.serviceReport.available';

const FORBIDDEN_ATTACHMENT_KEYS = new Set([
  'address',
  'aiRawPayload',
  'apiKey',
  'auditLog',
  'billingInternalData',
  'connectionString',
  'dbUrl',
  'dispatchNote',
  'finalAppointmentId',
  'fullAddress',
  'fullCasePayload',
  'fullPhone',
  'fullRawReportPayload',
  'internalAppointmentId',
  'internalNote',
  'internalReportId',
  'internalSettlementData',
  'lineUserId',
  'line_user_id',
  'mobile',
  'password',
  'phone',
  'providerRawPayload',
  'rawAddress',
  'rawCasePayload',
  'rawFieldServiceReportId',
  'rawPhone',
  'secret',
  'settlementInternalData',
  'signedUrl',
  'sql',
  'stack',
  'technicianPrivateNote',
  'tel',
  'token',
]);

const ALLOWED_PUBLICATION_STATES = new Set([
  'allowed',
  'customer_published',
  'customer-visible',
  'customer_visible',
  'public',
  'published',
]);

const ALLOWED_ATTACHMENT_VISIBILITY_STATES = new Set([
  'allowed',
  'available',
  'customer-published',
  'customer_published',
  'customer-visible',
  'customer_visible',
  'public',
  'published',
  'visible',
]);

const DENIED_PUBLICATION_STATES = new Set([
  'disabled',
  'draft',
  'hidden',
  'internal',
  'internal-only',
  'internal_only',
  'private',
  'revoked',
  'unpublished',
]);

const DENIED_ATTACHMENT_VISIBILITY_STATES = new Set([
  'deleted',
  'denied',
  'disabled',
  'draft',
  'hidden',
  'internal',
  'internal-only',
  'internal_only',
  'non-public',
  'non_public',
  'private',
  'rejected',
  'revoked',
  'unpublished',
]);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function identifierValue(value) {
  const candidate = stringValue(value);

  return candidate && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(candidate)
    ? candidate
    : undefined;
}

function hasMalformedIdentifierValue(...values) {
  return values.some((value) => {
    const candidate = stringValue(value);

    return Boolean(candidate && !identifierValue(candidate));
  });
}

function booleanTrue(value) {
  return value === true;
}

function hasOwn(value, key) {
  return isObject(value) && Object.prototype.hasOwnProperty.call(value, key);
}

function normalizedState(value) {
  const candidate = stringValue(value);

  return candidate ? candidate.toLowerCase() : undefined;
}

function publicationStateValue(source) {
  if (typeof source === 'string') {
    return normalizedState(source);
  }

  if (!isObject(source)) {
    return undefined;
  }

  return normalizedState(source.publicationState)
    || normalizedState(source.publication_state)
    || normalizedState(source.publicationStatus)
    || normalizedState(source.publication_status)
    || normalizedState(source.customerPublicationState)
    || normalizedState(source.customer_publication_state)
    || normalizedState(source.state);
}

function hasPublicationSignal(source) {
  if (source === true || source === false) {
    return true;
  }

  if (typeof source === 'string') {
    return Boolean(normalizedState(source));
  }

  if (!isObject(source)) {
    return false;
  }

  return [
    'allowed',
    'publicationAllowed',
    'publication_allowed',
    'publicationState',
    'publication_state',
    'publicationStatus',
    'publication_status',
    'published',
    'customerPublished',
    'customer_published',
    'customerVisible',
    'customer_visible',
    'customerVisiblePolicyPassed',
    'customer_visible_policy_passed',
    'draft',
    'internalOnly',
    'internal_only',
    'revoked',
    'unpublished',
  ].some((key) => hasOwn(source, key));
}

function publicationGuardDenied(source) {
  if (!isObject(source)) {
    return source === false;
  }

  const state = publicationStateValue(source);

  if (state && DENIED_PUBLICATION_STATES.has(state)) {
    return true;
  }

  return source.allowed === false
    || source.publicationAllowed === false
    || source.publication_allowed === false
    || source.published === false
    || source.customerPublished === false
    || source.customer_published === false
    || source.customerVisible === false
    || source.customer_visible === false
    || source.customerVisiblePolicyPassed === false
    || source.customer_visible_policy_passed === false
    || source.draft === true
    || source.internalOnly === true
    || source.internal_only === true
    || source.revoked === true
    || source.unpublished === true;
}

function publicationGuardAllows(source) {
  if (source === true) {
    return true;
  }

  if (!isObject(source) || publicationGuardDenied(source)) {
    return false;
  }

  const state = publicationStateValue(source);

  return source.allowed === true
    || source.publicationAllowed === true
    || source.publication_allowed === true
    || source.published === true
    || source.customerPublished === true
    || source.customer_published === true
    || (state && ALLOWED_PUBLICATION_STATES.has(state));
}

function publicationSourcesFromContext(context) {
  if (!isObject(context)) {
    return [];
  }

  const access = isObject(context.access) ? context.access : {};
  const sources = [];

  if (hasPublicationSignal(context.publication)) {
    sources.push(context.publication);
  }

  if (hasPublicationSignal(access.publication)) {
    sources.push(access.publication);
  }

  if (hasPublicationSignal(access.publicationState)) {
    sources.push(access.publicationState);
  }

  if (hasPublicationSignal(context)) {
    sources.push(context);
  }

  if (hasPublicationSignal(access)) {
    sources.push(access);
  }

  return sources;
}

function customerAccessPublicationStateGuardPasses(context) {
  const sources = publicationSourcesFromContext(context);

  if (sources.length === 0 || sources.some(publicationGuardDenied)) {
    return false;
  }

  return sources.some(publicationGuardAllows);
}

function rowPublicationReferenceMatches(row, expectedCaseId, expectedReportId) {
  const publicationCaseId = rowValue(
    row,
    'publication_case_id',
    'publicationCaseId',
    'published_case_id',
    'publishedCaseId',
  );
  const publicationReportId = rowValue(
    row,
    'publication_report_id',
    'publicationReportId',
    'published_report_id',
    'publishedReportId',
  );

  return (!publicationCaseId || publicationCaseId === expectedCaseId)
    && (!publicationReportId || publicationReportId === expectedReportId);
}

function serviceReportRowPublicationStateGuardPasses(row, scope) {
  if (!isObject(row)) {
    return false;
  }

  if (!rowPublicationReferenceMatches(row, scope.caseId, scope.reportId)) {
    return false;
  }

  if (publicationGuardDenied(row)) {
    return false;
  }

  if (!hasPublicationSignal(row)) {
    return false;
  }

  return publicationGuardAllows(row);
}

function buildSafeDenyEnvelope() {
  return {
    status: 'deny',
    messageKey: SAFE_DENY_MESSAGE_KEY,
    customerVisible: false,
    data: null,
    error: {
      messageKey: SAFE_DENY_MESSAGE_KEY,
    },
  };
}

function buildAllowEnvelope(serviceReport) {
  if (!isObject(serviceReport) || Object.keys(serviceReport).length === 0) {
    return buildSafeDenyEnvelope();
  }

  return {
    status: 'allow',
    messageKey: ALLOW_MESSAGE_KEY,
    customerVisible: true,
    data: {
      serviceReport,
    },
  };
}

function contextOrganizationId(context) {
  return identifierValue(context.organizationId)
    || identifierValue(context.auth && context.auth.organizationId)
    || identifierValue(context.organization && context.organization.organizationId)
    || identifierValue(context.organization && context.organization.id);
}

function contextCustomerId(context) {
  return identifierValue(context.customerId)
    || identifierValue(context.auth && context.auth.customerId)
    || identifierValue(context.customerIdentity && context.customerIdentity.customerId)
    || identifierValue(context.customer && context.customer.id);
}

function contextCaseId(context) {
  return identifierValue(context.caseId)
    || identifierValue(context.params && context.params.caseId)
    || identifierValue(context.case && context.case.caseId)
    || identifierValue(context.case && context.case.id);
}

function hasMalformedCustomerAccessIdentifier(context) {
  return hasMalformedIdentifierValue(
    context.organizationId,
    context.auth && context.auth.organizationId,
    context.organization && context.organization.organizationId,
    context.organization && context.organization.id,
    context.customerId,
    context.auth && context.auth.customerId,
    context.customerIdentity && context.customerIdentity.customerId,
    context.customer && context.customer.id,
    context.caseId,
    context.params && context.params.caseId,
    context.case && context.case.caseId,
    context.case && context.case.id,
    context.reportId,
    context.params && context.params.reportId,
    context.report && context.report.reportId,
    context.report && context.report.id,
    context.serviceReport && context.serviceReport.reportId,
  );
}

function isAuthorizedContext(context) {
  if (!isObject(context)) {
    return false;
  }

  if (hasMalformedCustomerAccessIdentifier(context)) {
    return false;
  }

  const access = isObject(context.access) ? context.access : {};
  const customerIdentity = isObject(context.customerIdentity) ? context.customerIdentity : {};
  const auth = isObject(context.auth) ? context.auth : {};

  const organizationScopeMatched = context.organizationScopeMatched === true
    || access.organizationScopeMatched === true
    || access.organizationScope === true
    || access.organizationScopeMatches === true;
  const customerIdentityVerified = context.customerIdentityVerified === true
    || auth.customerIdentityVerified === true
    || customerIdentity.verified === true;
  const caseLinkedToCustomer = context.caseLinkedToCustomer === true
    || access.caseLinkedToCustomer === true
    || access.caseLinkage === true;
  const publicationAllowed = customerAccessPublicationStateGuardPasses(context);
  const customerVisiblePolicyPassed = context.customerVisiblePolicyPassed === true
    || access.customerVisiblePolicyPassed === true
    || access.customerVisiblePolicy === true;

  return Boolean(
    contextOrganizationId(context) &&
    contextCustomerId(context) &&
    organizationScopeMatched &&
    customerIdentityVerified &&
    caseLinkedToCustomer &&
    publicationAllowed &&
    customerVisiblePolicyPassed,
  );
}

function valuesMatch(left, right) {
  return Boolean(left && right && left === right);
}

function rowReportId(row) {
  return identifierValue(rowValue(row, 'public_report_id', 'publicReportId'));
}

function rowValue(row, ...keys) {
  for (const key of keys) {
    const value = stringValue(row && row[key]);

    if (value) {
      return value;
    }
  }

  return undefined;
}

function completionTimeValue(value) {
  const candidate = stringValue(value);

  return candidate && /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(candidate)
    ? candidate
    : undefined;
}

function customerDisplayValue(value) {
  const candidate = stringValue(value);

  if (!candidate) {
    return undefined;
  }

  if (/^(?:[a-z][a-z0-9+.-]*:|\/|\.{1,2}\/|.*(?:token|secret|password|select\s+|from\s+cases|postgres:\/\/).*)/i.test(candidate)) {
    return undefined;
  }

  return candidate;
}

function buildQuerySpec({ organizationId, customerId, caseId, reportId }) {
  return Object.freeze({
    name: 'customerServiceReportProjection',
    readOnly: true,
    text: [
      'select organization_id, customer_id, case_id, public_report_id,',
      'publication_allowed, customer_visible_policy_passed, publication_state, customer_visible,',
      'case_display_id, service_status_display, appointment_window,',
      'engineer_display_name, service_summary, completion_time, public_attachments',
      'from customer_visible_service_reports',
      'where organization_id = $1 and customer_id = $2 and case_id = $3 and public_report_id = $4',
      'limit 1',
    ].join(' '),
    values: Object.freeze([organizationId, customerId, caseId, reportId]),
  });
}

function rowsFromResult(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (isObject(result) && Array.isArray(result.rows)) {
    return result.rows;
  }

  return [];
}

function attachmentValue(value, key) {
  if (FORBIDDEN_ATTACHMENT_KEYS.has(key)) {
    return undefined;
  }

  return stringValue(value);
}

function attachmentLabelValue(value) {
  const candidate = attachmentValue(value, 'label');

  if (!candidate) {
    return undefined;
  }

  if (/^(?:[a-z][a-z0-9+.-]*:|\/|\.{1,2}\/|.*(?:token|secret|password|signed|private).*)/i.test(candidate)) {
    return undefined;
  }

  return candidate;
}

function attachmentMimeTypeValue(value) {
  const candidate = stringValue(value);

  return candidate && /^[A-Za-z0-9][A-Za-z0-9.+-]{0,126}\/[A-Za-z0-9][A-Za-z0-9.+-]{0,126}$/.test(candidate)
    ? candidate
    : undefined;
}

function attachmentVisibilityState(value) {
  if (!isObject(value)) {
    return undefined;
  }

  return normalizedState(value.visibility)
    || normalizedState(value.visibilityState)
    || normalizedState(value.visibility_state)
    || normalizedState(value.publicationState)
    || normalizedState(value.publication_state)
    || normalizedState(value.status)
    || normalizedState(value.state);
}

function attachmentVisibilityDenied(value) {
  if (!isObject(value)) {
    return true;
  }

  const state = attachmentVisibilityState(value);

  return value.customer_visible === false
    || value.customerVisible === false
    || value.public === false
    || value.publiclyVisible === false
    || value.publicly_visible === false
    || value.customerVisiblePolicyPassed === false
    || value.customer_visible_policy_passed === false
    || value.internal === true
    || value.internalOnly === true
    || value.internal_only === true
    || value.draft === true
    || value.deleted === true
    || value.isDeleted === true
    || value.is_deleted === true
    || value.rejected === true
    || value.revoked === true
    || value.hidden === true
    || Boolean(value.deletedAt || value.deleted_at || value.rejectedAt || value.rejected_at)
    || Boolean(state && DENIED_ATTACHMENT_VISIBILITY_STATES.has(state));
}

function attachmentVisibilityAllows(value) {
  if (!isObject(value) || attachmentVisibilityDenied(value)) {
    return false;
  }

  const state = attachmentVisibilityState(value);

  return value.customer_visible === true
    || value.customerVisible === true
    || value.public === true
    || value.publiclyVisible === true
    || value.publicly_visible === true
    || value.customerVisiblePolicyPassed === true
    || value.customer_visible_policy_passed === true
    || Boolean(state && ALLOWED_ATTACHMENT_VISIBILITY_STATES.has(state));
}

function mapAttachment(value) {
  if (!isObject(value)) {
    return undefined;
  }

  if (!attachmentVisibilityAllows(value)) {
    return undefined;
  }

  const attachment = {};
  const attachmentId = identifierValue(value.attachmentId || value.attachment_id || value.publicAttachmentId);
  const label = attachmentLabelValue(value.label || value.displayName || value.fileName);
  const mimeType = attachmentMimeTypeValue(value.mimeType || value.mime_type);

  if (!attachmentId) {
    return undefined;
  }

  attachment.attachmentId = attachmentId;

  if (label) {
    attachment.label = label;
  }

  if (mimeType) {
    attachment.mimeType = mimeType;
  }

  return Object.keys(attachment).length > 0 ? attachment : undefined;
}

function safeAttachments(row) {
  const source = Array.isArray(row.publicAttachments)
    ? row.publicAttachments
    : row.public_attachments;

  if (!Array.isArray(source)) {
    return undefined;
  }

  const attachments = source
    .map(mapAttachment)
    .filter(Boolean);

  return attachments.length > 0 ? attachments : undefined;
}

function mapProjection(row) {
  if (!isObject(row)) {
    return undefined;
  }

  const serviceReport = {};
  const customerReportReference = identifierValue(rowValue(row, 'customerReportReference', 'public_report_id', 'publicReportId'));
  const caseReference = customerDisplayValue(rowValue(row, 'caseReference', 'case_display_id', 'caseDisplayId', 'customer_case_reference'));
  const serviceStatus = customerDisplayValue(rowValue(row, 'serviceStatus', 'service_status_display', 'serviceStatusDisplay', 'statusDisplay'));
  const appointmentWindow = customerDisplayValue(rowValue(row, 'appointmentWindow', 'appointment_window', 'appointmentDisplayTimeWindow'));
  const engineerDisplayName = customerDisplayValue(rowValue(row, 'engineerDisplayName', 'engineer_display_name'));
  const serviceSummary = rowValue(row, 'serviceSummary', 'service_summary', 'approved_service_summary');
  const completionTime = completionTimeValue(rowValue(row, 'completionTime', 'completion_time', 'completed_at'));
  const attachments = safeAttachments(row);

  if (customerReportReference) {
    serviceReport.customerReportReference = customerReportReference;
  }

  if (caseReference) {
    serviceReport.caseReference = caseReference;
  }

  if (serviceStatus) {
    serviceReport.serviceStatus = serviceStatus;
  }

  if (appointmentWindow) {
    serviceReport.appointmentWindow = appointmentWindow;
  }

  if (engineerDisplayName) {
    serviceReport.engineerDisplayName = engineerDisplayName;
  }

  if (serviceSummary) {
    serviceReport.serviceSummary = serviceSummary;
  }

  if (completionTime) {
    serviceReport.completionTime = completionTime;
  }

  if (attachments) {
    serviceReport.publicAttachments = attachments;
  }

  return Object.keys(serviceReport).length > 0 ? serviceReport : undefined;
}

function isCustomerVisibleRow(row, scope) {
  if (!isObject(row)) {
    return false;
  }

  if (row.customer_visible === false || row.customerVisible === false) {
    return false;
  }

  if (row.publication_allowed === false || row.publicationAllowed === false) {
    return false;
  }

  if (row.customer_visible_policy_passed === false || row.customerVisiblePolicyPassed === false) {
    return false;
  }

  if (row.customer_visible_policy_passed !== true && row.customerVisiblePolicyPassed !== true) {
    return false;
  }

  return serviceReportRowPublicationStateGuardPasses(row, scope);
}

async function queryProjection(dbClient, querySpec) {
  if (!isObject(dbClient) || typeof dbClient.query !== 'function') {
    return [];
  }

  const result = await dbClient.query(querySpec);

  return rowsFromResult(result);
}

async function getCustomerServiceReportProjection(options = {}) {
  if (!isObject(options)) {
    return buildSafeDenyEnvelope();
  }

  const { dbClient, customerAccessContext } = options;
  const caseId = identifierValue(options.caseId);
  const reportId = identifierValue(options.reportId);

  if (!isObject(dbClient) || typeof dbClient.query !== 'function') {
    return buildSafeDenyEnvelope();
  }

  if (!caseId || !reportId || !isAuthorizedContext(customerAccessContext)) {
    return buildSafeDenyEnvelope();
  }

  const organizationId = contextOrganizationId(customerAccessContext);
  const customerId = contextCustomerId(customerAccessContext);
  const scopedCaseId = contextCaseId(customerAccessContext);

  if (scopedCaseId && scopedCaseId !== caseId) {
    return buildSafeDenyEnvelope();
  }

  const querySpec = buildQuerySpec({
    organizationId,
    customerId,
    caseId,
    reportId,
  });

  try {
    const rows = await queryProjection(dbClient, querySpec);
    const row = rows.find((candidate) => (
      isCustomerVisibleRow(candidate, { caseId, reportId }) &&
      valuesMatch(rowValue(candidate, 'organization_id', 'organizationId'), organizationId) &&
      valuesMatch(rowValue(candidate, 'customer_id', 'customerId'), customerId) &&
      valuesMatch(rowValue(candidate, 'case_id', 'caseId'), caseId) &&
      valuesMatch(rowReportId(candidate), reportId)
    ));
    const projection = mapProjection(row);

    return projection ? buildAllowEnvelope(projection) : buildSafeDenyEnvelope();
  } catch (error) {
    return buildSafeDenyEnvelope();
  }
}

module.exports = {
  getCustomerServiceReportProjection,
};
