'use strict';

const {
  createEngineerMobileVisitActionApplicationService,
} = require('./engineerMobileVisitActionApplicationService');
const {
  createEngineerMobileVisitActionInjectedMountAdapter,
} = require('./engineerMobileVisitActionInjectedMountAdapter');

const ENGINEER_MOBILE_VISIT_ACTION_RUNTIME_BOOTSTRAP_KIND = 'engineer_mobile.visit_action_runtime_bootstrap';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cloneRoutes(routes) {
  if (!Array.isArray(routes)) {
    return [];
  }

  return routes
    .filter(isObject)
    .map((route) => ({
      method: route.method,
      path: route.path,
    }));
}

function serviceOnlyResult(visitActionService) {
  return {
    kind: ENGINEER_MOBILE_VISIT_ACTION_RUNTIME_BOOTSTRAP_KIND,
    ok: true,
    reasonCode: 'service_only',
    mounted: 0,
    routes: [],
    visitActionService,
  };
}

function mountedResult(visitActionService, mountSummary) {
  return {
    kind: ENGINEER_MOBILE_VISIT_ACTION_RUNTIME_BOOTSTRAP_KIND,
    ok: true,
    reasonCode: 'mounted',
    mounted: mountSummary.mounted === 1 ? 1 : 0,
    routes: cloneRoutes(mountSummary.routes),
    mountSummary: {
      ok: true,
      reasonCode: 'mounted',
      mounted: mountSummary.mounted === 1 ? 1 : 0,
      routes: cloneRoutes(mountSummary.routes),
      mountStyle: mountSummary.mountStyle,
    },
    visitActionService,
  };
}

function failedMountResult(visitActionService, mountSummary) {
  return {
    kind: ENGINEER_MOBILE_VISIT_ACTION_RUNTIME_BOOTSTRAP_KIND,
    ok: false,
    reasonCode: mountSummary.reasonCode,
    mounted: 0,
    routes: [],
    mountSummary: {
      ok: false,
      reasonCode: mountSummary.reasonCode,
      mounted: 0,
      routes: [],
    },
    visitActionService,
  };
}

function createEngineerMobileVisitActionRuntimeBootstrap(options = {}) {
  const source = isObject(options) ? options : {};
  const visitActionService = createEngineerMobileVisitActionApplicationService({
    transitionWriter: source.transitionWriter,
    auditWriter: source.auditWriter,
  });

  if (!isObject(source.mountTarget)) {
    return serviceOnlyResult(visitActionService);
  }

  const mountSummary = createEngineerMobileVisitActionInjectedMountAdapter({
    mountTarget: source.mountTarget,
    visitActionService,
    basePath: source.basePath,
  });

  if (!isObject(mountSummary) || mountSummary.ok !== true) {
    return failedMountResult(visitActionService, isObject(mountSummary) ? mountSummary : {
      reasonCode: 'unsupported_mount_target',
    });
  }

  return mountedResult(visitActionService, mountSummary);
}

module.exports = {
  createEngineerMobileVisitActionRuntimeBootstrap,
  ENGINEER_MOBILE_VISIT_ACTION_RUNTIME_BOOTSTRAP_KIND,
};
