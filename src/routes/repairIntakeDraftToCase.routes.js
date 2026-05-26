'use strict';

const { requirePermission } = require('../middlewares/requirePermission');
const {
  createRepairIntakeDraftToCaseInjectedRouteComposition,
} = require('../repairIntake/repairIntakeDraftToCaseInjectedRouteComposition');

const REPAIR_INTAKE_DRAFT_TO_CASE_ROUTES_ENABLED_ENV = 'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTES_ENABLED';
const REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION = 'cases.create';
const REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_BASE_PATH = '/api/v1/admin';
const REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH = '/api/v1/admin/repair-intake/drafts/:draftId/case/submit';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getRepairIntakeDraftToCaseRuntimePorts(options = {}) {
  if (options.repairIntakeDraftToCaseRuntimePorts) {
    return options.repairIntakeDraftToCaseRuntimePorts;
  }

  if (
    isObject(options.repairIntakeDraftToCase)
    && options.repairIntakeDraftToCase.runtimePorts
  ) {
    return options.repairIntakeDraftToCase.runtimePorts;
  }

  return undefined;
}

function adminRoutesEnabled(options = {}) {
  return options.repairIntakeDraftToCaseRoutesEnabled === true
    || options.routesEnabled === true
    || (
      isObject(options.repairIntakeDraftToCase)
      && options.repairIntakeDraftToCase.routesEnabled === true
    );
}

function firstString(...values) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0);
}

function userId(user = {}) {
  return firstString(user.id, user.userId, user.sub);
}

function organizationId(req, body, user) {
  return firstString(
    user.organizationId,
    req.context && req.context.organizationId,
    body.organizationId,
  );
}

function tenantId(req, body, user) {
  return firstString(
    user.tenantId,
    req.context && req.context.tenantId,
    body.tenantId,
  );
}

function requestId(req, body) {
  return firstString(
    req.requestId,
    req.context && req.context.requestId,
    body.requestId,
  );
}

function buildAdminRequestLike(req = {}) {
  const user = isObject(req.user) ? req.user : {};
  const body = isObject(req.body) ? req.body : {};
  const context = isObject(req.context) ? req.context : {};
  const resolvedOrganizationId = organizationId(req, body, user);
  const resolvedTenantId = tenantId(req, body, user);
  const resolvedRequestId = requestId(req, body);
  const resolvedActorId = userId(user);

  return {
    params: isObject(req.params) ? req.params : {},
    query: isObject(req.query) ? req.query : {},
    body: {
      ...body,
      permissionContext: {
        ...(isObject(body.permissionContext) ? body.permissionContext : {}),
        canCreateCaseFromRepairIntakeDraft: true,
      },
    },
    context: {
      ...context,
      organizationId: resolvedOrganizationId,
      tenantId: resolvedTenantId,
      actorId: resolvedActorId,
      requestId: resolvedRequestId,
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
        permission: REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION,
      },
    },
    actor: {
      id: resolvedActorId,
      userId: resolvedActorId,
      organizationId: resolvedOrganizationId,
    },
    organizationId: resolvedOrganizationId,
    tenantId: resolvedTenantId,
    requestId: resolvedRequestId,
  };
}

function statusCodeFromResult(result) {
  return Number.isInteger(result && result.statusCode) ? result.statusCode : 200;
}

function bodyFromResult(result) {
  return isObject(result) && Object.prototype.hasOwnProperty.call(result, 'body')
    ? result.body
    : result;
}

function createExpressSubmitHandler(routeHandler) {
  return async function repairIntakeDraftToCaseAdminSubmitHandler(req, res, next) {
    try {
      const result = await routeHandler(buildAdminRequestLike(req));

      res.status(statusCodeFromResult(result)).json(bodyFromResult(result));
    } catch (error) {
      next(error);
    }
  };
}

function createAdminMountTarget(router) {
  let mounted = false;

  return {
    post(pathname, routeHandler) {
      if (pathname !== REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH) {
        return;
      }

      router.post(
        REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH,
        requirePermission(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION),
        createExpressSubmitHandler(routeHandler),
      );
      mounted = true;
    },
    mounted() {
      return mounted;
    },
  };
}

function mountSummary(mounted, compositionSummary) {
  return {
    ok: mounted,
    mounted: mounted ? 1 : 0,
    routes: mounted
      ? [{
        method: 'POST',
        path: REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH,
      }]
      : [],
    reasonCode: mounted
      ? 'REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_MOUNTED'
      : 'REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_NOT_MOUNTED',
    requiredActions: mounted ? [] : ['configure_feature_flag_and_runtime_ports'],
    compositionSummary,
  };
}

function registerRepairIntakeDraftToCaseAdminRoutes(router, options = {}) {
  if (!router || typeof router.post !== 'function') {
    return null;
  }

  if (!adminRoutesEnabled(options)) {
    return mountSummary(false, null);
  }

  const runtimePorts = getRepairIntakeDraftToCaseRuntimePorts(options);

  if (!runtimePorts) {
    return mountSummary(false, null);
  }

  const mountTarget = createAdminMountTarget(router);
  const compositionSummary = createRepairIntakeDraftToCaseInjectedRouteComposition({
    runtimePorts,
    basePath: REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_BASE_PATH,
    mountTarget,
  });

  return mountSummary(mountTarget.mounted(), compositionSummary);
}

module.exports = {
  REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION,
  REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH,
  REPAIR_INTAKE_DRAFT_TO_CASE_ROUTES_ENABLED_ENV,
  buildAdminRequestLike,
  registerRepairIntakeDraftToCaseAdminRoutes,
};
