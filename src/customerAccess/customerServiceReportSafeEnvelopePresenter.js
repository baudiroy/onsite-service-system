'use strict';

const DENY_MESSAGE_KEY = 'customerAccess.unavailable';
const ALLOW_MESSAGE_KEY = 'customerAccess.serviceReport.available';

const SERVICE_REPORT_RESPONSE_KEYS = Object.freeze([
  'customerReportReference',
  'caseReference',
  'serviceStatus',
  'appointmentWindow',
  'engineerDisplayName',
  'serviceSummary',
  'completionTime',
]);

const PUBLIC_ATTACHMENT_RESPONSE_KEYS = Object.freeze([
  'attachmentId',
  'label',
  'mimeType',
]);

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function safeString(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function buildCustomerServiceReportSafeDenyEnvelope() {
  return {
    ok: false,
    status: 'deny',
    messageKey: DENY_MESSAGE_KEY,
  };
}

function projectionSource(input) {
  if (!isPlainObject(input) || input.status === 'deny' || input.customerVisible === false) {
    return undefined;
  }

  if (isPlainObject(input.data) && isPlainObject(input.data.serviceReport)) {
    return input.data.serviceReport;
  }

  if (isPlainObject(input.serviceReport)) {
    return input.serviceReport;
  }

  return input;
}

function publicAttachmentEnvelope(input) {
  if (!isPlainObject(input)) {
    return undefined;
  }

  const attachment = {};

  for (const key of PUBLIC_ATTACHMENT_RESPONSE_KEYS) {
    const value = safeString(input[key]);

    if (value) {
      attachment[key] = value;
    }
  }

  return Object.keys(attachment).length > 0 ? attachment : undefined;
}

function publicAttachmentsEnvelope(input) {
  if (!Array.isArray(input)) {
    return undefined;
  }

  const attachments = input
    .map(publicAttachmentEnvelope)
    .filter(Boolean);

  return attachments.length > 0 ? attachments : undefined;
}

function buildCustomerServiceReportSafeEnvelope(input) {
  const source = projectionSource(input);

  if (!source) {
    return buildCustomerServiceReportSafeDenyEnvelope();
  }

  const envelope = {
    ok: true,
    status: 'allow',
    messageKey: ALLOW_MESSAGE_KEY,
  };

  for (const key of SERVICE_REPORT_RESPONSE_KEYS) {
    const value = safeString(source[key]);

    if (value) {
      envelope[key] = value;
    }
  }

  const publicAttachments = publicAttachmentsEnvelope(source.publicAttachments);

  if (publicAttachments) {
    envelope.publicAttachments = publicAttachments;
  }

  return Object.keys(envelope).length > 3
    ? envelope
    : buildCustomerServiceReportSafeDenyEnvelope();
}

module.exports = {
  buildCustomerServiceReportSafeDenyEnvelope,
  buildCustomerServiceReportSafeEnvelope,
};
