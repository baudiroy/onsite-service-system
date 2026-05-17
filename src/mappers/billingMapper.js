function toIso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function toNumber(value) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function toBillingRecordDTO(row) {
  if (!row) return null;

  return {
    id: row.id,
    caseId: row.case_id,
    fieldServiceReportId: row.field_service_report_id,
    laborAmount: toNumber(row.labor_amount),
    partsAmount: toNumber(row.parts_amount),
    transportAmount: toNumber(row.transport_amount),
    additionalAmount: toNumber(row.additional_amount),
    totalAmount: toNumber(row.total_amount),
    warrantyAmount: toNumber(row.warranty_amount),
    customerChargeAmount: toNumber(row.customer_charge_amount),
    manufacturerClaimAmount: toNumber(row.manufacturer_claim_amount),
    billingStatus: row.billing_status,
    billingNote: row.billing_note,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
}

function toSettlementDTO(row) {
  if (!row) return null;

  return {
    id: row.id,
    billingRecordId: row.billing_record_id,
    settlementTargetType: row.settlement_target_type,
    settlementTargetId: row.settlement_target_id,
    settlementAmount: toNumber(row.settlement_amount),
    settlementStatus: row.settlement_status,
    settlementRuleCode: row.settlement_rule_code,
    settlementPolicyVersion: row.settlement_policy_version,
    settlementMetadata: row.settlement_metadata,
    settlementNote: row.settlement_note,
    settledAt: toIso(row.settled_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
}

module.exports = {
  toBillingRecordDTO,
  toSettlementDTO
};
