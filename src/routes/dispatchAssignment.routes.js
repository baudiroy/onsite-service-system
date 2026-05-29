'use strict';

const { requirePermission } = require('../middlewares/requirePermission');

const DISPATCH_ASSIGNMENT_ADMIN_PERMISSION = 'dispatch.manage';
const DISPATCH_ASSIGNMENT_ADMIN_ROUTE_PATH = '/api/v1/admin/dispatch-assignments/:assignmentId/assignment-intent';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return undefined;
}

function firstString(...values) {
  return values.map(stringValue).find(Boolean);
}

function actorId(user = {}) {
  return firstString(user.id, user.userId, user.sub);
}

function organizationId(req, body, user) {
  return firstString(
    user.organizationId,
    req.context && req.context.organizationId,
    body.organizationId,
  );
}

function requestId(req, body) {
  return firstString(
    req.requestId,
    req.context && req.context.requestId,
    body.requestId,
  );
}

function assignmentId(params, body) {
  return firstString(
    params.assignmentId,
    body.assignmentId,
    body.dispatchAssignmentId,
  );
}

function serviceFromOptions(options = {}) {
  if (!isObject(options)) {
    return undefined;
  }

  if (options.assignmentService) {
    return options.assignmentService;
  }

  if (isObject(options.dispatchAssignment) && options.dispatchAssignment.assignmentService) {
    return options.dispatchAssignment.assignmentService;
  }

  if (isObject(options.adminDispatch) && options.adminDispatch.assignmentService) {
    return options.adminDispatch.assignmentService;
  }

  return undefined;
}

function buildServiceInput(req = {}) {
  const user = isObject(req.user) ? req.user : {};
  const body = isObject(req.body) ? req.body : {};
  const params = isObject(req.params) ? req.params : {};
  const context = isObject(req.context) ? req.context : {};
  const resolvedRequestId = requestId(req, body);
  const resolvedOrganizationId = organizationId(req, body, user);
  const resolvedActorId = actorId(user);
  const resolvedAssignmentId = assignmentId(params, body);

  return {
    assignmentId: resolvedAssignmentId,
    organizationId: resolvedOrganizationId,
    actorId: resolvedActorId,
    actor: {
      id: resolvedActorId,
      userId: resolvedActorId,
      organizationId: resolvedOrganizationId,
    },
    dispatchUnitId: stringValue(body.dispatchUnitId),
    assignedEngineerId: stringValue(body.assignedEngineerId),
    dispatchStatus: stringValue(body.dispatchStatus),
    assignmentNote: body.assignmentNote,
    occurredAt: stringValue(body.occurredAt),
    requestId: resolvedRequestId,
    context: {
      ...context,
      organizationId: resolvedOrganizationId,
      actorId: resolvedActorId,
      requestId: resolvedRequestId,
      permissionContext: {
        canManageDispatch: true,
        permission: DISPATCH_ASSIGNMENT_ADMIN_PERMISSION,
      },
    },
    permissionContext: {
      canManageDispatch: true,
      permission: DISPATCH_ASSIGNMENT_ADMIN_PERMISSION,
    },
  };
}

function statusCodeFromResult(result) {
  if (!isObject(result)) {
    return 502;
  }

  if (result.ok === true) {
    return 200;
  }

  switch (result.reasonCode) {
    case 'assignment_route_dependency_required':
      return 503;
    case 'admin_actor_required':
    case 'organization_id_required':
    case 'dispatch_permission_context_required':
      return 403;
    case 'dispatch_assignment_id_required':
    case 'dispatch_assignment_intent_required':
      return 400;
    case 'dispatch_assignment_not_found_or_denied':
      return 404;
    case 'dispatch_assignment_write_denied':
      return 409;
    default:
      return 502;
  }
}

function successBody(result, req) {
  return {
    data: {
      assignment: result.assignment || null,
      auditContext: result.auditContext || null,
    },
    meta: {
      ok: true,
      assigned: true,
      reasonCode: result.reasonCode,
    },
    requestId: stringValue(result.requestId) || req.requestId || null,
  };
}

function failureBody(result, req) {
  const reasonCode = isObject(result) && stringValue(result.reasonCode)
    ? result.reasonCode
    : 'dispatch_assignment_route_failed';

  return {
    error: {
      code: 'DISPATCH_ASSIGNMENT_UNAVAILABLE',
      message: 'Dispatch assignment unavailable.',
      reasonCode,
      requestId: (isObject(result) && stringValue(result.requestId)) || req.requestId || null,
    },
  };
}

function routeDependencyFailure(req = {}) {
  return {
    ok: false,
    reasonCode: 'assignment_route_dependency_required',
    requestId: req.requestId,
  };
}

function createDispatchAssignmentRouteHandler(options = {}) {
  const assignmentService = serviceFromOptions(options);

  return async function dispatchAssignmentRouteHandler(req, res) {
    let result;

    try {
      result = assignmentService && typeof assignmentService.assignAppointment === 'function'
        ? await assignmentService.assignAppointment(buildServiceInput(req))
        : routeDependencyFailure(req);
    } catch (error) {
      result = {
        ok: false,
        reasonCode: 'dispatch_assignment_route_failed',
        requestId: req && req.requestId,
      };
    }

    const statusCode = statusCodeFromResult(result);
    const body = result && result.ok === true
      ? successBody(result, req)
      : failureBody(result, req);

    if (res && typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(statusCode).json(body);
    }

    return {
      statusCode,
      body,
    };
  };
}

function mountSummary(mounted) {
  return {
    ok: mounted,
    mounted: mounted ? 1 : 0,
    routes: mounted
      ? [{
        method: 'PATCH',
        path: DISPATCH_ASSIGNMENT_ADMIN_ROUTE_PATH,
      }]
      : [],
    reasonCode: mounted
      ? 'DISPATCH_ASSIGNMENT_ADMIN_ROUTE_MOUNTED'
      : 'DISPATCH_ASSIGNMENT_ADMIN_ROUTE_NOT_MOUNTED',
  };
}

function registerDispatchAssignmentRoutes(router, options = {}) {
  if (!router || typeof router.patch !== 'function') {
    return null;
  }

  const assignmentService = serviceFromOptions(options);

  if (!assignmentService) {
    return mountSummary(false);
  }

  router.patch(
    DISPATCH_ASSIGNMENT_ADMIN_ROUTE_PATH,
    requirePermission(DISPATCH_ASSIGNMENT_ADMIN_PERMISSION),
    createDispatchAssignmentRouteHandler({ assignmentService }),
  );

  return mountSummary(true);
}

module.exports = {
  DISPATCH_ASSIGNMENT_ADMIN_PERMISSION,
  DISPATCH_ASSIGNMENT_ADMIN_ROUTE_PATH,
  buildServiceInput,
  createDispatchAssignmentRouteHandler,
  registerDispatchAssignmentRoutes,
};
