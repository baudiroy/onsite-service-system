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

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function booleanTrue(value) {
  return value === true;
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
  return stringValue(context.organizationId)
    || stringValue(context.auth && context.auth.organizationId)
    || stringValue(context.organization && context.organization.organizationId)
    || stringValue(context.organization && context.organization.id);
}

function contextCustomerId(context) {
  return stringValue(context.customerId)
    || stringValue(context.auth && context.auth.customerId)
    || stringValue(context.customerIdentity && context.customerIdentity.customerId)
    || stringValue(context.customer && context.customer.id);
}

function contextCaseId(context) {
  return stringValue(context.caseId)
    || stringValue(context.params && context.params.caseId)
    || stringValue(context.case && context.case.caseId)
    || stringValue(context.case && context.case.id);
}

function isAuthorizedContext(context) {
  if (!isObject(context)) {
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
  const publicationAllowed = context.publicationAllowed === true
    || access.publicationAllowed === true
    || access.publication === true;
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

function rowValue(row, ...keys) {
  for (const key of keys) {
    const value = stringValue(row && row[key]);

    if (value) {
      return value;
    }
  }

  return undefined;
}

function buildQuerySpec({ organizationId, customerId, caseId, reportId }) {
  return Object.freeze({
    name: 'customerServiceReportProjection',
    readOnly: true,
    text: [
      'select public_report_id, case_display_id, service_status_display,',
      'appointment_window, engineer_display_name, service_summary, completion_time',
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

function mapAttachment(value) {
  if (!isObject(value)) {
    return undefined;
  }

  if (value.customer_visible === false || value.customerVisible === false) {
    return undefined;
  }

  const attachment = {};
  const attachmentId = attachmentValue(value.attachmentId || value.attachment_id || value.publicAttachmentId, 'attachmentId');
  const label = attachmentValue(value.label || value.displayName || value.fileName, 'label');
  const mimeType = attachmentValue(value.mimeType || value.mime_type, 'mimeType');

  if (attachmentId) {
    attachment.attachmentId = attachmentId;
  }

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
  const customerReportReference = rowValue(row, 'customerReportReference', 'public_report_id', 'publicReportId');
  const caseReference = rowValue(row, 'caseReference', 'case_display_id', 'caseDisplayId', 'customer_case_reference');
  const serviceStatus = rowValue(row, 'serviceStatus', 'service_status_display', 'serviceStatusDisplay', 'statusDisplay');
  const appointmentWindow = rowValue(row, 'appointmentWindow', 'appointment_window', 'appointmentDisplayTimeWindow');
  const engineerDisplayName = rowValue(row, 'engineerDisplayName', 'engineer_display_name');
  const serviceSummary = rowValue(row, 'serviceSummary', 'service_summary', 'approved_service_summary');
  const completionTime = rowValue(row, 'completionTime', 'completion_time', 'completed_at');
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

function isCustomerVisibleRow(row) {
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

  return true;
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
  const caseId = stringValue(options.caseId);
  const reportId = stringValue(options.reportId);

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
      isCustomerVisibleRow(candidate) &&
      valuesMatch(rowValue(candidate, 'organization_id', 'organizationId'), organizationId) &&
      valuesMatch(rowValue(candidate, 'customer_id', 'customerId'), customerId) &&
      valuesMatch(rowValue(candidate, 'case_id', 'caseId'), caseId) &&
      valuesMatch(rowValue(candidate, 'public_report_id', 'publicReportId', 'customerReportReference'), reportId)
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
