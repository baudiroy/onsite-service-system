'use strict';

const { requirePermission } = require('../middlewares/requirePermission');
const {
  createRepairIntakeDraftToCaseInjectedRouteComposition,
} = require('../repairIntake/repairIntakeDraftToCaseInjectedRouteComposition');
const {
  buildRepairIntakeDraftToCaseAuthSessionContext,
} = require('../repairIntake/repairIntakeDraftToCaseAuthSessionContextAdapter');
const {
  normalizeRepairIntakeDraftToCaseTrustedContext,
} = require('../repairIntake/repairIntakeDraftToCaseTrustedContextNormalizer');

const REPAIR_INTAKE_DRAFT_TO_CASE_ROUTES_ENABLED_ENV = 'REPAIR_INTAKE_DRAFT_TO_CASE_ROUTES_ENABLED';
const REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION = 'cases.create';
const REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_BASE_PATH = '/api/v1/admin';
const REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_PATH = '/api/v1/admin/repair-intake/drafts/:draftId/case/submit';
const REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_SAFE_ERROR_BODY = {
  ok: false,
  status: 'unavailable',
  messageKey: 'repair_intake_draft_to_case.admin_route_unavailable',
  reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_SAFE_ERROR',
  caseId: null,
  repairIntakeDraftId: null,
};

const BODY_CONTEXT_FIELD_NAMES = new Set([
  'actorid',
  'actorrole',
  'caseid',
  'correlationid',
  'debugid',
  'dedupekey',
  'draftid',
  'duplicate',
  'idempotencykey',
  'organizationid',
  'repairintakedraftid',
  'replay',
  'requestid',
  'source',
  'traceid',
]);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizedFieldName(value) {
  return String(value).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function stripBodyContextFields(value) {
  if (Array.isArray(value)) {
    return value.map((item) => stripBodyContextFields(item));
  }

  if (!isObject(value)) {
    return value;
  }

  const result = {};

  for (const [key, fieldValue] of Object.entries(value)) {
    if (BODY_CONTEXT_FIELD_NAMES.has(normalizedFieldName(key))) {
      continue;
    }

    result[key] = stripBodyContextFields(fieldValue);
  }

  return result;
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
  );
}

function tenantId(req, body, user) {
  return firstString(
    user.tenantId,
    req.context && req.context.tenantId,
    body.tenantId,
  );
}

function requestId(req) {
  return firstString(
    req.requestId,
    req.context && req.context.requestId,
  );
}

function idempotencyKey(req) {
  return firstString(
    req.idempotencyKey,
    req.context && req.context.idempotencyKey,
  );
}

function draftId(params, body) {
  return firstString(
    params.draftId,
  );
}

function bodyWithoutServerOwnedContext(body) {
  const {
    actorId,
    actorRole,
    caseId,
    correlationId,
    debugId,
    dedupeKey,
    draftId: bodyDraftId,
    duplicate,
    idempotencyKey,
    organizationId: bodyOrganizationId,
    repairIntakeDraftId,
    replay,
    requestId: bodyRequestId,
    source,
    traceId,
    ...safeBody
  } = body;

  return stripBodyContextFields(safeBody);
}

function buildAdminRequestLike(req = {}) {
  const user = isObject(req.user) ? req.user : {};
  const body = isObject(req.body) ? req.body : {};
  const requestBody = bodyWithoutServerOwnedContext(body);
  const context = isObject(req.context) ? req.context : {};
  const params = isObject(req.params) ? req.params : {};
  const adminPermissionContext = {
    canCreateCaseFromRepairIntakeDraft: true,
    permission: REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_PERMISSION,
  };
  const authSessionContextResult = buildRepairIntakeDraftToCaseAuthSessionContext({
    user,
    context,
    sessionContext: context,
    permissionContext: adminPermissionContext,
    requestId: requestId(req),
    idempotencyKey: idempotencyKey(req),
  });
  const authSessionContext = authSessionContextResult.ok === true
    ? authSessionContextResult.sessionContext
    : {};
  const trustedContextResult = normalizeRepairIntakeDraftToCaseTrustedContext({
    params,
    user: {},
    context: authSessionContext,
    sessionContext: authSessionContext,
    permissionContext: authSessionContext.permissionContext || adminPermissionContext,
    tenantId: tenantId(req, body, user),
    requestId: authSessionContext.requestId || requestId(req),
    idempotencyKey: authSessionContext.idempotencyKey || idempotencyKey(req),
  });
  const trustedContext = trustedContextResult.ok === true ? trustedContextResult.context : {};
  const resolvedOrganizationId = trustedContext.organizationId;
  const resolvedTenantId = trustedContext.tenantId;
  const resolvedRequestId = trustedContext.requestId;
  const resolvedIdempotencyKey = trustedContext.idempotencyKey;
  const resolvedActorId = trustedContext.actorId;
  const resolvedDraftId = trustedContext.repairIntakeDraftId;
  const resolvedPermissionContext = trustedContext.permissionContext || adminPermissionContext;
  const normalizedParams = {
    ...params,
    ...(resolvedDraftId ? {
      draftId: resolvedDraftId,
      repairIntakeDraftId: resolvedDraftId,
    } : {}),
  };

  return {
    params: normalizedParams,
    query: isObject(req.query) ? req.query : {},
    body: {
      ...requestBody,
      permissionContext: {
        canCreateCaseFromRepairIntakeDraft: true,
      },
    },
    context: {
      ...context,
      organizationId: resolvedOrganizationId,
      tenantId: resolvedTenantId,
      actorId: resolvedActorId,
      requestId: resolvedRequestId,
      permissionContext: resolvedPermissionContext,
    },
    actor: {
      id: resolvedActorId,
      userId: resolvedActorId,
      organizationId: resolvedOrganizationId,
    },
    organizationId: resolvedOrganizationId,
    tenantId: resolvedTenantId,
    requestId: resolvedRequestId,
    idempotencyKey: resolvedIdempotencyKey,
    repairIntakeDraftId: resolvedDraftId,
    draftId: resolvedDraftId,
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
      if (res && typeof res.status === 'function' && typeof res.json === 'function') {
        res.status(503).json(REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_SAFE_ERROR_BODY);
        return;
      }

      if (typeof next === 'function') {
        next({
          code: REPAIR_INTAKE_DRAFT_TO_CASE_ADMIN_ROUTE_SAFE_ERROR_BODY.reasonCode,
        });
      }
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
