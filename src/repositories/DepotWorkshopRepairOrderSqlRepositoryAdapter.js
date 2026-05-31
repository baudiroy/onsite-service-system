'use strict';

const {
  buildDepotWorkshopRepairOrderRepositorySafeFailure,
  normalizeDepotWorkshopRepairOrderRepositoryResult,
  normalizeDepotWorkshopRepairOrderRepositoryWriteCommand,
} = require('../depotWorkshop/depotWorkshopRepairOrderRepositoryContract');

const DEPOT_WORKSHOP_REPAIR_ORDER_SQL_REPOSITORY_ADAPTER_KIND = 'depot_workshop.repair_order_sql_repository_adapter';
const WRITE_REPAIR_ORDER_QUERY_NAME = 'depotWorkshopWriteRepairOrder';

const WRITE_REPAIR_ORDER_SQL = [
  'INSERT INTO depot_workshop_repair_orders (',
  '  organization_id,',
  '  tenant_id,',
  '  case_id,',
  '  depot_intake_id,',
  '  repair_order_ref,',
  '  depot_status,',
  '  workflow_type,',
  '  brand_id,',
  '  service_provider_id,',
  '  subcontractor_organization_id,',
  '  workshop_id,',
  '  workshop_team_id,',
  '  assigned_technician_id,',
  '  request_id,',
  '  created_by_actor_id,',
  '  updated_by_actor_id,',
  '  metadata_safe,',
  '  customer_projection_safe',
  ') VALUES (',
  '  $1, $2, $3, $4, $5, $6, $7, $8, $9,',
  '  $10, $11, $12, $13, $14, $15, $16, $17::jsonb, $18::jsonb',
  ')',
  'ON CONFLICT (organization_id, repair_order_ref)',
  'DO UPDATE SET',
  '  tenant_id = EXCLUDED.tenant_id,',
  '  depot_status = EXCLUDED.depot_status,',
  '  workshop_id = EXCLUDED.workshop_id,',
  '  workshop_team_id = EXCLUDED.workshop_team_id,',
  '  assigned_technician_id = EXCLUDED.assigned_technician_id,',
  '  updated_by_actor_id = EXCLUDED.updated_by_actor_id,',
  '  updated_at = now(),',
  '  metadata_safe = EXCLUDED.metadata_safe,',
  '  customer_projection_safe = EXCLUDED.customer_projection_safe',
  'RETURNING',
  '  id,',
  '  organization_id,',
  '  tenant_id,',
  '  case_id,',
  '  depot_intake_id,',
  '  repair_order_ref,',
  '  request_id',
].join('\n');

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function stringValue(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return undefined;
}

function compactRecord(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
}

function safeJsonText(value) {
  if (!isPlainObject(value)) {
    return '{}';
  }

  return JSON.stringify(value);
}

function resolveQueryExecutor(dbClient) {
  if (!isPlainObject(dbClient)) {
    return undefined;
  }

  if (typeof dbClient.query === 'function') {
    return dbClient.query.bind(dbClient);
  }

  if (typeof dbClient.execute === 'function') {
    return dbClient.execute.bind(dbClient);
  }

  return undefined;
}

function resultRows(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (isPlainObject(result) && Array.isArray(result.rows)) {
    return result.rows;
  }

  return [];
}

function resultFailed(result) {
  return isPlainObject(result) && (
    result.ok === false
    || result.success === false
    || result.error !== undefined
  );
}

function repairOrderRefFrom(command) {
  return stringValue(command.repairOrderId)
    || stringValue(command.depotIntakeId);
}

function depotStatusFrom(command) {
  return stringValue(command.targetDepotStatus)
    || stringValue(command.depotStatus)
    || 'intake_received';
}

function buildWriteSpec(normalized) {
  const command = normalized.command || {};
  const repairOrderRef = repairOrderRefFrom(command);

  if (!repairOrderRef) {
    return undefined;
  }

  return Object.freeze({
    name: WRITE_REPAIR_ORDER_QUERY_NAME,
    text: WRITE_REPAIR_ORDER_SQL,
    values: Object.freeze([
      command.organizationId,
      command.tenantId || null,
      command.caseId,
      command.depotIntakeId || null,
      repairOrderRef,
      depotStatusFrom(command),
      'depot_workshop_repair',
      command.brandId || null,
      command.serviceProviderId || null,
      command.subcontractorOrganizationId || null,
      command.workshopId || null,
      command.workshopTeamId || null,
      command.assignedTechnicianId || null,
      command.requestId || null,
      command.actorId || null,
      command.actorId || null,
      safeJsonText(normalized.auditIntent),
      safeJsonText(normalized.customerProjectionPreview),
    ]),
  });
}

function rowMatchesScope(row, command) {
  if (!isPlainObject(row)) {
    return false;
  }

  const rowOrganizationId = stringValue(row.organization_id || row.organizationId);
  const rowCaseId = stringValue(row.case_id || row.caseId);
  const rowDepotIntakeId = stringValue(row.depot_intake_id || row.depotIntakeId);
  const rowRepairOrderId = stringValue(row.id || row.repair_order_id || row.repairOrderId);
  const rowRepairOrderRef = stringValue(row.repair_order_ref || row.repairOrderRef);

  if (rowOrganizationId !== command.organizationId || rowCaseId !== command.caseId) {
    return false;
  }

  if (command.depotIntakeId && rowDepotIntakeId && rowDepotIntakeId !== command.depotIntakeId) {
    return false;
  }

  if (command.repairOrderId && rowRepairOrderRef && rowRepairOrderRef !== command.repairOrderId) {
    return false;
  }

  return Boolean(rowRepairOrderId || rowRepairOrderRef || rowDepotIntakeId);
}

function resultFromRow(row, command) {
  return compactRecord({
    ok: true,
    status: 'written',
    reasonCode: 'depot_workshop_repair_order_repository_write_succeeded',
    organizationId: stringValue(row.organization_id || row.organizationId) || command.organizationId,
    tenantId: stringValue(row.tenant_id || row.tenantId) || command.tenantId,
    caseId: stringValue(row.case_id || row.caseId) || command.caseId,
    depotIntakeId: stringValue(row.depot_intake_id || row.depotIntakeId) || command.depotIntakeId,
    repairOrderId: command.repairOrderId || stringValue(row.id || row.repair_order_id || row.repairOrderId),
    repairOrderReference: stringValue(row.repair_order_ref || row.repairOrderRef) || repairOrderRefFrom(command),
    written: true,
    requestId: stringValue(row.request_id || row.requestId) || command.requestId,
  });
}

function safeFailure(reasonCode, context = {}) {
  return buildDepotWorkshopRepairOrderRepositorySafeFailure(reasonCode, context);
}

function normalizeWriteResult(result, normalized) {
  const command = normalized.command || {};

  if (resultFailed(result)) {
    return safeFailure('depot_workshop_repair_order_repository_write_failed', command);
  }

  const [row] = resultRows(result);

  if (!rowMatchesScope(row, command)) {
    return safeFailure('depot_workshop_repair_order_repository_write_result_rejected', command);
  }

  return normalizeDepotWorkshopRepairOrderRepositoryResult({
    result: resultFromRow(row, command),
    trustedScope: command,
  });
}

function createDepotWorkshopRepairOrderSqlRepositoryAdapter(options = {}) {
  const source = isPlainObject(options) ? options : {};
  const dbClient = source.dbClient;
  const query = resolveQueryExecutor(dbClient);

  return {
    kind: DEPOT_WORKSHOP_REPAIR_ORDER_SQL_REPOSITORY_ADAPTER_KIND,

    async writeRepairOrder(input = {}) {
      const normalized = normalizeDepotWorkshopRepairOrderRepositoryWriteCommand(input);

      if (!normalized.ok) {
        return normalized;
      }

      if (typeof query !== 'function') {
        return safeFailure('db_client_required', normalized.command);
      }

      const writeSpec = buildWriteSpec(normalized);

      if (!writeSpec) {
        return safeFailure('repair_order_reference_required', normalized.command);
      }

      try {
        const result = await query(writeSpec);

        return normalizeWriteResult(result, normalized);
      } catch (caught) {
        return safeFailure('depot_workshop_repair_order_repository_write_failed', normalized.command);
      }
    },
  };
}

module.exports = {
  DEPOT_WORKSHOP_REPAIR_ORDER_SQL_REPOSITORY_ADAPTER_KIND,
  WRITE_REPAIR_ORDER_QUERY_NAME,
  createDepotWorkshopRepairOrderSqlRepositoryAdapter,
};
