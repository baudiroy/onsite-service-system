'use strict';

const {
  createRepairIntakeDraftToCaseInjectedRuntimeComposition,
} = require('./repairIntakeDraftToCaseInjectedRuntimeComposer');

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

function safeActions(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((action) => typeof action === 'string' && SAFE_CODE_PATTERN.test(action));
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

function componentSummary(components) {
  if (!isObject(components)) {
    return {};
  }

  const result = {};

  for (const [key, value] of Object.entries(components)) {
    if (SAFE_CODE_PATTERN.test(key) && typeof value === 'boolean') {
      result[key] = value;
    }
  }

  return result;
}

function failure(reasonCode, basePath, requiredActions = ['configure_runtime_ports']) {
  return {
    ok: false,
    mounted: 0,
    routes: [],
    basePath,
    components: {},
    reasonCode,
    requiredActions,
  };
}

function routeReasonCode(composerSummary, mountTarget) {
  if (!isObject(composerSummary)) {
    return 'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_COMPOSITION_FAILED';
  }

  if (composerSummary.ok === true) {
    return mountTarget === undefined
      ? 'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_COMPOSITION_READY'
      : 'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_COMPOSITION_MOUNTED';
  }

  if (
    composerSummary.reasonCode
    === 'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_COMPOSER_PORTS_REQUIRED'
  ) {
    return 'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_COMPOSITION_PORTS_REQUIRED';
  }

  return 'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_COMPOSITION_FAILED';
}

function sanitizeComposerSummary(composerSummary, basePath, mountTarget) {
  if (!isObject(composerSummary)) {
    return failure(
      'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_COMPOSITION_FAILED',
      basePath,
      ['retry_or_manual_review'],
    );
  }

  return {
    ok: composerSummary.ok === true,
    mounted: Number.isInteger(composerSummary.mounted) ? composerSummary.mounted : 0,
    routes: routeSummary(composerSummary.routes),
    basePath,
    components: componentSummary(composerSummary.components),
    reasonCode: routeReasonCode(composerSummary, mountTarget),
    requiredActions: composerSummary.ok === true
      ? []
      : safeActions(composerSummary.requiredActions),
  };
}

function createRepairIntakeDraftToCaseInjectedRouteComposition(options = {}) {
  const safeOptions = isObject(options) ? options : {};
  const basePath = safeBasePath(safeOptions.basePath);

  if (!isObject(safeOptions.runtimePorts)) {
    return failure(
      'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_COMPOSITION_PORTS_REQUIRED',
      basePath,
      ['configure_runtime_ports'],
    );
  }

  try {
    const composerOptions = {
      ...safeOptions.runtimePorts,
      basePath,
    };

    if (safeOptions.mountTarget !== undefined) {
      composerOptions.mountTarget = safeOptions.mountTarget;
    }

    const composerSummary = createRepairIntakeDraftToCaseInjectedRuntimeComposition(
      composerOptions,
    );

    return sanitizeComposerSummary(composerSummary, basePath, safeOptions.mountTarget);
  } catch (error) {
    return failure(
      'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTE_COMPOSITION_FAILED',
      basePath,
      ['retry_or_manual_review'],
    );
  }
}

module.exports = {
  createRepairIntakeDraftToCaseInjectedRouteComposition,
};
