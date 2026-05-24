'use strict';

const {
  createRepairIntakeDraftToCaseInjectedRouteComposition,
} = require('./repairIntakeDraftToCaseInjectedRouteComposition');

const SAFE_CODE_PATTERN = /^[A-Za-z0-9_-]+$/;
const SAFE_BASE_PATH_PATTERN = /^\/[A-Za-z0-9:_-]+(?:\/[A-Za-z0-9:_-]+)*$/;

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeCode(value, fallback) {
  if (typeof value === 'string' && SAFE_CODE_PATTERN.test(value)) {
    return value;
  }

  return fallback;
}

function safeActions(value, fallback = []) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const actions = value.filter((action) => typeof action === 'string' && SAFE_CODE_PATTERN.test(action));
  return actions.length > 0 ? actions : fallback;
}

function safeBasePath(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string' || value.includes('://') || value.startsWith('//')) {
    return null;
  }

  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  const normalized = withLeadingSlash.replace(/\/+/g, '/').replace(/\/+$/, '');

  if (normalized === '' || !SAFE_BASE_PATH_PATTERN.test(normalized)) {
    return null;
  }

  return normalized;
}

function routeSummary(routes) {
  if (!Array.isArray(routes)) {
    return [];
  }

  return routes
    .filter((route) => isObject(route))
    .map((route) => ({
      method: safeCode(route.method, 'POST'),
      path: typeof route.path === 'string' && route.path.startsWith('/') ? route.path : '/',
    }));
}

function envelope(reasonCode, requiredActions) {
  return {
    ok: false,
    reasonCode,
    requiredActions,
  };
}

function createSyntheticMountTarget() {
  const handlers = new Map();

  return {
    post(routePath, handler) {
      if (typeof routePath === 'string' && typeof handler === 'function') {
        handlers.set(`POST ${routePath}`, handler);
      }
    },
    async dispatch(method, routePath, request) {
      const normalizedMethod = typeof method === 'string' ? method.toUpperCase() : '';

      if (normalizedMethod !== 'POST') {
        return envelope(
          'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_METHOD_NOT_ALLOWED',
          ['use_supported_method'],
        );
      }

      const handler = handlers.get(`${normalizedMethod} ${routePath}`);

      if (!handler) {
        return envelope(
          'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_ROUTE_NOT_FOUND',
          ['use_mounted_route'],
        );
      }

      try {
        const response = await handler(isObject(request) ? request : {});
        if (!isObject(response)) {
          return envelope(
            'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_COMPOSE_FAILED',
            ['retry_or_manual_review'],
          );
        }

        return {
          ok: response.ok === true,
          body: response.body || response,
        };
      } catch (error) {
        return envelope(
          'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_COMPOSE_FAILED',
          ['retry_or_manual_review'],
        );
      }
    },
  };
}

function harnessFailure(reasonCode, basePath, requiredActions) {
  return {
    ok: false,
    mounted: 0,
    routes: [],
    basePath,
    reasonCode,
    requiredActions,
    handleSyntheticRequest: async (method) => {
      if (typeof method === 'string' && method.toUpperCase() !== 'POST') {
        return envelope(
          'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_METHOD_NOT_ALLOWED',
          ['use_supported_method'],
        );
      }

      return envelope(
        'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_ROUTE_NOT_FOUND',
        ['use_mounted_route'],
      );
    },
  };
}

function createRepairIntakeSyntheticAppCompositionHarness(options = {}) {
  const safeOptions = isObject(options) ? options : {};
  const basePath = safeBasePath(safeOptions.basePath);

  if (!isObject(safeOptions.runtimePorts)) {
    return harnessFailure(
      'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_PORTS_REQUIRED',
      basePath,
      ['configure_runtime_ports'],
    );
  }

  try {
    const mountTarget = createSyntheticMountTarget();
    const summary = createRepairIntakeDraftToCaseInjectedRouteComposition({
      runtimePorts: safeOptions.runtimePorts,
      basePath,
      mountTarget,
    });

    if (!isObject(summary) || summary.ok !== true) {
      return harnessFailure(
        'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_COMPOSE_FAILED',
        basePath,
        safeActions(summary && summary.requiredActions, ['retry_or_manual_review']),
      );
    }

    return {
      ok: true,
      mounted: Number.isInteger(summary.mounted) ? summary.mounted : 0,
      routes: routeSummary(summary.routes),
      basePath,
      reasonCode: 'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_READY',
      requiredActions: [],
      handleSyntheticRequest: mountTarget.dispatch,
    };
  } catch (error) {
    return harnessFailure(
      'REPAIR_INTAKE_SYNTHETIC_APP_COMPOSITION_HARNESS_COMPOSE_FAILED',
      basePath,
      ['retry_or_manual_review'],
    );
  }
}

module.exports = {
  createRepairIntakeSyntheticAppCompositionHarness,
};
