'use strict';

const {
  createRepairIntakeIdempotencyPortAdapter,
} = require('./repairIntakeIdempotencyPortAdapter');
const {
  createRepairIntakeDraftReaderPortAdapter,
} = require('./repairIntakeDraftReaderPortAdapter');
const {
  createRepairIntakeCasePlannerPortAdapter,
} = require('./repairIntakeCasePlannerPortAdapter');
const {
  createRepairIntakeCaseCreatorPortAdapter,
} = require('./repairIntakeCaseCreatorPortAdapter');
const {
  createRepairIntakeAuditWriterPortAdapter,
} = require('./repairIntakeAuditWriterPortAdapter');
const {
  createRepairIntakeDraftToCaseApplicationService,
} = require('./repairIntakeDraftToCaseApplicationService');
const {
  createRepairIntakeDraftToCaseController,
} = require('./repairIntakeDraftToCaseController');
const {
  createRepairIntakeDraftToCaseApiModule,
} = require('./repairIntakeDraftToCaseApiModule');
const {
  mountRepairIntakeDraftToCaseApiModule,
} = require('./repairIntakeDraftToCaseHttpMountAdapter');

const SAFE_CODE_PATTERN = /^[A-Za-z0-9_-]+$/;

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasMethod(value, methodName) {
  return isObject(value) && typeof value[methodName] === 'function';
}

function safeCode(value, fallback) {
  if (typeof value === 'string' && SAFE_CODE_PATTERN.test(value)) {
    return value;
  }

  return fallback;
}

function safeActions(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((action) => typeof action === 'string' && SAFE_CODE_PATTERN.test(action));
}

function routeSummary(routes) {
  if (!Array.isArray(routes)) {
    return [];
  }

  return routes
    .filter((route) => isObject(route))
    .map((route) => ({
      method: safeCode(route.method, 'POST'),
      path: typeof route.path === 'string' && route.path.startsWith('/') ? route.path : '/',
    }));
}

function componentSummary({ idempotencyStore, mounted }) {
  return {
    idempotency: Boolean(idempotencyStore),
    draftReader: true,
    casePlanner: true,
    caseCreator: true,
    auditWriter: true,
    applicationService: true,
    controller: true,
    apiModule: true,
    httpMount: mounted === true,
  };
}

function failure(reasonCode, requiredActions = ['configure_injected_ports']) {
  return {
    ok: false,
    components: {},
    mounted: 0,
    routes: [],
    reasonCode,
    requiredActions,
  };
}

function validatePorts(options) {
  if (!isObject(options)) {
    return false;
  }

  if (!hasMethod(options.draftRepository, 'findDraftForConversion')) {
    return false;
  }

  if (!hasMethod(options.caseCreationPort, 'createCaseFromDraft')) {
    return false;
  }

  if (!hasMethod(options.auditPort, 'recordDraftToCaseDecision')) {
    return false;
  }

  if (
    options.idempotencyStore !== undefined
    && (
      !hasMethod(options.idempotencyStore, 'findExistingDraftToCaseResult')
      || !hasMethod(options.idempotencyStore, 'recordDraftToCaseResult')
    )
  ) {
    return false;
  }

  if (
    options.planningPolicy !== undefined
    && !hasMethod(options.planningPolicy, 'planCaseFromDraft')
  ) {
    return false;
  }

  return true;
}

function createRepairIntakeDraftToCaseInjectedRuntimeComposition(options = {}) {
  const safeOptions = isObject(options) ? options : {};

  if (!validatePorts(safeOptions)) {
    return failure(
      'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_COMPOSER_PORTS_REQUIRED',
      ['configure_injected_ports'],
    );
  }

  try {
    const {
      auditPort,
      basePath,
      caseCreationPort,
      draftRepository,
      idempotencyStore,
      mountTarget,
      planningPolicy,
    } = safeOptions;

    const draftReader = createRepairIntakeDraftReaderPortAdapter({
      draftRepository,
    });
    const casePlanner = createRepairIntakeCasePlannerPortAdapter({
      planningPolicy,
    });
    const caseCreator = createRepairIntakeCaseCreatorPortAdapter({
      caseCreationPort,
    });
    const auditWriter = createRepairIntakeAuditWriterPortAdapter({
      auditPort,
    });
    const idempotencyPort = idempotencyStore
      ? createRepairIntakeIdempotencyPortAdapter({ idempotencyStore })
      : undefined;
    const applicationService = createRepairIntakeDraftToCaseApplicationService({
      idempotencyPort,
      draftReader,
      casePlanner,
      caseCreator,
      auditWriter,
    });
    const controller = createRepairIntakeDraftToCaseController({
      applicationService,
    });
    const apiModule = createRepairIntakeDraftToCaseApiModule({
      controller,
    });

    if (!apiModule || apiModule.ok !== true) {
      return failure(
        safeCode(
          apiModule && apiModule.reasonCode,
          'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_COMPOSER_COMPOSE_FAILED',
        ),
        safeActions(apiModule && apiModule.requiredActions),
      );
    }

    if (mountTarget !== undefined) {
      const mountSummary = mountRepairIntakeDraftToCaseApiModule({
        mountTarget,
        apiModule,
        basePath,
      });

      return {
        ok: mountSummary.ok === true,
        components: componentSummary({
          idempotencyStore,
          mounted: mountSummary.ok === true,
        }),
        mounted: Number.isInteger(mountSummary.mounted) ? mountSummary.mounted : 0,
        routes: routeSummary(mountSummary.routes),
        reasonCode: mountSummary.ok === true
          ? 'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_COMPOSER_MOUNTED'
          : safeCode(
            mountSummary.reasonCode,
            'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_COMPOSER_COMPOSE_FAILED',
          ),
        requiredActions: safeActions(mountSummary.requiredActions),
      };
    }

    return {
      ok: true,
      components: componentSummary({
        idempotencyStore,
        mounted: false,
      }),
      mounted: 0,
      routes: routeSummary(apiModule.routes),
      reasonCode: 'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_COMPOSER_READY',
      requiredActions: [],
    };
  } catch (error) {
    return failure(
      'REPAIR_INTAKE_DRAFT_TO_CASE_RUNTIME_COMPOSER_COMPOSE_FAILED',
      ['retry_or_manual_review'],
    );
  }
}

module.exports = {
  createRepairIntakeDraftToCaseInjectedRuntimeComposition,
};
