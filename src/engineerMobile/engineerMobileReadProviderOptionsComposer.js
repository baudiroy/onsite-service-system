'use strict';

const {
  createEngineerMobileReadRepository,
} = require('./engineerMobileReadRepository');

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasOwnOption(options, key) {
  return Object.prototype.hasOwnProperty.call(options, key);
}

function hasExplicitReadSource(options) {
  return Boolean(
    hasOwnOption(options, 'repository')
    || hasOwnOption(options, 'readModel')
    || hasOwnOption(options, 'readModelAsync')
    || hasOwnOption(options, 'taskProvider')
    || hasOwnOption(options, 'taskProviderAsync')
  );
}

function hasExecutorSource(options) {
  return Boolean(
    hasOwnOption(options, 'executor')
    || hasOwnOption(options, 'queryExecutor')
    || hasOwnOption(options, 'listExecutor')
    || hasOwnOption(options, 'detailExecutor')
  );
}

function hasInjectedQueryBoundary(options) {
  return Boolean(
    hasOwnOption(options, 'dbClient')
    || hasOwnOption(options, 'transaction')
  );
}

function createInjectedReadModelRepository(options = {}) {
  const {
    createEngineerMobileReadModelRepository,
  } = module['require']('./engineerMobileReadModelRepository');

  return createEngineerMobileReadModelRepository({
    dbClient: options.dbClient,
    transaction: options.transaction,
  });
}

function composeEngineerMobileReadProviderOptions(options = {}) {
  if (!isPlainObject(options) || options.useRequestAwareProvider !== true) {
    return options;
  }

  if (hasExplicitReadSource(options) || !hasExecutorSource(options)) {
    if (!hasExplicitReadSource(options) && hasInjectedQueryBoundary(options)) {
      return {
        ...options,
        repository: createInjectedReadModelRepository(options),
      };
    }

    return options;
  }

  const sharedExecutor = hasOwnOption(options, 'executor')
    ? options.executor
    : options.queryExecutor;

  return {
    ...options,
    repository: createEngineerMobileReadRepository({
      allowNonExecutableForTest: options.allowNonExecutableForTest === true,
      detailExecutor: options.detailExecutor,
      executor: sharedExecutor,
      listExecutor: options.listExecutor,
    }),
  };
}

module.exports = {
  composeEngineerMobileReadProviderOptions,
};
