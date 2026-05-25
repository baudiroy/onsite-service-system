'use strict';

const {
  buildEngineerMobileTaskList,
} = require('./engineerMobileTaskListService');
const {
  buildEngineerMobileTaskDetail,
} = require('./engineerMobileTaskDetailService');

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function emptyReadModel() {
  return {
    tasks: [],
  };
}

function resolvePermissionAssignmentServiceOptions(options, request) {
  const source = isPlainObject(options) ? options : {};
  const guard = typeof source.permissionAssignmentGuard === 'function'
    ? source.permissionAssignmentGuard
    : undefined;
  const enabled = source.permissionAssignmentGuardEnabled === true
    || source.usePermissionAssignmentGuard === true;

  if (!enabled) {
    return {};
  }

  const safeRequest = isPlainObject(request) ? request : {};

  return {
    permissionAssignmentContext: isPlainObject(source.permissionAssignmentContext)
      ? source.permissionAssignmentContext
      : (isPlainObject(safeRequest.auth) ? safeRequest.auth : {}),
    permissionAssignmentGuard: guard,
    permissionAssignmentGuardEnabled: true,
  };
}

function mapEngineerMobileTaskListRequest(request = {}) {
  const source = isPlainObject(request) ? request : {};
  const auth = isPlainObject(source.auth) ? source.auth : {};
  const organizationId = auth.organizationId;
  const engineerId = auth.engineerId;

  if (!organizationId || !engineerId) {
    return null;
  }

  const query = isPlainObject(source.query) ? source.query : {};
  const dateRange = {};

  if (query.from) {
    dateRange.from = query.from;
  }
  if (query.to) {
    dateRange.to = query.to;
  }

  return {
    organizationId,
    engineerId,
    ...(Object.keys(dateRange).length > 0 ? { dateRange } : {}),
  };
}

function mapEngineerMobileTaskDetailRequest(request = {}) {
  const source = isPlainObject(request) ? request : {};
  const auth = isPlainObject(source.auth) ? source.auth : {};
  const params = isPlainObject(source.params) ? source.params : {};
  const query = isPlainObject(source.query) ? source.query : {};
  const organizationId = auth.organizationId;
  const engineerId = auth.engineerId;
  const appointmentId = params.appointmentId;

  if (!organizationId || !engineerId || !appointmentId) {
    return null;
  }

  const dateRange = {};

  if (query.from) {
    dateRange.from = query.from;
  }
  if (query.to) {
    dateRange.to = query.to;
  }

  return {
    organizationId,
    engineerId,
    appointmentId,
    ...(Object.keys(dateRange).length > 0 ? { dateRange } : {}),
  };
}

function normalizeProviderResult(result, mappedInput, options = {}, request = {}) {
  const tasks = Array.isArray(result)
    ? result
    : (isPlainObject(result) && Array.isArray(result.tasks) ? result.tasks : undefined);

  if (!Array.isArray(tasks)) {
    return emptyReadModel();
  }

  const safeResult = buildEngineerMobileTaskList(mappedInput, {
    tasks,
    ...resolvePermissionAssignmentServiceOptions(options, request),
  });

  if (safeResult.status !== 'allow') {
    return emptyReadModel();
  }

  return {
    tasks: safeResult.tasks,
  };
}

async function normalizeProviderResultAsync(result, mappedInput, options = {}, request = {}) {
  return normalizeProviderResult(await result, mappedInput, options, request);
}

function normalizeTaskDetailProviderResult(result, mappedInput, options = {}, request = {}) {
  const readModelResult = Array.isArray(result) ? { tasks: result } : result;
  const detailResult = buildEngineerMobileTaskDetail(mappedInput, {
    readModel: readModelResult,
    ...resolvePermissionAssignmentServiceOptions(options, request),
  });

  if (detailResult.status !== 'allow' || !isPlainObject(detailResult.detail)) {
    return emptyReadModel();
  }

  return {
    task: detailResult.detail,
  };
}

async function normalizeTaskDetailProviderResultAsync(result, mappedInput, options = {}, request = {}) {
  return normalizeTaskDetailProviderResult(await result, mappedInput, options, request);
}

function resolveCallable(source, methodNames = []) {
  if (typeof source === 'function') {
    return source;
  }

  if (!isPlainObject(source)) {
    return undefined;
  }

  for (const methodName of methodNames) {
    if (typeof source[methodName] === 'function') {
      return source[methodName].bind(source);
    }
  }

  if (typeof source.getReadModel === 'function') {
    return source.getReadModel.bind(source);
  }

  if (typeof source.getTaskList === 'function') {
    return source.getTaskList.bind(source);
  }

  if (typeof source.listTasks === 'function') {
    return source.listTasks.bind(source);
  }

  return undefined;
}

function resolveCallableAsync(source, methodNames = []) {
  return resolveCallable(source, [
    ...methodNames,
    'getReadModelAsync',
    'getTaskListAsync',
    'listTasksAsync',
  ]);
}

function resolveReadSource(options) {
  const source = isPlainObject(options) ? options : {};

  if (source.repository && typeof source.repository.getReadModel === 'function') {
    return source.repository.getReadModel.bind(source.repository);
  }

  if (source.repository && typeof source.repository.getTaskList === 'function') {
    return source.repository.getTaskList.bind(source.repository);
  }

  const readModel = resolveCallable(source.readModel);

  if (readModel) {
    return readModel;
  }

  return resolveCallable(source.taskProvider);
}

function resolveReadSourceAsync(options) {
  const source = isPlainObject(options) ? options : {};

  if (typeof source.readModelAsync === 'function') {
    return source.readModelAsync.bind(source);
  }

  if (typeof source.taskProviderAsync === 'function') {
    return source.taskProviderAsync.bind(source);
  }

  if (source.repository && typeof source.repository.getReadModelAsync === 'function') {
    return source.repository.getReadModelAsync.bind(source.repository);
  }

  if (source.repository && typeof source.repository.getTaskListAsync === 'function') {
    return source.repository.getTaskListAsync.bind(source.repository);
  }

  const readModel = resolveCallableAsync(source.readModel);

  if (readModel) {
    return readModel;
  }

  const taskProvider = resolveCallableAsync(source.taskProvider);

  if (taskProvider) {
    return taskProvider;
  }

  return resolveReadSource(options);
}

function resolveDetailReadSource(options) {
  const source = isPlainObject(options) ? options : {};

  if (source.repository && typeof source.repository.getTaskDetail === 'function') {
    return source.repository.getTaskDetail.bind(source.repository);
  }

  if (source.repository && typeof source.repository.getReadModel === 'function') {
    return source.repository.getReadModel.bind(source.repository);
  }

  if (source.repository && typeof source.repository.getTaskList === 'function') {
    return source.repository.getTaskList.bind(source.repository);
  }

  const readModel = resolveCallable(source.readModel, ['getTaskDetail']);

  if (readModel) {
    return readModel;
  }

  return resolveCallable(source.taskProvider, ['getTaskDetail']);
}

function resolveDetailReadSourceAsync(options) {
  const source = isPlainObject(options) ? options : {};

  if (typeof source.readModelAsync === 'function') {
    return source.readModelAsync.bind(source);
  }

  if (typeof source.taskProviderAsync === 'function') {
    return source.taskProviderAsync.bind(source);
  }

  if (source.repository && typeof source.repository.getTaskDetailAsync === 'function') {
    return source.repository.getTaskDetailAsync.bind(source.repository);
  }

  if (source.repository && typeof source.repository.getReadModelAsync === 'function') {
    return source.repository.getReadModelAsync.bind(source.repository);
  }

  if (source.repository && typeof source.repository.getTaskListAsync === 'function') {
    return source.repository.getTaskListAsync.bind(source.repository);
  }

  const readModel = resolveCallableAsync(source.readModel, ['getTaskDetailAsync', 'getTaskDetail']);

  if (readModel) {
    return readModel;
  }

  const taskProvider = resolveCallableAsync(source.taskProvider, ['getTaskDetailAsync', 'getTaskDetail']);

  if (taskProvider) {
    return taskProvider;
  }

  return resolveDetailReadSource(options);
}

function createEngineerMobileTaskListReadProvider(options = {}) {
  const readSource = resolveReadSource(options);
  const readSourceAsync = resolveReadSourceAsync(options);

  function readModel(request = {}) {
    const mappedInput = mapEngineerMobileTaskListRequest(request);

    if (!mappedInput || typeof readSource !== 'function') {
      return emptyReadModel();
    }

    try {
      return normalizeProviderResult(readSource(mappedInput), mappedInput, options, request);
    } catch (error) {
      return emptyReadModel();
    }
  }

  async function readModelAsync(request = {}) {
    const mappedInput = mapEngineerMobileTaskListRequest(request);

    if (!mappedInput || typeof readSourceAsync !== 'function') {
      return emptyReadModel();
    }

    try {
      return await normalizeProviderResultAsync(readSourceAsync(mappedInput), mappedInput, options, request);
    } catch (error) {
      return emptyReadModel();
    }
  }

  return {
    readModel,
    readModelAsync,
    taskProvider: readModel,
    taskProviderAsync: readModelAsync,
  };
}

function createEngineerMobileTaskDetailReadProvider(options = {}) {
  const readSource = resolveDetailReadSource(options);
  const readSourceAsync = resolveDetailReadSourceAsync(options);

  function readModel(request = {}) {
    const mappedInput = mapEngineerMobileTaskDetailRequest(request);

    if (!mappedInput || typeof readSource !== 'function') {
      return emptyReadModel();
    }

    try {
      return normalizeTaskDetailProviderResult(readSource(mappedInput), mappedInput, options, request);
    } catch (error) {
      return emptyReadModel();
    }
  }

  async function readModelAsync(request = {}) {
    const mappedInput = mapEngineerMobileTaskDetailRequest(request);

    if (!mappedInput || typeof readSourceAsync !== 'function') {
      return emptyReadModel();
    }

    try {
      return await normalizeTaskDetailProviderResultAsync(readSourceAsync(mappedInput), mappedInput, options, request);
    } catch (error) {
      return emptyReadModel();
    }
  }

  return {
    readModel,
    readModelAsync,
    taskProvider: readModel,
    taskProviderAsync: readModelAsync,
  };
}

module.exports = {
  createEngineerMobileTaskDetailReadProvider,
  createEngineerMobileTaskListReadProvider,
  mapEngineerMobileTaskDetailRequest,
  mapEngineerMobileTaskListRequest,
};
