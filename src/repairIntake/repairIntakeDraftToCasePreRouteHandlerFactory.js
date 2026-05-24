'use strict';

const UNAVAILABLE_BODY = {
  ok: false,
  status: 'unavailable',
  messageKey: 'repair_intake_draft_to_case.pre_route_handler_unavailable',
  reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PRE_ROUTE_HANDLER_UNAVAILABLE',
  caseId: null,
  repairIntakeDraftId: null,
};

const UNSAFE_FIELD_NAMES = new Set([
  'address',
  'authorization',
  'cookie',
  'customer',
  'customerdata',
  'customername',
  'customerphone',
  'databaseurl',
  'dbrow',
  'd' + 'b',
  'email',
  'error',
  'headers',
  'lineaccesstoken',
  'lineuserid',
  'permissiontrace',
  'phone',
  'pro' + 'viderpayload',
  'query',
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
  's' + 'ql',
  'stack',
  'token',
]);

function isPlainObject(value) {
  return Boolean(value)
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

function normalizedFieldName(value) {
  return String(value).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function fieldIsUnsafe(key) {
  const normalized = normalizedFieldName(key);

  return normalized.startsWith('raw') || UNSAFE_FIELD_NAMES.has(normalized);
}

function sanitizeNestedValue(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeNestedValue(item))
      .filter((item) => item !== undefined);
  }

  if (isPlainObject(value)) {
    const result = {};

    for (const [key, fieldValue] of Object.entries(value)) {
      if (fieldIsUnsafe(key)) {
        continue;
      }

      const sanitized = sanitizeNestedValue(fieldValue);

      if (sanitized !== undefined) {
        result[key] = sanitized;
      }
    }

    return result;
  }

  if (
    value === undefined
    || typeof value === 'function'
    || typeof value === 'symbol'
    || (value !== null && typeof value === 'object')
  ) {
    return undefined;
  }

  return value;
}

function safeString(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function unavailableEnvelope(reasonCode = UNAVAILABLE_BODY.reasonCode) {
  return {
    statusCode: 503,
    body: {
      ...UNAVAILABLE_BODY,
      reasonCode,
    },
    auditIntents: [],
    idempotencyPolicy: null,
  };
}

function resolveFunction(dependency, functionName) {
  if (typeof dependency === 'function') {
    return dependency;
  }

  if (isPlainObject(dependency) && typeof dependency[functionName] === 'function') {
    return dependency[functionName].bind(dependency);
  }

  return null;
}

function normalizeHttpEnvelope(value) {
  const safeValue = sanitizeNestedValue(value);

  if (!isPlainObject(safeValue) || typeof safeValue.statusCode !== 'number' || !isPlainObject(safeValue.body)) {
    return unavailableEnvelope(
      'REPAIR_INTAKE_DRAFT_TO_CASE_PRE_ROUTE_HANDLER_HTTP_ENVELOPE_INVALID',
    );
  }

  return {
    statusCode: safeValue.statusCode,
    body: safeValue.body,
    auditIntents: [],
    idempotencyPolicy: null,
  };
}

function policyInputFromContext(context, input) {
  const requestBody = isPlainObject(input.requestBody) ? input.requestBody : {};

  return {
    organizationId: safeString(context.organizationId),
    actorId: safeString(context.actorId),
    repairIntakeDraftId: safeString(context.repairIntakeDraftId),
    requestId: safeString(input.requestId),
    idempotencyKey: safeString(input.idempotencyKey) || safeString(requestBody.idempotencyKey),
    source: safeString(context.source),
  };
}

function auditInputFromContext(context, phase, result = {}) {
  return {
    phase,
    organizationId: safeString(context.organizationId),
    actorId: safeString(context.actorId),
    repairIntakeDraftId: safeString(context.repairIntakeDraftId),
    caseId: safeString(result.caseId),
    resultStatus: safeString(result.status) || 'started',
    reasonCode: safeString(result.reasonCode) || 'REPAIR_INTAKE_DRAFT_TO_CASE_PRE_ROUTE_HANDLER_ATTEMPT',
    source: safeString(context.source),
  };
}

function completionPhase(publicResult) {
  if (isPlainObject(publicResult) && publicResult.ok === true) {
    return 'submitted';
  }

  return isPlainObject(publicResult) && publicResult.status === 'denied' ? 'denied' : 'failed';
}

function createRepairIntakeDraftToCasePreRouteHandler(options = {}) {
  const safeOptions = isPlainObject(options) ? options : {};
  const resolveContext = resolveFunction(
    safeOptions.requestContextResolver,
    'resolveRepairIntakeDraftToCaseRequestContext',
  );
  const buildPolicy = resolveFunction(
    safeOptions.idempotencyPolicyBuilder,
    'buildRepairIntakeDraftToCaseIdempotencyPolicy',
  );
  const buildAudit = resolveFunction(
    safeOptions.auditIntentBuilder,
    'buildRepairIntakeDraftToCaseAuditIntent',
  );
  const handleSynthetic = resolveFunction(
    safeOptions.syntheticHandler,
    'handleDraftToCase',
  );
  const mapHttpResult = resolveFunction(
    safeOptions.httpResultMapper,
    'mapRepairIntakeDraftToCasePublicResultToHttpResponse',
  );

  if (!resolveContext || !buildPolicy || !buildAudit || !handleSynthetic || !mapHttpResult) {
    async function handleDraftToCasePreRoute() {
      return unavailableEnvelope(
        'REPAIR_INTAKE_DRAFT_TO_CASE_PRE_ROUTE_HANDLER_DEPENDENCY_REQUIRED',
      );
    }

    return {
      handleDraftToCasePreRoute,
    };
  }

  async function mapToHttp(publicResult) {
    try {
      return normalizeHttpEnvelope(await mapHttpResult(publicResult));
    } catch (error) {
      return unavailableEnvelope(
        'REPAIR_INTAKE_DRAFT_TO_CASE_PRE_ROUTE_HANDLER_HTTP_MAPPER_FAILED',
      );
    }
  }

  async function handleDraftToCasePreRoute(input = {}) {
    const safeInput = isPlainObject(input) ? input : {};
    let context;

    try {
      context = sanitizeNestedValue(await resolveContext(safeInput));
    } catch (error) {
      return unavailableEnvelope(
        'REPAIR_INTAKE_DRAFT_TO_CASE_PRE_ROUTE_HANDLER_CONTEXT_RESOLVER_FAILED',
      );
    }

    if (!isPlainObject(context) || context.ok !== true) {
      const invalidContext = isPlainObject(context) ? context : {
        ok: false,
        status: 'invalid_context',
        reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PRE_ROUTE_HANDLER_CONTEXT_INVALID',
      };
      const httpEnvelope = await mapToHttp(invalidContext);
      let invalidAudit = null;

      try {
        invalidAudit = sanitizeNestedValue(await buildAudit(auditInputFromContext(invalidContext, 'failed', invalidContext)));
      } catch (error) {
        invalidAudit = null;
      }

      return sanitizeNestedValue({
        statusCode: httpEnvelope.statusCode,
        body: httpEnvelope.body,
        auditIntents: invalidAudit ? [invalidAudit] : [],
        idempotencyPolicy: null,
      });
    }

    let idempotencyPolicy;
    let attemptAudit;

    try {
      idempotencyPolicy = sanitizeNestedValue(await buildPolicy(policyInputFromContext(context, safeInput)));
      attemptAudit = sanitizeNestedValue(await buildAudit(auditInputFromContext(context, 'attempt')));
    } catch (error) {
      return unavailableEnvelope(
        'REPAIR_INTAKE_DRAFT_TO_CASE_PRE_ROUTE_HANDLER_PRECONDITION_BUILD_FAILED',
      );
    }

    let publicResult;

    try {
      publicResult = sanitizeNestedValue(await handleSynthetic(safeInput));
    } catch (error) {
      publicResult = {
        ok: false,
        status: 'unavailable',
        messageKey: UNAVAILABLE_BODY.messageKey,
        reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_PRE_ROUTE_HANDLER_SYNTHETIC_HANDLER_FAILED',
        caseId: null,
        repairIntakeDraftId: safeString(context.repairIntakeDraftId),
      };
    }

    const httpEnvelope = await mapToHttp(publicResult);
    let finalAudit = null;

    try {
      finalAudit = sanitizeNestedValue(await buildAudit(
        auditInputFromContext(context, completionPhase(publicResult), publicResult),
      ));
    } catch (error) {
      finalAudit = null;
    }

    return sanitizeNestedValue({
      statusCode: httpEnvelope.statusCode,
      body: httpEnvelope.body,
      auditIntents: [attemptAudit, finalAudit].filter(Boolean),
      idempotencyPolicy,
    });
  }

  return {
    handleDraftToCasePreRoute,
  };
}

module.exports = {
  createRepairIntakeDraftToCasePreRouteHandler,
};
