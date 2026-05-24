'use strict';

const {
  createRepairIntakeDraftCaseControllerAdapter,
} = require('./repairIntakeDraftCaseControllerAdapter');
const {
  createRepairIntakeDraftCaseRoutes,
} = require('./repairIntakeDraftCaseRouteFactory');
const {
  registerRepairIntakeDraftToCaseRoutes,
} = require('./repairIntakeDraftToCaseRouteRegistrar');

const SAFE_HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
const SAFE_PATH_PATTERN = /^\/[A-Za-z0-9:_-]+(?:\/[A-Za-z0-9:_-]+)*$/;
const SAFE_REQUEST_INPUT_FIELDS = new Set([
  'actor',
  'body',
  'context',
  'organizationId',
  'params',
  'query',
  'requestId',
  'tenantId',
]);
const UNSAFE_REQUEST_FIELD_NAMES = new Set([
  'address',
  'app',
  'authorization',
  'baseurl',
  'connection',
  'cookie',
  'cookies',
  'customerphone',
  'database_url',
  'file',
  'files',
  'finalappointmentid',
  'headers',
  'hostname',
  'ip',
  'ips',
  'lineaccesstoken',
  'lineuserid',
  'next',
  'originalurl',
  'phone',
  'protocol',
  'rawbody',
  'rawheaders',
  'req',
  'res',
  'response',
  'route',
  'session',
  'signedcookies',
  'socket',
  'sql',
]);
const UNSAFE_OUTPUT_FIELD_NAMES = new Set([
  'address',
  'app',
  'applicationservice',
  'authorization',
  'connection',
  'controller',
  'cookie',
  'cookies',
  'customername',
  'customerphone',
  'database_url',
  'databaseurl',
  'db',
  'error',
  'file',
  'files',
  'finalappointmentid',
  'handler',
  'headers',
  'lineaccesstoken',
  'lineuserid',
  'next',
  'paramssql',
  'phone',
  'query',
  'raw',
  'rawbody',
  'rawheaders',
  'rawrows',
  'req',
  'res',
  'response',
  'route',
  'session',
  'signedcookies',
  'socket',
  'sql',
  'stack',
]);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function requestFieldIsUnsafe(key) {
  return UNSAFE_REQUEST_FIELD_NAMES.has(String(key).toLowerCase());
}

function sanitizeRequestValue(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeRequestValue(item))
      .filter((item) => item !== undefined);
  }

  if (isObject(value)) {
    const result = {};

    for (const [key, fieldValue] of Object.entries(value)) {
      if (requestFieldIsUnsafe(key)) {
        continue;
      }

      const sanitized = sanitizeRequestValue(fieldValue);

      if (sanitized !== undefined) {
        result[key] = sanitized;
      }
    }

    return result;
  }

  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
    return undefined;
  }

  return value;
}

function sanitizeRequestInput(requestLike = {}) {
  const source = isObject(requestLike) ? requestLike : {};
  const result = {};

  for (const key of SAFE_REQUEST_INPUT_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) {
      continue;
    }

    const sanitized = sanitizeRequestValue(source[key]);

    if (sanitized !== undefined) {
      result[key] = sanitized;
    }
  }

  return result;
}

function outputFieldIsUnsafe(key) {
  return UNSAFE_OUTPUT_FIELD_NAMES.has(String(key).toLowerCase());
}

function sanitizeHandlerOutputValue(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeHandlerOutputValue(item))
      .filter((item) => item !== undefined);
  }

  if (isObject(value)) {
    const result = {};

    for (const [key, fieldValue] of Object.entries(value)) {
      if (outputFieldIsUnsafe(key)) {
        continue;
      }

      const sanitized = sanitizeHandlerOutputValue(fieldValue);

      if (sanitized !== undefined) {
        result[key] = sanitized;
      }
    }

    return result;
  }

  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
    return undefined;
  }

  return value;
}

async function sanitizeHandlerOutput(outputPromise) {
  return sanitizeHandlerOutputValue(await outputPromise);
}

function createSafeController(controller) {
  return {
    planDraftToCase: (requestLike = {}) => sanitizeHandlerOutput(
      controller.planDraftToCase.call(
        controller,
        sanitizeRequestInput(requestLike),
      ),
    ),
    submitDraftToCase: (requestLike = {}) => sanitizeHandlerOutput(
      controller.submitDraftToCase.call(
        controller,
        sanitizeRequestInput(requestLike),
      ),
    ),
  };
}

function failure(reasonCode, requiredActions = ['retry_or_manual_review']) {
  return {
    ok: false,
    controller: null,
    routes: [],
    registration: null,
    reasonCode,
    requiredActions,
  };
}

function success(controller, routes, registration = null) {
  return {
    ok: registration ? registration.ok === true : true,
    controller,
    routes,
    registration,
    reasonCode: registration
      ? registration.reasonCode
      : 'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_READY',
    requiredActions: registration ? registration.requiredActions : [],
  };
}

function routeIsValid(route) {
  if (!isObject(route)) {
    return false;
  }

  const method = typeof route.method === 'string' ? route.method.toUpperCase() : '';

  return SAFE_HTTP_METHODS.has(method)
    && typeof route.path === 'string'
    && SAFE_PATH_PATTERN.test(route.path)
    && typeof route.handler === 'function';
}

function routesAreValid(routes) {
  return Array.isArray(routes) && routes.length > 0 && routes.every(routeIsValid);
}

function basePathWasProvided(options) {
  return Object.prototype.hasOwnProperty.call(options, 'basePath')
    && options.basePath !== undefined
    && options.basePath !== null
    && options.basePath !== '';
}

function controllerWasProvided(options) {
  return Object.prototype.hasOwnProperty.call(options, 'controller');
}

function controllerIsValid(controller) {
  return isObject(controller)
    && typeof controller.planDraftToCase === 'function'
    && typeof controller.submitDraftToCase === 'function';
}

function applicationServiceIsValid(applicationService) {
  return isObject(applicationService)
    && typeof applicationService.planDraftToCase === 'function'
    && typeof applicationService.submitDraftToCase === 'function';
}

function buildController(options) {
  if (controllerWasProvided(options)) {
    return options.controller;
  }

  if (!applicationServiceIsValid(options.applicationService)) {
    return null;
  }

  try {
    return createRepairIntakeDraftCaseControllerAdapter({
      applicationService: options.applicationService,
    });
  } catch (error) {
    return null;
  }
}

function buildRoutes(options, controller) {
  if (Array.isArray(options.routes)) {
    return options.routes;
  }

  try {
    return createRepairIntakeDraftCaseRoutes({ controller });
  } catch (error) {
    return null;
  }
}

function createRepairIntakeDraftToCaseApiModule(options = {}) {
  const safeOptions = isObject(options) ? options : {};
  const controller = buildController(safeOptions);

  if (!controller) {
    if (controllerWasProvided(safeOptions)) {
      return failure(
        'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_CONTROLLER_REQUIRED',
        ['configure_controller'],
      );
    }

    return failure(
      'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_APPLICATION_SERVICE_REQUIRED',
      ['configure_application_service_or_controller'],
    );
  }

  if (!controllerIsValid(controller)) {
    return failure(
      'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_CONTROLLER_REQUIRED',
      ['configure_controller'],
    );
  }

  const safeController = createSafeController(controller);
  const routes = buildRoutes(safeOptions, safeController);

  if (!routesAreValid(routes)) {
    return failure(
      'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_ROUTES_INVALID',
      ['configure_valid_routes'],
    );
  }

  if (!isObject(safeOptions.router)) {
    if (basePathWasProvided(safeOptions)) {
      return failure(
        'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_BASE_PATH_REQUIRES_ROUTER',
        ['configure_router_for_base_path'],
      );
    }

    return success(safeController, routes);
  }

  const registration = registerRepairIntakeDraftToCaseRoutes({
    router: safeOptions.router,
    routes,
    basePath: safeOptions.basePath,
  });

  if (!registration || registration.ok !== true) {
    return {
      ...failure(
        'REPAIR_INTAKE_DRAFT_TO_CASE_API_MODULE_REGISTRATION_FAILED',
        ['configure_router_or_routes'],
      ),
      controller: safeController,
      routes,
      registration: registration || null,
    };
  }

  return success(safeController, routes, registration);
}

module.exports = {
  createRepairIntakeDraftToCaseApiModule,
};
