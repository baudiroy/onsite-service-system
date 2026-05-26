'use strict';

const crypto = require('node:crypto');

const {
  createRepairIntakeCaseRepositoryAdapter,
} = require('./repairIntakeCaseRepositoryAdapter');
const {
  createRepairIntakeDraftRepository,
} = require('./repairIntakeDraftRepository');
const {
  createRepairIntakeIdempotencyRepository,
} = require('./repairIntakeIdempotencyRepository');

const DEFAULT_AUDIT_EVENT_TYPE = 'repair_intake_draft_to_case_submission';
const DEFAULT_CONVERSION_STATUS = 'converted';
const DEFAULT_IDEMPOTENCY_RECORD_STATUS = 'completed';

class RepairIntakeDraftToCaseRuntimePortsFactoryError extends Error {
  constructor(reasonCode, requiredActions = ['configure_runtime_ports_factory']) {
    super(reasonCode);
    this.name = 'RepairIntakeDraftToCaseRuntimePortsFactoryError';
    this.reasonCode = reasonCode;
    this.requiredActions = requiredActions;
    this.stack = undefined;
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeString(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function firstString(...values) {
  for (const value of values) {
    const candidate = safeString(value);

    if (candidate) {
      return candidate;
    }
  }

  return null;
}

function safeObject(value) {
  return isObject(value) ? value : {};
}

function assertDbClient(dbClient) {
  if (!isObject(dbClient) || typeof dbClient.query !== 'function') {
    throw new RepairIntakeDraftToCaseRuntimePortsFactoryError(
      'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_PORTS_DB_CLIENT_REQUIRED',
      ['provide_injected_query_client'],
    );
  }
}

function resolveGenerator(generator, reasonCode, requiredActions) {
  if (typeof generator === 'function') {
    return generator;
  }

  if (isObject(generator) && typeof generator.generate === 'function') {
    return generator.generate.bind(generator);
  }

  if (isObject(generator) && typeof generator.next === 'function') {
    return generator.next.bind(generator);
  }

  throw new RepairIntakeDraftToCaseRuntimePortsFactoryError(reasonCode, requiredActions);
}

function resolveOptionalGenerator(generator) {
  if (generator === undefined || generator === null) {
    return null;
  }

  return resolveGenerator(
    generator,
    'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_PORTS_GENERATOR_INVALID',
    ['provide_supported_generator'],
  );
}

function resolveClock(clock) {
  if (clock === undefined || clock === null) {
    return () => new Date().toISOString();
  }

  if (typeof clock === 'function') {
    return clock;
  }

  if (isObject(clock) && typeof clock.now === 'function') {
    return clock.now.bind(clock);
  }

  throw new RepairIntakeDraftToCaseRuntimePortsFactoryError(
    'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_PORTS_CLOCK_INVALID',
    ['provide_supported_clock'],
  );
}

function timestamp(now) {
  const value = now();

  if (value instanceof Date) {
    return value.toISOString();
  }

  return safeString(value) || new Date().toISOString();
}

async function generateId(generate, scope) {
  const id = safeString(await generate(scope));

  if (!id) {
    throw new RepairIntakeDraftToCaseRuntimePortsFactoryError(
      'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_PORTS_ID_GENERATION_FAILED',
      ['provide_runtime_id_generator'],
    );
  }

  return id;
}

function pick(source, ...keys) {
  const object = safeObject(source);

  for (const key of keys) {
    const value = object[key];

    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return undefined;
}

function draftSummary(input) {
  const draft = safeObject(input.draft);

  return {
    ...safeObject(draft.metadata),
    ...safeObject(draft.summary),
  };
}

async function buildCaseCandidate(input, options) {
  const draft = safeObject(input.draft);
  const summary = draftSummary(input);
  const organizationId = firstString(input.organizationId, draft.organizationId);
  const tenantId = firstString(input.tenantId, draft.tenantId);
  const sourceDraftId = firstString(input.draftId, draft.draftId, draft.id);
  const caseNo = firstString(
    pick(summary, 'caseNo', 'case_no', 'caseRef', 'case_ref'),
    options.generateCaseNo
      ? await options.generateCaseNo({ organizationId, sourceDraftId, tenantId })
      : null,
  );

  return {
    sourceDraftId,
    organizationId,
    tenantId,
    caseNo,
    customerId: firstString(pick(summary, 'customerId', 'customer_id')),
    source: firstString(pick(summary, 'source'), draft.source, draft.intakeSource, 'web'),
    brand: firstString(pick(summary, 'brand')),
    productType: firstString(pick(summary, 'productType', 'product_type')),
    modelNo: firstString(pick(summary, 'modelNo', 'model_no')),
    problemDescription: firstString(
      pick(summary, 'problemDescription', 'problem_description', 'issueSummary', 'issue_summary', 'title'),
    ),
    serviceType: firstString(pick(summary, 'serviceType', 'service_type'), 'onsite'),
    caseType: firstString(pick(summary, 'caseType', 'case_type'), 'repair'),
    priority: firstString(pick(summary, 'priority'), 'normal'),
    serviceRegion: firstString(pick(summary, 'serviceRegion', 'service_region')),
    metadata: {
      repairIntakeDraftId: sourceDraftId,
      sourceRef: firstString(draft.sourceRef),
      tenantId,
    },
  };
}

function createPlanningPolicy(options) {
  if (isObject(options.planningPolicy) && typeof options.planningPolicy.planCaseFromDraft === 'function') {
    return options.planningPolicy;
  }

  return {
    async planCaseFromDraft(input) {
      return {
        status: 'planned',
        reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_PORTS_PLAN_READY',
        candidate: await buildCaseCandidate(input, options),
      };
    },
  };
}

function caseNoFromResult(result) {
  return firstString(
    result.caseRef,
    result.caseNo,
    result.case_no,
    result.summary && result.summary.caseRef,
    result.summary && result.summary.caseNo,
    result.summary && result.summary.case_no,
  );
}

function createConversionWriter({ dbClient, generateId: generate, now }) {
  return async function recordConversion(input, caseRef) {
    const plan = safeObject(input.plan);
    const candidate = safeObject(plan.candidate);
    const draft = safeObject(input.draft);
    const organizationId = firstString(input.organizationId, candidate.organizationId, draft.organizationId);
    const tenantId = firstString(input.tenantId, candidate.tenantId, draft.tenantId);
    const draftId = firstString(input.draftId, candidate.sourceDraftId, draft.draftId, draft.id);
    const caseId = firstString(caseRef.id, caseRef.caseId);
    const caseRefText = firstString(caseNoFromResult(caseRef), candidate.caseNo, caseId);
    const idempotencyKey = firstString(input.idempotencyKey, input.body && input.body.idempotencyKey);
    const actorId = firstString(input.actorId, input.context && input.context.actorId);
    const requestId = firstString(input.requestId, input.context && input.context.requestId);
    const conversionId = await generateId(generate, {
      kind: 'repair_intake_draft_case_conversion',
      organizationId,
      draftId,
      caseId,
    });

    await dbClient.query(
      [
        'INSERT INTO repair_intake_draft_case_conversions (',
        '    id, organization_id, tenant_id, draft_id, case_id, case_ref,',
        '    conversion_status, idempotency_key, actor_id, actor_type, request_id,',
        '    safe_metadata, submitted_at, converted_at',
        ') VALUES (',
        '    $1, $2, $3, $4, $5, $6,',
        '    $7, $8, $9, $10, $11, $12::jsonb, $13, $13',
        ')',
      ].join('\n'),
      [
        conversionId,
        organizationId,
        tenantId,
        draftId,
        caseId,
        caseRefText,
        DEFAULT_CONVERSION_STATUS,
        idempotencyKey,
        actorId,
        'system',
        requestId,
        JSON.stringify({
          source: 'repair_intake_draft_to_case_runtime_ports_factory',
        }),
        timestamp(now),
      ],
    );

    await dbClient.query(
      [
        'UPDATE repair_intake_drafts',
        "SET draft_status = 'converted', converted_at = $4",
        'WHERE id = $1',
        '  AND organization_id = $2',
        '  AND tenant_id = $3',
      ].join('\n'),
      [draftId, organizationId, tenantId, timestamp(now)],
    );

    return {
      conversionId,
      caseRef: caseRefText,
    };
  };
}

function createCaseCreationPort({ caseRepository, recordConversion }) {
  return {
    async createCaseFromDraft(input) {
      const plan = safeObject(input.plan);
      const created = await caseRepository.createCaseFromRepairIntakeCandidate({
        command: {
          actorId: firstString(input.actorId, input.context && input.context.actorId),
          draftId: firstString(input.draftId, input.draft && input.draft.draftId, input.draft && input.draft.id),
          idempotencyKey: firstString(input.idempotencyKey, input.body && input.body.idempotencyKey),
          organizationId: firstString(input.organizationId, input.context && input.context.organizationId),
          requestId: firstString(input.requestId, input.context && input.context.requestId),
        },
        caseCandidate: plan.candidate,
      });

      if (!isObject(created) || created.status !== 'created') {
        return created;
      }

      const conversion = await recordConversion(input, created);
      const caseRef = firstString(conversion.caseRef, caseNoFromResult(created), created.id);

      return {
        ...created,
        caseRef,
        summary: {
          ...(isObject(created.summary) ? created.summary : {}),
          caseRef,
          conversionId: conversion.conversionId,
        },
      };
    },
  };
}

function createAuditPort({ dbClient, generateId: generate, now }) {
  return {
    async recordDraftToCaseDecision(input) {
      const caseRef = safeObject(input.caseRef);
      const draft = safeObject(input.draft);
      const auditEventId = await generateId(generate, {
        kind: 'repair_intake_audit_event',
        organizationId: input.organizationId,
        draftId: input.draftId,
      });
      const organizationId = firstString(input.organizationId, draft.organizationId, caseRef.organizationId);
      const tenantId = firstString(input.tenantId, draft.tenantId, caseRef.tenantId);
      const draftId = firstString(input.draftId, draft.draftId, draft.id);
      const caseId = firstString(caseRef.id, caseRef.caseId);
      const caseRefText = firstString(caseNoFromResult(caseRef), caseId);
      const actorId = firstString(input.actorId, input.context && input.context.actorId);
      const requestId = firstString(input.requestId, input.context && input.context.requestId);

      await dbClient.query(
        [
          'INSERT INTO repair_intake_audit_events (',
          '    id, organization_id, tenant_id, event_type, draft_id, case_id, case_ref,',
          '    actor_id, actor_type, request_id, decision, outcome, reason_code,',
          '    safe_metadata, visibility, occurred_at',
          ') VALUES (',
          '    $1, $2, $3, $4, $5, $6, $7,',
          '    $8, $9, $10, $11, $12, $13, $14::jsonb, $15, $16',
          ')',
        ].join('\n'),
        [
          auditEventId,
          organizationId,
          tenantId,
          DEFAULT_AUDIT_EVENT_TYPE,
          draftId,
          caseId,
          caseRefText,
          actorId,
          'system',
          requestId,
          'case_created_from_admin_route',
          'submitted',
          'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_PORTS_AUDIT_RECORDED',
          JSON.stringify({
            source: 'repair_intake_draft_to_case_runtime_ports_factory',
          }),
          'internal_only',
          timestamp(now),
        ],
      );

      return {
        ok: true,
        eventType: DEFAULT_AUDIT_EVENT_TYPE,
        outcome: 'submitted',
        draftId,
        organizationId,
        tenantId,
        caseId,
        reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_PORTS_AUDIT_RECORDED',
      };
    },
  };
}

function fingerprint(input) {
  const source = JSON.stringify({
    draftId: input.draftId,
    idempotencyKey: input.idempotencyKey,
    organizationId: input.organizationId,
    requestId: input.requestId,
    tenantId: input.tenantId,
  });

  return crypto.createHash('sha256').update(source).digest('hex');
}

function createIdempotencyStore(idempotencyRepository) {
  return {
    findExistingDraftToCaseResult: (input) => idempotencyRepository.findExistingDraftToCaseResult(input),
    recordDraftToCaseResult: (input) => {
      const caseRef = safeObject(input.caseRef);
      const resultCaseRef = safeObject(input.result && input.result.caseRef);
      const caseId = firstString(input.caseId, caseRef.caseId, caseRef.id, resultCaseRef.caseId, resultCaseRef.id);
      const caseRefText = firstString(
        input.caseRef,
        caseRef.caseRef,
        caseRef.caseNo,
        resultCaseRef.caseRef,
        resultCaseRef.caseNo,
        resultCaseRef.summary && resultCaseRef.summary.caseRef,
        caseId,
      );

      return idempotencyRepository.recordDraftToCaseResult({
        ...input,
        caseId,
        caseRef: caseRefText,
        recordStatus: DEFAULT_IDEMPOTENCY_RECORD_STATUS,
        safeRequestFingerprint: input.safeRequestFingerprint || fingerprint(input),
      });
    },
  };
}

function createRepairIntakeDraftToCaseRuntimePorts(options = {}) {
  const safeOptions = isObject(options) ? options : {};
  const { dbClient } = safeOptions;

  assertDbClient(dbClient);

  const generate = resolveGenerator(
    safeOptions.idGenerator,
    'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_PORTS_ID_GENERATOR_REQUIRED',
    ['provide_id_generator'],
  );
  const generateCaseNo = resolveOptionalGenerator(safeOptions.caseNumberGenerator);
  const now = resolveClock(safeOptions.clock);
  const draftRepository = createRepairIntakeDraftRepository({ dbClient });
  const idempotencyRepository = createRepairIntakeIdempotencyRepository({ dbClient });
  const caseRepository = createRepairIntakeCaseRepositoryAdapter({
    dbClient,
    idGenerator: generate,
    caseNumberGenerator: generateCaseNo || safeOptions.caseNumberGenerator,
    clock: now,
  });
  const planningPolicy = createPlanningPolicy({
    ...safeOptions,
    generateCaseNo,
  });
  const recordConversion = createConversionWriter({
    dbClient,
    generateId: generate,
    now,
  });

  return {
    draftRepository,
    idempotencyStore: createIdempotencyStore(idempotencyRepository),
    planningPolicy,
    caseCreationPort: createCaseCreationPort({
      caseRepository,
      recordConversion,
    }),
    auditPort: createAuditPort({
      dbClient,
      generateId: generate,
      now,
    }),
  };
}

module.exports = {
  RepairIntakeDraftToCaseRuntimePortsFactoryError,
  createRepairIntakeDraftToCaseRuntimePorts,
};
