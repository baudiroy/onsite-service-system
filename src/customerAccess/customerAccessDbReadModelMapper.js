'use strict';

const CUSTOMER_ACCESS_READ_MODEL_QUERY_FIELDS = Object.freeze({
  requiredParams: Object.freeze([
    'organizationId',
    'caseId',
    'customerId',
  ]),
  rowSections: Object.freeze([
    'caseRow',
    'customerIdentityRow',
    'publicationRow',
    'serviceReportRow',
  ]),
  customerVisibleServiceReportFields: Object.freeze([
    'publicReportId',
    'status',
  ]),
});

const CUSTOMER_ACCESS_READ_MODEL_STATEMENTS = Object.freeze([
  Object.freeze({
    key: 'case',
    sql: [
      'select id, organization_id, customer_id',
      'from cases',
      'where organization_id = $1 and id = $2 and customer_id = $3',
      'limit 1',
    ].join(' '),
    params: Object.freeze(['organizationId', 'caseId', 'customerId']),
  }),
  Object.freeze({
    key: 'customerIdentity',
    sql: [
      'select customer_id, organization_id, verified, line_channel_id',
      'from customer_channel_identities',
      'where organization_id = $1 and customer_id = $2 and verified = true',
      'limit 1',
    ].join(' '),
    params: Object.freeze(['organizationId', 'customerId']),
  }),
  Object.freeze({
    key: 'publication',
    sql: [
      'select case_id, organization_id, publication_allowed, customer_visible_policy_passed',
      'from customer_access_publications',
      'where organization_id = $1 and case_id = $2',
      'limit 1',
    ].join(' '),
    params: Object.freeze(['organizationId', 'caseId']),
  }),
  Object.freeze({
    key: 'serviceReport',
    sql: [
      'select public_report_id, status',
      'from customer_visible_service_reports',
      'where organization_id = $1 and case_id = $2',
      'limit 1',
    ].join(' '),
    params: Object.freeze(['organizationId', 'caseId']),
  }),
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

function emptyReadModel() {
  return {
    organizationScope: {
      matched: false,
      organizationId: null,
    },
    customerIdentity: {
      verified: false,
      customerId: null,
    },
    caseLinkage: {
      linked: false,
      caseId: null,
    },
    publication: {
      allowed: false,
      customerVisiblePolicyPassed: false,
    },
    customerVisibleProjection: {
      available: false,
      data: {},
    },
  };
}

function partiallyScopedReadModel(caseRow) {
  const caseId = stringValue(caseRow && caseRow.id);
  const organizationId = stringValue(caseRow && caseRow.organization_id);

  return {
    organizationScope: {
      matched: Boolean(organizationId && caseId),
      organizationId: organizationId || null,
    },
    customerIdentity: {
      verified: false,
      customerId: null,
    },
    caseLinkage: {
      linked: false,
      caseId: caseId || null,
    },
    publication: {
      allowed: false,
      customerVisiblePolicyPassed: false,
    },
    customerVisibleProjection: {
      available: false,
      data: {},
    },
  };
}

function rowOrganizationId(row) {
  return stringValue(row && row.organization_id);
}

function hasOrganizationMismatch(expectedOrganizationId, rows) {
  return rows.some((row) => {
    if (!isObject(row)) {
      return false;
    }

    const organizationId = rowOrganizationId(row);
    return Boolean(organizationId && organizationId !== expectedOrganizationId);
  });
}

function mapServiceReportProjection(serviceReportRow) {
  const publicReportId = stringValue(serviceReportRow && serviceReportRow.public_report_id)
    || stringValue(serviceReportRow && serviceReportRow.publicReportId);
  const status = stringValue(serviceReportRow && serviceReportRow.status);

  if (!publicReportId || !status) {
    return {
      available: false,
      data: {},
    };
  }

  return {
    available: true,
    data: {
      serviceReport: {
        publicReportId,
        status,
      },
    },
  };
}

function mapCustomerAccessDbRowsToReadModel(input) {
  if (!isObject(input) || !isObject(input.caseRow)) {
    return emptyReadModel();
  }

  const caseRow = input.caseRow;
  const caseId = stringValue(caseRow.id);
  const organizationId = rowOrganizationId(caseRow);
  const caseCustomerId = stringValue(caseRow.customer_id);

  if (!caseId || !organizationId) {
    return emptyReadModel();
  }

  if (hasOrganizationMismatch(organizationId, [
    input.customerIdentityRow,
    input.publicationRow,
    input.serviceReportRow,
  ])) {
    return emptyReadModel();
  }

  if (!caseCustomerId) {
    return partiallyScopedReadModel(caseRow);
  }

  const identityRow = isObject(input.customerIdentityRow) ? input.customerIdentityRow : undefined;
  const identityCustomerId = stringValue(identityRow && identityRow.customer_id);

  if (identityCustomerId && identityCustomerId !== caseCustomerId) {
    return emptyReadModel();
  }

  const publicationRow = isObject(input.publicationRow) ? input.publicationRow : undefined;
  const publicationCaseId = stringValue(publicationRow && publicationRow.case_id);

  if (publicationCaseId && publicationCaseId !== caseId) {
    return emptyReadModel();
  }

  const identityVerified = Boolean(identityCustomerId && booleanTrue(identityRow.verified));
  const publicationAllowed = Boolean(publicationRow && booleanTrue(publicationRow.publication_allowed));
  const customerVisiblePolicyPassed = Boolean(
    publicationAllowed && booleanTrue(publicationRow.customer_visible_policy_passed),
  );
  const projection = mapServiceReportProjection(input.serviceReportRow);

  return {
    organizationScope: {
      matched: true,
      organizationId,
    },
    customerIdentity: {
      verified: identityVerified,
      customerId: identityVerified ? caseCustomerId : null,
      ...(identityVerified && stringValue(identityRow.line_channel_id)
        ? { lineChannelId: stringValue(identityRow.line_channel_id) }
        : {}),
    },
    caseLinkage: {
      linked: true,
      caseId,
    },
    publication: {
      allowed: publicationAllowed,
      customerVisiblePolicyPassed,
    },
    customerVisibleProjection: customerVisiblePolicyPassed ? projection : {
      available: false,
      data: {},
    },
  };
}

function queryParamValue(input, key) {
  return stringValue(input && input[key]) || null;
}

function buildCustomerAccessReadModelQuerySpec(input) {
  const params = {
    organizationId: queryParamValue(input, 'organizationId'),
    caseId: queryParamValue(input, 'caseId'),
    customerId: queryParamValue(input, 'customerId'),
  };
  const executable = CUSTOMER_ACCESS_READ_MODEL_QUERY_FIELDS.requiredParams.every((key) => (
    Boolean(params[key])
  ));

  return {
    name: 'customerAccessReadModel',
    executable,
    params,
    requiredParams: [...CUSTOMER_ACCESS_READ_MODEL_QUERY_FIELDS.requiredParams],
    statements: CUSTOMER_ACCESS_READ_MODEL_STATEMENTS.map((statement) => ({
      key: statement.key,
      sql: statement.sql,
      params: [...statement.params],
    })),
  };
}

module.exports = {
  CUSTOMER_ACCESS_READ_MODEL_QUERY_FIELDS,
  buildCustomerAccessReadModelQuerySpec,
  mapCustomerAccessDbRowsToReadModel,
};
