'use strict';

const SAFE_TASK_FIELDS = [
  'caseId',
  'appointmentId',
  'scheduledStart',
  'scheduledEnd',
  'status',
  'customerNameMasked',
  'customerPhoneMasked',
  'addressSummary',
  'productSummary',
  'issueSummary',
  'serviceType',
];

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeEmptyResult() {
  return {
    status: 'deny',
    tasks: [],
  };
}

function resolvePermissionAssignmentGuardOptions(options, request) {
  const source = isPlainObject(options) ? options : {};
  const guard = typeof source.permissionAssignmentGuard === 'function'
    ? source.permissionAssignmentGuard
    : undefined;
  const enabled = source.permissionAssignmentGuardEnabled === true
    || source.usePermissionAssignmentGuard === true;

  if (!enabled) {
    return {
      enabled: false,
    };
  }

  return {
    auth: isPlainObject(source.permissionAssignmentContext)
      ? source.permissionAssignmentContext
      : (
        isPlainObject(request.permissionAssignmentContext)
          ? request.permissionAssignmentContext
          : request
      ),
    enabled: true,
    guard,
  };
}

function isPermissionAssignmentAllowed({
  action,
  options,
  request,
  task,
}) {
  const guardOptions = resolvePermissionAssignmentGuardOptions(options, request);

  if (!guardOptions.enabled) {
    return true;
  }

  if (typeof guardOptions.guard !== 'function') {
    return false;
  }

  try {
    const decision = guardOptions.guard({
      action,
      assignment: task,
      auth: guardOptions.auth,
    });

    return isPlainObject(decision) && decision.allowed === true;
  } catch (error) {
    return false;
  }
}

function isThenable(value) {
  return Boolean(value) && typeof value.then === 'function';
}

function normalizeResolvedTasks(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (isPlainObject(result) && Array.isArray(result.tasks)) {
    return result.tasks;
  }

  return result;
}

function resolveTasks(options, requestInput) {
  const source = isPlainObject(options) ? options : {};

  if (Array.isArray(source.tasks)) {
    return source.tasks;
  }

  if (source.readModel && Array.isArray(source.readModel.tasks)) {
    return source.readModel.tasks;
  }

  if (source.taskProvider && Array.isArray(source.taskProvider.tasks)) {
    return source.taskProvider.tasks;
  }

  if (typeof source.readModel === 'function') {
    return normalizeResolvedTasks(source.readModel(requestInput));
  }

  if (typeof source.taskProvider === 'function') {
    return normalizeResolvedTasks(source.taskProvider(requestInput));
  }

  if (source.readModel && typeof source.readModel.listTasks === 'function') {
    return normalizeResolvedTasks(source.readModel.listTasks(requestInput));
  }

  if (source.taskProvider && typeof source.taskProvider.listTasks === 'function') {
    return normalizeResolvedTasks(source.taskProvider.listTasks(requestInput));
  }

  return [];
}

async function resolveTasksAsync(options, requestInput) {
  const source = isPlainObject(options) ? options : {};

  if (Array.isArray(source.tasks)) {
    return source.tasks;
  }

  if (source.readModel && Array.isArray(source.readModel.tasks)) {
    return source.readModel.tasks;
  }

  if (source.taskProvider && Array.isArray(source.taskProvider.tasks)) {
    return source.taskProvider.tasks;
  }

  if (typeof source.readModelAsync === 'function') {
    return normalizeResolvedTasks(await source.readModelAsync(requestInput));
  }

  if (typeof source.taskProviderAsync === 'function') {
    return normalizeResolvedTasks(await source.taskProviderAsync(requestInput));
  }

  if (source.readModel && typeof source.readModel.getReadModelAsync === 'function') {
    return normalizeResolvedTasks(await source.readModel.getReadModelAsync(requestInput));
  }

  if (source.readModel && typeof source.readModel.getTaskListAsync === 'function') {
    return normalizeResolvedTasks(await source.readModel.getTaskListAsync(requestInput));
  }

  if (source.readModel && typeof source.readModel.listTasksAsync === 'function') {
    return normalizeResolvedTasks(await source.readModel.listTasksAsync(requestInput));
  }

  if (source.taskProvider && typeof source.taskProvider.getTaskListAsync === 'function') {
    return normalizeResolvedTasks(await source.taskProvider.getTaskListAsync(requestInput));
  }

  if (source.taskProvider && typeof source.taskProvider.listTasksAsync === 'function') {
    return normalizeResolvedTasks(await source.taskProvider.listTasksAsync(requestInput));
  }

  const resolved = resolveTasks(options, requestInput);

  if (isThenable(resolved)) {
    return normalizeResolvedTasks(await resolved);
  }

  return resolved;
}

function isWithinDateRange(task, dateRange) {
  if (!isPlainObject(dateRange)) {
    return true;
  }

  if (!dateRange.from && !dateRange.to) {
    return true;
  }

  const scheduledAt = Date.parse(task.scheduledStart || task.scheduledDate || '');

  if (Number.isNaN(scheduledAt)) {
    return false;
  }

  if (dateRange.from) {
    const from = Date.parse(`${dateRange.from}T00:00:00.000Z`);

    if (!Number.isNaN(from) && scheduledAt < from) {
      return false;
    }
  }

  if (dateRange.to) {
    const to = Date.parse(`${dateRange.to}T23:59:59.999Z`);

    if (!Number.isNaN(to) && scheduledAt > to) {
      return false;
    }
  }

  return true;
}

function mapSafeTask(task) {
  const safeTask = {};

  for (const field of SAFE_TASK_FIELDS) {
    if (task[field] !== undefined && task[field] !== null) {
      safeTask[field] = task[field];
    }
  }

  return safeTask;
}

function sortTask(a, b) {
  const aStart = a.scheduledStart || '';
  const bStart = b.scheduledStart || '';

  if (aStart !== bStart) {
    return aStart.localeCompare(bStart);
  }

  const aAppointment = a.appointmentId || '';
  const bAppointment = b.appointmentId || '';

  if (aAppointment !== bAppointment) {
    return aAppointment.localeCompare(bAppointment);
  }

  return (a.caseId || '').localeCompare(b.caseId || '');
}

function buildEngineerMobileTaskList(input, options = {}) {
  const request = isPlainObject(input) ? input : {};
  const organizationId = request.organizationId;
  const engineerId = request.engineerId;

  if (!organizationId || !engineerId) {
    return safeEmptyResult();
  }

  let tasks;

  try {
    tasks = resolveTasks(options, request);
  } catch (error) {
    return safeEmptyResult();
  }

  if (!Array.isArray(tasks)) {
    return safeEmptyResult();
  }

  const matchingTasks = tasks
    .filter((task) => isPlainObject(task))
    .filter((task) => task.organizationId === organizationId)
    .filter((task) => task.assignedEngineerId === engineerId)
    .filter((task) => isWithinDateRange(task, request.dateRange));
  const guardedTasks = matchingTasks.filter((task) => isPermissionAssignmentAllowed({
    action: 'task_list',
    options,
    request,
    task,
  }));

  if (matchingTasks.length > 0 && guardedTasks.length === 0) {
    return safeEmptyResult();
  }

  return {
    status: 'allow',
    tasks: guardedTasks
      .map(mapSafeTask)
      .sort(sortTask),
  };
}

async function buildEngineerMobileTaskListAsync(input, options = {}) {
  const request = isPlainObject(input) ? input : {};
  const organizationId = request.organizationId;
  const engineerId = request.engineerId;

  if (!organizationId || !engineerId) {
    return safeEmptyResult();
  }

  let tasks;

  try {
    tasks = await resolveTasksAsync(options, request);
  } catch (error) {
    return safeEmptyResult();
  }

  if (!Array.isArray(tasks)) {
    return safeEmptyResult();
  }

  const matchingTasks = tasks
    .filter((task) => isPlainObject(task))
    .filter((task) => task.organizationId === organizationId)
    .filter((task) => task.assignedEngineerId === engineerId)
    .filter((task) => isWithinDateRange(task, request.dateRange));
  const guardedTasks = matchingTasks.filter((task) => isPermissionAssignmentAllowed({
    action: 'task_list',
    options,
    request,
    task,
  }));

  if (matchingTasks.length > 0 && guardedTasks.length === 0) {
    return safeEmptyResult();
  }

  return {
    status: 'allow',
    tasks: guardedTasks
      .map(mapSafeTask)
      .sort(sortTask),
  };
}

module.exports = {
  buildEngineerMobileTaskListAsync,
  buildEngineerMobileTaskList,
};
