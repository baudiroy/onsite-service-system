'use strict';

const ROUTE = Object.freeze({
  method: 'POST',
  path: '/repair-intake/drafts/:draftId/case/plan',
});

const UNSAFE_FIELD_NAMES = new Set([
  'address',
  'authorization',
  'caseid',
  'case_id',
  'caseno',
  'case_no',
  'caseref',
  'case_ref',
  'cookie',
  'customerpayload',
  'database_url',
  'databaseurl',
  'db',
  'error',
  'finalappointmentid',
  'final_appointment_id',
  'headers',
  'lineaccesstoken',
  'lineuserid',
  'permissiontrace',
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
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
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

function safeActions(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim())
    : [];
}

function firstString(...values) {
  for (const value of values) {
    const safe = stringValue(value);

    if (safe) {
      return safe;
    }
  }

  return undefined;
}

function resolvePlanner(planningService) {
  if (typeof planningService === 'function') {
    return planningService;
  }

  if (isObject(planningService) && typeof planningService.planDraftToCase === 'function') {
    return planningService.planDraftToCase.bind(planningService);
  }

  return null;
}

function contextFromRequest(requestLike) {
  const request = isObject(requestLike) ? requestLike : {};
  const context = isObject(request.context) ? request.context : {};
  const sessionContext = isObject(request.sessionContext) ? request.sessionContext : {};
  const actor = isObject(request.actor) ? request.actor : {};

  return {
    organizationId: firstString(context.organizationId, sessionContext.organizationId, request.organizationId),
    actorId: firstString(context.actorId, sessionContext.actorId, actor.actorId, actor.id),
    requestId: firstString(request.requestId, context.requestId, sessionContext.requestId),
  };
}

function draftIdFromRequest(requestLike) {
  const request = isObject(requestLike) ? requestLike : {};
  const params = isObject(request.params) ? request.params : {};

  return firstString(
    params.repairIntakeDraftId,
    params.draftId,
    request.repairIntakeDraftId,
    request.draftId,
  );
}

function body(statusCode, status, reasonCode, {
  ok = false,
  repairIntakeDraftId = null,
  requiredActions = [],
} = {}) {
  return {
    statusCode,
    body: {
      ok,
      status,
      messageKey: `repair_intake_draft_to_case.${status}`,
      reasonCode,
      caseId: null,
      repairIntakeDraftId,
      requiredActions: safeActions(requiredActions),
    },
  };
}

function statusFromPlanResult(planResult) {
  const reasonCode = stringValue(planResult && planResult.reasonCode);
  const status = stringValue(planResult && planResult.status);

  if (planResult && planResult.ok === true) {
    return { statusCode: 200, status: 'planned' };
  }

  if (reasonCode === 'draft_not_found') {
    return { statusCode: 404, status: 'not_found' };
  }

  if (
    reasonCode === 'organization_scope_mismatch'
    || reasonCode === 'missing_organization_scope'
    || status === 'forbidden'
    || status === 'denied'
  ) {
    return { statusCode: 403, status: 'denied' };
  }

  if (
    status === 'needs_review'
    || reasonCode === 'duplicate_unresolved'
    || reasonCode === 'duplicate_candidate_review_required'
    || reasonCode === 'duplicate_signal_missing'
  ) {
    return { statusCode: 202, status: 'review_required' };
  }

  return { statusCode: 403, status: 'denied' };
}

function publicEnvelopeFromPlanResult(planResult, fallbackDraftId) {
  const safePlan = sanitizeValue(isObject(planResult) ? planResult : {});
  const reasonCode = stringValue(safePlan.reasonCode)
    || 'REPAIR_INTAKE_DRAFT_TO_CASE_SAFE_ROUTE_PLAN_DENIED';
  const repairIntakeDraftId = firstString(safePlan.draftId, fallbackDraftId) || null;
  const resolvedStatus = statusFromPlanResult(safePlan);

  return body(resolvedStatus.statusCode, resolvedStatus.status, reasonCode, {
    ok: safePlan.ok === true && resolvedStatus.statusCode === 200,
    repairIntakeDraftId,
    requiredActions: safePlan.requiredActions,
  });
}

function createRepairIntakeDraftToCaseSafeRouteBoundary(options = {}) {
  const safeOptions = isObject(options) ? options : {};
  const planDraftToCase = resolvePlanner(safeOptions.planningService);

  async function handlePlanRoute(requestLike = {}) {
    if (!planDraftToCase) {
      return body(
        503,
        'unavailable',
        'REPAIR_INTAKE_DRAFT_TO_CASE_SAFE_ROUTE_PLANNER_REQUIRED',
        { requiredActions: ['configure_planning_service'] },
      );
    }

    const repairIntakeDraftId = draftIdFromRequest(requestLike);

    if (!repairIntakeDraftId) {
      return body(
        400,
        'invalid_request',
        'REPAIR_INTAKE_DRAFT_TO_CASE_SAFE_ROUTE_DRAFT_ID_REQUIRED',
        { requiredActions: ['provide_repair_intake_draft_id'] },
      );
    }

    const context = contextFromRequest(requestLike);

    if (!context.organizationId || !context.actorId) {
      return body(
        403,
        'denied',
        'REPAIR_INTAKE_DRAFT_TO_CASE_SAFE_ROUTE_CONTEXT_REQUIRED',
        {
          repairIntakeDraftId,
          requiredActions: ['provide_authenticated_organization_context'],
        },
      );
    }

    const serviceInput = {
      draftId: repairIntakeDraftId,
      organizationId: context.organizationId,
      actorId: context.actorId,
      requestId: context.requestId,
    };

    try {
      const planResult = await planDraftToCase(serviceInput);

      return publicEnvelopeFromPlanResult(planResult, repairIntakeDraftId);
    } catch (error) {
      return body(
        503,
        'unavailable',
        'REPAIR_INTAKE_DRAFT_TO_CASE_SAFE_ROUTE_PLANNER_FAILED',
        {
          repairIntakeDraftId,
          requiredActions: ['retry_or_manual_review'],
        },
      );
    }
  }

  return {
    ok: true,
    routes: [{
      ...ROUTE,
      handler: handlePlanRoute,
    }],
    handlePlanRoute,
  };
}

module.exports = {
  ROUTE,
  createRepairIntakeDraftToCaseSafeRouteBoundary,
};
