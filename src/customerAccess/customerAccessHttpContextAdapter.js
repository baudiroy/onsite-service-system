'use strict';

const HTTP_CONTEXT_INPUT_DTO_KEYS = Object.freeze([
  'caseId',
  'customerAccessContext',
]);
const CUSTOMER_ACCESS_CONTEXT_SECTIONS = Object.freeze([
  'params',
  'auth',
  'channel',
  'access',
  'customerVisibleData',
]);
const CUSTOMER_VISIBLE_DATA_KEYS = Object.freeze([
  'serviceReport',
]);
const CUSTOMER_VISIBLE_SERVICE_REPORT_KEYS = Object.freeze([
  'caseNo',
  'finalAppointmentId',
  'publicReportId',
  'status',
  'summary',
]);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isPlainObject(value) {
  if (!isObject(value)) {
    return false;
  }

  if (
    value instanceof Date ||
    value instanceof Error ||
    (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) ||
    isThenable(value)
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

function isThenable(value) {
  return Boolean(value) && typeof safeProperty(value, 'then') === 'function';
}

function inputDtoFromInput(input) {
  if (!isPlainObject(input)) {
    return {};
  }

  const dto = {};

  for (const key of HTTP_CONTEXT_INPUT_DTO_KEYS) {
    dto[key] = safeProperty(input, key);
  }

  return dto;
}

function isUnsafeCustomerVisibleString(value) {
  return /(?:['"`;=]|--|\/\*|\*\/|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bunion\b|\bbearer\b|\bauthorization\b|\bcookie\b|\bset-cookie\b|\btoken\b|\bjwt\b|\bapi[-_ ]?key\b|\bheader\b|\bstack\b|\bat\s+\w+\s*\()/i
    .test(value);
}

function isSafeCustomerVisibleValue(value) {
  if (value === null || ['number', 'boolean'].includes(typeof value)) {
    return true;
  }

  return typeof value === 'string' && !isUnsafeCustomerVisibleString(value);
}

function sanitizedCustomerVisibleServiceReport(value) {
  const source = isPlainObject(value) ? value : {};
  const serviceReport = {};

  for (const key of CUSTOMER_VISIBLE_SERVICE_REPORT_KEYS) {
    const fieldValue = safeProperty(source, key);

    if (isSafeCustomerVisibleValue(fieldValue)) {
      serviceReport[key] = fieldValue;
    }
  }

  return serviceReport;
}

function sanitizeCustomerVisibleData(value) {
  const source = isPlainObject(value) ? value : {};
  const data = {};

  for (const key of CUSTOMER_VISIBLE_DATA_KEYS) {
    if (key === 'serviceReport') {
      const serviceReport = sanitizedCustomerVisibleServiceReport(
        safeProperty(source, key),
      );

      if (Object.keys(serviceReport).length > 0) {
        data[key] = serviceReport;
      }
    }
  }

  return data;
}

function emptyRequestLikeInput() {
  return {
    organizationId: undefined,
    caseId: undefined,
    customerId: undefined,
    isCustomerIdentityVerified: false,
    isCaseLinkedToCustomer: false,
    isPublicationAllowed: false,
    isCustomerVisiblePolicyPassed: false,
    organizationScopeMatches: false,
    channelIdentityPresent: false,
    scopedChannelIdentityPresent: false,
    customerVisibleData: {},
  };
}

function stringValue(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  if (
    !trimmed ||
    trimmed.length > 128 ||
    /(?:['"`;=]|--|\/\*|\*\/|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bunion\b|\bbearer\b|\bauthorization\b|\bcookie\b|\bset-cookie\b|\btoken\b|\bjwt\b|\bapi[-_ ]?key\b|\bheader\b)/i
      .test(trimmed)
  ) {
    return undefined;
  }

  return /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(trimmed) ? trimmed : undefined;
}

function contextFromInput(input) {
  const inputDto = inputDtoFromInput(input);
  const caseId = stringValue(safeProperty(inputDto, 'caseId'));
  const customerAccessContext = safeProperty(inputDto, 'customerAccessContext');

  if (!caseId || !isPlainObject(customerAccessContext)) {
    return undefined;
  }

  const context = {};

  for (const key of CUSTOMER_ACCESS_CONTEXT_SECTIONS) {
    context[key] = safeProperty(customerAccessContext, key);
  }

  const params = safeProperty(context, 'params');

  if (!isPlainObject(params) || stringValue(safeProperty(params, 'caseId')) !== caseId) {
    return undefined;
  }

  return {
    params: {
      caseId,
    },
    auth: isPlainObject(safeProperty(context, 'auth'))
      ? safeProperty(context, 'auth')
      : {},
    channel: isPlainObject(safeProperty(context, 'channel'))
      ? safeProperty(context, 'channel')
      : {},
    access: isPlainObject(safeProperty(context, 'access'))
      ? safeProperty(context, 'access')
      : {},
    customerVisibleData: isPlainObject(safeProperty(context, 'customerVisibleData'))
      ? safeProperty(context, 'customerVisibleData')
      : {},
  };
}

function mapCustomerAccessHttpContext(input) {
  if (!isPlainObject(input)) {
    return emptyRequestLikeInput();
  }

  const context = contextFromInput(input);
  const params = isPlainObject(safeProperty(context, 'params')) ? safeProperty(context, 'params') : {};
  const auth = isPlainObject(safeProperty(context, 'auth')) ? safeProperty(context, 'auth') : {};
  const channel = isPlainObject(safeProperty(context, 'channel')) ? safeProperty(context, 'channel') : {};
  const access = isPlainObject(safeProperty(context, 'access')) ? safeProperty(context, 'access') : {};
  const organizationId = stringValue(safeProperty(auth, 'organizationId'));
  const caseId = stringValue(safeProperty(params, 'caseId'));
  const customerId = stringValue(safeProperty(auth, 'customerId'));
  const lineChannelId = stringValue(safeProperty(channel, 'lineChannelId'));
  const lineUserId = stringValue(safeProperty(channel, 'lineUserId'));

  return {
    organizationId,
    caseId,
    customerId,
    isCustomerIdentityVerified: safeProperty(auth, 'customerIdentityVerified') === true,
    isCaseLinkedToCustomer: Boolean(caseId) && safeProperty(access, 'caseLinkedToCustomer') === true,
    isPublicationAllowed: safeProperty(access, 'publicationAllowed') === true,
    isCustomerVisiblePolicyPassed: safeProperty(access, 'customerVisiblePolicyPassed') === true,
    organizationScopeMatches: safeProperty(access, 'organizationScopeMatched') === true,
    channelIdentityPresent: Boolean(lineChannelId && lineUserId),
    scopedChannelIdentityPresent: Boolean(organizationId && lineChannelId && lineUserId),
    customerVisibleData: sanitizeCustomerVisibleData(
      isPlainObject(safeProperty(context, 'customerVisibleData'))
        ? safeProperty(context, 'customerVisibleData')
        : {},
    ),
  };
}

module.exports = {
  mapCustomerAccessHttpContext,
};
