'use strict';

const {
  buildCustomerAccessReadModelQuerySpec,
  mapCustomerAccessDbRowsToReadModel,
} = require('./customerAccessDbReadModelMapper');

const FORBIDDEN_KEYS = new Set([
  'address',
  'aiRawPayload',
  'auditLog',
  'billingInternalData',
  'channelSecret',
  'fullAddress',
  'fullPhone',
  'internalBillingData',
  'internalNote',
  'internalSettlementData',
  'lineAccessToken',
  'lineUserId',
  'line_user_id',
  'phone',
  'rawAddress',
  'rawLineId',
  'rawLineUserId',
  'rawPhone',
  'secret',
  'settlementInternalData',
  'token',
]);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function sanitizeCustomerVisibleData(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeCustomerVisibleData);
  }

  if (!isObject(value)) {
    return value;
  }

  const sanitized = {};

  for (const [key, childValue] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) {
      continue;
    }

    sanitized[key] = sanitizeCustomerVisibleData(childValue);
  }

  return sanitized;
}

function sourceFromOptions(options) {
  if (!isObject(options)) {
    return undefined;
  }

  return isObject(options.readModel) ? options.readModel : options.dataProvider;
}

function queryExecutorFromOptions(options) {
  return isObject(options) && typeof options.queryExecutor === 'function'
    ? options.queryExecutor
    : undefined;
}

function buildReadModelFromQueryExecutor(queryExecutor, input) {
  if (typeof queryExecutor !== 'function') {
    return undefined;
  }

  try {
    const querySpec = buildCustomerAccessReadModelQuerySpec(input);

    if (!querySpec.executable) {
      return undefined;
    }

    const rows = queryExecutor(querySpec, input);

    return isObject(rows) ? mapCustomerAccessDbRowsToReadModel(rows) : undefined;
  } catch (error) {
    return undefined;
  }
}

function readSection(source, sectionName, input) {
  try {
    if (!isObject(source)) {
      return undefined;
    }

    const value = source[sectionName];

    if (typeof value === 'function') {
      const result = value(input);
      return isObject(result) ? result : undefined;
    }

    return isObject(value) ? value : undefined;
  } catch (error) {
    return undefined;
  }
}

function unmatchedOrganizationScope() {
  return {
    available: false,
    matched: false,
    organizationId: null,
  };
}

function unverifiedCustomerIdentity() {
  return {
    available: false,
    verified: false,
    customerId: null,
  };
}

function unlinkedCase() {
  return {
    available: false,
    linked: false,
    caseId: null,
  };
}

function unpublishedState() {
  return {
    available: false,
    allowed: false,
    customerVisiblePolicyPassed: false,
  };
}

function unavailableProjection() {
  return {
    available: false,
    data: {},
  };
}

function createCustomerAccessReadOnlyRepository(options) {
  const source = sourceFromOptions(options);
  const queryExecutor = queryExecutorFromOptions(options);

  function sourceForInput(input) {
    return source || buildReadModelFromQueryExecutor(queryExecutor, input);
  }

  return {
    getOrganizationScope(input) {
      const section = readSection(sourceForInput(input), 'organizationScope', input);
      const organizationId = stringValue(section && section.organizationId);
      const matched = Boolean(section && (section.matched === true || section.organizationScopeMatched === true));

      if (!organizationId || !matched) {
        return unmatchedOrganizationScope();
      }

      return {
        available: true,
        matched: true,
        organizationId,
      };
    },
    getVerifiedCustomerIdentity(input) {
      const section = readSection(sourceForInput(input), 'customerIdentity', input);
      const customerId = stringValue(section && section.customerId);
      const verified = Boolean(section && (section.verified === true || section.customerIdentityVerified === true));

      if (!customerId || !verified) {
        return unverifiedCustomerIdentity();
      }

      return {
        available: true,
        verified: true,
        customerId,
      };
    },
    getCaseLinkage(input) {
      const section = readSection(sourceForInput(input), 'caseLinkage', input);
      const caseId = stringValue(section && section.caseId);
      const linked = Boolean(section && (section.linked === true || section.caseLinkedToCustomer === true));

      if (!caseId || !linked) {
        return unlinkedCase();
      }

      return {
        available: true,
        linked: true,
        caseId,
      };
    },
    getPublicationState(input) {
      const section = readSection(sourceForInput(input), 'publication', input);
      const allowed = Boolean(section && (section.allowed === true || section.publicationAllowed === true));

      if (!allowed) {
        return unpublishedState();
      }

      return {
        available: true,
        allowed: true,
        customerVisiblePolicyPassed: false,
      };
    },
    getCustomerVisibleProjection(input) {
      const section = readSection(sourceForInput(input), 'customerVisibleProjection', input);
      const data = section && (isObject(section.data) ? section.data : section.customerVisibleData);

      if (!section || section.available !== true || !isObject(data)) {
        return unavailableProjection();
      }

      return {
        available: true,
        data: sanitizeCustomerVisibleData(data),
      };
    },
  };
}

module.exports = {
  createCustomerAccessReadOnlyRepository,
};
