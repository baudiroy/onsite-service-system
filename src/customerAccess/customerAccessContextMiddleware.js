'use strict';

const { buildCustomerAccessContext } = require('./customerAccessContextProvider');
const { createCustomerAccessReadOnlyRepository } = require('./customerAccessReadOnlyRepository');

const CUSTOMER_ACCESS_CONTEXT_SECTIONS = Object.freeze([
  'params',
  'auth',
  'channel',
  'access',
  'customerVisibleData',
]);
const AUTH_KEYS = Object.freeze([
  'organizationId',
  'customerId',
  'customerIdentityVerified',
]);
const ACCESS_KEYS = Object.freeze([
  'organizationScopeMatched',
  'caseLinkedToCustomer',
  'publicationAllowed',
  'customerVisiblePolicyPassed',
]);
const CUSTOMER_VISIBLE_DATA_FORBIDDEN_KEYS = new Set([
  'address',
  'aiRawPayload',
  'ai_draft_summary',
  'ai_generated_summary',
  'authorization',
  'billingInternalData',
  'body',
  'channelSecret',
  'connection',
  'cookie',
  'cookies',
  'debug',
  'diagnosis_notes',
  'engineer_notes',
  'env',
  'fullAddress',
  'fullPhone',
  'headers',
  'internalBillingData',
  'internalNote',
  'internalPolicyDetails',
  'internalSettlementData',
  'lineAccessToken',
  'lineProfile',
  'lineUserId',
  'line_user_id',
  'phone',
  'policyDetails',
  'policyEngineResult',
  'policyRuleList',
  'providerPayload',
  'providerRawPayload',
  'rawAddress',
  'rawBody',
  'rawHeaders',
  'rawLineId',
  'rawLineUserId',
  'rawPhone',
  'rawPolicyResult',
  'rawRequest',
  'raw_payload',
  'refreshToken',
  'request',
  'req',
  'ruleList',
  'secret',
  'session',
  'sessionSecret',
  'socket',
  'stack',
  'token',
  'user',
  'zeabur',
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
    isPromiseLike(value)
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

function isPromiseLike(value) {
  return Boolean(value) && typeof safeProperty(value, 'then') === 'function';
}

function contextInputFromRequest(req) {
  return isPlainObject(req) ? safeProperty(req, 'customerAccessContextInput') : undefined;
}

function objectOrEmpty(value) {
  return isPlainObject(value) ? value : {};
}

function hasOwn(value, key) {
  return isPlainObject(value) && Object.prototype.hasOwnProperty.call(value, key);
}

function safeIdentifierValue(value) {
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

function safeBoolean(value) {
  return value === true;
}

function sanitizedParams(value) {
  const params = objectOrEmpty(value);
  const caseId = safeIdentifierValue(safeProperty(params, 'caseId'));

  return caseId ? { caseId } : {};
}

function sanitizedAuth(value) {
  const auth = objectOrEmpty(value);
  const organizationId = safeIdentifierValue(safeProperty(auth, 'organizationId'));
  const customerId = safeIdentifierValue(safeProperty(auth, 'customerId'));

  return {
    ...(organizationId ? { organizationId } : {}),
    ...(customerId ? { customerId } : {}),
    customerIdentityVerified: safeBoolean(safeProperty(auth, 'customerIdentityVerified')),
  };
}

function sanitizedAccess(value) {
  const access = objectOrEmpty(value);

  return {
    organizationScopeMatched: safeBoolean(safeProperty(access, 'organizationScopeMatched')),
    caseLinkedToCustomer: safeBoolean(safeProperty(access, 'caseLinkedToCustomer')),
    publicationAllowed: safeBoolean(safeProperty(access, 'publicationAllowed')),
    customerVisiblePolicyPassed: safeBoolean(safeProperty(access, 'customerVisiblePolicyPassed')),
  };
}

function sanitizeCustomerVisibleData(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeCustomerVisibleData);
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const sanitized = {};

  for (const [key, childValue] of Object.entries(value)) {
    if (CUSTOMER_VISIBLE_DATA_FORBIDDEN_KEYS.has(key)) {
      continue;
    }

    sanitized[key] = sanitizeCustomerVisibleData(childValue);
  }

  return sanitized;
}

function sanitizedCustomerAccessContext(context) {
  const safeContext = objectOrEmpty(context);

  return {
    params: sanitizedParams(safeProperty(safeContext, 'params')),
    auth: sanitizedAuth(safeProperty(safeContext, 'auth')),
    channel: {},
    access: sanitizedAccess(safeProperty(safeContext, 'access')),
    customerVisibleData: sanitizeCustomerVisibleData(
      objectOrEmpty(safeProperty(safeContext, 'customerVisibleData')),
    ),
  };
}

function inputFromMiddleware(getInput, req, res) {
  try {
    return getInput(req, res);
  } catch (error) {
    return undefined;
  }
}

function contextFromMiddlewareInput(input, repository) {
  try {
    return buildCustomerAccessContext(input, { repository });
  } catch (error) {
    return buildCustomerAccessContext();
  }
}

function applyCustomerAccessContextToRequest(req, context) {
  if (!isPlainObject(req)) {
    return req;
  }

  const safeContext = sanitizedCustomerAccessContext(context);
  const routeParams = hasOwn(req, 'customerAccessRouteParams')
    ? sanitizedParams(safeProperty(req, 'customerAccessRouteParams'))
    : sanitizedParams(safeProperty(req, 'params'));

  if (!hasOwn(req, 'customerAccessRouteParams')) {
    req.customerAccessRouteParams = routeParams;
  }

  req.params = {
    ...safeContext.params,
    ...routeParams,
  };
  req.auth = safeContext.auth;
  req.channel = safeContext.channel;
  req.access = safeContext.access;
  req.customerVisibleData = safeContext.customerVisibleData;
  req.customerAccessContext = safeContext;

  return req;
}

function buildCustomerAccessContextMiddleware(options) {
  const safeOptions = isObject(options) ? options : {};
  const getInput = typeof safeOptions.getInput === 'function'
    ? safeOptions.getInput
    : contextInputFromRequest;
  const repository = safeOptions.repository || (
    safeOptions.readModel || safeOptions.dataProvider || safeOptions.queryExecutor
      ? createCustomerAccessReadOnlyRepository({
        readModel: safeOptions.readModel,
        dataProvider: safeOptions.dataProvider,
        queryExecutor: safeOptions.queryExecutor,
      })
      : undefined
  );

  return function customerAccessContextMiddleware(req, res, next) {
    const input = inputFromMiddleware(getInput, req, res);
    const context = contextFromMiddlewareInput(input, repository);

    if (isPromiseLike(context)) {
      return context
        .then((resolvedContext) => {
          applyCustomerAccessContextToRequest(req, resolvedContext);

          if (typeof next === 'function') {
            return next();
          }

          return undefined;
        })
        .catch(() => {
          applyCustomerAccessContextToRequest(req, buildCustomerAccessContext());

          if (typeof next === 'function') {
            return next();
          }

          return undefined;
        });
    }

    applyCustomerAccessContextToRequest(req, context);

    if (typeof next === 'function') {
      return next();
    }

    return undefined;
  };
}

module.exports = {
  applyCustomerAccessContextToRequest,
  buildCustomerAccessContextMiddleware,
  CUSTOMER_ACCESS_CONTEXT_SECTIONS,
  AUTH_KEYS,
  ACCESS_KEYS,
};
