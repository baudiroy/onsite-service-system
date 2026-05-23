'use strict';

const SAFE_HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
const SAFE_PATH_PATTERN = /^\/[A-Za-z0-9:_-]+(?:\/[A-Za-z0-9:_-]+)*$/;

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function failure(reasonCode, requiredActions) {
  return {
    ok: false,
    registered: 0,
    routes: [],
    reasonCode,
    requiredActions,
  };
}

function success(routes) {
  return {
    ok: true,
    registered: routes.length,
    routes: routes.map((route) => ({
      method: route.method,
      path: route.path,
    })),
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTES_REGISTERED',
    requiredActions: [],
  };
}

function normalizeBasePath(basePath) {
  if (basePath === undefined || basePath === null || basePath === '') {
    return '';
  }

  if (typeof basePath !== 'string' || !SAFE_PATH_PATTERN.test(basePath)) {
    return null;
  }

  return basePath.replace(/\/+$/, '');
}

function withBasePath(basePath, path) {
  if (!basePath) {
    return path;
  }

  return `${basePath}${path}`;
}

function normalizeRoute(route, basePath) {
  if (!isObject(route)) {
    return null;
  }

  const method = typeof route.method === 'string' ? route.method.toUpperCase() : '';

  if (!SAFE_HTTP_METHODS.has(method)) {
    return null;
  }

  if (typeof route.path !== 'string' || !SAFE_PATH_PATTERN.test(route.path)) {
    return null;
  }

  if (typeof route.handler !== 'function') {
    return null;
  }

  return {
    method,
    path: withBasePath(basePath, route.path),
    handler: route.handler,
  };
}

function registerRepairIntakeDraftToCaseRoutes(options = {}) {
  const safeOptions = isObject(options) ? options : {};
  const router = safeOptions.router;
  const routes = safeOptions.routes;
  const basePath = normalizeBasePath(safeOptions.basePath);

  if (!isObject(router)) {
    return failure(
      'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_REGISTRAR_ROUTER_REQUIRED',
      ['configure_router'],
    );
  }

  if (!Array.isArray(routes)) {
    return failure(
      'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_REGISTRAR_ROUTES_REQUIRED',
      ['configure_routes'],
    );
  }

  if (basePath === null) {
    return failure(
      'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_REGISTRAR_BASE_PATH_INVALID',
      ['configure_safe_base_path'],
    );
  }

  const normalizedRoutes = [];

  for (const route of routes) {
    const normalizedRoute = normalizeRoute(route, basePath);

    if (!normalizedRoute) {
      return failure(
        'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_REGISTRAR_ROUTE_INVALID',
        ['configure_valid_route_definitions'],
      );
    }

    const register = router[normalizedRoute.method.toLowerCase()];

    if (typeof register !== 'function') {
      return failure(
        'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_REGISTRAR_ROUTER_METHOD_REQUIRED',
        ['configure_router_method'],
      );
    }

    normalizedRoutes.push(normalizedRoute);
  }

  try {
    for (const route of normalizedRoutes) {
      router[route.method.toLowerCase()](route.path, route.handler);
    }
  } catch (error) {
    return failure(
      'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_REGISTRAR_FAILED',
      ['retry_or_manual_review'],
    );
  }

  return success(normalizedRoutes);
}

module.exports = {
  registerRepairIntakeDraftToCaseRoutes,
};
