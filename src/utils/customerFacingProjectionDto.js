const { isVerifiedCustomerAccessContext } = require('./customerAccessContext');
const { isCustomerFacingForbiddenFieldName } = require('./customerFacingForbiddenFields');

const CUSTOMER_FACING_DTO_TYPE = Object.freeze({
  TIMELINE: 'timeline',
  SERVICE_REPORT: 'service_report',
  UNAVAILABLE: 'unavailable'
});

const TIMELINE_ALLOWED_FIELDS = Object.freeze([
  'serviceDisplayTitle',
  'customerCaseReference',
  'appointmentStatusDisplay',
  'appointmentWindow',
  'visitOutcomeSummary',
  'nextCustomerAction',
  'supportContactHint'
]);

const SERVICE_REPORT_ALLOWED_FIELDS = Object.freeze([
  'customerReportReference',
  'serviceDate',
  'servicedItemSummary',
  'issueSummary',
  'workPerformedSummary',
  'partsSummary',
  'chargesSummary',
  'warrantyOrFollowUpHint',
  'supportContactHint'
]);

const UNAVAILABLE_ALLOWED_FIELDS = Object.freeze(['supportContactHint']);

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeCustomerSafeValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeCustomerSafeValue);
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.entries(value).reduce((sanitized, [key, entryValue]) => {
    if (isCustomerFacingForbiddenFieldName(key)) {
      return sanitized;
    }

    sanitized[key] = sanitizeCustomerSafeValue(entryValue);
    return sanitized;
  }, {});
}

function isAccessContextBlockingProjection(options) {
  if (!Object.prototype.hasOwnProperty.call(options, 'accessContext')) {
    return true;
  }

  return !isPlainObject(options.accessContext) || !isVerifiedCustomerAccessContext(options.accessContext);
}

function buildDtoFromAllowedFields(dtoType, options, allowedFields) {
  if (!isPlainObject(options) || isAccessContextBlockingProjection(options)) {
    return buildCustomerUnavailableProjectionDto();
  }

  return allowedFields.reduce(
    (dto, fieldName) => {
      if (Object.prototype.hasOwnProperty.call(options, fieldName)) {
        dto[fieldName] = sanitizeCustomerSafeValue(options[fieldName]);
      }

      return dto;
    },
    { dtoType }
  );
}

function buildCustomerTimelineProjectionDto(options = {}) {
  return buildDtoFromAllowedFields(CUSTOMER_FACING_DTO_TYPE.TIMELINE, options, TIMELINE_ALLOWED_FIELDS);
}

function buildCustomerServiceReportProjectionDto(options = {}) {
  return buildDtoFromAllowedFields(
    CUSTOMER_FACING_DTO_TYPE.SERVICE_REPORT,
    options,
    SERVICE_REPORT_ALLOWED_FIELDS
  );
}

function buildCustomerUnavailableProjectionDto(options = {}) {
  const dto = { dtoType: CUSTOMER_FACING_DTO_TYPE.UNAVAILABLE };

  if (!isPlainObject(options)) {
    return dto;
  }

  return UNAVAILABLE_ALLOWED_FIELDS.reduce((unavailableDto, fieldName) => {
    if (Object.prototype.hasOwnProperty.call(options, fieldName)) {
      unavailableDto[fieldName] = sanitizeCustomerSafeValue(options[fieldName]);
    }

    return unavailableDto;
  }, dto);
}

module.exports = {
  CUSTOMER_FACING_DTO_TYPE,
  buildCustomerTimelineProjectionDto,
  buildCustomerServiceReportProjectionDto,
  buildCustomerUnavailableProjectionDto
};
