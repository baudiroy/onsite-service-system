'use strict';

const {
  createRepairIntakeCaseCreatorRepositoryAdapter,
} = require('./repairIntakeCaseCreatorRepositoryAdapter');
const {
  createRepairIntakeCaseRepositoryAdapter,
} = require('./repairIntakeCaseRepositoryAdapter');
const {
  createRepairIntakeDraftRepositoryAdapter,
} = require('./repairIntakeDraftRepositoryAdapter');
const {
  createRepairIntakeTransactionRunnerAdapter,
} = require('./repairIntakeTransactionRunnerAdapter');
const {
  createRepairIntakeDraftCaseAuditWriterAdapter,
} = require('./repairIntakeDraftCaseAuditWriterAdapter');
const {
  createRepairIntakeDraftCaseIdempotencyCheckerAdapter,
} = require('./repairIntakeDraftCaseIdempotencyCheckerAdapter');

const TABLE_KEYS = new Set([
  'cases',
  'repairIntakeDrafts',
  'auditEvents',
  'idempotencySubmissions',
]);

const FORBIDDEN_INPUT_FIELDS = new Set([
  'address',
  'caseId',
  'case_id',
  'customerPayload',
  'finalAppointmentId',
  'final_appointment_id',
  'fullAddress',
  'lineAccessToken',
  'phone',
  'phoneNumber',
  'providerPayload',
  'rawAddress',
  'rawCustomerPayload',
  'rawImportedRow',
  'rawImportedRowPayload',
  'rawPayload',
  'secret',
  'token',
  'tokenSecret',
]);

class RepairIntakeDraftCaseRuntimeDependencyFactoryError extends Error {
  constructor(reasonCode, requiredActions = ['configure_runtime_dependencies']) {
    super(reasonCode);
    this.name = 'RepairIntakeDraftCaseRuntimeDependencyFactoryError';
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

function safeTableName(value) {
  const tableName = stringValue(value);

  if (!tableName) {
    return undefined;
  }

  return /^[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)?$/.test(tableName)
    ? tableName
    : null;
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

function assertSafeOptions(options) {
  if (hasForbiddenInputField(options)) {
    throw new RepairIntakeDraftCaseRuntimeDependencyFactoryError(
      'REPAIR_INTAKE_DRAFT_CASE_RUNTIME_DEPENDENCIES_UNSAFE_INPUT',
      ['provide_sanitized_runtime_dependency_options'],
    );
  }
}

function assertDbClient(dbClient) {
  if (!isObject(dbClient)) {
    throw new RepairIntakeDraftCaseRuntimeDependencyFactoryError(
      'REPAIR_INTAKE_DRAFT_CASE_RUNTIME_DEPENDENCIES_DB_CLIENT_REQUIRED',
      ['configure_db_client'],
    );
  }
}

function assertIdGenerator(idGenerator) {
  const supported = typeof idGenerator === 'function'
    || (isObject(idGenerator) && typeof idGenerator.generate === 'function')
    || (isObject(idGenerator) && typeof idGenerator.next === 'function');

  if (!supported) {
    throw new RepairIntakeDraftCaseRuntimeDependencyFactoryError(
      'REPAIR_INTAKE_DRAFT_CASE_RUNTIME_DEPENDENCIES_ID_GENERATOR_REQUIRED',
      ['configure_id_generator'],
    );
  }
}

function normalizeTableNames(tableNames) {
  if (tableNames === undefined) {
    return {};
  }

  if (!isObject(tableNames)) {
    throw new RepairIntakeDraftCaseRuntimeDependencyFactoryError(
      'REPAIR_INTAKE_DRAFT_CASE_RUNTIME_DEPENDENCIES_TABLE_NAMES_INVALID',
      ['configure_safe_table_names'],
    );
  }

  const normalized = {};

  for (const [key, value] of Object.entries(tableNames)) {
    if (!TABLE_KEYS.has(key)) {
      throw new RepairIntakeDraftCaseRuntimeDependencyFactoryError(
        'REPAIR_INTAKE_DRAFT_CASE_RUNTIME_DEPENDENCIES_TABLE_NAME_KEY_INVALID',
        ['configure_supported_table_name_keys'],
      );
    }

    const tableName = safeTableName(value);

    if (tableName === null) {
      throw new RepairIntakeDraftCaseRuntimeDependencyFactoryError(
        'REPAIR_INTAKE_DRAFT_CASE_RUNTIME_DEPENDENCIES_TABLE_NAME_INVALID',
        ['configure_safe_table_names'],
      );
    }

    if (tableName) {
      normalized[key] = tableName;
    }
  }

  return normalized;
}

function createRepairIntakeDraftCaseRuntimeDependencies(options = {}) {
  const safeOptions = isObject(options) ? options : {};

  assertSafeOptions(safeOptions);
  assertDbClient(safeOptions.dbClient);
  assertIdGenerator(safeOptions.idGenerator);

  const { dbClient, idGenerator, clock } = safeOptions;
  const tableNames = normalizeTableNames(safeOptions.tableNames);

  const caseRepository = createRepairIntakeCaseRepositoryAdapter({
    dbClient,
    idGenerator,
    clock,
    tableName: tableNames.cases,
  });
  const repairIntakeDraftRepository = createRepairIntakeDraftRepositoryAdapter({
    dbClient,
    clock,
    tableName: tableNames.repairIntakeDrafts,
  });
  const transactionRunner = createRepairIntakeTransactionRunnerAdapter({
    dbClient,
  });
  const auditWriter = createRepairIntakeDraftCaseAuditWriterAdapter({
    dbClient,
    idGenerator,
    clock,
    tableName: tableNames.auditEvents,
  });
  const idempotencyChecker = createRepairIntakeDraftCaseIdempotencyCheckerAdapter({
    dbClient,
    tableName: tableNames.idempotencySubmissions,
  });
  const caseCreator = createRepairIntakeCaseCreatorRepositoryAdapter({
    caseRepository,
    repairIntakeDraftRepository,
    transactionRunner,
    auditWriter,
    clock,
  });

  return {
    caseRepository,
    repairIntakeDraftRepository,
    transactionRunner,
    auditWriter,
    idempotencyChecker,
    caseCreator,
  };
}

module.exports = {
  RepairIntakeDraftCaseRuntimeDependencyFactoryError,
  createRepairIntakeDraftCaseRuntimeDependencies,
};
