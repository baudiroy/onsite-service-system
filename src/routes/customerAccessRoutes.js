'use strict';

const { createCustomerAccessDbAdapter } = require('../customerAccess/customerAccessDbAdapter');
const { buildCustomerAccessContextMiddleware } = require('../customerAccess/customerAccessContextMiddleware');
const {
  buildCustomerAccessControllerResponse,
  handleCustomerAccessRequest,
} = require('../controllers/customerAccessController');
const {
  handleCustomerServiceReportProjectionRequest,
} = require('../customerAccess/customerServiceReportProjectionHandler');
const {
  recordCustomerServiceReportAuditEvent,
} = require('../customerAccess/customerServiceReportAuditBoundary');

const CUSTOMER_ACCESS_ROUTE_PATH = '/customer-access/:caseId';
const CUSTOMER_ACCESS_REPORT_ROUTE_PATH = '/customer-access/:caseId/service-report/:reportId';
const SAFE_DENY_ENVELOPE = Object.freeze({
  status: 'deny',
  messageKey: 'customerAccess.unavailable',
  customerVisible: false,
  data: null,
  error: Object.freeze({
    messageKey: 'customerAccess.unavailable',
  }),
});

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function middlewareOptionsFromRouteOptions(options) {
  if (!isObject(options)) {
    return options;
  }

  if (options.repository) {
    return options;
  }

  const dbAdapter = isObject(options.dbAdapter) ? options.dbAdapter : undefined;

  if (dbAdapter && dbAdapter.repository) {
    return {
      ...options,
      repository: dbAdapter.repository,
    };
  }

  if (options.queryExecutor) {
    return options;
  }

  if (dbAdapter && dbAdapter.queryExecutor) {
    return {
      ...options,
      queryExecutor: dbAdapter.queryExecutor,
    };
  }

  if (options.dbClient) {
    const adapter = createCustomerAccessDbAdapter({ dbClient: options.dbClient });

    return {
      ...options,
      repository: adapter.repository,
    };
  }

  if (Object.prototype.hasOwnProperty.call(options, 'dbAdapter')) {
    return {
      ...options,
      repository: {},
    };
  }

  return options;
}

function dbClientFromRouteOptions(options) {
  if (!isObject(options)) {
    return undefined;
  }

  if (options.dbClient && typeof options.dbClient['query'] === 'function') {
    return options.dbClient;
  }

  return undefined;
}

function auditWriterFromRouteOptions(options) {
  return isObject(options) && typeof options.auditWriter === 'function'
    ? options.auditWriter
    : undefined;
}

function safeProperty(value, key) {
  try {
    return value ? value[key] : undefined;
  } catch (error) {
    return undefined;
  }
}

function hasOwn(value, key) {
  return isObject(value) && Object.prototype.hasOwnProperty.call(value, key);
}

function routeParamsSnapshot(req) {
  return isObject(req) && isObject(req.params) ? { ...req.params } : {};
}

function restoreReportRouteParams(req, snapshot) {
  if (!isObject(req) || !hasOwn(snapshot, 'reportId')) {
    return;
  }

  req.params = {
    ...(isObject(req.params) ? req.params : {}),
    reportId: safeProperty(snapshot, 'reportId'),
  };
}

function serviceReportContextMiddleware(customerAccessContextMiddleware) {
  return function customerAccessServiceReportContextMiddleware(req, res, next) {
    const routeParams = routeParamsSnapshot(req);

    return customerAccessContextMiddleware(req, res, () => {
      restoreReportRouteParams(req, routeParams);

      if (typeof next === 'function') {
        return next();
      }

      return undefined;
    });
  };
}

function safeRegistrationFailed(reasonCode = 'mount_target_invalid') {
  return {
    registered: false,
    messageKey: 'customerAccess.unavailable',
    customerVisible: false,
    reasonCode,
  };
}

function safeRegistrationSucceeded() {
  return {
    registered: true,
    routes: [
      {
        method: 'GET',
        path: CUSTOMER_ACCESS_ROUTE_PATH,
      },
      {
        method: 'GET',
        path: CUSTOMER_ACCESS_REPORT_ROUTE_PATH,
      },
    ],
  };
}

function hasValidExplicitDbClient(options) {
  if (!hasOwn(options, 'dbClient')) {
    return true;
  }

  const dbClient = safeProperty(options, 'dbClient');

  return isObject(dbClient) && typeof safeProperty(dbClient, 'query') === 'function';
}

function writeSafeDeny(res) {
  if (res && typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(404).json(SAFE_DENY_ENVELOPE);
  }

  return {
    statusCode: 404,
    body: SAFE_DENY_ENVELOPE,
  };
}

async function buildServiceReportProjectionResponse(req, dbClient) {
  try {
    return await handleCustomerServiceReportProjectionRequest({
      request: req,
      dbClient,
    });
  } catch (error) {
    return {
      statusCode: 404,
      body: SAFE_DENY_ENVELOPE,
    };
  }
}

function createCustomerAccessReportRouteHandler(options) {
  const dbClient = dbClientFromRouteOptions(options);
  const auditWriter = auditWriterFromRouteOptions(options);

  async function recordAccessAudit(req, responseBody) {
    try {
      await recordCustomerServiceReportAuditEvent({
        auditWriter,
        request: req,
        responseBody,
      });
    } catch (error) {
      // Audit must never make the customer-facing safe-deny path observable.
    }
  }

  return async function handleCustomerAccessReportRequest(req, res) {
    const accessEnvelope = buildCustomerAccessControllerResponse(req);

    if (!accessEnvelope || accessEnvelope.status !== 'allow') {
      await recordAccessAudit(req, SAFE_DENY_ENVELOPE);
      return writeSafeDeny(res);
    }

    const response = await buildServiceReportProjectionResponse(req, dbClient);

    await recordAccessAudit(req, response.body);

    if (res && typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(response.statusCode).json(response.body);
    }

    return response;
  };
}

function registerCustomerAccessRoutes(router, options) {
  const registerGet = safeProperty(router, 'get');

  if (typeof registerGet !== 'function') {
    return safeRegistrationFailed('mount_target_invalid');
  }

  if (!hasValidExplicitDbClient(options)) {
    return safeRegistrationFailed('db_client_invalid');
  }

  try {
    const routeOptions = middlewareOptionsFromRouteOptions(options);
    const customerAccessContextMiddleware = buildCustomerAccessContextMiddleware(routeOptions);
    const customerAccessServiceReportContextMiddleware = serviceReportContextMiddleware(
      customerAccessContextMiddleware,
    );
    const reportRouteHandler = createCustomerAccessReportRouteHandler(routeOptions);

    registerGet.call(router, CUSTOMER_ACCESS_ROUTE_PATH, customerAccessContextMiddleware, handleCustomerAccessRequest);
    registerGet.call(
      router,
      CUSTOMER_ACCESS_REPORT_ROUTE_PATH,
      customerAccessServiceReportContextMiddleware,
      reportRouteHandler,
    );

    return safeRegistrationSucceeded();
  } catch (error) {
    return safeRegistrationFailed('route_registration_failed');
  }
}

module.exports = {
  CUSTOMER_ACCESS_REPORT_ROUTE_PATH,
  CUSTOMER_ACCESS_ROUTE_PATH,
  createCustomerAccessReportRouteHandler,
  registerCustomerAccessRoutes,
};
