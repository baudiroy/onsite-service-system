const {
  CUSTOMER_ACCESS_PROJECTION_SCOPE,
  buildCustomerAccessContext,
  isVerifiedCustomerAccessContext
} = require('./customerAccessContext');
const {
  buildCustomerTimelineProjectionDto,
  buildCustomerServiceReportProjectionDto,
  buildCustomerUnavailableProjectionDto
} = require('./customerFacingProjectionDto');

const TIMELINE_SOURCE_TO_DTO_FIELDS = Object.freeze({
  serviceDisplayTitle: 'serviceDisplayTitle',
  customerCaseReference: 'customerCaseReference',
  appointmentStatusDisplay: 'appointmentStatusDisplay',
  appointmentWindow: 'appointmentWindow',
  visitOutcomeSummary: 'visitOutcomeSummary',
  nextCustomerAction: 'nextCustomerAction',
  supportContactHint: 'supportContactHint'
});

const SERVICE_REPORT_SOURCE_TO_DTO_FIELDS = Object.freeze({
  customerReportReference: 'customerReportReference',
  serviceDate: 'serviceDate',
  servicedItemSummary: 'servicedItemSummary',
  issueSummary: 'issueSummary',
  workPerformedSummary: 'workPerformedSummary',
  partsSummary: 'partsSummary',
  chargesSummary: 'chargesSummary',
  warrantyOrFollowUpHint: 'warrantyOrFollowUpHint',
  supportContactHint: 'supportContactHint'
});

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeAccessContext(accessContext) {
  if (!isPlainObject(accessContext)) {
    return buildCustomerAccessContext();
  }

  return accessContext;
}

function projectionScopeAllowsTimeline(accessContext) {
  return (
    accessContext.allowedProjectionScope === CUSTOMER_ACCESS_PROJECTION_SCOPE.TIMELINE ||
    accessContext.allowedProjectionScope === CUSTOMER_ACCESS_PROJECTION_SCOPE.TIMELINE_AND_SERVICE_REPORT
  );
}

function projectionScopeAllowsServiceReport(accessContext) {
  return (
    accessContext.allowedProjectionScope === CUSTOMER_ACCESS_PROJECTION_SCOPE.SERVICE_REPORT ||
    accessContext.allowedProjectionScope === CUSTOMER_ACCESS_PROJECTION_SCOPE.TIMELINE_AND_SERVICE_REPORT
  );
}

function mapAllowedSourceFields(source, fieldMap) {
  if (!isPlainObject(source)) {
    return {};
  }

  return Object.entries(fieldMap).reduce((projection, [sourceField, dtoField]) => {
    if (Object.prototype.hasOwnProperty.call(source, sourceField)) {
      projection[dtoField] = source[sourceField];
    }

    return projection;
  }, {});
}

function buildAccessUnavailableProjection(options = {}) {
  return buildCustomerUnavailableProjectionDto({
    supportContactHint: isPlainObject(options) ? options.supportContactHint : undefined
  });
}

function buildVerificationRequiredProjection(options = {}) {
  return buildAccessUnavailableProjection(options);
}

function buildTimelineProjection(options = {}) {
  const accessContext = normalizeAccessContext(options.accessContext);

  if (!isVerifiedCustomerAccessContext(accessContext) || !projectionScopeAllowsTimeline(accessContext)) {
    return buildAccessUnavailableProjection(options);
  }

  return buildCustomerTimelineProjectionDto({
    ...mapAllowedSourceFields(options.timelineSource, TIMELINE_SOURCE_TO_DTO_FIELDS),
    accessContext
  });
}

function buildServiceReportProjection(options = {}) {
  const accessContext = normalizeAccessContext(options.accessContext);

  if (!isVerifiedCustomerAccessContext(accessContext) || !projectionScopeAllowsServiceReport(accessContext)) {
    return buildAccessUnavailableProjection(options);
  }

  return buildCustomerServiceReportProjectionDto({
    ...mapAllowedSourceFields(options.serviceReportSource, SERVICE_REPORT_SOURCE_TO_DTO_FIELDS),
    accessContext
  });
}

module.exports = {
  buildTimelineProjection,
  buildServiceReportProjection,
  buildAccessUnavailableProjection,
  buildVerificationRequiredProjection
};
