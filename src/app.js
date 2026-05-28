const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const { env } = require('./config/env');
const { requestId } = require('./middlewares/requestId');
const { requestLogger } = require('./middlewares/requestLogger');
const { notFoundHandler } = require('./middlewares/notFoundHandler');
const { errorHandler } = require('./middlewares/errorHandler');
const { createAppRouter } = require('./routes');
const {
  createEngineerMobileTaskDetailReadProvider,
  createEngineerMobileTaskListReadProvider,
} = require('./engineerMobile/engineerMobileTaskListReadProviderAdapter');
const {
  composeEngineerMobileReadProviderOptions,
} = require('./engineerMobile/engineerMobileReadProviderOptionsComposer');
const {
  createEngineerMobileVisitActionRuntimeBootstrap,
} = require('./engineerMobile/engineerMobileVisitActionRuntimeBootstrap');

const ENGINEER_MOBILE_READ_REPOSITORY_OPTION_KEYS = [
  'engineerMobileReadRepository',
];

const ENGINEER_MOBILE_READ_EXECUTOR_OPTION_KEYS = [
  'engineerMobileReadExecutor',
  'engineerMobileQueryExecutor',
  'engineerMobileReadQueryExecutor',
  'engineerMobileListExecutor',
  'engineerMobileReadListExecutor',
  'engineerMobileDetailExecutor',
  'engineerMobileReadDetailExecutor',
];

const ENGINEER_MOBILE_VISIT_ACTION_OPTION_KEYS = [
  'engineerMobileVisitActionService',
  'engineerMobileVisitActionAppointmentProvider',
  'engineerMobileVisitActionPermission',
  'engineerMobileVisitActionNow',
  'engineerMobileVisitActionTransitionWriter',
  'engineerMobileVisitActionAuditWriter',
  'engineerMobileVisitActionPatchWriter',
  'engineerMobileVisitActionAuditEventWriter',
  'engineerMobileVisitActionPersistencePort',
  'engineerMobileVisitActionRepositoryAdapter',
];

function hasEngineerMobileReadRepositoryOptions(options = {}) {
  return ENGINEER_MOBILE_READ_REPOSITORY_OPTION_KEYS.some((key) => hasOwnOption(options, key));
}

function hasEngineerMobileReadExecutorOptions(options = {}) {
  return ENGINEER_MOBILE_READ_EXECUTOR_OPTION_KEYS.some((key) => hasOwnOption(options, key));
}

function buildEngineerMobileReadOptions(engineerMobileOptions) {
  if (!engineerMobileOptions || engineerMobileOptions.useRequestAwareProvider !== true) {
    return engineerMobileOptions;
  }

  const readProviderOptions = composeEngineerMobileReadProviderOptions(engineerMobileOptions);
  const listProvider = createEngineerMobileTaskListReadProvider(readProviderOptions);
  const detailProvider = createEngineerMobileTaskDetailReadProvider(readProviderOptions);

  function requestFromTaskListInput(input = {}) {
    return {
      auth: {
        organizationId: input.organizationId,
        engineerId: input.engineerId,
      },
      query: input.dateRange || {},
    };
  }

  function requestFromTaskDetailInput(input = {}) {
    return {
      auth: {
        organizationId: input.organizationId,
        engineerId: input.engineerId,
      },
      params: {
        appointmentId: input.appointmentId,
      },
      query: input.dateRange || {},
    };
  }

  function withRouteFilterFields(result, input = {}) {
    const tasks = Array.isArray(result)
      ? result
      : (result && Array.isArray(result.tasks) ? result.tasks : undefined);

    if (!Array.isArray(tasks)) {
      return result;
    }

    return {
      tasks: tasks.map((task) => ({
        ...task,
        organizationId: input.organizationId,
        assignedEngineerId: input.engineerId,
      })),
    };
  }

  async function withRouteFilterFieldsAsync(result, input = {}) {
    return withRouteFilterFields(await result, input);
  }

  return {
    ...readProviderOptions,
    readModel(input) {
      if (input && input.appointmentId) {
        return detailProvider.readModel(requestFromTaskDetailInput(input));
      }

      return withRouteFilterFields(listProvider.readModel(requestFromTaskListInput(input)), input);
    },
    async readModelAsync(input) {
      if (input && input.appointmentId) {
        return detailProvider.readModelAsync(requestFromTaskDetailInput(input));
      }

      return withRouteFilterFieldsAsync(
        listProvider.readModelAsync(requestFromTaskListInput(input)),
        input,
      );
    },
    taskProvider(input) {
      if (input && input.appointmentId) {
        return detailProvider.taskProvider(requestFromTaskDetailInput(input));
      }

      return withRouteFilterFields(listProvider.taskProvider(requestFromTaskListInput(input)), input);
    },
    async taskProviderAsync(input) {
      if (input && input.appointmentId) {
        return detailProvider.taskProviderAsync(requestFromTaskDetailInput(input));
      }

      return withRouteFilterFieldsAsync(
        listProvider.taskProviderAsync(requestFromTaskListInput(input)),
        input,
      );
    },
  };
}

function engineerMobileVisitActionNestedOptions(options = {}) {
  return isPlainObject(options.visitAction) ? options.visitAction : {};
}

function hasEngineerMobileVisitActionOptions(options = {}) {
  const nested = engineerMobileVisitActionNestedOptions(options);

  return ENGINEER_MOBILE_VISIT_ACTION_OPTION_KEYS.some((key) => hasOwnOption(options, key))
    || hasOwnOption(options, 'visitAction')
    || hasOwnOption(options, 'visitActionService')
    || hasOwnOption(options, 'visitActionAppointmentProvider')
    || hasOwnOption(nested, 'visitActionService')
    || hasOwnOption(nested, 'appointmentProvider');
}

function buildVisitActionWriterSource(options = {}) {
  const nested = engineerMobileVisitActionNestedOptions(options);

  return {
    transitionWriter: firstOwnOption(options, [
      'engineerMobileVisitActionTransitionWriter',
      'transitionWriter',
    ]) || nested.transitionWriter,
    auditWriter: firstOwnOption(options, [
      'engineerMobileVisitActionAuditWriter',
      'auditWriter',
    ]) || nested.auditWriter,
    patchWriter: firstOwnOption(options, [
      'engineerMobileVisitActionPatchWriter',
      'patchWriter',
    ]) || nested.patchWriter,
    auditEventWriter: firstOwnOption(options, [
      'engineerMobileVisitActionAuditEventWriter',
      'auditEventWriter',
    ]) || nested.auditEventWriter,
    persistencePort: firstOwnOption(options, [
      'engineerMobileVisitActionPersistencePort',
      'persistencePort',
    ]) || nested.persistencePort,
    repositoryAdapter: firstOwnOption(options, [
      'engineerMobileVisitActionRepositoryAdapter',
      'repositoryAdapter',
    ]) || nested.repositoryAdapter,
    now: firstOwnOption(options, [
      'engineerMobileVisitActionNow',
      'now',
    ]) || nested.now,
  };
}

function hasVisitActionWriterSource(writerSource = {}) {
  return [
    'transitionWriter',
    'auditWriter',
    'patchWriter',
    'auditEventWriter',
    'persistencePort',
    'repositoryAdapter',
  ].some((key) => isPlainObject(writerSource[key]));
}

function buildEngineerMobileVisitActionOptions(options = {}, readOptions = {}) {
  if (!hasEngineerMobileVisitActionOptions(options)) {
    return undefined;
  }

  const nested = engineerMobileVisitActionNestedOptions(options);
  const writerSource = buildVisitActionWriterSource(options);
  const explicitService = firstOwnOption(options, [
    'engineerMobileVisitActionService',
    'visitActionService',
  ]) || nested.visitActionService;
  const visitActionService = explicitService || (
    hasVisitActionWriterSource(writerSource)
      ? createEngineerMobileVisitActionRuntimeBootstrap(writerSource).visitActionService
      : undefined
  );

  if (!visitActionService) {
    return undefined;
  }

  return {
    visitActionService,
    visitActionAppointmentProvider: firstOwnOption(options, [
      'engineerMobileVisitActionAppointmentProvider',
      'visitActionAppointmentProvider',
      'appointmentProvider',
    ]) || nested.visitActionAppointmentProvider
      || nested.appointmentProvider
      || readOptions.taskProviderAsync
      || readOptions.taskProvider,
    permission: firstOwnOption(options, [
      'engineerMobileVisitActionPermission',
      'permission',
    ]) || nested.permission,
    now: firstOwnOption(options, [
      'engineerMobileVisitActionNow',
      'now',
    ]) || nested.now,
  };
}

function withEngineerMobileVisitActionOptions(readOptions, options = {}) {
  const baseOptions = readOptions || {};
  const visitActionOptions = buildEngineerMobileVisitActionOptions(options, baseOptions);

  if (!visitActionOptions) {
    return readOptions;
  }

  return {
    ...baseOptions,
    ...visitActionOptions,
  };
}

function buildEngineerMobileOptions(options = {}) {
  let readOptions;

  if (hasOwnOption(options, 'engineerMobile')) {
    readOptions = buildEngineerMobileReadOptions(options.engineerMobile);
    return withEngineerMobileVisitActionOptions(readOptions, {
      ...options,
      ...options.engineerMobile,
    });
  }

  if (!hasEngineerMobileReadRepositoryOptions(options)) {
    if (!hasEngineerMobileReadExecutorOptions(options)) {
      return withEngineerMobileVisitActionOptions(undefined, options);
    }

    readOptions = buildEngineerMobileReadOptions({
      allowNonExecutableForTest: options.engineerMobileAllowNonExecutableForTest === true,
      detailExecutor: firstOwnOption(options, [
        'engineerMobileDetailExecutor',
        'engineerMobileReadDetailExecutor',
      ]),
      executor: firstOwnOption(options, [
        'engineerMobileReadExecutor',
        'engineerMobileQueryExecutor',
        'engineerMobileReadQueryExecutor',
      ]),
      listExecutor: firstOwnOption(options, [
        'engineerMobileListExecutor',
        'engineerMobileReadListExecutor',
      ]),
      useRequestAwareProvider: true,
    });
    return withEngineerMobileVisitActionOptions(readOptions, options);
  }

  readOptions = buildEngineerMobileReadOptions({
    repository: options.engineerMobileReadRepository,
    useRequestAwareProvider: true,
  });
  return withEngineerMobileVisitActionOptions(readOptions, options);
}

const ENGINEER_MOBILE_WORKBENCH_OPTION_KEYS = [
  'engineerMobileWorkbenchDbClient',
  'engineerMobileWorkbenchContextProvider',
  'engineerMobileWorkbenchCurrentContext',
  'engineerMobileWorkbenchTaskStatusProvider',
  'engineerMobileWorkbenchStatusOperationProvider',
  'engineerMobileWorkbenchArrivedProvider',
  'engineerMobileWorkbenchStartedProvider',
  'engineerMobileWorkbenchCompletionSubmissionProvider',
  'engineerMobileWorkbenchPermission',
  'engineerMobileWorkbenchTaskProvider',
  'engineerMobileWorkbenchTasksProvider',
  'engineerMobileWorkbenchTaskListProvider',
  'engineerMobileWorkbenchTaskDetailProvider',
];

function buildEngineerMobileWorkbenchDbReadOptions(options = {}) {
  const dbClient = firstOwnOption(options, [
    'engineerMobileWorkbenchDbClient',
    'dbClient',
  ]);

  if (!dbClient) {
    return undefined;
  }

  const factory = require(['.', 'engineerMobileWorkbench', 'engineerMobileWorkbenchDbReadProviderFactory'].join('/'));
  const providerFactory = factory.createEngineerMobileWorkbenchDbReadProviderFactory({
    dbClient,
  });

  return {
    contextProvider: providerFactory.contextProvider,
    taskProvider: providerFactory.taskProvider,
  };
}

function omitEngineerMobileWorkbenchDbReadOptions(options = {}) {
  if (!isPlainObject(options)) {
    return options;
  }

  const {
    dbClient,
    engineerMobileWorkbenchDbClient,
    ...safeOptions
  } = options;

  return safeOptions;
}

function compactEngineerMobileWorkbenchOptions(options = {}) {
  return Object.fromEntries(
    Object.entries(options).filter((entry) => entry[1] !== undefined)
  );
}

const DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP = Object.freeze({
  CORRECTION_REPOSITORY: 'dataCorrectionRepository',
  WRITER_SET: 'dataCorrectionWriterSet',
  APPOINTMENT_RESULT_WRITER: 'dataCorrectionAppointmentResultWriter',
  AUDIT_WRITER: 'dataCorrectionAuditWriter',
  CONTACT_LOG_WRITER: 'dataCorrectionContactLogWriter',
  CORRECTION_WRITER: 'dataCorrectionCorrectionWriter',
  DECISION_AUDIT_WRITER: 'dataCorrectionDecisionAuditWriter',
  DISPATCH_NOTE_WRITER: 'dataCorrectionDispatchNoteWriter',
  ENGINEER_NOTIFICATION_WRITER: 'dataCorrectionEngineerNotificationWriter',
  EVIDENCE_WRITER: 'dataCorrectionEvidenceWriter',
  FOLLOW_UP_DRAFT_WRITER: 'dataCorrectionFollowUpDraftWriter',
});

const DATA_CORRECTION_OPTION_KEYS = Object.freeze(Object.values(DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP));

const DATA_CORRECTION_APP_SHORTCUT_OPTION_KEYS = DATA_CORRECTION_OPTION_KEYS;

function hasOwnOption(options, key) {
  return Boolean(options && Object.prototype.hasOwnProperty.call(options, key));
}

function firstOwnOption(options, keys) {
  for (const key of keys) {
    if (hasOwnOption(options, key)) {
      return options[key];
    }
  }

  return undefined;
}

function bindProviderMethod(provider, methodName) {
  if (provider && typeof provider[methodName] === 'function') {
    return provider[methodName].bind(provider);
  }

  return undefined;
}

function buildEngineerMobileWorkbenchTaskProvider(options = {}) {
  const taskProvider = firstOwnOption(options, [
    'engineerMobileWorkbenchTaskProvider',
    'engineerMobileWorkbenchTasksProvider',
  ]);

  if (taskProvider) {
    return taskProvider;
  }

  const taskListProvider = options.engineerMobileWorkbenchTaskListProvider;
  const taskDetailProvider = options.engineerMobileWorkbenchTaskDetailProvider;
  const listTasks = bindProviderMethod(taskListProvider, 'listTasks');
  const getTaskDetail = bindProviderMethod(taskDetailProvider, 'getTaskDetail');

  if (!listTasks && !getTaskDetail) {
    return undefined;
  }

  return {
    listTasks,
    getTaskDetail,
  };
}

function hasEngineerMobileWorkbenchShortcutOptions(options = {}) {
  return ENGINEER_MOBILE_WORKBENCH_OPTION_KEYS.some((key) => hasOwnOption(options, key));
}

function hasDataCorrectionShortcutOptions(options = {}) {
  return DATA_CORRECTION_OPTION_KEYS.some((key) => hasOwnOption(options, key));
}

function buildDataCorrectionOptions(options = {}) {
  if (options.dataCorrection) {
    return options.dataCorrection;
  }

  if (!hasDataCorrectionShortcutOptions(options)) {
    return options.dataCorrection;
  }

  if (hasOwnOption(options, DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP.WRITER_SET)) {
    return options[DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP.WRITER_SET];
  }

  if (
    hasOwnOption(options, DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP.CORRECTION_REPOSITORY)
    && options[DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP.CORRECTION_REPOSITORY]
    && typeof options[DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP.CORRECTION_REPOSITORY].getWriterSet === 'function'
  ) {
    return options[DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP.CORRECTION_REPOSITORY].getWriterSet();
  }

  return {
    appointmentResultWriter: options[DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP.APPOINTMENT_RESULT_WRITER],
    auditWriter: options[DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP.AUDIT_WRITER],
    contactLogWriter: options[DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP.CONTACT_LOG_WRITER],
    correctionWriter: options[DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP.CORRECTION_WRITER],
    decisionAuditWriter: options[DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP.DECISION_AUDIT_WRITER],
    dispatchNoteWriter: options[DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP.DISPATCH_NOTE_WRITER],
    engineerNotificationWriter: options[DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP.ENGINEER_NOTIFICATION_WRITER],
    evidenceWriter: options[DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP.EVIDENCE_WRITER],
    followUpDraftWriter: options[DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP.FOLLOW_UP_DRAFT_WRITER],
  };
}

function buildEngineerMobileWorkbenchOptions(options = {}) {
  if (options.engineerMobileWorkbench) {
    const dbReadOptions = buildEngineerMobileWorkbenchDbReadOptions(options.engineerMobileWorkbench);

    if (!dbReadOptions) {
      return options.engineerMobileWorkbench;
    }

    return {
      ...dbReadOptions,
      ...omitEngineerMobileWorkbenchDbReadOptions(options.engineerMobileWorkbench),
    };
  }

  const dbReadOptions = buildEngineerMobileWorkbenchDbReadOptions(options);

  if (!hasEngineerMobileWorkbenchShortcutOptions(options) && !dbReadOptions) {
    return options.engineerMobileWorkbench;
  }

  return {
    ...dbReadOptions,
    ...compactEngineerMobileWorkbenchOptions({
    arrivedProvider: options.engineerMobileWorkbenchArrivedProvider,
    completionSubmissionProvider: options.engineerMobileWorkbenchCompletionSubmissionProvider,
    contextProvider: firstOwnOption(options, [
      'engineerMobileWorkbenchContextProvider',
      'engineerMobileWorkbenchCurrentContext',
    ]),
    permission: options.engineerMobileWorkbenchPermission,
    startedProvider: options.engineerMobileWorkbenchStartedProvider,
    statusOperationProvider: options.engineerMobileWorkbenchStatusOperationProvider,
    taskProvider: buildEngineerMobileWorkbenchTaskProvider(options),
    taskStatusProvider: options.engineerMobileWorkbenchTaskStatusProvider,
    }),
  };
}

function isPlainObject(value) {
  return Boolean(value)
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

function loadRepairIntakeDraftToCaseRuntimePortsFactory() {
  return require(['.', 'repairIntake', 'repairIntakeDraftToCaseRuntimePortsFactory'].join('/'));
}

function repairIntakeDraftToCaseRoutesEnabled(options = {}) {
  return options.repairIntakeDraftToCaseRoutesEnabled === true
    || (
      isPlainObject(options.repairIntakeDraftToCase)
      && options.repairIntakeDraftToCase.routesEnabled === true
    )
    || env.repairIntakeDraftToCaseRoutesEnabled === true;
}

function repairIntakeDraftToCaseDependencyOptions(options = {}) {
  const nested = isPlainObject(options.repairIntakeDraftToCase)
    ? options.repairIntakeDraftToCase
    : {};

  return {
    ...nested,
    dbClient: options.repairIntakeDraftToCaseDbClient || nested.dbClient,
    idGenerator: options.repairIntakeDraftToCaseIdGenerator || nested.idGenerator,
    caseNumberGenerator: options.repairIntakeDraftToCaseCaseNumberGenerator || nested.caseNumberGenerator,
    clock: options.repairIntakeDraftToCaseClock || nested.clock,
    planningPolicy: options.repairIntakeDraftToCasePlanningPolicy || nested.planningPolicy,
  };
}

function hasRepairIntakeDraftToCaseFactoryDependencies(dependencies = {}) {
  return Boolean(dependencies.dbClient && dependencies.idGenerator);
}

function buildRepairIntakeDraftToCaseOptions(options = {}) {
  const nested = isPlainObject(options.repairIntakeDraftToCase)
    ? options.repairIntakeDraftToCase
    : undefined;
  const routesEnabled = repairIntakeDraftToCaseRoutesEnabled(options);

  if (options.repairIntakeDraftToCaseRuntimePorts) {
    return {
      ...(nested || {}),
      routesEnabled,
      runtimePorts: options.repairIntakeDraftToCaseRuntimePorts,
    };
  }

  if (!routesEnabled) {
    return nested;
  }

  const dependencies = repairIntakeDraftToCaseDependencyOptions(options);

  if (!hasRepairIntakeDraftToCaseFactoryDependencies(dependencies)) {
    return {
      ...(nested || {}),
      routesEnabled,
    };
  }

  const factory = loadRepairIntakeDraftToCaseRuntimePortsFactory();
  const factoryMethod = ['create', 'RepairIntake', 'DraftToCase', 'RuntimePorts'].join('');

  return {
    ...dependencies,
    routesEnabled,
    runtimePorts: factory[factoryMethod](dependencies),
  };
}

function createApp(options = {}) {
  const repairIntakeDraftToCaseOptions = buildRepairIntakeDraftToCaseOptions(options);

  if (repairIntakeDraftToCaseOptions) {
    options = {
      ...options,
      repairIntakeDraftToCaseRuntimePorts: repairIntakeDraftToCaseOptions.runtimePorts
        || options.repairIntakeDraftToCaseRuntimePorts,
      repairIntakeDraftToCase: repairIntakeDraftToCaseOptions,
    };
  }

  const app = express();

  app.disable('x-powered-by');
  app.use(requestId);
  app.use(requestLogger);
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json({
    limit: '1mb',
    verify: (req, res, buf) => {
      req.rawBody = Buffer.from(buf);
    }
  }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  if (typeof options.engineerMobileWorkbenchHttpContext === 'function') {
    app.use(options.engineerMobileWorkbenchHttpContext);
  }

  app.use(createAppRouter({
    repairIntakeDraftToCaseRuntimePorts: options.repairIntakeDraftToCaseRuntimePorts,
    repairIntakeDraftToCase: options.repairIntakeDraftToCase,
    customerAccess: options.customerAccess,
    dataCorrection: buildDataCorrectionOptions(options),
    engineerMobile: buildEngineerMobileOptions(options),
    engineerMobileWorkbench: buildEngineerMobileWorkbenchOptions(options),
  }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

const app = createApp();

module.exports = {
  DATA_CORRECTION_APP_SHORTCUT_OPTION_KEY_MAP,
  DATA_CORRECTION_APP_SHORTCUT_OPTION_KEYS,
  app,
  createApp
};
