#!/usr/bin/env node
'use strict';

const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const INVENTORY_WARNING = [
  'This script is inventory-only. It does not delete, update, unlink, disable, or cleanup any records.',
  'Destructive cleanup is not implemented and must not be run against shared Zeabur runtime.',
];

const UNSAFE_COLUMN_PATTERN = /(mobile|phone|tel|line_user_id|password|password_hash|token|secret|payload|raw|database_url)/i;
const DEFAULT_MAX_DATE_RANGE_DAYS = 7;
const DEFAULT_MIN_PREFIX_LENGTH = 10;

const ENTITY_CONFIGS = [
  {
    entityType: 'organizations',
    table: 'organizations',
    riskLevel: 'high',
    safeTextColumns: ['organization_code', 'organization_name'],
    labelColumns: ['organization_code', 'organization_name'],
    dependencyWarning: 'Root tenant scope. Inventory only; do not cleanup shared runtime organizations.',
  },
  {
    entityType: 'dispatch_units',
    table: 'dispatch_units',
    riskLevel: 'medium',
    safeTextColumns: ['code', 'name'],
    labelColumns: ['code', 'name'],
    dependencyWarning: 'May be referenced by cases, dispatch assignments, and users.',
  },
  {
    entityType: 'customers',
    table: 'customers',
    riskLevel: 'low',
    safeTextColumns: ['customer_name'],
    labelColumns: ['customer_name'],
    dependencyWarning: 'Depends on organization scope and may be referenced by cases.',
  },
  {
    entityType: 'cases',
    table: 'cases',
    riskLevel: 'low',
    safeTextColumns: ['case_no', 'model_no', 'problem_description'],
    labelColumns: ['case_no', 'model_no', 'problem_description'],
    dependencyWarning: 'Root of dispatch, appointment, report, message, and audit records.',
  },
  {
    entityType: 'dispatch_assignments',
    table: 'dispatch_assignments',
    riskLevel: 'low',
    safeTextColumns: ['assignment_note'],
    labelColumns: ['assignment_note', 'dispatch_status'],
    dependencyWarning: 'Depends on cases and dispatch units.',
  },
  {
    entityType: 'appointments',
    table: 'appointments',
    riskLevel: 'low',
    safeTextColumns: ['note', 'reschedule_reason', 'incomplete_reason', 'next_action', 'visit_result'],
    labelColumns: ['note', 'visit_sequence', 'reschedule_reason', 'incomplete_reason', 'next_action', 'visit_result', 'appointment_status'],
    dependencyWarning: 'Depends on cases and dispatch assignments.',
  },
  {
    entityType: 'field_service_reports',
    table: 'field_service_reports',
    riskLevel: 'low',
    safeTextColumns: ['diagnosis_result', 'repair_action', 'repair_result', 'engineer_note'],
    labelColumns: ['diagnosis_result', 'repair_action', 'repair_result', 'service_status'],
    dependencyWarning: 'Depends on cases. One case should keep one active Field Service Report.',
  },
  {
    entityType: 'case_messages',
    table: 'case_messages',
    riskLevel: 'medium',
    safeTextColumns: ['sender_display_name', 'body_text'],
    labelColumns: ['sender_display_name', 'body_text', 'message_type'],
    dependencyWarning: 'Timeline/message retention may matter. Inventory only.',
  },
  {
    entityType: 'audit_logs',
    table: 'audit_logs',
    riskLevel: 'medium',
    safeTextColumns: ['actor_display_name', 'action', 'entity_type'],
    labelColumns: ['actor_display_name', 'action', 'entity_type'],
    dependencyWarning: 'Audit retention may matter. Cleanup is not supported.',
  },
  {
    entityType: 'line_channels',
    table: 'line_channels',
    riskLevel: 'medium',
    safeTextColumns: ['channel_code', 'channel_name', 'channel_id'],
    labelColumns: ['channel_code', 'channel_name', 'channel_id'],
    dependencyWarning: 'May be referenced by LINE identities and inquiry state.',
  },
  {
    entityType: 'customer_line_identities',
    table: 'customer_line_identities',
    riskLevel: 'medium',
    safeTextColumns: ['display_name'],
    labelColumns: ['display_name'],
    dependencyWarning: 'Raw LINE user id is intentionally excluded from matching and output.',
  },
  {
    entityType: 'roles',
    table: 'roles',
    riskLevel: 'high',
    safeTextColumns: ['role_key', 'name', 'description'],
    labelColumns: ['role_key', 'name', 'description'],
    dependencyWarning: 'RBAC fixture. High risk; inventory only.',
    includeRoleMetadata: true,
  },
  {
    entityType: 'role_permissions',
    table: 'role_permissions',
    riskLevel: 'high',
    safeTextColumns: [],
    labelColumns: ['role_id', 'permission_id'],
    dependencyWarning: 'RBAC fixture. Matched through smoke-created roles when possible.',
    relatedRoleColumn: 'role_id',
  },
  {
    entityType: 'users',
    table: 'users',
    riskLevel: 'high',
    safeTextColumns: ['email', 'display_name'],
    labelColumns: ['email', 'display_name', 'user_type', 'status'],
    dependencyWarning: 'Auth fixture. Password hash is intentionally excluded from matching and output.',
  },
  {
    entityType: 'user_roles',
    table: 'user_roles',
    riskLevel: 'high',
    safeTextColumns: [],
    labelColumns: ['user_id', 'role_id'],
    dependencyWarning: 'RBAC membership fixture. Matched through smoke-created users or roles when possible.',
    relatedRoleColumn: 'role_id',
    relatedUserColumn: 'user_id',
  },
  {
    entityType: 'user_organizations',
    table: 'user_organizations',
    riskLevel: 'high',
    safeTextColumns: ['role_note'],
    labelColumns: ['role_note', 'user_id', 'organization_id'],
    dependencyWarning: 'Organization membership fixture. Matched through note, users, or organizations when possible.',
    relatedUserColumn: 'user_id',
    relatedOrganizationColumn: 'organization_id',
  },
];

function requireDryRun() {
  if (process.env.DRY_RUN !== '1') {
    console.error('This inventory script is read-only and requires DRY_RUN=1. No cleanup is implemented.');
    process.exit(1);
  }
}

function isEnabled(value) {
  return value === '1';
}

function parsePositiveIntegerEnv(name, defaultValue) {
  const rawValue = process.env[name];
  if (!rawValue) {
    return defaultValue;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isInteger(parsed) || parsed <= 0 || String(parsed) !== rawValue.trim()) {
    console.error(`${name} must be a positive integer. No cleanup was performed.`);
    process.exit(1);
  }

  return parsed;
}

function readInventorySettings() {
  const sharedRuntime = isEnabled(process.env.INVENTORY_SHARED_RUNTIME) || isEnabled(process.env.SHARED_RUNTIME);
  return {
    sharedRuntime,
    strictSharedRuntime: sharedRuntime && isEnabled(process.env.REQUIRE_STRICT_FILTER_ON_SHARED_RUNTIME),
    allowBroadInventory: isEnabled(process.env.ALLOW_BROAD_INVENTORY),
    inventoryMaxDateRangeDays: parsePositiveIntegerEnv('INVENTORY_MAX_DATE_RANGE_DAYS', DEFAULT_MAX_DATE_RANGE_DAYS),
    inventoryMinPrefixLength: parsePositiveIntegerEnv('INVENTORY_MIN_PREFIX_LENGTH', DEFAULT_MIN_PREFIX_LENGTH),
  };
}

function parseOptionalDate(name) {
  const value = process.env[name];
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    console.error(`${name} must be a valid date or ISO timestamp.`);
    process.exit(1);
  }
  return date;
}

function readFilters() {
  const createdFrom = parseOptionalDate('CREATED_FROM');
  const createdTo = parseOptionalDate('CREATED_TO');

  const filters = {
    smokeRunId: normalizeNullable(process.env.SMOKE_RUN_ID),
    smokeTaskCode: normalizeNullable(process.env.SMOKE_TASK_CODE),
    smokePrefix: normalizeNullable(process.env.SMOKE_PREFIX),
    createdFrom: createdFrom ? createdFrom.toISOString() : null,
    createdTo: createdTo ? createdTo.toISOString() : null,
  };

  if (!filters.smokeRunId && !filters.smokeTaskCode && !filters.smokePrefix && !filters.createdFrom && !filters.createdTo) {
    console.error('Refusing to run inventory without SMOKE_RUN_ID, SMOKE_TASK_CODE, SMOKE_PREFIX, or CREATED_FROM/CREATED_TO.');
    process.exit(1);
  }

  return filters;
}

function normalizeNullable(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function dateRangeDays(filters) {
  if (!filters.createdFrom || !filters.createdTo) {
    return null;
  }

  const fromTime = new Date(filters.createdFrom).getTime();
  const toTime = new Date(filters.createdTo).getTime();
  if (toTime < fromTime) {
    console.error('CREATED_FROM must be before or equal to CREATED_TO. No cleanup was performed.');
    process.exit(1);
  }

  return Math.ceil((toTime - fromTime) / (24 * 60 * 60 * 1000));
}

function pushUniqueWarning(warnings, message) {
  if (!warnings.includes(message)) {
    warnings.push(message);
  }
}

function buildBroadQueryWarnings(filters, settings) {
  const warnings = [];
  const hasRunId = Boolean(filters.smokeRunId);
  const hasTaskCode = Boolean(filters.smokeTaskCode);
  const hasPrefix = Boolean(filters.smokePrefix);
  const hasDateFrom = Boolean(filters.createdFrom);
  const hasDateTo = Boolean(filters.createdTo);
  const hasDateRange = hasDateFrom || hasDateTo;

  if (hasRunId) {
    pushUniqueWarning(
      warnings,
      'SMOKE_RUN_ID inventory uses substring matching on safe text fields except where structured metadata exact matching is available, such as roles.metadata smokeRunId. Prefix-like run ids may match sibling or historical fixtures. Review sample labels, createdAt, and task context before interpreting counts. Inventory is read-only and does not grant cleanup permission.',
    );
  }

  if (settings.sharedRuntime && !hasRunId) {
    pushUniqueWarning(
      warnings,
      'This inventory query may be broad on shared runtime. Prefer SMOKE_RUN_ID or add CREATED_FROM/CREATED_TO.',
    );
  }

  if (hasTaskCode && !hasRunId) {
    pushUniqueWarning(
      warnings,
      'SMOKE_TASK_CODE can match historical fixtures. Prefer SMOKE_RUN_ID for a single run, or add a narrow CREATED_FROM/CREATED_TO range.',
    );
  }

  if (hasDateRange && !hasRunId && !hasTaskCode && !hasPrefix) {
    pushUniqueWarning(
      warnings,
      'Date-range-only inventory can scan many non-smoke records. Keep the range narrow and review output manually.',
    );
  }

  if (hasPrefix && !hasRunId && filters.smokePrefix.length < settings.inventoryMinPrefixLength) {
    pushUniqueWarning(
      warnings,
      'SMOKE_PREFIX is short and may match unrelated records. Prefer SMOKE_RUN_ID or use a longer prefix.',
    );
  }

  return warnings;
}

function rejectStrictGuard(message) {
  console.error(`${message} No cleanup was performed.`);
  process.exit(1);
}

function validateStrictFilters(filters, settings) {
  const hasRunId = Boolean(filters.smokeRunId);
  const hasTaskCode = Boolean(filters.smokeTaskCode);
  const hasPrefix = Boolean(filters.smokePrefix);
  const hasDateFrom = Boolean(filters.createdFrom);
  const hasDateTo = Boolean(filters.createdTo);
  const hasDateRange = hasDateFrom || hasDateTo;
  const completeDateRange = hasDateFrom && hasDateTo;
  const onlyTaskCode = hasTaskCode && !hasRunId && !hasPrefix && !hasDateRange;
  const onlyDateRange = hasDateRange && !hasRunId && !hasTaskCode && !hasPrefix;
  const taskCodeWithDateRange = hasTaskCode && hasDateRange && !hasRunId && !hasPrefix;
  const rangeDays = dateRangeDays(filters);

  if (settings.sharedRuntime && hasPrefix && !hasRunId && filters.smokePrefix.length < settings.inventoryMinPrefixLength) {
    rejectStrictGuard('SMOKE_PREFIX is too short for shared-runtime inventory. Use a longer prefix, SMOKE_RUN_ID, or add CREATED_FROM/CREATED_TO.');
  }

  if (!settings.strictSharedRuntime || hasRunId) {
    return;
  }

  if (hasDateRange && !completeDateRange) {
    rejectStrictGuard('Open-ended date range is not allowed in shared-runtime strict mode. Provide both CREATED_FROM and CREATED_TO.');
  }

  if (onlyDateRange && rangeDays > settings.inventoryMaxDateRangeDays) {
    rejectStrictGuard('Date range exceeds INVENTORY_MAX_DATE_RANGE_DAYS. Narrow the range or use SMOKE_RUN_ID.');
  }

  if (onlyTaskCode && !settings.allowBroadInventory) {
    rejectStrictGuard('Refusing broad shared-runtime inventory without ALLOW_BROAD_INVENTORY=1.');
  }

  if (taskCodeWithDateRange && completeDateRange && rangeDays > settings.inventoryMaxDateRangeDays && !settings.allowBroadInventory) {
    rejectStrictGuard('Date range exceeds INVENTORY_MAX_DATE_RANGE_DAYS. Narrow the range or use SMOKE_RUN_ID.');
  }
}

function requireDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required for read-only DB inventory. The URL was not printed.');
    process.exit(1);
  }
}

function quoteIdentifier(identifier) {
  if (!/^[a-z_][a-z0-9_]*$/i.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }
  return `"${identifier}"`;
}

function isSafeColumn(column) {
  return !UNSAFE_COLUMN_PATTERN.test(column);
}

function existingSafeColumns(columns, candidates) {
  return candidates.filter((column) => columns.has(column) && isSafeColumn(column));
}

function pushParam(params, value) {
  params.push(value);
  return `$${params.length}`;
}

function likePattern(value) {
  return `%${value}%`;
}

function addColumnLikeConditions(conditions, params, columns, safeTextColumns, value) {
  for (const column of existingSafeColumns(columns, safeTextColumns)) {
    conditions.push(`LOWER(${quoteIdentifier(column)}::text) LIKE LOWER(${pushParam(params, likePattern(value))})`);
  }
}

function addRoleMetadataConditions(conditions, params, columns, filters) {
  if (!columns.has('metadata') || !isSafeColumn('metadata')) {
    return;
  }

  if (filters.smokeRunId) {
    conditions.push(`metadata->>'smokeRunId' = ${pushParam(params, filters.smokeRunId)}`);
  }
  if (filters.smokeTaskCode) {
    conditions.push(`LOWER(COALESCE(metadata->>'smokePrefix', '')) LIKE LOWER(${pushParam(params, likePattern(filters.smokeTaskCode))})`);
  }
  if (filters.smokePrefix) {
    conditions.push(`LOWER(COALESCE(metadata->>'smokePrefix', '')) LIKE LOWER(${pushParam(params, likePattern(filters.smokePrefix))})`);
  }
}

function buildRoleRelatedCondition(params, filters, roleIdExpression) {
  const roleConditions = [];

  if (filters.smokeRunId) {
    const runIdPattern = pushParam(params, likePattern(filters.smokeRunId));
    roleConditions.push(`LOWER(COALESCE(r.role_key, '')) LIKE LOWER(${runIdPattern})`);
    roleConditions.push(`LOWER(COALESCE(r.name, '')) LIKE LOWER(${runIdPattern})`);
    roleConditions.push(`LOWER(COALESCE(r.description, '')) LIKE LOWER(${runIdPattern})`);
    roleConditions.push(`r.metadata->>'smokeRunId' = ${pushParam(params, filters.smokeRunId)}`);
  }

  if (filters.smokeTaskCode) {
    const taskPattern = pushParam(params, likePattern(filters.smokeTaskCode));
    roleConditions.push(`LOWER(COALESCE(r.role_key, '')) LIKE LOWER(${taskPattern})`);
    roleConditions.push(`LOWER(COALESCE(r.name, '')) LIKE LOWER(${taskPattern})`);
    roleConditions.push(`LOWER(COALESCE(r.description, '')) LIKE LOWER(${taskPattern})`);
    roleConditions.push(`LOWER(COALESCE(r.metadata->>'smokePrefix', '')) LIKE LOWER(${taskPattern})`);
  }

  if (filters.smokePrefix) {
    const prefixPattern = pushParam(params, likePattern(filters.smokePrefix));
    roleConditions.push(`LOWER(COALESCE(r.role_key, '')) LIKE LOWER(${prefixPattern})`);
    roleConditions.push(`LOWER(COALESCE(r.name, '')) LIKE LOWER(${prefixPattern})`);
    roleConditions.push(`LOWER(COALESCE(r.description, '')) LIKE LOWER(${prefixPattern})`);
    roleConditions.push(`LOWER(COALESCE(r.metadata->>'smokePrefix', '')) LIKE LOWER(${prefixPattern})`);
  }

  if (roleConditions.length === 0) {
    return null;
  }

  return `EXISTS (SELECT 1 FROM roles r WHERE r.id = ${roleIdExpression} AND (${roleConditions.join(' OR ')}))`;
}

function buildUserRelatedCondition(params, filters, userIdExpression) {
  const userConditions = [];

  for (const value of [filters.smokeRunId, filters.smokeTaskCode, filters.smokePrefix].filter(Boolean)) {
    const pattern = pushParam(params, likePattern(value));
    userConditions.push(`LOWER(COALESCE(u.email, '')) LIKE LOWER(${pattern})`);
    userConditions.push(`LOWER(COALESCE(u.display_name, '')) LIKE LOWER(${pattern})`);
  }

  if (userConditions.length === 0) {
    return null;
  }

  return `EXISTS (SELECT 1 FROM users u WHERE u.id = ${userIdExpression} AND (${userConditions.join(' OR ')}))`;
}

function buildOrganizationRelatedCondition(params, filters, organizationIdExpression) {
  const organizationConditions = [];

  for (const value of [filters.smokeRunId, filters.smokeTaskCode, filters.smokePrefix].filter(Boolean)) {
    const pattern = pushParam(params, likePattern(value));
    organizationConditions.push(`LOWER(COALESCE(o.organization_code, '')) LIKE LOWER(${pattern})`);
    organizationConditions.push(`LOWER(COALESCE(o.organization_name, '')) LIKE LOWER(${pattern})`);
  }

  if (organizationConditions.length === 0) {
    return null;
  }

  return `EXISTS (SELECT 1 FROM organizations o WHERE o.id = ${organizationIdExpression} AND (${organizationConditions.join(' OR ')}))`;
}

function buildWhereClause(config, columns, filters, params) {
  const markerConditions = [];
  const rangeConditions = [];

  if (filters.smokeRunId) {
    addColumnLikeConditions(markerConditions, params, columns, config.safeTextColumns, filters.smokeRunId);
  }
  if (filters.smokeTaskCode) {
    addColumnLikeConditions(markerConditions, params, columns, config.safeTextColumns, filters.smokeTaskCode);
  }
  if (filters.smokePrefix) {
    addColumnLikeConditions(markerConditions, params, columns, config.safeTextColumns, filters.smokePrefix);
  }

  if (config.includeRoleMetadata) {
    addRoleMetadataConditions(markerConditions, params, columns, filters);
  }

  if (config.relatedRoleColumn && columns.has(config.relatedRoleColumn)) {
    const condition = buildRoleRelatedCondition(params, filters, `${quoteIdentifier(config.table)}.${quoteIdentifier(config.relatedRoleColumn)}`);
    if (condition) {
      markerConditions.push(condition);
    }
  }

  if (config.relatedUserColumn && columns.has(config.relatedUserColumn)) {
    const condition = buildUserRelatedCondition(params, filters, `${quoteIdentifier(config.table)}.${quoteIdentifier(config.relatedUserColumn)}`);
    if (condition) {
      markerConditions.push(condition);
    }
  }

  if (config.relatedOrganizationColumn && columns.has(config.relatedOrganizationColumn)) {
    const condition = buildOrganizationRelatedCondition(params, filters, `${quoteIdentifier(config.table)}.${quoteIdentifier(config.relatedOrganizationColumn)}`);
    if (condition) {
      markerConditions.push(condition);
    }
  }

  if (filters.createdFrom || filters.createdTo) {
    if (!columns.has('created_at')) {
      return { skipped: true, skipReason: 'created_at_column_not_found' };
    }
    if (filters.createdFrom) {
      rangeConditions.push(`created_at >= ${pushParam(params, filters.createdFrom)}`);
    }
    if (filters.createdTo) {
      rangeConditions.push(`created_at <= ${pushParam(params, filters.createdTo)}`);
    }
  }

  const hasMarkerFilter = Boolean(filters.smokeRunId || filters.smokeTaskCode || filters.smokePrefix);
  if (hasMarkerFilter && markerConditions.length === 0 && rangeConditions.length === 0) {
    return { skipped: true, skipReason: 'no_supported_filter_columns' };
  }

  const whereParts = [];
  if (markerConditions.length > 0) {
    whereParts.push(`(${markerConditions.join(' OR ')})`);
  }
  if (rangeConditions.length > 0) {
    whereParts.push(...rangeConditions);
  }

  if (whereParts.length === 0) {
    return { skipped: true, skipReason: 'no_supported_filter_columns' };
  }

  return { skipped: false, whereSql: whereParts.join(' AND ') };
}

async function getTableColumns(client, table) {
  const result = await client.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position
    `,
    [table],
  );

  return new Set(result.rows.map((row) => row.column_name));
}

function buildIdExpression(table, columns) {
  const tableSql = quoteIdentifier(table);
  if (columns.has('id')) {
    return `${tableSql}.id::text`;
  }

  const idParts = ['role_id', 'permission_id', 'user_id', 'organization_id', 'case_id']
    .filter((column) => columns.has(column))
    .map((column) => `${tableSql}.${quoteIdentifier(column)}::text`);

  if (idParts.length === 0) {
    return `NULL::text`;
  }

  return `concat_ws(':', ${idParts.join(', ')})`;
}

function buildLabelExpression(table, columns, labelColumns, entityType) {
  const tableSql = quoteIdentifier(table);

  if (entityType === 'role_permissions' && columns.has('role_id') && columns.has('permission_id')) {
    return `
      NULLIF(concat_ws(' | ',
        (SELECT r.role_key FROM roles r WHERE r.id = ${tableSql}.role_id),
        (SELECT r.name FROM roles r WHERE r.id = ${tableSql}.role_id),
        (SELECT p.permission_key FROM permissions p WHERE p.id = ${tableSql}.permission_id),
        (SELECT p.description FROM permissions p WHERE p.id = ${tableSql}.permission_id),
        ${tableSql}.role_id::text,
        ${tableSql}.permission_id::text
      ), '')
    `;
  }

  if (entityType === 'user_roles' && columns.has('user_id') && columns.has('role_id')) {
    return `
      NULLIF(concat_ws(' | ',
        (SELECT u.email FROM users u WHERE u.id = ${tableSql}.user_id),
        (SELECT u.display_name FROM users u WHERE u.id = ${tableSql}.user_id),
        (SELECT r.role_key FROM roles r WHERE r.id = ${tableSql}.role_id),
        (SELECT r.name FROM roles r WHERE r.id = ${tableSql}.role_id),
        ${tableSql}.user_id::text,
        ${tableSql}.role_id::text
      ), '')
    `;
  }

  if (entityType === 'user_organizations' && columns.has('user_id') && columns.has('organization_id')) {
    const roleNoteExpression = columns.has('role_note') ? `${tableSql}.role_note::text` : 'NULL::text';
    return `
      NULLIF(concat_ws(' | ',
        ${roleNoteExpression},
        (SELECT u.email FROM users u WHERE u.id = ${tableSql}.user_id),
        (SELECT u.display_name FROM users u WHERE u.id = ${tableSql}.user_id),
        (SELECT o.organization_code FROM organizations o WHERE o.id = ${tableSql}.organization_id),
        (SELECT o.organization_name FROM organizations o WHERE o.id = ${tableSql}.organization_id),
        ${tableSql}.user_id::text,
        ${tableSql}.organization_id::text
      ), '')
    `;
  }

  const safeLabels = existingSafeColumns(columns, labelColumns);
  if (safeLabels.length === 0) {
    return `NULL::text`;
  }

  return `NULLIF(concat_ws(' | ', ${safeLabels.map((column) => `${tableSql}.${quoteIdentifier(column)}::text`).join(', ')}), '')`;
}

function buildCreatedAtExpression(columns) {
  return columns.has('created_at') ? 'created_at' : 'NULL::timestamptz';
}

function toIsoOrNull(value) {
  return value instanceof Date ? value.toISOString() : null;
}

async function inventoryEntity(client, config, filters) {
  const columns = await getTableColumns(client, config.table);
  if (columns.size === 0) {
    return skippedEntity(config, 'table_not_found');
  }

  const params = [];
  const where = buildWhereClause(config, columns, filters, params);
  if (where.skipped) {
    return skippedEntity(config, where.skipReason);
  }

  const tableSql = quoteIdentifier(config.table);
  const createdAtExpression = buildCreatedAtExpression(columns);

  try {
    const countResult = await client.query(
      `
        SELECT
          count(*)::int AS count,
          min(${createdAtExpression}) AS created_at_min,
          max(${createdAtExpression}) AS created_at_max
        FROM ${tableSql}
        WHERE ${where.whereSql}
      `,
      params,
    );

    const sampleResult = await client.query(
      `
        SELECT
          ${buildIdExpression(config.table, columns)} AS sample_id,
          ${buildLabelExpression(config.table, columns, config.labelColumns, config.entityType)} AS sample_label,
          ${createdAtExpression} AS sample_created_at
        FROM ${tableSql}
        WHERE ${where.whereSql}
        ORDER BY sample_created_at DESC NULLS LAST
        LIMIT 5
      `,
      params,
    );

    const countRow = countResult.rows[0] || {};
    return {
      entityType: config.entityType,
      table: config.table,
      riskLevel: config.riskLevel,
      count: Number(countRow.count || 0),
      sampleIds: sampleResult.rows.map((row) => row.sample_id).filter(Boolean),
      sampleLabels: sampleResult.rows.map((row) => row.sample_label).filter(Boolean),
      createdAtMin: toIsoOrNull(countRow.created_at_min),
      createdAtMax: toIsoOrNull(countRow.created_at_max),
      dependencyWarning: config.dependencyWarning,
      cleanupSupported: false,
      skipped: false,
    };
  } catch (error) {
    return {
      ...skippedEntity(config, 'query_failed'),
      errorCode: error.code || null,
      errorMessage: redactErrorMessage(error.message),
    };
  }
}

function skippedEntity(config, skipReason) {
  return {
    entityType: config.entityType,
    table: config.table,
    riskLevel: config.riskLevel,
    count: 0,
    sampleIds: [],
    sampleLabels: [],
    createdAtMin: null,
    createdAtMax: null,
    dependencyWarning: config.dependencyWarning,
    cleanupSupported: false,
    skipped: true,
    skipReason,
  };
}

function redactErrorMessage(message) {
  if (!message) {
    return null;
  }
  return String(message)
    .replace(process.env.DATABASE_URL || '__never_match_database_url__', '[redacted-database-url]')
    .replace(/password=[^&\s]+/gi, 'password=[redacted]')
    .replace(/token=[^&\s]+/gi, 'token=[redacted]')
    .replace(/secret=[^&\s]+/gi, 'secret=[redacted]');
}

function buildBaseOutput(filters, settings, broadQueryWarnings) {
  return {
    mode: 'inventory-only',
    dryRun: true,
    destructiveCleanupImplemented: false,
    cleanupSupported: false,
    filters,
    environment: {
      nodeEnv: process.env.NODE_ENV || null,
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      databaseUrlRedacted: true,
      sharedRuntime: settings.sharedRuntime,
      strictSharedRuntime: settings.strictSharedRuntime,
      allowBroadInventory: settings.allowBroadInventory,
      inventoryMaxDateRangeDays: settings.inventoryMaxDateRangeDays,
      inventoryMinPrefixLength: settings.inventoryMinPrefixLength,
    },
    warning: INVENTORY_WARNING,
    broadQueryWarnings,
  };
}

async function main() {
  requireDryRun();
  const filters = readFilters();
  const settings = readInventorySettings();
  validateStrictFilters(filters, settings);
  const broadQueryWarnings = buildBroadQueryWarnings(filters, settings);
  requireDatabaseUrl();

  const output = buildBaseOutput(filters, settings, broadQueryWarnings);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });

  try {
    const client = await pool.connect();
    try {
      const entities = [];
      for (const config of ENTITY_CONFIGS) {
        entities.push(await inventoryEntity(client, config, filters));
      }
      console.log(JSON.stringify({ ...output, entities }, null, 2));
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(JSON.stringify({
      ...output,
      error: {
        message: 'Database inventory failed. No cleanup was performed.',
        code: error.code || null,
        detail: redactErrorMessage(error.message),
      },
    }, null, 2));
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    mode: 'inventory-only',
    dryRun: true,
    destructiveCleanupImplemented: false,
    cleanupSupported: false,
    warning: INVENTORY_WARNING,
    error: {
      message: 'Unexpected inventory failure. No cleanup was performed.',
      detail: redactErrorMessage(error.message),
    },
  }, null, 2));
  process.exit(1);
});
