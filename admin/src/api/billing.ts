import { apiRequest, apiRequestEnvelope } from '../lib/apiClient';

export type BillingStatus = 'draft' | 'pending_review' | 'approved' | 'submitted' | 'settled' | 'cancelled';
export type SettlementTargetType = 'engineer' | 'manufacturer' | 'internal' | 'vendor' | 'distributor' | 'partner' | 'subcontractor';
export type SettlementStatus = 'pending' | 'submitted' | 'completed' | 'rejected';

export type BillingRecord = {
  id: string;
  caseId: string;
  fieldServiceReportId?: string | null;
  laborAmount: number;
  partsAmount: number;
  transportAmount: number;
  additionalAmount: number;
  totalAmount: number;
  warrantyAmount: number;
  customerChargeAmount: number;
  manufacturerClaimAmount: number;
  billingStatus: BillingStatus | string;
  billingNote?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type Settlement = {
  id: string;
  billingRecordId: string;
  settlementTargetType: SettlementTargetType | string;
  settlementTargetId?: string | null;
  settlementAmount: number;
  settlementStatus: SettlementStatus | string;
  settlementRuleCode?: string | null;
  settlementPolicyVersion?: string | null;
  settlementMetadata?: Record<string, unknown> | null;
  settlementNote?: string | null;
  settledAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type CreateBillingPayload = {
  fieldServiceReportId?: string;
  laborAmount?: number;
  partsAmount?: number;
  transportAmount?: number;
  additionalAmount?: number;
  customerChargeAmount?: number;
  manufacturerClaimAmount?: number;
  warrantyAmount?: number;
  billingStatus?: BillingStatus;
  billingNote?: string;
};

export type UpdateBillingPayload = CreateBillingPayload;

export type ListSettlementsParams = {
  limit?: number;
  offset?: number;
};

export type PaginatedSettlements = {
  data: Settlement[];
  pagination: {
    limit: number;
    offset: number;
    total?: number;
  };
};

export type CreateSettlementPayload = {
  settlementTargetType: SettlementTargetType;
  settlementTargetId?: string;
  settlementAmount: number;
  settlementStatus?: SettlementStatus;
  settlementNote?: string;
};

export type UpdateSettlementPayload = {
  settlementTargetType?: SettlementTargetType;
  settlementTargetId?: string;
  settlementAmount?: number;
  settlementStatus?: SettlementStatus;
  settlementNote?: string;
};

const SENSITIVE_KEYS = [
  'password',
  'password_hash',
  'passwordHash',
  'token',
  'accessToken',
  'channelSecret',
  'channelAccessToken',
  'secret',
  'apiKey',
  'DATABASE_URL',
  'JWT_SECRET',
  'OPENAI_API_KEY',
  'R2_SECRET_ACCESS_KEY'
];

function buildQuery(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function assertNoSensitiveFields(entity: Record<string, unknown>, label: string) {
  const foundKeys = SENSITIVE_KEYS.filter((key) => key in entity);

  if (foundKeys.length > 0 && import.meta.env.DEV) {
    console.warn(`${label} API response included sensitive field keys. The frontend ignored them.`);
  }
}

function sanitizeBilling(record: BillingRecord): BillingRecord {
  assertNoSensitiveFields(record as unknown as Record<string, unknown>, 'Billing');

  return {
    id: record.id,
    caseId: record.caseId,
    fieldServiceReportId: record.fieldServiceReportId,
    laborAmount: Number(record.laborAmount || 0),
    partsAmount: Number(record.partsAmount || 0),
    transportAmount: Number(record.transportAmount || 0),
    additionalAmount: Number(record.additionalAmount || 0),
    totalAmount: Number(record.totalAmount || 0),
    warrantyAmount: Number(record.warrantyAmount || 0),
    customerChargeAmount: Number(record.customerChargeAmount || 0),
    manufacturerClaimAmount: Number(record.manufacturerClaimAmount || 0),
    billingStatus: record.billingStatus,
    billingNote: record.billingNote,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function sanitizeSettlement(settlement: Settlement): Settlement {
  assertNoSensitiveFields(settlement as unknown as Record<string, unknown>, 'Settlement');

  return {
    id: settlement.id,
    billingRecordId: settlement.billingRecordId,
    settlementTargetType: settlement.settlementTargetType,
    settlementTargetId: settlement.settlementTargetId,
    settlementAmount: Number(settlement.settlementAmount || 0),
    settlementStatus: settlement.settlementStatus,
    settlementRuleCode: settlement.settlementRuleCode,
    settlementPolicyVersion: settlement.settlementPolicyVersion,
    settlementMetadata: settlement.settlementMetadata,
    settlementNote: settlement.settlementNote,
    settledAt: settlement.settledAt,
    createdAt: settlement.createdAt,
    updatedAt: settlement.updatedAt
  };
}

export async function getCaseBilling(caseId: string) {
  const billing = await apiRequest<BillingRecord>(`/api/v1/admin/cases/${caseId}/billing`);
  return sanitizeBilling(billing);
}

export async function createCaseBilling(caseId: string, payload: CreateBillingPayload) {
  const billing = await apiRequest<BillingRecord>(`/api/v1/admin/cases/${caseId}/billing`, {
    method: 'POST',
    body: payload
  });
  return sanitizeBilling(billing);
}

export async function updateBilling(billingId: string, payload: UpdateBillingPayload) {
  const billing = await apiRequest<BillingRecord>(`/api/v1/admin/billing/${billingId}`, {
    method: 'PATCH',
    body: payload
  });
  return sanitizeBilling(billing);
}

export async function listBillingSettlements(
  billingId: string,
  params: ListSettlementsParams = {}
): Promise<PaginatedSettlements> {
  const query = buildQuery({
    limit: params.limit ?? 50,
    offset: params.offset ?? 0
  });
  const envelope = await apiRequestEnvelope<Settlement[]>(`/api/v1/admin/billing/${billingId}/settlements${query}`);

  return {
    data: (envelope.data || []).map(sanitizeSettlement),
    pagination: {
      limit: envelope.pagination?.limit ?? params.limit ?? 50,
      offset: envelope.pagination?.offset ?? params.offset ?? 0,
      total: envelope.pagination?.total
    }
  };
}

export async function createBillingSettlement(billingId: string, payload: CreateSettlementPayload) {
  const settlement = await apiRequest<Settlement>(`/api/v1/admin/billing/${billingId}/settlements`, {
    method: 'POST',
    body: payload
  });
  return sanitizeSettlement(settlement);
}

export async function updateSettlement(settlementId: string, payload: UpdateSettlementPayload) {
  const settlement = await apiRequest<Settlement>(`/api/v1/admin/settlements/${settlementId}`, {
    method: 'PATCH',
    body: payload
  });
  return sanitizeSettlement(settlement);
}
