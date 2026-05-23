'use strict';

const {
  createRepairIntakeDraftCasePlanningService,
} = require('./repairIntakeDraftCasePlanningService');
const {
  createRepairIntakeDraftCaseRuntimeDependencies,
} = require('./repairIntakeDraftCaseRuntimeDependencyFactory');
const {
  createRepairIntakeDraftCaseSubmissionService,
} = require('./repairIntakeDraftCaseSubmissionService');

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

class RepairIntakeDraftCaseApplicationServiceFactoryError extends Error {
  constructor(reasonCode, requiredActions = ['configure_application_service_dependencies']) {
    super(reasonCode);
    this.name = 'RepairIntakeDraftCaseApplicationServiceFactoryError';
    this.reasonCode = reasonCode;
    this.requiredActions = requiredActions;
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
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
    throw new RepairIntakeDraftCaseApplicationServiceFactoryError(
      'REPAIR_INTAKE_DRAFT_CASE_APPLICATION_SERVICE_UNSAFE_INPUT',
      ['provide_sanitized_application_service_options'],
    );
  }
}

function assertDbClient(dbClient) {
  if (!isObject(dbClient)) {
    throw new RepairIntakeDraftCaseApplicationServiceFactoryError(
      'REPAIR_INTAKE_DRAFT_CASE_APPLICATION_SERVICE_DB_CLIENT_REQUIRED',
      ['configure_db_client'],
    );
  }
}

function assertIdGenerator(idGenerator) {
  const supported = typeof idGenerator === 'function'
    || (isObject(idGenerator) && typeof idGenerator.generate === 'function')
    || (isObject(idGenerator) && typeof idGenerator.next === 'function');

  if (!supported) {
    throw new RepairIntakeDraftCaseApplicationServiceFactoryError(
      'REPAIR_INTAKE_DRAFT_CASE_APPLICATION_SERVICE_ID_GENERATOR_REQUIRED',
      ['configure_id_generator'],
    );
  }
}

function assertDraftReader(draftReader) {
  const supported = typeof draftReader === 'function'
    || (isObject(draftReader) && typeof draftReader.readDraftForCasePlanning === 'function')
    || (isObject(draftReader) && typeof draftReader.readDraftForCasePreflight === 'function')
    || (isObject(draftReader) && typeof draftReader.read === 'function');

  if (!supported) {
    throw new RepairIntakeDraftCaseApplicationServiceFactoryError(
      'REPAIR_INTAKE_DRAFT_CASE_APPLICATION_SERVICE_DRAFT_READER_REQUIRED',
      ['configure_draft_reader'],
    );
  }
}

function createRepairIntakeDraftCaseApplicationService(options = {}) {
  const safeOptions = isObject(options) ? options : {};

  assertSafeOptions(safeOptions);
  assertDbClient(safeOptions.dbClient);
  assertIdGenerator(safeOptions.idGenerator);
  assertDraftReader(safeOptions.draftReader);

  const runtimeDependencies = createRepairIntakeDraftCaseRuntimeDependencies({
    dbClient: safeOptions.dbClient,
    idGenerator: safeOptions.idGenerator,
    clock: safeOptions.clock,
    tableNames: safeOptions.tableNames,
  });
  const planner = createRepairIntakeDraftCasePlanningService({
    draftReader: safeOptions.draftReader,
    eligibilityEvaluator: safeOptions.eligibilityEvaluator,
    candidateBuilder: safeOptions.candidateBuilder,
  });
  const submissionService = createRepairIntakeDraftCaseSubmissionService({
    planner,
    caseCreator: runtimeDependencies.caseCreator,
    idempotencyChecker: runtimeDependencies.idempotencyChecker,
    commandGuard: safeOptions.commandGuard,
    auditEventBuilder: safeOptions.auditEventBuilder,
  });

  return {
    planDraftToCase: planner.planDraftToCase,
    submitDraftToCase: submissionService.submitDraftToCase,
  };
}

module.exports = {
  RepairIntakeDraftCaseApplicationServiceFactoryError,
  createRepairIntakeDraftCaseApplicationService,
};
