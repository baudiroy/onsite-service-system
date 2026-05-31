'use strict';

const UNSAFE_FIELD_NAMES = new Set([
  'address',
  'authorization',
  'billingpayload',
  'body',
  'client',
  'clientsecret',
  'cookie',
  'customer',
  'customerdata',
  'customername',
  'customerphone',
  'databaseerror',
  'database_url',
  'databaseurl',
  'db',
  'draftinput',
  'error',
  'finalappointmentid',
  'handler',
  'headers',
  'lineaccesstoken',
  'lineuserid',
  'password',
  'phone',
  'providerpayload',
  'raw',
  'rawbody',
  'rawdraft',
  'rawinput',
  'rawportoutput',
  'rawrepositoryresult',
  'rawrow',
  'rawrows',
  'rawservicepayload',
  'repository',
  'requestbody',
  'secret',
  'sql',
  'stack',
  'token',
]);

class RepairIntakeCasePlannerPortAdapterError extends Error {
  constructor(reasonCode, requiredActions = ['configure_planning_policy']) {
    super(reasonCode);
    this.name = 'RepairIntakeCasePlannerPortAdapterError';
    this.reasonCode = reasonCode;
    this.requiredActions = requiredActions;
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function fieldIsUnsafe(key) {
  return UNSAFE_FIELD_NAMES.has(String(key).toLowerCase());
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

function safeString(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function safeArray(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function firstSafeString(...values) {
  for (const value of values) {
    const candidate = safeString(value);

    if (candidate) {
      return candidate;
    }
  }

  return null;
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined && fieldValue !== null),
  );
}

function failureEnvelope(reasonCode, requiredActions = ['retry_or_manual_review']) {
  return {
    ok: false,
    status: 'failed',
    reasonCode,
    requiredActions,
    candidate: null,
    draft: null,
    warnings: [],
  };
}

function draftSummary(draft) {
  return sanitizeValue(compactObject({
    id: firstSafeString(draft.id, draft.draftId),
    draftId: firstSafeString(draft.draftId, draft.id),
    organizationId: safeString(draft.organizationId),
    tenantId: safeString(draft.tenantId),
    status: safeString(draft.status),
    source: draft.source,
    sourceRef: draft.sourceRef,
    intakeSource: draft.intakeSource,
    reasonCode: safeString(draft.reasonCode),
    requiredActions: safeArray(draft.requiredActions),
    summary: draft.summary,
  }));
}

function createPlanningInput(input) {
  const draft = isObject(input.draft) ? draftSummary(input.draft) : null;

  return sanitizeValue(compactObject({
    draft,
    draftId: firstSafeString(input.draftId, draft && draft.draftId, draft && draft.id),
    organizationId: firstSafeString(
      input.organizationId,
      input.context && input.context.organizationId,
      draft && draft.organizationId,
    ),
    tenantId: firstSafeString(input.tenantId, input.context && input.context.tenantId, draft && draft.tenantId),
    requestId: firstSafeString(input.requestId, input.context && input.context.requestId),
    actor: input.actor || (input.context && { actorId: input.context.actorId }),
    metadata: input.metadata,
    warnings: input.warnings,
  }));
}

function planEnvelope(planningInput, plannerResult = {}) {
  const candidate = isObject(plannerResult.candidate)
    ? plannerResult.candidate
    : {
      sourceDraftId: planningInput.draftId,
      organizationId: planningInput.organizationId,
      tenantId: planningInput.tenantId,
    };

  return sanitizeValue({
    ok: plannerResult.ok !== false,
    status: safeString(plannerResult.status) || 'planned',
    reasonCode: safeString(plannerResult.reasonCode) || 'REPAIR_INTAKE_CASE_PLANNER_PORT_ADAPTER_PLAN_READY',
    requiredActions: safeArray(plannerResult.requiredActions),
    candidate,
    draft: planningInput.draft,
    metadata: plannerResult.metadata || planningInput.metadata || null,
    warnings: safeArray(plannerResult.warnings || planningInput.warnings),
  });
}

function defaultPlanCaseFromDraft(planningInput) {
  return planEnvelope(planningInput);
}

function createRepairIntakeCasePlannerPortAdapter(options = {}) {
  const safeOptions = isObject(options) ? options : {};
  const { planningPolicy } = safeOptions;

  if (planningPolicy !== undefined && !(
    isObject(planningPolicy) && typeof planningPolicy.planCaseFromDraft === 'function'
  )) {
    throw new RepairIntakeCasePlannerPortAdapterError(
      'REPAIR_INTAKE_CASE_PLANNER_PORT_ADAPTER_POLICY_REQUIRED',
      ['configure_planning_policy_plan_case_from_draft'],
    );
  }

  async function planCaseFromDraft(input) {
    if (!isObject(input) || !isObject(input.draft)) {
      return failureEnvelope(
        'REPAIR_INTAKE_CASE_PLANNER_PORT_ADAPTER_INPUT_INVALID',
        ['provide_valid_planning_input'],
      );
    }

    const planningInput = createPlanningInput(sanitizeValue(input));

    if (!safeString(planningInput.draftId) || !isObject(planningInput.draft)) {
      return failureEnvelope(
        'REPAIR_INTAKE_CASE_PLANNER_PORT_ADAPTER_INPUT_INVALID',
        ['provide_valid_draft_summary'],
      );
    }

    try {
      if (planningPolicy) {
        const plannerResult = sanitizeValue(await planningPolicy.planCaseFromDraft(planningInput));

        if (!isObject(plannerResult)) {
          return failureEnvelope('REPAIR_INTAKE_CASE_PLANNER_PORT_ADAPTER_PLAN_FAILED');
        }

        return planEnvelope(planningInput, plannerResult);
      }

      return defaultPlanCaseFromDraft(planningInput);
    } catch (error) {
      return failureEnvelope('REPAIR_INTAKE_CASE_PLANNER_PORT_ADAPTER_PLAN_FAILED');
    }
  }

  return {
    planCaseFromDraft,
  };
}

module.exports = {
  RepairIntakeCasePlannerPortAdapterError,
  createRepairIntakeCasePlannerPortAdapter,
};
