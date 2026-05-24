'use strict';

const SAFE_HTTP_METHOD_KEYS = new Set(['post']);
const SAFE_PATH_PATTERN = /^\/[A-Za-z0-9:_-]+(?:\/[A-Za-z0-9:_-]+)*$/;
const SAFE_CODE_PATTERN = /^[A-Za-z0-9_-]+$/;

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeCode(value, fallback) {
  if (typeof value === 'string' && SAFE_CODE_PATTERN.test(value)) {
    return value;
  }

  return fallback;
}

function safeActions(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((action) => typeof action === 'string' && SAFE_CODE_PATTERN.test(action));
}

function routeSummary(routes) {
  return routes.map((route) => ({
    method: route.method,
    path: route.path,
  }));
}

function failure(reasonCode, requiredActions, routes = []) {
  return {
    ok: false,
    mounted: routes.length,
    routes: routeSummary(routes),
    reasonCode,
    requiredActions,
  };
}

function success(routes, apiModule) {
  return {
    ok: true,
    mounted: routes.length,
    routes: routeSummary(routes),
    reasonCode: safeCode(
      apiModule.reasonCode,
      'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_MOUNTED',
    ),
    requiredActions: safeActions(apiModule.requiredActions),
  };
}

function normalizeBasePath(basePath) {
  if (basePath === undefined || basePath === '') {
    return '';
  }

  if (typeof basePath !== 'string') {
    return null;
  }

  if (basePath.includes('://') || basePath.startsWith('//')) {
    return null;
  }

  const withLeadingSlash = basePath.startsWith('/') ? basePath : `/${basePath}`;
  const normalized = withLeadingSlash.replace(/\/+/g, '/').replace(/\/+$/, '');

  if (normalized === '') {
    return '';
  }

  if (!SAFE_PATH_PATTERN.test(normalized)) {
    return null;
  }

  return normalized;
}

function withBasePath(basePath, path) {
  if (!basePath) {
    return path;
  }

  return `${basePath}${path}`;
}

function normalizeRoutePath(routePath) {
  if (typeof routePath !== 'string' || routePath === '') {
    return null;
  }

  if (routePath.includes('://') || routePath.startsWith('//')) {
    return null;
  }

  const withLeadingSlash = routePath.startsWith('/') ? routePath : `/${routePath}`;
  const normalized = withLeadingSlash.replace(/\/+/g, '/').replace(/\/+$/, '');

  if (normalized === '' || !SAFE_PATH_PATTERN.test(normalized)) {
    return null;
  }

  return normalized;
}

function normalizeMethod(method) {
  if (typeof method !== 'string') {
    return null;
  }

  const methodKey = method.toLowerCase();

  if (!SAFE_HTTP_METHOD_KEYS.has(methodKey)) {
    return null;
  }

  return {
    method: methodKey.toUpperCase(),
    methodKey,
  };
}

function normalizeRoute(route, basePath) {
  if (!isObject(route)) {
    return {
      ok: false,
      reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_ROUTE_INVALID',
      requiredActions: ['configure_valid_route_definitions'],
    };
  }

  const normalizedMethod = normalizeMethod(route.method);
  const path = normalizeRoutePath(route.path);

  if (!normalizedMethod) {
    return {
      ok: false,
      reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_UNSUPPORTED_METHOD',
      requiredActions: ['configure_supported_route_method'],
    };
  }

  if (!path) {
    return {
      ok: false,
      reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_ROUTE_INVALID',
      requiredActions: ['configure_valid_route_definitions'],
    };
  }

  if (typeof route.handler !== 'function') {
    return {
      ok: false,
      reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_ROUTE_INVALID',
      requiredActions: ['configure_valid_route_definitions'],
    };
  }

  return {
    ok: true,
    route: {
      method: normalizedMethod.method,
      methodKey: normalizedMethod.methodKey,
      path: withBasePath(basePath, path),
      handler: route.handler,
    },
  };
}

function mountTargetSupportsRoute(mountTarget, route) {
  return (
    typeof mountTarget[route.methodKey] === 'function'
    || typeof mountTarget.register === 'function'
  );
}

function mountRoute(mountTarget, route) {
  if (typeof mountTarget[route.methodKey] === 'function') {
    mountTarget[route.methodKey](route.path, route.handler);
    return;
  }

  mountTarget.register(route.method, route.path, route.handler);
}

function mountRepairIntakeDraftToCaseApiModule(options = {}) {
  const safeOptions = isObject(options) ? options : {};
  const mountTarget = safeOptions.mountTarget;
  const apiModule = safeOptions.apiModule;
  const basePath = normalizeBasePath(safeOptions.basePath);

  if (!isObject(mountTarget)) {
    return failure(
      'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_TARGET_REQUIRED',
      ['configure_mount_target'],
    );
  }

  if (!isObject(apiModule)) {
    return failure(
      'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_API_MODULE_REQUIRED',
      ['configure_api_module'],
    );
  }

  if (apiModule.ok !== true) {
    return failure(
      safeCode(
        apiModule.reasonCode,
        'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_API_MODULE_NOT_READY',
      ),
      safeActions(apiModule.requiredActions),
    );
  }

  if (!Array.isArray(apiModule.routes) || apiModule.routes.length === 0) {
    return failure(
      'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_ROUTES_REQUIRED',
      ['configure_routes'],
    );
  }

  if (basePath === null) {
    return failure(
      'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_BASE_PATH_INVALID',
      ['configure_safe_base_path'],
    );
  }

  const normalizedRoutes = [];
  const routeKeys = new Set();

  for (const route of apiModule.routes) {
    const normalizedRouteResult = normalizeRoute(route, basePath);

    if (!normalizedRouteResult.ok) {
      return failure(
        normalizedRouteResult.reasonCode,
        normalizedRouteResult.requiredActions,
      );
    }

    const normalizedRoute = normalizedRouteResult.route;
    const routeKey = `${normalizedRoute.method} ${normalizedRoute.path}`;

    if (routeKeys.has(routeKey)) {
      return failure(
        'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_DUPLICATE_ROUTE',
        ['configure_unique_route_definitions'],
      );
    }

    routeKeys.add(routeKey);

    if (!mountTargetSupportsRoute(mountTarget, normalizedRoute)) {
      return failure(
        'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_TARGET_METHOD_REQUIRED',
        ['configure_mount_target_method'],
      );
    }

    normalizedRoutes.push(normalizedRoute);
  }

  const mountedRoutes = [];

  try {
    for (const route of normalizedRoutes) {
      mountRoute(mountTarget, route);
      mountedRoutes.push(route);
    }
  } catch (error) {
    return failure(
      'REPAIR_INTAKE_DRAFT_TO_CASE_HTTP_MOUNT_ADAPTER_MOUNT_FAILED',
      ['retry_or_manual_review'],
      mountedRoutes,
    );
  }

  return success(normalizedRoutes, apiModule);
}

module.exports = {
  mountRepairIntakeDraftToCaseApiModule,
};
