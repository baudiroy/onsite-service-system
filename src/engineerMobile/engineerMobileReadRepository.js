'use strict';

const {
  createEngineerMobileTaskListReadRepository,
} = require('./engineerMobileTaskListReadRepository');
const {
  createEngineerMobileTaskDetailReadRepository,
} = require('./engineerMobileTaskDetailReadRepository');

const ENGINEER_MOBILE_READ_REPOSITORY_NAME = 'engineerMobileReadRepository';
const ENGINEER_MOBILE_READ_REPOSITORY_METHODS = Object.freeze([
  'getTaskList',
  'getTaskListAsync',
  'getReadModel',
  'getReadModelAsync',
  'getTaskDetail',
  'getTaskDetailAsync',
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function selectExecutor(specificExecutor, fallbackExecutor) {
  return specificExecutor === undefined ? fallbackExecutor : specificExecutor;
}

function createEngineerMobileReadRepository(options = {}) {
  const safeOptions = isPlainObject(options) ? options : {};
  const sharedOptions = {
    allowNonExecutableForTest: safeOptions.allowNonExecutableForTest === true,
  };
  const listRepository = createEngineerMobileTaskListReadRepository({
    ...sharedOptions,
    executor: selectExecutor(safeOptions.listExecutor, safeOptions.executor),
  });
  const detailRepository = createEngineerMobileTaskDetailReadRepository({
    ...sharedOptions,
    executor: selectExecutor(safeOptions.detailExecutor, safeOptions.executor),
  });

  function getTaskList(input = {}) {
    return listRepository.getTaskList(input);
  }

  function getTaskListAsync(input = {}) {
    return listRepository.getTaskListAsync(input);
  }

  function getTaskDetail(input = {}) {
    return detailRepository.getTaskDetail(input);
  }

  function getTaskDetailAsync(input = {}) {
    return detailRepository.getTaskDetailAsync(input);
  }

  function getReadModel(input = {}) {
    const request = isPlainObject(input) ? input : {};

    if (request.appointmentId) {
      return getTaskDetail(request);
    }

    return getTaskList(request);
  }

  function getReadModelAsync(input = {}) {
    const request = isPlainObject(input) ? input : {};

    if (request.appointmentId) {
      return getTaskDetailAsync(request);
    }

    return getTaskListAsync(request);
  }

  return {
    getReadModel,
    getReadModelAsync,
    getTaskDetail,
    getTaskDetailAsync,
    getTaskList,
    getTaskListAsync,
    methods: ENGINEER_MOBILE_READ_REPOSITORY_METHODS,
    name: ENGINEER_MOBILE_READ_REPOSITORY_NAME,
  };
}

module.exports = {
  ENGINEER_MOBILE_READ_REPOSITORY_METHODS,
  ENGINEER_MOBILE_READ_REPOSITORY_NAME,
  createEngineerMobileReadRepository,
};
