'use strict';

const UNSAFE_FIELD_NAMES = new Set([
  'address',
  'auditinternal',
  'authorization',
  'billing',
  'cookie',
  'customername',
  'customerphone',
  'customer',
  'customerdata',
  'database_url',
  'databaseurl',
  'db',
  'debug',
  'error',
  'finalappointmentid',
  'handler',
  'headers',
  'internal',
  'invoice',
  'lineaccesstoken',
  'lineuserid',
  'password',
  'phone',
  'providerpayload',
  'rag',
  'raw',
  'rawbody',
  'rawdraft',
  'rawinput',
  'rawportoutput',
  'rawrows',
  'secret',
  'settlement',
  'sql',
  'stack',
  'token',
]);

class RepairIntakeDraftToCaseApplicationServiceError extends Error {
  constructor(reasonCode, requiredActions = ['configure_application_service_ports']) {
    super(reasonCode);
    this.name = 'RepairIntakeDraftToCaseApplicationServiceError';
    this.reasonCode = reasonCode;
    this.requiredActions = requiredActions;
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function portMethodIsValid(port, methodName) {
  return isObject(port) && typeof port[methodName] === 'function';
}

function portsAreValid(ports) {
  return portMethodIsValid(ports.draftReader, 'getDraftForConversion')
    && portMethodIsValid(ports.casePlanner, 'planCaseFromDraft')
    && portMethodIsValid(ports.caseCreator, 'createCaseFromDraft')
    && portMethodIsValid(ports.auditWriter, 'recordDraftToCaseDecision');
}

function idempotencyPortIsValid(idempotencyPort) {
  return idempotencyPort === undefined || (
    portMethodIsValid(idempotencyPort, 'findExistingDraftToCaseResult')
    && portMethodIsValid(idempotencyPort, 'recordDraftToCaseResult')
  );
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

function safeArray(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function safeString(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function safeFailure(reasonCode, requiredActions = ['retry_or_manual_review']) {
  return {
    ok: false,
    action: null,
    draftId: null,
    organizationId: null,
    status: 'failed',
    submitted: false,
    reasonCode,
    requiredActions,
    plan: null,
    caseRef: null,
    auditEvent: null,
  };
}

function draftReadFailed(draft) {
  return !isObject(draft) || draft.ok === false || safeString(draft.status) === 'failed';
}

function draftReadFailureEnvelope(input, draft, action) {
  const inputPayload = createInputPayload(input);

  return sanitizeValue({
    ok: false,
    action,
    draftId: safeString(inputPayload.draftId) || safeString(draft && (draft.draftId || draft.id)) || null,
    organizationId: safeString(inputPayload.organizationId) || safeString(draft && draft.organizationId) || null,
    status: safeString(draft && draft.status) || 'failed',
    submitted: false,
    reasonCode: safeString(draft && draft.reasonCode)
      || 'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_DRAFT_READ_FAILED',
    requiredActions: safeArray(draft && draft.requiredActions).length > 0
      ? safeArray(draft.requiredActions)
      : ['retry_or_manual_review'],
    plan: null,
    caseRef: null,
    auditEvent: null,
  });
}

function draftAlreadyConverted(draft) {
  const status = safeString(draft && draft.status);

  return status === 'converted'
    || status === 'already_converted'
    || status === 'linked'
    || status === 'already_linked';
}

function draftAlreadyConvertedFailureEnvelope(input, draft) {
  const inputPayload = createInputPayload(input);

  return sanitizeValue({
    ok: false,
    action: 'repair_intake_draft_to_case_submit',
    draftId: safeString(inputPayload.draftId) || safeString(draft && (draft.draftId || draft.id)) || null,
    organizationId: safeString(inputPayload.organizationId) || safeString(draft && draft.organizationId) || null,
    status: 'blocked',
    submitted: false,
    reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_DRAFT_ALREADY_CONVERTED',
    requiredActions: ['do_not_create_duplicate_case'],
    plan: null,
    caseRef: null,
    auditEvent: null,
  });
}

function submitPreconditionFailure(input) {
  const body = isObject(input.body) ? input.body : {};
  const idempotencyKey = firstSafeString(input.idempotencyKey, body.idempotencyKey);

  if (!idempotencyKey) {
    return safeFailure(
      'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_IDEMPOTENCY_REQUIRED',
      ['provide_idempotency_key'],
    );
  }

  if (
    !isObject(body.permissionContext)
    || body.permissionContext.canCreateCaseFromRepairIntakeDraft !== true
  ) {
    return safeFailure(
      'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_PERMISSION_REQUIRED',
      ['provide_case_creation_permission'],
    );
  }

  if (!isObject(body.approvalContext) || body.approvalContext.accepted !== true) {
    return safeFailure(
      'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_APPROVAL_REQUIRED',
      ['provide_approval_acceptance'],
    );
  }

  return null;
}

function planEnvelope(input, draft, plan) {
  return sanitizeValue({
    ok: true,
    action: 'repair_intake_draft_to_case_plan',
    draftId: safeString(input.draftId) || safeString(draft.id) || null,
    organizationId: safeString(input.organizationId) || safeString(draft.organizationId) || null,
    status: safeString(plan.status) || 'planned',
    submitted: false,
    reasonCode: safeString(plan.reasonCode) || 'REPAIR_INTAKE_DRAFT_TO_CASE_PLAN_READY',
    requiredActions: safeArray(plan.requiredActions),
    plan,
    caseRef: null,
    auditEvent: null,
  });
}

function submitEnvelope(input, draft, plan, caseRef, auditEvent) {
  return sanitizeValue({
    ok: true,
    action: 'repair_intake_draft_to_case_submit',
    draftId: safeString(input.draftId) || safeString(draft.id) || null,
    organizationId: safeString(input.organizationId) || safeString(draft.organizationId) || null,
    status: safeString(caseRef.status) || 'submitted',
    submitted: true,
    reasonCode: safeString(caseRef.reasonCode) || 'REPAIR_INTAKE_DRAFT_TO_CASE_SUBMITTED',
    requiredActions: safeArray(caseRef.requiredActions),
    plan,
    caseRef,
    auditEvent,
  });
}

function idempotentReplayEnvelope(input, existingResult) {
  return sanitizeValue({
    ok: true,
    action: existingResult.action || 'repair_intake_draft_to_case_submit',
    draftId: safeString(existingResult.draftId) || safeString(input.draftId) || null,
    organizationId: safeString(existingResult.organizationId) || safeString(input.organizationId) || null,
    status: safeString(existingResult.status) || 'submitted',
    submitted: existingResult.submitted !== false,
    reasonCode: safeString(existingResult.reasonCode) || 'REPAIR_INTAKE_DRAFT_TO_CASE_IDEMPOTENT_REPLAY',
    requiredActions: safeArray(existingResult.requiredActions),
    plan: existingResult.plan || null,
    caseRef: existingResult.caseRef || null,
    auditEvent: existingResult.auditEvent || null,
    idempotentReplay: true,
  });
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
  );
}

function firstSafeString(...values) {
  for (const value of values) {
    const candidate = safeString(value);

    if (candidate) {
      return candidate;
    }
  }

  return undefined;
}

function createInputPayload(input) {
  return sanitizeValue(compactObject({
    draftId: firstSafeString(input.draftId, input.params && input.params.draftId, input.body && input.body.draftId),
    organizationId: firstSafeString(
      input.organizationId,
      input.context && input.context.organizationId,
      input.body && input.body.organizationId,
    ),
    actorId: firstSafeString(input.actorId, input.context && input.context.actorId, input.body && input.body.actorId),
    requestId: firstSafeString(
      input.requestId,
      input.context && input.context.requestId,
      input.body && input.body.requestId,
    ),
    idempotencyKey: firstSafeString(input.idempotencyKey, input.body && input.body.idempotencyKey),
    tenantId: firstSafeString(input.tenantId, input.body && input.body.tenantId),
    approvalContext: input.approvalContext || (input.body && input.body.approvalContext),
    permissionContext: input.permissionContext || (input.context && input.context.permissionContext),
    params: input.params,
    query: input.query,
    body: input.body,
    context: input.context,
  }));
}

function createDraftSummary(draft) {
  return sanitizeValue(compactObject({
    id: draft.id,
    draftId: draft.draftId || draft.id,
    organizationId: draft.organizationId,
    status: draft.status,
    source: draft.source,
    sourceRef: draft.sourceRef,
    intakeSource: draft.intakeSource,
    reasonCode: draft.reasonCode,
    requiredActions: draft.requiredActions,
    summary: draft.summary,
  }));
}

function createPlanSummary(plan) {
  return sanitizeValue(compactObject({
    status: plan.status,
    reasonCode: plan.reasonCode,
    requiredActions: plan.requiredActions,
    candidate: plan.candidate,
    caseCandidate: plan.caseCandidate,
    summary: plan.summary,
  }));
}

function createCaseRefSummary(caseRef) {
  return sanitizeValue(compactObject({
    id: caseRef.id,
    caseId: caseRef.caseId || caseRef.id,
    organizationId: caseRef.organizationId,
    sourceDraftId: caseRef.sourceDraftId,
    status: caseRef.status,
    reasonCode: caseRef.reasonCode,
    requiredActions: caseRef.requiredActions,
    summary: caseRef.summary,
  }));
}

function createPlanPayload(input, draft) {
  return sanitizeValue({
    ...createInputPayload(input),
    draft: createDraftSummary(draft),
  });
}

function createCasePayload(input, draft, plan) {
  return sanitizeValue({
    ...createInputPayload(input),
    draft: createDraftSummary(draft),
    plan: createPlanSummary(plan),
  });
}

function createAuditPayload(input, draft, plan, caseRef) {
  return sanitizeValue({
    ...createInputPayload(input),
    draft: createDraftSummary(draft),
    plan: createPlanSummary(plan),
    caseRef: createCaseRefSummary(caseRef),
    decision: 'submitted',
  });
}

function createIdempotencyRecordPayload(input, result) {
  return sanitizeValue({
    ...createInputPayload(input),
    caseRef: isObject(result && result.caseRef) ? result.caseRef : undefined,
    result,
  });
}

function existingResultIsSuccessful(existingResult) {
  return isObject(existingResult) && (
    existingResult.ok === true
    || existingResult.submitted === true
  );
}

function portResultFailed(result) {
  return !isObject(result)
    || result.ok === false
    || safeString(result.status) === 'failed';
}

async function callIdempotencyPort(operation) {
  try {
    return sanitizeValue(await operation());
  } catch (error) {
    throw new RepairIntakeDraftToCaseApplicationServiceError(
      'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_IDEMPOTENCY_FAILED',
      ['retry_or_manual_review'],
    );
  }
}

function createRepairIntakeDraftToCaseApplicationService(options = {}) {
  const safeOptions = isObject(options) ? options : {};

  if (!portsAreValid(safeOptions)) {
    throw new RepairIntakeDraftToCaseApplicationServiceError(
      'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_PORTS_REQUIRED',
      ['configure_draft_reader_case_planner_case_creator_audit_writer'],
    );
  }

  if (!idempotencyPortIsValid(safeOptions.idempotencyPort)) {
    throw new RepairIntakeDraftToCaseApplicationServiceError(
      'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_IDEMPOTENCY_PORT_REQUIRED',
      ['configure_idempotency_port'],
    );
  }

  const {
    auditWriter,
    caseCreator,
    casePlanner,
    draftReader,
    idempotencyPort,
  } = safeOptions;

  async function planDraftToCase(input) {
    if (!isObject(input)) {
      return safeFailure(
        'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_PLAN_INPUT_INVALID',
        ['provide_valid_input'],
      );
    }

    const safeInput = sanitizeValue(input);

    try {
      const draft = sanitizeValue(await draftReader.getDraftForConversion(createInputPayload(safeInput)));

      if (draftReadFailed(draft)) {
        return draftReadFailureEnvelope(safeInput, draft, 'repair_intake_draft_to_case_plan');
      }

      const plan = sanitizeValue(await casePlanner.planCaseFromDraft(createPlanPayload(safeInput, draft)));

      if (!isObject(plan)) {
        return safeFailure('REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_PLAN_FAILED');
      }

      return planEnvelope(safeInput, draft, plan);
    } catch (error) {
      return safeFailure('REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_PLAN_FAILED');
    }
  }

  async function submitDraftToCase(input) {
    if (!isObject(input)) {
      return safeFailure(
        'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_SUBMIT_INPUT_INVALID',
        ['provide_valid_input'],
      );
    }

    const preconditionFailure = submitPreconditionFailure(input);

    if (preconditionFailure) {
      return preconditionFailure;
    }

    const safeInput = sanitizeValue(input);

    try {
      if (idempotencyPort) {
        const existingResult = await callIdempotencyPort(
          () => idempotencyPort.findExistingDraftToCaseResult(createInputPayload(safeInput)),
        );

        if (existingResultIsSuccessful(existingResult)) {
          return idempotentReplayEnvelope(safeInput, existingResult);
        }
      }

      const draft = sanitizeValue(await draftReader.getDraftForConversion(createInputPayload(safeInput)));

      if (draftReadFailed(draft)) {
        return draftReadFailureEnvelope(safeInput, draft, 'repair_intake_draft_to_case_submit');
      }

      if (draftAlreadyConverted(draft)) {
        return draftAlreadyConvertedFailureEnvelope(safeInput, draft);
      }

      const plan = sanitizeValue(await casePlanner.planCaseFromDraft(createPlanPayload(safeInput, draft)));
      if (!isObject(plan)) {
        return safeFailure('REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_SUBMIT_FAILED');
      }

      const caseRef = sanitizeValue(await caseCreator.createCaseFromDraft(createCasePayload(safeInput, draft, plan)));
      if (portResultFailed(caseRef)) {
        return safeFailure('REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_SUBMIT_FAILED');
      }

      const auditEvent = sanitizeValue(
        await auditWriter.recordDraftToCaseDecision(createAuditPayload(safeInput, draft, plan, caseRef)),
      );
      if (portResultFailed(auditEvent)) {
        return safeFailure('REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_SUBMIT_FAILED');
      }

      const result = submitEnvelope(safeInput, draft, plan, caseRef, auditEvent);

      if (idempotencyPort) {
        const recordedResult = await callIdempotencyPort(
          () => idempotencyPort.recordDraftToCaseResult(createIdempotencyRecordPayload(safeInput, result)),
        );

        if (portResultFailed(recordedResult)) {
          return safeFailure('REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_IDEMPOTENCY_FAILED');
        }
      }

      return result;
    } catch (error) {
      if (
        error instanceof RepairIntakeDraftToCaseApplicationServiceError
        && error.reasonCode === 'REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_IDEMPOTENCY_FAILED'
      ) {
        return safeFailure(error.reasonCode);
      }

      return safeFailure('REPAIR_INTAKE_DRAFT_TO_CASE_APPLICATION_SERVICE_SUBMIT_FAILED');
    }
  }

  return {
    planDraftToCase,
    submitDraftToCase,
  };
}

function invalidInputEnvelope(reasonCode, request = {}, requiredActions = ['provide_valid_request']) {
  const safeRequest = sanitizeValue(isObject(request) ? request : {});

  return sanitizeValue({
    ok: false,
    action: 'repair_intake_draft_to_case_consumer_submit',
    status: 'invalid_input',
    submitted: false,
    reasonCode,
    requiredActions,
    repairIntakeDraftId: safeString(safeRequest.repairIntakeDraftId),
    draftId: safeString(safeRequest.repairIntakeDraftId),
    organizationId: safeString(safeRequest.organizationId),
    tenantId: safeString(safeRequest.tenantId),
    requestId: safeString(safeRequest.requestId),
    actorId: safeString(safeRequest.actorId),
    caseId: null,
    caseRef: null,
    summary: null,
    metadata: {},
    warnings: [],
  });
}

function invalidConsumerDependencyEnvelope(reasonCode) {
  return {
    ok: false,
    action: 'repair_intake_draft_to_case_consumer_submit',
    status: 'invalid_dependency',
    submitted: false,
    reasonCode,
    requiredActions: ['configure_case_repository_consumer'],
    repairIntakeDraftId: null,
    draftId: null,
    organizationId: null,
    tenantId: null,
    requestId: null,
    actorId: null,
    caseId: null,
    caseRef: null,
    summary: null,
    metadata: {},
    warnings: [],
  };
}

function validateConsumerApplicationRequest(request) {
  if (!isObject(request)) {
    return 'REPAIR_INTAKE_DRAFT_TO_CASE_CONSUMER_APPLICATION_SERVICE_INPUT_INVALID';
  }

  if (!safeString(request.organizationId)) {
    return 'REPAIR_INTAKE_DRAFT_TO_CASE_CONSUMER_APPLICATION_SERVICE_ORGANIZATION_REQUIRED';
  }

  if (!safeString(request.actorId)) {
    return 'REPAIR_INTAKE_DRAFT_TO_CASE_CONSUMER_APPLICATION_SERVICE_ACTOR_REQUIRED';
  }

  if (!safeString(request.repairIntakeDraftId)) {
    return 'REPAIR_INTAKE_DRAFT_TO_CASE_CONSUMER_APPLICATION_SERVICE_DRAFT_REQUIRED';
  }

  if (request.draftInput !== undefined && !isObject(request.draftInput)) {
    return 'REPAIR_INTAKE_DRAFT_TO_CASE_CONSUMER_APPLICATION_SERVICE_DRAFT_INPUT_INVALID';
  }

  return null;
}

function createConsumerInput(request) {
  const safeRequest = sanitizeValue(request);
  const draftInput = isObject(safeRequest.draftInput) ? safeRequest.draftInput : {};

  return sanitizeValue({
    draftId: safeString(safeRequest.repairIntakeDraftId),
    sourceDraftId: safeString(safeRequest.repairIntakeDraftId),
    organizationId: safeString(safeRequest.organizationId),
    tenantId: safeString(safeRequest.tenantId),
    requestId: safeString(safeRequest.requestId),
    actorId: safeString(safeRequest.actorId),
    draft: {
      ...draftInput,
      draftId: safeString(safeRequest.repairIntakeDraftId),
      organizationId: safeString(safeRequest.organizationId),
      tenantId: safeString(safeRequest.tenantId),
    },
    plan: {
      sourceDraftId: safeString(safeRequest.repairIntakeDraftId),
      organizationId: safeString(safeRequest.organizationId),
      tenantId: safeString(safeRequest.tenantId),
      status: 'repository_consumer_ready',
    },
    metadata: isObject(safeRequest.metadata) ? safeRequest.metadata : {},
    warnings: safeArray(safeRequest.warnings),
  });
}

function consumerApplicationEnvelope(request, consumerResult) {
  const safeRequest = sanitizeValue(isObject(request) ? request : {});
  const result = sanitizeValue(isObject(consumerResult) ? consumerResult : {});
  const status = safeString(result.status) || (result.ok === true ? 'created' : 'failed');
  const reasonCode = safeString(result.reasonCode)
    || (result.ok === true
      ? 'REPAIR_INTAKE_DRAFT_TO_CASE_CONSUMER_APPLICATION_SERVICE_CASE_READY'
      : 'REPAIR_INTAKE_DRAFT_TO_CASE_CONSUMER_APPLICATION_SERVICE_CONSUMER_FAILED');

  return sanitizeValue({
    ok: result.ok === true,
    action: 'repair_intake_draft_to_case_consumer_submit',
    status,
    submitted: result.ok === true,
    reasonCode,
    requiredActions: result.ok === true ? [] : (
      safeArray(result.requiredActions).length > 0 ? safeArray(result.requiredActions) : ['retry_or_manual_review']
    ),
    repairIntakeDraftId: firstSafeString(result.sourceDraftId, result.draftId, safeRequest.repairIntakeDraftId) || null,
    draftId: firstSafeString(result.draftId, result.sourceDraftId, safeRequest.repairIntakeDraftId) || null,
    organizationId: firstSafeString(result.organizationId, safeRequest.organizationId) || null,
    tenantId: firstSafeString(result.tenantId, safeRequest.tenantId) || null,
    requestId: firstSafeString(result.requestId, safeRequest.requestId) || null,
    actorId: firstSafeString(result.actorId, safeRequest.actorId) || null,
    caseId: safeString(result.caseId),
    caseRef: isObject(result.caseRef) ? result.caseRef : null,
    summary: result.summary || null,
    metadata: isObject(result.metadata) ? result.metadata : {},
    warnings: safeArray(result.warnings),
  });
}

function createInvalidConsumerApplicationService(reasonCode) {
  async function submitDraftToCase() {
    return invalidConsumerDependencyEnvelope(reasonCode);
  }

  return {
    submitDraftToCase,
  };
}

function createRepairIntakeDraftToCaseInjectedConsumerApplicationService(options = {}) {
  const safeOptions = isObject(options) ? options : {};
  const { caseRepositoryConsumer } = safeOptions;

  if (!isObject(caseRepositoryConsumer)) {
    return createInvalidConsumerApplicationService(
      'REPAIR_INTAKE_DRAFT_TO_CASE_CONSUMER_APPLICATION_SERVICE_CONSUMER_REQUIRED',
    );
  }

  if (typeof caseRepositoryConsumer.createCaseFromDraft !== 'function') {
    return createInvalidConsumerApplicationService(
      'REPAIR_INTAKE_DRAFT_TO_CASE_CONSUMER_APPLICATION_SERVICE_CONSUMER_METHOD_REQUIRED',
    );
  }

  async function submitDraftToCase(request = {}) {
    const invalidReasonCode = validateConsumerApplicationRequest(request);

    if (invalidReasonCode) {
      return invalidInputEnvelope(invalidReasonCode, request);
    }

    const safeRequest = sanitizeValue(request);

    try {
      const result = await caseRepositoryConsumer.createCaseFromDraft(createConsumerInput(safeRequest));

      return consumerApplicationEnvelope(safeRequest, result);
    } catch (error) {
      return consumerApplicationEnvelope(safeRequest, {
        ok: false,
        status: 'failed',
        reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_CONSUMER_APPLICATION_SERVICE_CONSUMER_FAILED',
        requiredActions: ['retry_or_manual_review'],
      });
    }
  }

  return {
    submitDraftToCase,
  };
}

module.exports = {
  RepairIntakeDraftToCaseApplicationServiceError,
  createRepairIntakeDraftToCaseApplicationService,
  createRepairIntakeDraftToCaseInjectedConsumerApplicationService,
};
