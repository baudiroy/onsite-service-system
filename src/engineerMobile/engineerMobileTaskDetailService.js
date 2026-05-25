'use strict';

const SAFE_DETAIL_FIELDS = [
  'appointmentId',
  'caseId',
  'organizationId',
  'assignedEngineerId',
  'scheduledStart',
  'scheduledEnd',
  'status',
  'customerNameMasked',
  'customerPhoneMasked',
  'addressSummary',
  'productSummary',
  'issueSummary',
  'serviceType',
  'siteNoteSafe',
  'checklistSummary',
  'evidenceRefs',
];

const SAFE_EVIDENCE_REF_FIELDS = [
  'id',
  'type',
  'label',
];

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeEmptyResult() {
  return {
    detail: null,
    status: 'deny',
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

  if (isPlainObject(result) && isPlainObject(result.task)) {
    return [result.task];
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

  if (source.readModel && isPlainObject(source.readModel.task)) {
    return [source.readModel.task];
  }

  if (source.taskProvider && Array.isArray(source.taskProvider.tasks)) {
    return source.taskProvider.tasks;
  }

  if (source.taskProvider && isPlainObject(source.taskProvider.task)) {
    return [source.taskProvider.task];
  }

  if (typeof source.readModel === 'function') {
    return normalizeResolvedTasks(source.readModel(requestInput));
  }

  if (typeof source.taskProvider === 'function') {
    return normalizeResolvedTasks(source.taskProvider(requestInput));
  }

  if (source.readModel && typeof source.readModel.getTaskDetail === 'function') {
    return normalizeResolvedTasks(source.readModel.getTaskDetail(requestInput));
  }

  if (source.taskProvider && typeof source.taskProvider.getTaskDetail === 'function') {
    return normalizeResolvedTasks(source.taskProvider.getTaskDetail(requestInput));
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

  if (source.readModel && isPlainObject(source.readModel.task)) {
    return [source.readModel.task];
  }

  if (source.taskProvider && Array.isArray(source.taskProvider.tasks)) {
    return source.taskProvider.tasks;
  }

  if (source.taskProvider && isPlainObject(source.taskProvider.task)) {
    return [source.taskProvider.task];
  }

  if (typeof source.readModelAsync === 'function') {
    return normalizeResolvedTasks(await source.readModelAsync(requestInput));
  }

  if (typeof source.taskProviderAsync === 'function') {
    return normalizeResolvedTasks(await source.taskProviderAsync(requestInput));
  }

  if (source.readModel && typeof source.readModel.getTaskDetailAsync === 'function') {
    return normalizeResolvedTasks(await source.readModel.getTaskDetailAsync(requestInput));
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

  if (source.taskProvider && typeof source.taskProvider.getTaskDetailAsync === 'function') {
    return normalizeResolvedTasks(await source.taskProvider.getTaskDetailAsync(requestInput));
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

function safeEvidenceRefs(value) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value
    .filter(isPlainObject)
    .map((entry) => {
      const safeEntry = {};

      for (const field of SAFE_EVIDENCE_REF_FIELDS) {
        if (entry[field] !== undefined && entry[field] !== null) {
          safeEntry[field] = String(entry[field]);
        }
      }

      return safeEntry;
    })
    .filter((entry) => Object.keys(entry).length > 0);
}

function mapSafeDetail(task) {
  const safeDetail = {};

  for (const field of SAFE_DETAIL_FIELDS) {
    if (field === 'evidenceRefs') {
      const refs = safeEvidenceRefs(task[field]);

      if (refs && refs.length > 0) {
        safeDetail[field] = refs;
      }

      continue;
    }

    if (task[field] !== undefined && task[field] !== null) {
      safeDetail[field] = task[field];
    }
  }

  return safeDetail;
}

function buildEngineerMobileTaskDetail(input = {}, options = {}) {
  const request = isPlainObject(input) ? input : {};
  const organizationId = request.organizationId;
  const engineerId = request.engineerId;
  const appointmentId = request.appointmentId;

  if (!organizationId || !engineerId || !appointmentId) {
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

  const matchedTask = tasks
    .filter(isPlainObject)
    .find((task) => (
      task.organizationId === organizationId
      && task.assignedEngineerId === engineerId
      && task.appointmentId === appointmentId
    ));

  if (!matchedTask) {
    return safeEmptyResult();
  }

  if (!isPermissionAssignmentAllowed({
    action: 'task_detail',
    options,
    request,
    task: matchedTask,
  })) {
    return safeEmptyResult();
  }

  return {
    detail: mapSafeDetail(matchedTask),
    status: 'allow',
  };
}

async function buildEngineerMobileTaskDetailAsync(input = {}, options = {}) {
  const request = isPlainObject(input) ? input : {};
  const organizationId = request.organizationId;
  const engineerId = request.engineerId;
  const appointmentId = request.appointmentId;

  if (!organizationId || !engineerId || !appointmentId) {
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

  const matchedTask = tasks
    .filter(isPlainObject)
    .find((task) => (
      task.organizationId === organizationId
      && task.assignedEngineerId === engineerId
      && task.appointmentId === appointmentId
    ));

  if (!matchedTask) {
    return safeEmptyResult();
  }

  if (!isPermissionAssignmentAllowed({
    action: 'task_detail',
    options,
    request,
    task: matchedTask,
  })) {
    return safeEmptyResult();
  }

  return {
    detail: mapSafeDetail(matchedTask),
    status: 'allow',
  };
}

module.exports = {
  SAFE_DETAIL_FIELDS,
  buildEngineerMobileTaskDetailAsync,
  buildEngineerMobileTaskDetail,
};
