'use strict';

const {
  createEngineerMobileVisitActionHttpHandlerAdapter,
} = require('./engineerMobileVisitActionHttpHandlerAdapter');

const ENGINEER_MOBILE_VISIT_ACTION_INJECTED_MOUNT_ADAPTER_KIND = 'engineer_mobile.visit_action_injected_mount_adapter';
const DEFAULT_BASE_PATH = '/engineer-mobile';
const VISIT_ACTION_ROUTE_SUFFIX = '/appointments/:appointmentId/actions/:action';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeBasePath(basePath) {
  if (basePath === undefined || basePath === null) {
    return DEFAULT_BASE_PATH;
  }

  if (typeof basePath !== 'string') {
    return DEFAULT_BASE_PATH;
  }

  const trimmed = basePath.trim();

  if (trimmed.length === 0 || !trimmed.startsWith('/')) {
    return DEFAULT_BASE_PATH;
  }

  if (trimmed === '/') {
    return '';
  }

  return trimmed.replace(/\/+$/, '');
}

function routePathFor(basePath) {
  return `${normalizeBasePath(basePath)}${VISIT_ACTION_ROUTE_SUFFIX}`;
}

function mountSummary({ ok, reasonCode, path, method = 'POST', mountStyle }) {
  const summary = {
    kind: ENGINEER_MOBILE_VISIT_ACTION_INJECTED_MOUNT_ADAPTER_KIND,
    ok,
    mounted: ok ? 1 : 0,
    reasonCode,
    routes: ok ? [{ method, path }] : [],
  };

  if (ok) {
    summary.mountStyle = mountStyle;
  }

  return summary;
}

function missingTargetSummary() {
  return mountSummary({
    ok: false,
    reasonCode: 'mount_target_required',
  });
}

function unsupportedTargetSummary() {
  return mountSummary({
    ok: false,
    reasonCode: 'unsupported_mount_target',
  });
}

function registerPost(mountTarget, path, handler) {
  if (typeof mountTarget.post === 'function') {
    mountTarget.post(path, handler);
    return 'post';
  }

  if (typeof mountTarget.route === 'function') {
    const route = mountTarget.route(path);

    if (isObject(route) && typeof route.post === 'function') {
      route.post(handler);
      return 'route.post';
    }
  }

  if (typeof mountTarget.register === 'function') {
    mountTarget.register({
      method: 'POST',
      path,
      handler,
    });
    return 'register';
  }

  return undefined;
}

function createEngineerMobileVisitActionInjectedMountAdapter(options = {}) {
  const safeOptions = isObject(options) ? options : {};
  const mountTarget = safeOptions.mountTarget;

  if (!isObject(mountTarget)) {
    return missingTargetSummary();
  }

  const httpHandlerAdapter = createEngineerMobileVisitActionHttpHandlerAdapter({
    visitActionService: safeOptions.visitActionService,
  });
  const path = routePathFor(safeOptions.basePath);
  const mountStyle = registerPost(
    mountTarget,
    path,
    httpHandlerAdapter.handleEngineerMobileVisitActionRequest,
  );

  if (!mountStyle) {
    return unsupportedTargetSummary();
  }

  return mountSummary({
    ok: true,
    reasonCode: 'mounted',
    path,
    mountStyle,
  });
}

module.exports = {
  createEngineerMobileVisitActionInjectedMountAdapter,
  ENGINEER_MOBILE_VISIT_ACTION_INJECTED_MOUNT_ADAPTER_KIND,
};
