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

function buildEngineerMobileOptions(options = {}) {
  if (hasOwnOption(options, 'engineerMobile')) {
    return buildEngineerMobileReadOptions(options.engineerMobile);
  }

  if (!hasEngineerMobileReadRepositoryOptions(options)) {
    if (!hasEngineerMobileReadExecutorOptions(options)) {
      return undefined;
    }

    return buildEngineerMobileReadOptions({
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
  }

  return buildEngineerMobileReadOptions({
    repository: options.engineerMobileReadRepository,
    useRequestAwareProvider: true,
  });
}

const ENGINEER_MOBILE_WORKBENCH_OPTION_KEYS = [
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
    return options.engineerMobileWorkbench;
  }

  if (!hasEngineerMobileWorkbenchShortcutOptions(options)) {
    return options.engineerMobileWorkbench;
  }

  return {
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
  };
}

function createApp(options = {}) {
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
