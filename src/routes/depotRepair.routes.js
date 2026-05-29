'use strict';

const { requirePermission } = require('../middlewares/requirePermission');
const { evaluateDepotAccessScope } = require('../guards/DepotAccessScopeGuard');

const DEPOT_REPAIR_ROUTE_PERMISSION = 'depot.repair.prepare';
const DEPOT_REPAIR_ROUTE_PATH = '/api/v1/depot/repairs/:depotIntakeId/assignment-intent';

const UNSAFE_FIELD_NAMES = new Set([
  'address',
  'authorization',
  'billinginternals',
  'cookie',
  'customeraddress',
  'customercontact',
  'customeremail',
  'customername',
  'customerphone',
  'customervisiblepublication',
  'databaseurl',
  'dbrow',
  'dbrows',
  'email',
  'fieldservicereport',
  'finalappointmentid',
  'headers',
  'lineaccesstoken',
  'phone',
  'providerpayload',
  'raw',
  'rawbody',
  'rawcontext',
  'rawerror',
  'rawinput',
  'rawrequest',
  'rawresult',
  'rawrow',
  'rawrows',
  'secret',
  'sql',
  'stack',
  'token',
]);

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

function normalizedFieldName(value) {
  return String(value).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function fieldIsUnsafe(key) {
  const normalized = normalizedFieldName(key);

  return normalized.startsWith('raw') || UNSAFE_FIELD_NAMES.has(normalized);
}

function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeValue(item))
      .filter((item) => item !== undefined);
  }

  if (isObject(value)) {
    const result = {};

    for (const [key, fieldValue] of Object.entries(value)) {
      if (fieldIsUnsafe(key)) {
        continue;
      }

      const sanitized = sanitizeValue(fieldValue);

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

function compactRecord(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
}

function userFromRequest(req = {}) {
  return isObject(req.user) ? req.user : {};
}

function bodyFromRequest(req = {}) {
  return isObject(req.body) ? req.body : {};
}

function paramsFromRequest(req = {}) {
  return isObject(req.params) ? req.params : {};
}

function contextFromRequest(req = {}) {
  return isObject(req.context) ? req.context : {};
}

function actorIdFrom(user = {}) {
  return firstString(user.id, user.userId, user.sub);
}

function organizationIdFrom(req = {}, body = {}, user = {}) {
  const context = contextFromRequest(req);

  return firstString(
    user.organizationId,
    user.organization_id,
    context.organizationId,
    context.organization_id,
    body.organizationId,
    body.organization_id,
  );
}

function requestIdFrom(req = {}, body = {}) {
  const context = contextFromRequest(req);

  return firstString(req.requestId, context.requestId, body.requestId);
}

function depotIntakeIdFrom(req = {}, body = {}) {
  const params = paramsFromRequest(req);

  return firstString(
    params.depotIntakeId,
    params.depot_intake_id,
    body.depotIntakeId,
    body.depot_intake_id,
    body.draftId,
    body.draft_id,
  );
}

function serviceFromOptions(options = {}) {
  if (!isObject(options)) {
    return undefined;
  }

  return options.depotRepairService
    || options.workshopAssignmentService
    || options.assignmentService
    || (isObject(options.depotWorkshop) ? options.depotWorkshop.depotRepairService : undefined)
    || (isObject(options.depotWorkshop) ? options.depotWorkshop.workshopAssignmentService : undefined);
}

function serviceHandlerFrom(service) {
  if (typeof service === 'function') {
    return service;
  }

  if (isObject(service) && typeof service.prepareDepotRepairRouteIntent === 'function') {
    return service.prepareDepotRepairRouteIntent.bind(service);
  }

  if (isObject(service) && typeof service.prepareAssignmentIntent === 'function') {
    return service.prepareAssignmentIntent.bind(service);
  }

  return undefined;
}

function accessGuardFromOptions(options = {}) {
  if (!isObject(options)) {
    return evaluateDepotAccessScope;
  }

  if (typeof options.accessGuard === 'function') {
    return options.accessGuard;
  }

  if (isObject(options.depotWorkshop) && typeof options.depotWorkshop.accessGuard === 'function') {
    return options.depotWorkshop.accessGuard;
  }

  return evaluateDepotAccessScope;
}

function writeRequested(req = {}) {
  const body = bodyFromRequest(req);

  return body.writeRequested === true
    || body.writeApproved === true
    || body.persist === true
    || body.commit === true
    || String(req.method || '').toUpperCase() === 'PATCH'
    || String(req.method || '').toUpperCase() === 'PUT'
    || String(req.method || '').toUpperCase() === 'DELETE';
}

function buildAccessGuardInput(req = {}) {
  const user = userFromRequest(req);
  const body = bodyFromRequest(req);
  const context = contextFromRequest(req);
  const organizationId = organizationIdFrom(req, body, user);

  return {
    requestId: requestIdFrom(req, body),
    actor: {
      id: actorIdFrom(user),
      role: firstString(body.actorRole, user.role, context.role),
      organizationId,
      brandIds: user.brandIds || user.brand_ids || body.brandIds || body.brand_ids || body.brandId,
      serviceProviderIds: user.serviceProviderIds
        || user.service_provider_ids
        || body.serviceProviderIds
        || body.service_provider_ids
        || body.serviceProviderId,
      subcontractorOrganizationIds: user.subcontractorOrganizationIds
        || user.subcontractor_organization_ids
        || body.subcontractorOrganizationIds
        || body.subcontractor_organization_ids
        || body.subcontractorOrganizationId,
    },
    accessContext: {
      ...(isObject(context.accessContext) ? context.accessContext : {}),
      ...(isObject(body.accessContext) ? body.accessContext : {}),
      organizationId,
      role: firstString(body.actorRole, user.role, context.role),
      brandIds: body.accessBrandIds || body.brandIds || user.brandIds,
      serviceProviderIds: body.accessServiceProviderIds || body.serviceProviderIds || user.serviceProviderIds,
      subcontractorOrganizationIds: body.accessSubcontractorOrganizationIds
        || body.subcontractorOrganizationIds
        || user.subcontractorOrganizationIds,
      assignmentRelationship: firstString(
        body.assignmentRelationship,
        context.assignmentRelationship,
        isObject(context.accessContext) && context.accessContext.assignmentRelationship,
      ),
    },
    resource: {
      organizationId: firstString(body.resourceOrganizationId, body.organizationId, organizationId),
      brandId: firstString(body.resourceBrandId, body.brandId),
      serviceProviderId: firstString(body.resourceServiceProviderId, body.serviceProviderId, body.providerId),
      subcontractorOrganizationId: firstString(body.resourceSubcontractorOrganizationId, body.subcontractorOrganizationId),
      assignmentRelationship: firstString(body.resourceAssignmentRelationship, body.assignmentRelationship),
      subcontractorAssignmentApproved: body.subcontractorAssignmentApproved === true,
    },
    context,
  };
}

function buildServiceInput(req = {}) {
  const user = userFromRequest(req);
  const body = bodyFromRequest(req);
  const context = contextFromRequest(req);
  const organizationId = organizationIdFrom(req, body, user);
  const requestId = requestIdFrom(req, body);

  return compactRecord({
    depotIntakeId: depotIntakeIdFrom(req, body),
    draftId: depotIntakeIdFrom(req, body),
    organizationId,
    tenantId: firstString(body.tenantId, context.tenantId),
    actorId: actorIdFrom(user),
    actorRole: firstString(body.actorRole, user.role, context.role),
    brandId: firstString(body.brandId, body.resourceBrandId),
    serviceProviderId: firstString(body.serviceProviderId, body.resourceServiceProviderId, body.providerId),
    subcontractorOrganizationId: firstString(body.subcontractorOrganizationId, body.resourceSubcontractorOrganizationId),
    assignmentRelationship: firstString(body.assignmentRelationship, body.resourceAssignmentRelationship),
    workshopId: stringValue(body.workshopId),
    workshopTeamId: stringValue(body.workshopTeamId),
    assignedTechnicianId: stringValue(body.assignedTechnicianId),
    assignmentNote: stringValue(body.assignmentNote),
    requestId,
    context: {
      ...context,
      organizationId,
      actorId: actorIdFrom(user),
      requestId,
      permissionContext: {
        canPrepareDepotRepair: true,
        canAssignWorkshop: true,
        permission: 'workshop.assign',
        permissions: [
          DEPOT_REPAIR_ROUTE_PERMISSION,
          'workshop.assign',
        ],
      },
    },
    permissionContext: {
      canPrepareDepotRepair: true,
      canAssignWorkshop: true,
      permission: 'workshop.assign',
      permissions: [
        DEPOT_REPAIR_ROUTE_PERMISSION,
        'workshop.assign',
      ],
    },
  });
}

function statusCodeFromResult(result) {
  if (!isObject(result)) {
    return 502;
  }

  if (result.ok === true) {
    return 200;
  }

  switch (result.reasonCode) {
    case 'depot_repair_route_dependency_required':
    case 'depot_repair_route_service_required':
    case 'depot_repair_route_access_guard_required':
    case 'depot_repair_route_service_failed':
      return 503;
    case 'depot_repair_route_write_scope_not_approved':
    case 'workshop_assignment_write_scope_not_approved':
    case 'workshop_assignment_depot_status_ineligible':
      return 409;
    case 'depot_intake_required':
    case 'workshop_assignment_intent_required':
      return 400;
    case 'depot_intake_not_found_or_denied':
      return 404;
    default:
      return 403;
  }
}

function failure(reasonCode, req = {}) {
  return {
    ok: false,
    reasonCode,
    requestId: req.requestId || requestIdFrom(req, bodyFromRequest(req)),
  };
}

function successBody(result, req = {}) {
  return {
    data: {
      depotRepair: sanitizeValue(result.assignmentIntent || result.depotRepair || result.intent || null),
    },
    meta: {
      ok: true,
      prepared: result.prepared === true || result.ok === true,
      written: false,
      reasonCode: stringValue(result.reasonCode) || 'depot_repair_route_prepared',
    },
    requestId: stringValue(result.requestId) || requestIdFrom(req, bodyFromRequest(req)) || null,
  };
}

function failureBody(result, req = {}) {
  return {
    error: {
      code: 'DEPOT_REPAIR_ROUTE_DENIED',
      message: 'Depot repair route denied.',
      reasonCode: isObject(result) && stringValue(result.reasonCode)
        ? result.reasonCode
        : 'depot_repair_route_denied',
      requestId: (isObject(result) && stringValue(result.requestId)) || requestIdFrom(req, bodyFromRequest(req)) || null,
    },
  };
}

function sendResponse(res, statusCode, body) {
  const safeBody = sanitizeValue(body);

  if (res && typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(safeBody);
  }

  return {
    statusCode,
    body: safeBody,
  };
}

function createDepotRepairRouteHandler(options = {}) {
  const service = serviceFromOptions(options);
  const prepareIntent = serviceHandlerFrom(service);
  const accessGuard = accessGuardFromOptions(options);

  return async function depotRepairRouteHandler(req = {}, res) {
    let result;

    if (!prepareIntent) {
      result = failure('depot_repair_route_service_required', req);
      return sendResponse(res, statusCodeFromResult(result), failureBody(result, req));
    }

    if (typeof accessGuard !== 'function') {
      result = failure('depot_repair_route_access_guard_required', req);
      return sendResponse(res, statusCodeFromResult(result), failureBody(result, req));
    }

    if (writeRequested(req)) {
      result = failure('depot_repair_route_write_scope_not_approved', req);
      return sendResponse(res, statusCodeFromResult(result), failureBody(result, req));
    }

    try {
      const accessDecision = accessGuard(buildAccessGuardInput(req));

      if (!accessDecision || accessDecision.allowed !== true) {
        result = {
          ok: false,
          reasonCode: stringValue(accessDecision && accessDecision.reasonCode) || 'depot_repair_route_access_denied',
          requestId: requestIdFrom(req, bodyFromRequest(req)),
        };
        return sendResponse(res, statusCodeFromResult(result), failureBody(result, req));
      }

      result = await prepareIntent(buildServiceInput(req));
    } catch (error) {
      result = failure('depot_repair_route_service_failed', req);
    }

    const statusCode = statusCodeFromResult(result);
    const body = result && result.ok === true
      ? successBody(result, req)
      : failureBody(result, req);

    return sendResponse(res, statusCode, body);
  };
}

function mountSummary(mounted) {
  return {
    ok: mounted,
    mounted: mounted ? 1 : 0,
    routes: mounted
      ? [{
        method: 'POST',
        path: DEPOT_REPAIR_ROUTE_PATH,
      }]
      : [],
    reasonCode: mounted
      ? 'DEPOT_REPAIR_ROUTE_BOUNDARY_MOUNTED'
      : 'DEPOT_REPAIR_ROUTE_BOUNDARY_NOT_MOUNTED',
  };
}

function registerDepotRepairRoutes(router, options = {}) {
  if (!router || typeof router.post !== 'function') {
    return null;
  }

  const service = serviceFromOptions(options);

  if (!service) {
    return mountSummary(false);
  }

  router.post(
    DEPOT_REPAIR_ROUTE_PATH,
    requirePermission(DEPOT_REPAIR_ROUTE_PERMISSION),
    createDepotRepairRouteHandler(options),
  );

  return mountSummary(true);
}

module.exports = {
  DEPOT_REPAIR_ROUTE_PATH,
  DEPOT_REPAIR_ROUTE_PERMISSION,
  buildAccessGuardInput,
  buildServiceInput,
  createDepotRepairRouteHandler,
  registerDepotRepairRoutes,
};
