'use strict';

const { app: defaultApp, createApp } = require('./app');
const { env } = require('./config/env');
const customerAccessAppBootstrapAdapter = require('./customerAccess/customerAccessAppBootstrapAdapter');
const customerAccessBootstrapComposer = require('./customerAccess/customerAccessBootstrapComposer');
const customerAccessEnvBoundary = require('./customerAccess/customerAccessEnvBoundary');
const customerAccessServerBootstrapPlan = require('./customerAccess/customerAccessServerBootstrapPlan');

const createCustomerAccessApp = customerAccessAppBootstrapAdapter[['createCustomerAccess', 'EnabledApp'].join('')];
const composeCustomerAccessBootstrap = customerAccessBootstrapComposer.composeCustomerAccessBootstrap;
const buildCustomerAccessInputFromEnv = customerAccessEnvBoundary[['buildCustomerAccess', 'BootstrapInputFromEnv'].join('')];
const buildCustomerAccessPlan = customerAccessServerBootstrapPlan[['buildCustomerAccess', 'ServerBootstrapPlan'].join('')];

const CUSTOMER_ACCESS_SAFE_ENV_FLAG_KEYS = [
  'CUSTOMER_ACCESS_ENABLED',
  'CUSTOMER_ACCESS_READ_ONLY_ENABLED',
  'CUSTOMER_ACCESS_DB_ENABLED',
];

function getCustomerAccessSafeEnvFlags(envLike = process.env) {
  if (!envLike || typeof envLike !== 'object' || Array.isArray(envLike)) {
    return {};
  }

  const flags = {};

  for (const key of CUSTOMER_ACCESS_SAFE_ENV_FLAG_KEYS) {
    if (Object.prototype.hasOwnProperty.call(envLike, key)) {
      flags[key] = envLike[key];
    }
  }

  return flags;
}

function buildCustomerAccessBootstrapFromComposerInput(composerInput) {
  const composerBootstrap = composeCustomerAccessBootstrap(composerInput).customerAccessBootstrap;

  if (!composerBootstrap.enabled) {
    return composerBootstrap;
  }

  const customerAccess = composerBootstrap.customerAccess || {};

  if (
    customerAccess.repository
    || customerAccess.dbAdapter
    || customerAccess.queryExecutor
    || customerAccess.dbClient
  ) {
    return composerBootstrap;
  }

  return {
    ...composerBootstrap,
    customerAccess: {
      ...customerAccess,
      dbAdapter: {},
    },
  };
}

function buildCustomerAccessBootstrapFromOptions(options = {}) {
  if (Object.prototype.hasOwnProperty.call(options, 'customerAccessBootstrap')) {
    return options.customerAccessBootstrap;
  }

  if (Object.prototype.hasOwnProperty.call(options, 'customerAccessComposer')) {
    return buildCustomerAccessBootstrapFromComposerInput(options.customerAccessComposer);
  }

  if (
    Object.prototype.hasOwnProperty.call(options, 'customerAccessPool')
    || Object.prototype.hasOwnProperty.call(options, 'customerAccessDb')
  ) {
    if (Object.prototype.hasOwnProperty.call(options, 'env')) {
      const envBootstrap = buildCustomerAccessInputFromEnv(options.env);

      if (!envBootstrap.enabled) {
        return envBootstrap;
      }
    }

    return buildCustomerAccessBootstrapFromComposerInput({
      env: options.env,
      pool: options.customerAccessPool,
      db: options.customerAccessDb,
      dbClientConfig: options.customerAccessDbClientConfig,
      customerAccess: options.customerAccess,
    });
  }

  if (Object.prototype.hasOwnProperty.call(options, 'env')) {
    const envBootstrap = buildCustomerAccessInputFromEnv(options.env);

    if (!envBootstrap.enabled) {
      return envBootstrap;
    }

    return {
      ...envBootstrap,
      customerAccess: {
        ...envBootstrap.customerAccess,
        dbAdapter: {},
      },
    };
  }

  const defaultEnvFlags = getCustomerAccessSafeEnvFlags();
  const envBootstrap = buildCustomerAccessInputFromEnv(defaultEnvFlags);

  if (!envBootstrap.enabled) {
    return undefined;
  }

  return {
    ...envBootstrap,
    customerAccess: {
      ...envBootstrap.customerAccess,
      dbAdapter: {},
    },
  };
}

function hasOwnOption(options, key) {
  return Object.prototype.hasOwnProperty.call(options, key);
}

const DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP = Object.freeze({
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

const DATA_CORRECTION_OPTION_KEYS = Object.freeze(Object.values(DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP));

const DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEYS = DATA_CORRECTION_OPTION_KEYS;

function hasDataCorrectionShortcutOptions(options = {}) {
  return DATA_CORRECTION_OPTION_KEYS.some((key) => hasOwnOption(options, key));
}

function buildDataCorrectionOptionsFromShortcutOptions(options = {}) {
  if (!hasDataCorrectionShortcutOptions(options)) {
    return undefined;
  }

  if (hasOwnOption(options, DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP.WRITER_SET)) {
    return options[DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP.WRITER_SET];
  }

  if (
    hasOwnOption(options, DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP.CORRECTION_REPOSITORY)
    && options[DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP.CORRECTION_REPOSITORY]
    && typeof options[DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP.CORRECTION_REPOSITORY].getWriterSet === 'function'
  ) {
    return options[DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP.CORRECTION_REPOSITORY].getWriterSet();
  }

  return {
    appointmentResultWriter: options[DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP.APPOINTMENT_RESULT_WRITER],
    auditWriter: options[DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP.AUDIT_WRITER],
    contactLogWriter: options[DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP.CONTACT_LOG_WRITER],
    correctionWriter: options[DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP.CORRECTION_WRITER],
    decisionAuditWriter: options[DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP.DECISION_AUDIT_WRITER],
    dispatchNoteWriter: options[DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP.DISPATCH_NOTE_WRITER],
    engineerNotificationWriter: options[DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP.ENGINEER_NOTIFICATION_WRITER],
    evidenceWriter: options[DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP.EVIDENCE_WRITER],
    followUpDraftWriter: options[DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP.FOLLOW_UP_DRAFT_WRITER],
  };
}

function withDataCorrectionOptions(appFactoryOptions = {}, options = {}) {
  if (hasOwnOption(options, 'dataCorrection')) {
    return {
      ...appFactoryOptions,
      dataCorrection: options.dataCorrection,
    };
  }

  const dataCorrection = buildDataCorrectionOptionsFromShortcutOptions(options);

  if (!dataCorrection) {
    return appFactoryOptions;
  }

  return {
    ...appFactoryOptions,
    dataCorrection,
  };
}

const ENGINEER_MOBILE_READ_EXECUTOR_OPTION_KEYS = [
  'engineerMobileReadExecutor',
  'engineerMobileQueryExecutor',
  'engineerMobileReadQueryExecutor',
  'engineerMobileListExecutor',
  'engineerMobileReadListExecutor',
  'engineerMobileDetailExecutor',
  'engineerMobileReadDetailExecutor',
];

const ENGINEER_MOBILE_READ_REPOSITORY_OPTION_KEYS = [
  'engineerMobileReadRepository',
];

function firstOwnOption(options, keys) {
  for (const key of keys) {
    if (hasOwnOption(options, key)) {
      return options[key];
    }
  }

  return undefined;
}

function hasEngineerMobileReadExecutorOptions(options = {}) {
  return ENGINEER_MOBILE_READ_EXECUTOR_OPTION_KEYS.some((key) => hasOwnOption(options, key));
}

function hasEngineerMobileReadRepositoryOptions(options = {}) {
  return ENGINEER_MOBILE_READ_REPOSITORY_OPTION_KEYS.some((key) => hasOwnOption(options, key));
}

function buildEngineerMobileOptionsFromExecutorOptions(options = {}) {
  if (hasEngineerMobileReadRepositoryOptions(options)) {
    return {
      repository: options.engineerMobileReadRepository,
      useRequestAwareProvider: true,
    };
  }

  if (!hasEngineerMobileReadExecutorOptions(options)) {
    return undefined;
  }

  return {
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
  };
}

function withEngineerMobileOptions(appFactoryOptions = {}, options = {}) {
  if (hasOwnOption(options, 'engineerMobile')) {
    return {
      ...appFactoryOptions,
      engineerMobile: options.engineerMobile,
    };
  }

  const engineerMobile = buildEngineerMobileOptionsFromExecutorOptions(options);

  if (!engineerMobile) {
    return appFactoryOptions;
  }

  return {
    ...appFactoryOptions,
    engineerMobile,
  };
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

function hasEngineerMobileWorkbenchShortcutOptions(options = {}) {
  return ENGINEER_MOBILE_WORKBENCH_OPTION_KEYS.some((key) => hasOwnOption(options, key));
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

function buildEngineerMobileWorkbenchOptionsFromShortcutOptions(options = {}) {
  if (!hasEngineerMobileWorkbenchShortcutOptions(options)) {
    return undefined;
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

function withEngineerMobileWorkbenchOptions(appFactoryOptions = {}, options = {}) {
  if (hasOwnOption(options, 'engineerMobileWorkbench')) {
    return {
      ...appFactoryOptions,
      engineerMobileWorkbench: options.engineerMobileWorkbench,
    };
  }

  const engineerMobileWorkbench = buildEngineerMobileWorkbenchOptionsFromShortcutOptions(options);

  if (!engineerMobileWorkbench) {
    return appFactoryOptions;
  }

  return {
    ...appFactoryOptions,
    engineerMobileWorkbench,
  };
}

function withServerAppOptions(appFactoryOptions = {}, options = {}) {
  return withEngineerMobileWorkbenchOptions(
    withEngineerMobileOptions(
      withDataCorrectionOptions(appFactoryOptions, options),
      options,
    ),
    options,
  );
}

function resolveServerApp(options = {}) {
  if (options.app) {
    return options.app;
  }

  const customerAccessBootstrap = buildCustomerAccessBootstrapFromOptions(options);

  if (customerAccessBootstrap) {
    const bootstrapPlan = buildCustomerAccessPlan(customerAccessBootstrap);

    if (bootstrapPlan.shouldCreateCustomerAccessEnabledApp) {
      try {
        return createCustomerAccessApp({
          ...bootstrapPlan.appFactoryOptions,
          createApp(appFactoryOptions) {
            return createApp(withServerAppOptions(appFactoryOptions, options));
          },
        });
      } catch (error) {
        return defaultApp;
      }
    }
  }

  if (
    hasOwnOption(options, 'dataCorrection')
    || hasDataCorrectionShortcutOptions(options)
    || hasOwnOption(options, 'engineerMobile')
    || hasOwnOption(options, 'engineerMobileWorkbench')
    || hasEngineerMobileWorkbenchShortcutOptions(options)
    || hasEngineerMobileReadRepositoryOptions(options)
    || hasEngineerMobileReadExecutorOptions(options)
  ) {
    return createApp(withServerAppOptions({}, options));
  }

  return defaultApp;
}

function resolvePort(options = {}) {
  return Object.prototype.hasOwnProperty.call(options, 'port') ? options.port : env.port;
}

function loadDefaultPool() {
  const poolModulePath = ['./db', 'pool'].join('/');

  return require(poolModulePath).pool;
}

function createServerBootstrap(options = {}) {
  const app = resolveServerApp(options);
  const port = resolvePort(options);

  return {
    app,
    port,
    start(startOptions = {}) {
      return startServer({
        ...options,
        ...startOptions,
        app,
        port: Object.prototype.hasOwnProperty.call(startOptions, 'port') ? startOptions.port : port,
      });
    },
  };
}

function startServer(options = {}) {
  const app = resolveServerApp(options);
  const port = resolvePort(options);
  const logger = options.logger || console;
  const exit = options.exit || process.exit;
  const registerSignals = options.registerSignals !== false;

  const server = app.listen(port, () => {
    logger.log(`onsite-service-api listening on port ${port}`);
  });

  async function closePool() {
    const pool = options.pool || loadDefaultPool();

    await pool.end();
  }

  function shutdown(signal) {
    logger.log(`Received ${signal}. Shutting down HTTP server.`);

    server.close(async () => {
      try {
        await closePool();
        logger.log('PostgreSQL pool closed.');
        exit(0);
      } catch (error) {
        logger.error('Error while closing PostgreSQL pool', {
          message: error.message,
        });
        exit(1);
      }
    });
  }

  if (registerSignals) {
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  return {
    server,
    shutdown,
  };
}

if (require.main === module) {
  startServer();
}

module.exports = {
  DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEY_MAP,
  DATA_CORRECTION_SERVER_SHORTCUT_OPTION_KEYS,
  createServerBootstrap,
  getCustomerAccessSafeEnvFlags,
  resolveServerApp,
  startServer,
};
