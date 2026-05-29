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
  buildCustomerAccessAuditEvent,
} = require('../customerAccess/customerAccessAuditEventBuilder');
const {
  writeCustomerAccessAuditEvent,
} = require('../customerAccess/customerAccessAuditWriterAdapter');
const {
  recordCustomerServiceReportAuditEvent,
} = require('../customerAccess/customerServiceReportAuditBoundary');

const CUSTOMER_ACCESS_ROUTE_PATH = '/customer-access/:caseId';
const CUSTOMER_ACCESS_REPORT_ROUTE_PATH = '/customer-access/:caseId/service-report/:reportId';
const CUSTOMER_ACCESS_ROUTE_REGISTRATION_AUDIT_SOURCE = 'customer_access_route_registration';
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

function isAcceptedCustomerAccessRoutePath(path) {
  return path === CUSTOMER_ACCESS_ROUTE_PATH || path === CUSTOMER_ACCESS_REPORT_ROUTE_PATH;
}

function routeRegistrationAuditInput({
  eventType,
  route,
  reasonCode,
  dependencyValid,
  registrationResult,
}) {
  return {
    eventType,
    route,
    method: 'GET',
    source: CUSTOMER_ACCESS_ROUTE_REGISTRATION_AUDIT_SOURCE,
    reasonCode,
    metadata: {
      dependencyValid,
      registrationResult,
    },
  };
}

function writeRouteRegistrationAudit({ auditWriter, auditInput }) {
  if (typeof auditWriter !== 'function') {
    return;
  }

  const auditEventResult = buildCustomerAccessAuditEvent(auditInput);

  if (!auditEventResult || auditEventResult.ok !== true || !auditEventResult.auditEvent) {
    return;
  }

  try {
    writeCustomerAccessAuditEvent({
      auditEvent: auditEventResult.auditEvent,
      writer: auditWriter,
    }).catch(() => undefined);
  } catch (error) {
    // Registration audit must never alter the registration summary.
  }
}

function recordRouteRegistrationSuccessAudit(options, summary) {
  const auditWriter = auditWriterFromRouteOptions(options);

  if (!auditWriter || !isObject(summary) || !Array.isArray(summary.routes)) {
    return;
  }

  for (const route of summary.routes) {
    if (!isObject(route) || route.method !== 'GET' || !isAcceptedCustomerAccessRoutePath(route.path)) {
      continue;
    }

    writeRouteRegistrationAudit({
      auditWriter,
      auditInput: routeRegistrationAuditInput({
        eventType: 'customer_access.route_registration.success',
        route: route.path,
        dependencyValid: true,
        registrationResult: 'success',
      }),
    });
  }
}

function recordRouteRegistrationFailureAudit(options, reasonCode, failedRoutePath) {
  const auditWriter = auditWriterFromRouteOptions(options);

  if (
    !auditWriter
    || reasonCode !== 'route_registration_failed'
    || !isAcceptedCustomerAccessRoutePath(failedRoutePath)
  ) {
    return;
  }

  writeRouteRegistrationAudit({
    auditWriter,
    auditInput: routeRegistrationAuditInput({
      eventType: 'customer_access.route_registration.failure',
      route: failedRoutePath,
      reasonCode,
      dependencyValid: true,
      registrationResult: 'failure',
    }),
  });
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

  let routeOptions = options;
  let attemptedRoutePath;

  try {
    routeOptions = middlewareOptionsFromRouteOptions(options);
    const customerAccessContextMiddleware = buildCustomerAccessContextMiddleware(routeOptions);
    const customerAccessServiceReportContextMiddleware = serviceReportContextMiddleware(
      customerAccessContextMiddleware,
    );
    const reportRouteHandler = createCustomerAccessReportRouteHandler(routeOptions);

    attemptedRoutePath = CUSTOMER_ACCESS_ROUTE_PATH;
    registerGet.call(router, CUSTOMER_ACCESS_ROUTE_PATH, customerAccessContextMiddleware, handleCustomerAccessRequest);
    attemptedRoutePath = CUSTOMER_ACCESS_REPORT_ROUTE_PATH;
    registerGet.call(
      router,
      CUSTOMER_ACCESS_REPORT_ROUTE_PATH,
      customerAccessServiceReportContextMiddleware,
      reportRouteHandler,
    );

    const summary = safeRegistrationSucceeded();

    recordRouteRegistrationSuccessAudit(routeOptions, summary);

    return summary;
  } catch (error) {
    const summary = safeRegistrationFailed('route_registration_failed');

    recordRouteRegistrationFailureAudit(routeOptions, summary.reasonCode, attemptedRoutePath);

    return summary;
  }
}

module.exports = {
  CUSTOMER_ACCESS_REPORT_ROUTE_PATH,
  CUSTOMER_ACCESS_ROUTE_PATH,
  createCustomerAccessReportRouteHandler,
  registerCustomerAccessRoutes,
};
