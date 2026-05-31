'use strict';

const {
  normalizeRepairIntakeDraftCaseSubmissionResult,
} = require('./repairIntakeDraftCaseSubmissionResultNormalizer');
const {
  buildRepairIntakeDraftCaseSubmissionAuditEvent,
} = require('./repairIntakeDraftCaseSubmissionAuditEventBuilder');

const FORBIDDEN_INPUT_FIELDS = new Set([
  'address',
  'billingPayload',
  'body',
  'caseId',
  'case_id',
  'client',
  'clientSecret',
  'customerPayload',
  'databaseError',
  'draftInput',
  'finalAppointmentId',
  'final_appointment_id',
  'fullAddress',
  'headers',
  'lineAccessToken',
  'password',
  'phone',
  'phoneNumber',
  'providerPayload',
  'query',
  'rawAddress',
  'rawBody',
  'rawCustomerPayload',
  'rawInput',
  'rawImportedRow',
  'rawImportedRowPayload',
  'rawPayload',
  'rawRepositoryResult',
  'rawRows',
  'rawServicePayload',
  'requestBody',
  'secret',
  'stack',
  'token',
  'tokenSecret',
]);

class AdapterFailure extends Error {
  constructor(reasonCode, requiredActions = ['manual_review']) {
    super(reasonCode);
    this.reasonCode = reasonCode;
    this.requiredActions = requiredActions;
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function blocked(reasonCode, requiredActions = ['manual_review']) {
  return {
    ok: false,
    reasonCode,
    requiredActions,
    caseRef: null,
  };
}

function failure(reasonCode, requiredActions = ['manual_review']) {
  return new AdapterFailure(reasonCode, requiredActions);
}

function safeReasonCode(value, fallback) {
  const reasonCode = stringValue(value);

  return reasonCode && /^[A-Z0-9_]+$/.test(reasonCode) ? reasonCode : fallback;
}

function safeRequiredActions(value, fallback = ['manual_review']) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const requiredActions = value
    .map((action) => stringValue(action))
    .filter((action) => action && /^[a-z0-9_]+$/.test(action));

  return requiredActions.length > 0 ? requiredActions : fallback;
}

function hasForbiddenInputField(value) {
  if (Array.isArray(value)) {
    return value.some((item) => hasForbiddenInputField(item));
  }

  if (!isObject(value)) {
    return false;
  }

  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_INPUT_FIELDS.has(key) || hasForbiddenInputField(child)) {
      return true;
    }
  }

  return false;
}

function sanitizeRef(value) {
  if (!isObject(value)) {
    return null;
  }

  const sanitized = {};

  for (const key of [
    'id',
    'refId',
    'referenceId',
    'type',
    'role',
    'source',
    'sourceRef',
    'externalRef',
    'reviewStatus',
  ]) {
    const refValue = stringValue(value[key]);

    if (refValue) {
      sanitized[key] = refValue;
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : null;
}

function sanitizeCommand(command) {
  if (!isObject(command)) {
    return null;
  }

  const draftId = stringValue(command.draftId);
  const organizationId = stringValue(command.organizationId);
  const tenantId = stringValue(command.tenantId);
  const actorId = stringValue(command.actorId);
  const idempotencyKey = stringValue(command.idempotencyKey);

  if (!draftId || !organizationId || !actorId || !idempotencyKey) {
    return null;
  }

  return {
    draftId,
    organizationId,
    ...(tenantId ? { tenantId } : {}),
    actorId,
    requestId: stringValue(command.requestId) || null,
    idempotencyKey,
  };
}

function sanitizeCandidate(candidate) {
  if (!isObject(candidate)) {
    return null;
  }

  const sourceDraftId = stringValue(candidate.sourceDraftId);
  const organizationId = stringValue(candidate.organizationId);
  const tenantId = stringValue(candidate.tenantId);
  const intakeSource = stringValue(candidate.intakeSource);

  if (!sourceDraftId || !organizationId || !intakeSource) {
    return null;
  }

  return {
    sourceDraftId,
    organizationId,
    ...(tenantId ? { tenantId } : {}),
    brandId: stringValue(candidate.brandId) || null,
    serviceProviderId: stringValue(candidate.serviceProviderId) || null,
    intakeSource,
    serviceType: stringValue(candidate.serviceType) || null,
    priority: stringValue(candidate.priority) || null,
    reporterRef: sanitizeRef(candidate.reporterRef),
    customerRef: sanitizeRef(candidate.customerRef),
    billingContactRef: sanitizeRef(candidate.billingContactRef),
    siteRef: sanitizeRef(candidate.siteRef),
    issueSummaryRef: sanitizeRef(candidate.issueSummaryRef),
    createdByActorId: stringValue(candidate.createdByActorId) || null,
  };
}

function normalizeCreatorInput(input) {
  if (!isObject(input)) {
    return blocked('REPAIR_INTAKE_CASE_CREATOR_INPUT_MISSING', ['provide_creator_input']);
  }

  if (hasForbiddenInputField(input)) {
    return blocked('REPAIR_INTAKE_CASE_CREATOR_UNSAFE_INPUT', ['provide_sanitized_creator_input']);
  }

  const command = sanitizeCommand(input.command);

  if (!command) {
    return blocked('REPAIR_INTAKE_CASE_CREATOR_COMMAND_MISSING', ['provide_sanitized_command']);
  }

  const caseCandidate = sanitizeCandidate(input.caseCandidate);

  if (!caseCandidate) {
    return blocked('REPAIR_INTAKE_CASE_CREATOR_CANDIDATE_MISSING', ['provide_sanitized_case_candidate']);
  }

  if (command.organizationId !== caseCandidate.organizationId) {
    return blocked('REPAIR_INTAKE_CASE_CREATOR_ORGANIZATION_MISMATCH', ['manual_review']);
  }

  if (command.draftId !== caseCandidate.sourceDraftId) {
    return blocked('REPAIR_INTAKE_CASE_CREATOR_SOURCE_DRAFT_MISMATCH', ['manual_review']);
  }

  if (command.tenantId && caseCandidate.tenantId && command.tenantId !== caseCandidate.tenantId) {
    return blocked('REPAIR_INTAKE_CASE_CREATOR_TENANT_MISMATCH', ['manual_review']);
  }

  return {
    ok: true,
    command,
    caseCandidate,
  };
}

function resolveCaseRepository(repository) {
  if (typeof repository === 'function') {
    return repository;
  }

  if (isObject(repository) && typeof repository.createCaseFromRepairIntakeCandidate === 'function') {
    return repository.createCaseFromRepairIntakeCandidate.bind(repository);
  }

  if (isObject(repository) && typeof repository.create === 'function') {
    return repository.create.bind(repository);
  }

  return undefined;
}

function resolveDraftRepository(repository) {
  if (typeof repository === 'function') {
    return repository;
  }

  if (isObject(repository) && typeof repository.markDraftLinkedToCase === 'function') {
    return repository.markDraftLinkedToCase.bind(repository);
  }

  if (isObject(repository) && typeof repository.markLinkedToCase === 'function') {
    return repository.markLinkedToCase.bind(repository);
  }

  return undefined;
}

function resolveAuditWriter(auditWriter) {
  if (typeof auditWriter === 'function') {
    return auditWriter;
  }

  if (isObject(auditWriter) && typeof auditWriter.recordRepairIntakeDraftToCaseCreated === 'function') {
    return auditWriter.recordRepairIntakeDraftToCaseCreated.bind(auditWriter);
  }

  if (isObject(auditWriter) && typeof auditWriter.record === 'function') {
    return auditWriter.record.bind(auditWriter);
  }

  return undefined;
}

function resolveTransactionRunner(transactionRunner) {
  if (typeof transactionRunner === 'function') {
    return transactionRunner;
  }

  if (isObject(transactionRunner) && typeof transactionRunner.runInTransaction === 'function') {
    return transactionRunner.runInTransaction.bind(transactionRunner);
  }

  if (isObject(transactionRunner) && typeof transactionRunner.transaction === 'function') {
    return transactionRunner.transaction.bind(transactionRunner);
  }

  return resolveManualTransactionRunner(transactionRunner);
}

function resolveMethod(target, methodNames) {
  if (!isObject(target)) {
    return undefined;
  }

  for (const methodName of methodNames) {
    if (typeof target[methodName] === 'function') {
      return target[methodName].bind(target);
    }
  }

  return undefined;
}

async function callTransactionMethod(tx, transactionRunner, txMethodNames, runnerMethodNames) {
  const txMethod = resolveMethod(tx, txMethodNames);

  if (txMethod) {
    return txMethod();
  }

  const runnerMethod = resolveMethod(transactionRunner, runnerMethodNames);

  return runnerMethod ? runnerMethod(tx) : undefined;
}

async function rollbackTransaction(tx, transactionRunner) {
  try {
    await callTransactionMethod(
      tx,
      transactionRunner,
      ['rollback', 'rollbackTransaction'],
      ['rollback', 'rollbackTransaction'],
    );
  } catch (error) {
    return undefined;
  }

  return undefined;
}

function resolveManualTransactionRunner(transactionRunner) {
  const begin = resolveMethod(transactionRunner, ['begin', 'beginTransaction', 'startTransaction']);

  if (!begin) {
    return undefined;
  }

  return async function runManualTransaction(callback) {
    if (typeof callback !== 'function') {
      throw failure('REPAIR_INTAKE_CASE_CREATOR_TRANSACTION_CALLBACK_MISSING', ['provide_transaction_callback']);
    }

    let tx;

    try {
      tx = await begin();
    } catch (error) {
      throw failure('REPAIR_INTAKE_CASE_CREATOR_TRANSACTION_BEGIN_FAILED', ['retry_or_manual_review']);
    }

    let callbackSucceeded = false;

    try {
      const result = await callback(tx);
      callbackSucceeded = true;
      try {
        await callTransactionMethod(
          tx,
          transactionRunner,
          ['commit', 'commitTransaction'],
          ['commit', 'commitTransaction'],
        );
      } catch (error) {
        await rollbackTransaction(tx, transactionRunner);

        throw failure('REPAIR_INTAKE_CASE_CREATOR_TRANSACTION_COMMIT_FAILED', ['retry_or_manual_review']);
      }

      return result;
    } catch (error) {
      if (!callbackSucceeded) {
        await rollbackTransaction(tx, transactionRunner);
      }

      throw error;
    }
  };
}

function resolveClock(clock) {
  if (typeof clock === 'function') {
    return clock;
  }

  if (isObject(clock) && typeof clock.now === 'function') {
    return clock.now.bind(clock);
  }

  return undefined;
}

function timestamp(clock) {
  if (!clock) {
    return null;
  }

  let value;

  try {
    value = clock();
  } catch (error) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return stringValue(value) || null;
}

function assertWritableDependency(resolved, reasonCode, requiredActions) {
  if (!resolved) {
    throw failure(reasonCode, requiredActions);
  }
}

async function writeAudit({ writeAudit, command, caseRef, tx, occurredAt }) {
  const auditResult = buildRepairIntakeDraftCaseSubmissionAuditEvent({
    sanitizedCommand: command,
    submissionResult: {
      reasonCode: 'CASE_REF_NORMALIZED',
      requiredActions: [],
      caseRef,
    },
    outcome: 'submitted',
  });

  if (!isObject(auditResult) || auditResult.ok !== true || !isObject(auditResult.auditEvent)) {
    throw failure('REPAIR_INTAKE_CASE_CREATOR_AUDIT_EVENT_FAILED', ['manual_review']);
  }

  try {
    const result = await writeAudit({
      auditEvent: auditResult.auditEvent,
      caseRef,
      command,
      occurredAt,
      tx,
    });

    if (isObject(result) && result.ok === false) {
      throw failure('REPAIR_INTAKE_CASE_CREATOR_AUDIT_WRITE_FAILED', ['retry_or_manual_review']);
    }
  } catch (error) {
    if (error instanceof AdapterFailure) {
      throw error;
    }

    throw failure('REPAIR_INTAKE_CASE_CREATOR_AUDIT_WRITE_FAILED', ['retry_or_manual_review']);
  }
}

function createRepairIntakeCaseCreatorRepositoryAdapter(options = {}) {
  const safeOptions = isObject(options) ? options : {};
  const createCase = resolveCaseRepository(safeOptions.caseRepository);
  const markDraftLinked = resolveDraftRepository(safeOptions.repairIntakeDraftRepository);
  const runTransaction = resolveTransactionRunner(safeOptions.transactionRunner);
  const writeAuditEvent = resolveAuditWriter(safeOptions.auditWriter);
  const now = resolveClock(safeOptions.clock);

  async function createCaseFromCandidate(creatorInput = {}) {
    const normalizedInput = normalizeCreatorInput(creatorInput);

    if (!isObject(normalizedInput) || normalizedInput.ok !== true) {
      return normalizedInput;
    }

    try {
      assertWritableDependency(
        createCase,
        'REPAIR_INTAKE_CASE_CREATOR_CASE_REPOSITORY_REQUIRED',
        ['configure_case_repository'],
      );
      assertWritableDependency(
        markDraftLinked,
        'REPAIR_INTAKE_CASE_CREATOR_DRAFT_REPOSITORY_REQUIRED',
        ['configure_repair_intake_draft_repository'],
      );
      assertWritableDependency(
        runTransaction,
        'REPAIR_INTAKE_CASE_CREATOR_TRANSACTION_RUNNER_REQUIRED',
        ['configure_transaction_runner'],
      );
      assertWritableDependency(
        writeAuditEvent,
        'REPAIR_INTAKE_CASE_CREATOR_AUDIT_WRITER_REQUIRED',
        ['configure_audit_writer'],
      );
    } catch (error) {
      return blocked(error.reasonCode, error.requiredActions);
    }

    const { command, caseCandidate } = normalizedInput;
    const occurredAt = timestamp(now);

    try {
      return await runTransaction(async (tx) => {
        let created;

        try {
          created = await createCase({
            command,
            caseCandidate,
            occurredAt,
            tx,
          });
        } catch (error) {
          throw failure('REPAIR_INTAKE_CASE_CREATOR_CASE_CREATE_FAILED', ['retry_or_manual_review']);
        }

        if (isObject(created) && created.ok === false) {
          throw failure(
            safeReasonCode(created.reasonCode, 'REPAIR_INTAKE_CASE_CREATOR_CASE_CREATE_FAILED'),
            safeRequiredActions(created.requiredActions, ['manual_review']),
          );
        }

        const normalizedResult = normalizeRepairIntakeDraftCaseSubmissionResult({
          draftId: command.draftId,
          organizationId: command.organizationId,
          sourceDraftId: caseCandidate.sourceDraftId,
          creatorResult: created,
        });

        if (!isObject(normalizedResult) || normalizedResult.ok !== true) {
          throw failure(
            stringValue(normalizedResult && normalizedResult.reasonCode)
              || 'REPAIR_INTAKE_CASE_CREATOR_CASE_RESULT_INVALID',
            ['manual_review'],
          );
        }

        const caseRef = normalizedResult.caseRef;

        try {
          const linkResult = await markDraftLinked({
            draftId: command.draftId,
            organizationId: command.organizationId,
            ...(command.tenantId ? { tenantId: command.tenantId } : {}),
            caseRef,
            actorId: command.actorId,
            requestId: command.requestId,
            idempotencyKey: command.idempotencyKey,
            occurredAt,
            tx,
          });

          if (isObject(linkResult) && linkResult.ok === false) {
            throw failure('REPAIR_INTAKE_CASE_CREATOR_DRAFT_LINK_FAILED', ['retry_or_manual_review']);
          }
        } catch (error) {
          if (error instanceof AdapterFailure) {
            throw error;
          }

          throw failure('REPAIR_INTAKE_CASE_CREATOR_DRAFT_LINK_FAILED', ['retry_or_manual_review']);
        }

        await writeAudit({
          writeAudit: writeAuditEvent,
          command,
          caseRef,
          tx,
          occurredAt,
        });

        return caseRef;
      });
    } catch (error) {
      if (error instanceof AdapterFailure) {
        return blocked(error.reasonCode, error.requiredActions);
      }

      return blocked('REPAIR_INTAKE_CASE_CREATOR_TRANSACTION_FAILED', ['retry_or_manual_review']);
    }
  }

  return {
    createCaseFromCandidate,
    create: createCaseFromCandidate,
  };
}

module.exports = {
  createRepairIntakeCaseCreatorRepositoryAdapter,
};
