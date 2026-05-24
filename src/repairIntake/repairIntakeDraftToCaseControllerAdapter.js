'use strict';

const PUBLIC_UNAVAILABLE = {
  ok: false,
  status: 'unavailable',
  messageKey: 'repair_intake_draft_to_case.unavailable',
  reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_ADAPTER_UNAVAILABLE',
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
  'd' + 'b',
  'error',
  'final' + 'appointment' + 'id',
  'headers',
  'lineaccesstoken',
  'lineuserid',
  'params',
  'phone',
  'query',
  'raw',
  'rawbody',
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

  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
    return undefined;
  }

  return value;
}

function safeString(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function createSafeInternalInput(syntheticInput) {
  const safeInput = sanitizeNestedValue(isPlainObject(syntheticInput) ? syntheticInput : {});
  const draftInput = isPlainObject(safeInput.draftInput) ? safeInput.draftInput : undefined;

  return sanitizeNestedValue({
    organizationId: safeString(safeInput.organizationId),
    actorId: safeString(safeInput.actorId),
    repairIntakeDraftId: safeString(safeInput.repairIntakeDraftId),
    source: safeString(safeInput.source),
    actorRole: safeString(safeInput.actorRole),
    requestId: safeString(safeInput.requestId),
    tenantId: safeString(safeInput.tenantId),
    draftInput,
    metadata: isPlainObject(safeInput.metadata) ? safeInput.metadata : {},
  });
}

function minimalUnavailable(syntheticInput, reasonCode = PUBLIC_UNAVAILABLE.reasonCode) {
  const safeInput = createSafeInternalInput(syntheticInput);

  return {
    ...PUBLIC_UNAVAILABLE,
    reasonCode,
    repairIntakeDraftId: safeInput.repairIntakeDraftId || null,
  };
}

function resolvePresenter(publicResultPresenter) {
  if (typeof publicResultPresenter === 'function') {
    return publicResultPresenter;
  }

  if (
    isPlainObject(publicResultPresenter)
    && typeof publicResultPresenter.presentRepairIntakeDraftToCaseResult === 'function'
  ) {
    return publicResultPresenter.presentRepairIntakeDraftToCaseResult.bind(publicResultPresenter);
  }

  return null;
}

function createInvalidAdapter(reasonCode) {
  async function submitDraftToCase(syntheticInput = {}) {
    return minimalUnavailable(syntheticInput, reasonCode);
  }

  return {
    submitDraftToCase,
  };
}

function createRepairIntakeDraftToCaseControllerAdapter(options = {}) {
  const safeOptions = isPlainObject(options) ? options : {};
  const { orchestrator, publicResultPresenter } = safeOptions;
  const presenter = resolvePresenter(publicResultPresenter);

  if (!isPlainObject(orchestrator)) {
    return createInvalidAdapter(
      'REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_ADAPTER_ORCHESTRATOR_REQUIRED',
    );
  }

  if (typeof orchestrator.submitDraftToCase !== 'function') {
    return createInvalidAdapter(
      'REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_ADAPTER_ORCHESTRATOR_METHOD_REQUIRED',
    );
  }

  if (!presenter) {
    return createInvalidAdapter(
      'REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_ADAPTER_PRESENTER_REQUIRED',
    );
  }

  async function submitDraftToCase(syntheticInput = {}) {
    const safeInput = createSafeInternalInput(syntheticInput);
    let orchestratorResult;

    try {
      orchestratorResult = await orchestrator.submitDraftToCase(safeInput);
    } catch (error) {
      orchestratorResult = {
        ok: false,
        status: 'failed',
        reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_ADAPTER_ORCHESTRATOR_FAILED',
        repairIntakeDraftId: safeInput.repairIntakeDraftId || null,
      };
    }

    try {
      return sanitizeNestedValue(presenter(orchestratorResult));
    } catch (error) {
      return minimalUnavailable(safeInput, 'REPAIR_INTAKE_DRAFT_TO_CASE_CONTROLLER_ADAPTER_PRESENTER_FAILED');
    }
  }

  return {
    submitDraftToCase,
  };
}

module.exports = {
  createRepairIntakeDraftToCaseControllerAdapter,
};
