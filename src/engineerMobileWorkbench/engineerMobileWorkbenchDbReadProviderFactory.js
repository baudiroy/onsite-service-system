'use strict';

const {
  createEngineerMobileReadModelRepository,
} = require('../engineerMobile/engineerMobileReadModelRepository');

const ENGINEER_MOBILE_WORKBENCH_CONTEXT_SQL = `
select
  u.display_name as engineer_display_name,
  o.organization_name
from users u
join user_organizations uo
  on uo.user_id = u.id
  and uo.deleted_at is null
join organizations o
  on o.id = uo.organization_id
  and o.deleted_at is null
where o.id = $1
  and u.id = $2
  and u.user_type = 'engineer'
  and u.status = 'active'
  and u.deleted_at is null
limit 1
`.trim();

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function resolveQuery(options) {
  if (!isPlainObject(options)) {
    return undefined;
  }

  const dbClient = options.dbClient || options.transaction;

  if (typeof dbClient === 'function') {
    return dbClient;
  }

  if (dbClient && typeof dbClient.query === 'function') {
    return dbClient.query.bind(dbClient);
  }

  return undefined;
}

function rowsFromQueryResult(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (isPlainObject(result) && Array.isArray(result.rows)) {
    return result.rows;
  }

  return [];
}

function mapContextRow(row = {}) {
  return {
    capabilities: [
      'tasks.read',
      'task.detail.read',
    ],
    engineerDisplayName: safeString(row.engineer_display_name || row.engineerDisplayName),
    organizationName: safeString(row.organization_name || row.organizationName),
    workbenchMode: 'engineer_mobile_workbench',
  };
}

function createContextProvider(query) {
  async function getCurrentContext(input = {}) {
    const organizationId = safeString(input.organizationId);
    const engineerId = safeString(input.engineerId);

    if (!organizationId || !engineerId || typeof query !== 'function') {
      throw new Error('engineerMobileWorkbenchContextUnavailable');
    }

    const result = await query(ENGINEER_MOBILE_WORKBENCH_CONTEXT_SQL, [
      organizationId,
      engineerId,
    ]);
    const row = rowsFromQueryResult(result)[0];

    if (!isPlainObject(row)) {
      throw new Error('engineerMobileWorkbenchContextUnavailable');
    }

    return mapContextRow(row);
  }

  return {
    getContext: getCurrentContext,
    getCurrentContext,
  };
}

function createTaskProvider(repository) {
  async function listTasks(input = {}) {
    if (!repository || typeof repository.getTaskList !== 'function') {
      return [];
    }

    const result = await repository.getTaskList(input);
    return isPlainObject(result) && Array.isArray(result.tasks) ? result.tasks : [];
  }

  async function getTaskDetail(input = {}) {
    if (!repository || typeof repository.getTaskDetail !== 'function') {
      return {
        task: null,
      };
    }

    const result = await repository.getTaskDetail(input);

    return {
      task: isPlainObject(result) && isPlainObject(result.task) ? result.task : null,
    };
  }

  return {
    getTaskDetail,
    getTaskDetailAsync: getTaskDetail,
    getTaskList: listTasks,
    getTaskListAsync: listTasks,
    listTasks,
    listTasksAsync: listTasks,
  };
}

function createEngineerMobileWorkbenchDbReadProviderFactory(options = {}) {
  const query = resolveQuery(options);
  const repository = createEngineerMobileReadModelRepository({
    dbClient: query,
  });

  return {
    contextProvider: createContextProvider(query),
    name: 'engineerMobileWorkbenchDbReadProviderFactory',
    taskProvider: createTaskProvider(repository),
  };
}

module.exports = {
  ENGINEER_MOBILE_WORKBENCH_CONTEXT_SQL,
  createEngineerMobileWorkbenchDbReadProviderFactory,
};
