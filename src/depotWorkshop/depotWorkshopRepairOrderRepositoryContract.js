'use strict';

const DEPOT_WORKSHOP_REPAIR_ORDER_REPOSITORY_CONTRACT_KIND = 'depot_workshop.repair_order_repository_contract';
const DEPOT_WORKSHOP_ASSIGNMENT_INTENT_WRITE_ACTION = 'depot_workshop.assignment_intent.write';

const FORBIDDEN_REPOSITORY_CONTRACT_KEYS = new Set([
  'aiOutput',
  'ai_output',
  'aiProviderOutput',
  'ai_provider_output',
  'app',
  'billing',
  'billingInternals',
  'billing_internals',
  'completionReport',
  'completion_report',
  'completionReportId',
  'completion_report_id',
  'customerAddress',
  'customer_address',
  'customerContact',
  'customer_contact',
  'customerPhoto',
  'customer_photo',
  'customerPhone',
  'customer_phone',
  'customerSignature',
  'customer_signature',
  'DATABASE_URL',
  'db',
  'dbClient',
  'db_client',
  'execute',
  'fieldServiceReport',
  'field_service_report',
  'fieldServiceReportId',
  'field_service_report_id',
  'finalAppointmentId',
  'final_appointment_id',
  'invoice',
  'migration',
  'openAiTrace',
  'openai_trace',
  'password',
  'payment',
  'providerPayload',
  'provider_payload',
  'query',
  'rawAuditPayload',
  'raw_audit_payload',
  'rawCustomerData',
  'raw_customer_data',
  'rawDbRow',
  'raw_db_row',
  'rawError',
  'raw_error',
  'rawRepositoryError',
  'raw_repository_error',
  'rawRows',
  'raw_rows',
  'secret',
  'settlement',
  'sql',
  'stack',
  'token',
  'transaction',
  'vectorTrace',
  'vector_trace',
]);

const UNSAFE_REPOSITORY_CONTRACT_TEXT_PATTERNS = Object.freeze([
  /database[_\s-]*url/i,
  /jwt[_\s-]*secret/i,
  /provider\s*payload/i,
  /\braw(?:\s|_|-)*(?:audit|customer|db|error|payload|phone|repository|row|rows)?\b/i,
  /\b(?:sql|stack|token|secret|password)\b/i,
  /\b(?:billing|invoice|charge|settlement|payment)\b/i,
  /\b(?:openai|ai\s*output|rag|vector)\b/i,
  /\b(?:final\s*appointment|field\s*service\s*report|completion\s*report|fsr)\b/i,
  /\b(?:phone|tel|address|signature|photo)\b/i,
]);

const SAFE_COMMAND_FIELDS = Object.freeze([
  'action',
  'organizationId',
  'tenantId',
  'caseId',
  'depotIntakeId',
  'repairOrderId',
  'brandId',
  'serviceProviderId',
  'workshopId',
  'workshopTeamId',
  'assignedTechnicianId',
  'subcontractorOrganizationId',
  'assignmentRelationship',
  'actorId',
  'actorRole',
  'depotStatus',
  'targetDepotStatus',
  'requestId',
]);

const SAFE_RESULT_FIELDS = Object.freeze([
  'ok',
  'status',
  'reasonCode',
  'repositoryKind',
  'repairOrderReference',
  'organizationId',
  'tenantId',
  'caseId',
  'depotIntakeId',
  'repairOrderId',
  'written',
  'requestId',
]);

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function compactRecord(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
}

function normalizedFieldName(value) {
  return String(value || '').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
}

function fieldIsForbidden(fieldName) {
  return FORBIDDEN_REPOSITORY_CONTRACT_KEYS.has(fieldName)
    || FORBIDDEN_REPOSITORY_CONTRACT_KEYS.has(normalizedFieldName(fieldName))
    || normalizedFieldName(fieldName).startsWith('raw');
}

function safeScalar(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed || UNSAFE_REPOSITORY_CONTRACT_TEXT_PATTERNS.some((pattern) => pattern.test(trimmed))) {
      return undefined;
    }

    return trimmed;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  return undefined;
}

function firstSafeValue(...values) {
  return values.map(safeScalar).find((value) => value !== undefined);
}

function hasForbiddenInput(value) {
  if (Array.isArray(value)) {
    return value.some((item) => hasForbiddenInput(item));
  }

  if (!isPlainObject(value)) {
    return false;
  }

  return Object.entries(value).some(([fieldName, fieldValue]) => (
    fieldIsForbidden(fieldName)
    || (typeof fieldValue === 'string' && safeScalar(fieldValue) === undefined && fieldValue.trim().length > 0)
    || hasForbiddenInput(fieldValue)
  ));
}

function safeObject(value) {
  if (!isPlainObject(value) || hasForbiddenInput(value)) {
    return undefined;
  }

  const result = {};

  for (const [fieldName, fieldValue] of Object.entries(value)) {
    if (fieldIsForbidden(fieldName)) {
      return undefined;
    }

    if (Array.isArray(fieldValue)) {
      const safeArray = fieldValue
        .map((item) => (isPlainObject(item) ? safeObject(item) : safeScalar(item)))
        .filter((item) => item !== undefined);

      if (safeArray.length > 0) {
        result[fieldName] = safeArray;
      }

      continue;
    }

    if (isPlainObject(fieldValue)) {
      const nested = safeObject(fieldValue);

      if (nested !== undefined && Object.keys(nested).length > 0) {
        result[fieldName] = nested;
      }

      continue;
    }

    const scalar = safeScalar(fieldValue);

    if (scalar !== undefined) {
      result[fieldName] = scalar;
    }
  }

  return result;
}

function buildDepotWorkshopRepairOrderRepositorySafeFailure(reasonCode, details = {}) {
  const source = isPlainObject(details) ? details : {};

  return compactRecord({
    ok: false,
    status: 'rejected',
    reasonCode: safeScalar(reasonCode) || 'depot_workshop_repair_order_repository_contract_rejected',
    repositoryKind: DEPOT_WORKSHOP_REPAIR_ORDER_REPOSITORY_CONTRACT_KIND,
    written: false,
    requestId: firstSafeValue(source.requestId, source.request_id),
  });
}

function commandEnvelopeFrom(input = {}) {
  if (!isPlainObject(input)) {
    return undefined;
  }

  if (isPlainObject(input.command)) {
    return input.command;
  }

  return input;
}

function safeCommandFrom(command = {}) {
  if (!isPlainObject(command)) {
    return undefined;
  }

  const result = {};

  for (const fieldName of SAFE_COMMAND_FIELDS) {
    const value = safeScalar(command[fieldName]);

    if (value !== undefined) {
      result[fieldName] = value;
    }
  }

  return compactRecord(result);
}

function commandActionFrom(input = {}, command = {}) {
  return firstSafeValue(input.action, command.action);
}

function normalizeDepotWorkshopRepairOrderRepositoryWriteCommand(input = {}) {
  if (!isPlainObject(input)) {
    return buildDepotWorkshopRepairOrderRepositorySafeFailure(
      'depot_workshop_repair_order_repository_command_plain_object_required',
    );
  }

  if (input.ok !== true || hasForbiddenInput(input)) {
    return buildDepotWorkshopRepairOrderRepositorySafeFailure(
      'depot_workshop_repair_order_repository_command_rejected',
      input,
    );
  }

  const command = safeCommandFrom(commandEnvelopeFrom(input));
  const action = commandActionFrom(input, command);

  if (action !== DEPOT_WORKSHOP_ASSIGNMENT_INTENT_WRITE_ACTION) {
    return buildDepotWorkshopRepairOrderRepositorySafeFailure(
      'depot_workshop_repair_order_repository_action_required',
      command,
    );
  }

  if (!command.organizationId) {
    return buildDepotWorkshopRepairOrderRepositorySafeFailure('organization_id_required', command);
  }

  if (!command.caseId) {
    return buildDepotWorkshopRepairOrderRepositorySafeFailure('case_id_required', command);
  }

  if (!command.depotIntakeId && !command.repairOrderId) {
    return buildDepotWorkshopRepairOrderRepositorySafeFailure(
      'repair_order_source_reference_required',
      command,
    );
  }

  const auditIntent = safeObject(input.auditIntent);
  const customerProjectionPreview = safeObject(input.customerProjectionPreview);

  if ((input.auditIntent && !auditIntent) || (input.customerProjectionPreview && !customerProjectionPreview)) {
    return buildDepotWorkshopRepairOrderRepositorySafeFailure(
      'depot_workshop_repair_order_repository_projection_or_audit_rejected',
      command,
    );
  }

  return compactRecord({
    ok: true,
    status: 'ready',
    reasonCode: 'depot_workshop_repair_order_repository_write_command_normalized',
    repositoryKind: DEPOT_WORKSHOP_REPAIR_ORDER_REPOSITORY_CONTRACT_KIND,
    action: DEPOT_WORKSHOP_ASSIGNMENT_INTENT_WRITE_ACTION,
    command: {
      ...command,
      action: DEPOT_WORKSHOP_ASSIGNMENT_INTENT_WRITE_ACTION,
    },
    auditIntent: auditIntent ? { ...auditIntent } : undefined,
    customerProjectionPreview: customerProjectionPreview ? { ...customerProjectionPreview } : undefined,
    written: false,
    requestId: command.requestId,
  });
}

function resultSourceFrom(input = {}) {
  if (!isPlainObject(input)) {
    return {};
  }

  if (isPlainObject(input.result)) {
    return input.result;
  }

  return input;
}

function trustedScopeFrom(input = {}) {
  if (!isPlainObject(input)) {
    return {};
  }

  return isPlainObject(input.trustedScope) ? input.trustedScope : {};
}

function resultScopeMatches(result = {}, trustedScope = {}) {
  if (!isPlainObject(trustedScope) || Object.keys(trustedScope).length === 0) {
    return true;
  }

  const expectedOrganizationId = firstSafeValue(trustedScope.organizationId, trustedScope.organization_id);
  const expectedTenantId = firstSafeValue(trustedScope.tenantId, trustedScope.tenant_id);
  const expectedCaseId = firstSafeValue(trustedScope.caseId, trustedScope.case_id);
  const expectedDepotIntakeId = firstSafeValue(trustedScope.depotIntakeId, trustedScope.depot_intake_id);
  const expectedRepairOrderId = firstSafeValue(trustedScope.repairOrderId, trustedScope.repair_order_id);

  if (expectedOrganizationId && result.organizationId !== expectedOrganizationId) {
    return false;
  }

  if (expectedTenantId && result.tenantId !== expectedTenantId) {
    return false;
  }

  if (expectedCaseId && result.caseId !== expectedCaseId) {
    return false;
  }

  if (expectedDepotIntakeId && result.depotIntakeId && result.depotIntakeId !== expectedDepotIntakeId) {
    return false;
  }

  if (expectedRepairOrderId && result.repairOrderId && result.repairOrderId !== expectedRepairOrderId) {
    return false;
  }

  return true;
}

function safeResultFrom(input = {}) {
  const source = resultSourceFrom(input);
  const result = {};

  for (const fieldName of SAFE_RESULT_FIELDS) {
    if (fieldName === 'ok') {
      result.ok = source.ok === true;
      continue;
    }

    if (fieldName === 'written') {
      result.written = source.written === true;
      continue;
    }

    const value = safeScalar(source[fieldName]);

    if (value !== undefined) {
      result[fieldName] = value;
    }
  }

  result.repositoryKind = DEPOT_WORKSHOP_REPAIR_ORDER_REPOSITORY_CONTRACT_KIND;
  result.repairOrderReference = firstSafeValue(
    source.repairOrderReference,
    source.repair_order_reference,
    source.customerRepairReference,
    source.customer_repair_reference,
    source.repairOrderId,
    source.repair_order_id,
    source.depotIntakeId,
    source.depot_intake_id,
  );
  result.organizationId = firstSafeValue(source.organizationId, source.organization_id);
  result.tenantId = firstSafeValue(source.tenantId, source.tenant_id);
  result.caseId = firstSafeValue(source.caseId, source.case_id);
  result.depotIntakeId = firstSafeValue(source.depotIntakeId, source.depot_intake_id, source.draftId, source.draft_id);
  result.repairOrderId = firstSafeValue(source.repairOrderId, source.repair_order_id);
  result.requestId = firstSafeValue(source.requestId, source.request_id);

  return compactRecord(result);
}

function normalizeDepotWorkshopRepairOrderRepositoryResult(input = {}) {
  if (!isPlainObject(input) || hasForbiddenInput(input)) {
    return buildDepotWorkshopRepairOrderRepositorySafeFailure(
      'depot_workshop_repair_order_repository_result_rejected',
      input,
    );
  }

  const result = safeResultFrom(input);

  if (result.ok !== true || !result.organizationId || !result.caseId || (!result.depotIntakeId && !result.repairOrderId)) {
    return buildDepotWorkshopRepairOrderRepositorySafeFailure(
      'depot_workshop_repair_order_repository_result_rejected',
      result,
    );
  }

  if (!resultScopeMatches(result, trustedScopeFrom(input))) {
    return buildDepotWorkshopRepairOrderRepositorySafeFailure(
      'depot_workshop_repair_order_repository_result_scope_mismatch',
      result,
    );
  }

  return compactRecord({
    ok: true,
    status: result.status || (result.written ? 'written' : 'accepted'),
    reasonCode: result.reasonCode || 'depot_workshop_repair_order_repository_result_normalized',
    repositoryKind: DEPOT_WORKSHOP_REPAIR_ORDER_REPOSITORY_CONTRACT_KIND,
    repairOrderReference: result.repairOrderReference,
    organizationId: result.organizationId,
    tenantId: result.tenantId,
    caseId: result.caseId,
    depotIntakeId: result.depotIntakeId,
    repairOrderId: result.repairOrderId,
    written: result.written === true,
    requestId: result.requestId,
  });
}

module.exports = {
  DEPOT_WORKSHOP_REPAIR_ORDER_REPOSITORY_CONTRACT_KIND,
  buildDepotWorkshopRepairOrderRepositorySafeFailure,
  normalizeDepotWorkshopRepairOrderRepositoryResult,
  normalizeDepotWorkshopRepairOrderRepositoryWriteCommand,
};
