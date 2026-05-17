import { apiRequest, apiRequestEnvelope } from '../lib/apiClient';

export type CaseStatus =
  | 'draft'
  | 'pending_customer'
  | 'submitted'
  | 'reviewing'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'dispatch_pending'
  | 'assigned'
  | 'scheduled'
  | 'on_site'
  | 'completed'
  | 'closed';

export type CasePriority = 'low' | 'normal' | 'high' | 'urgent' | 'vip';
export type WarrantyStatus = 'unknown' | 'pending_review' | 'in_warranty' | 'out_of_warranty';
export type CaseType = 'repair' | 'installation' | 'maintenance' | 'inspection' | 'return' | 'warranty' | 'other';
export type CaseSource =
  | 'line'
  | 'website'
  | 'admin'
  | 'api'
  | 'migration'
  | 'phone'
  | 'whatsapp'
  | 'facebook'
  | 'instagram'
  | 'email';

export type CustomerSummary = {
  name?: string | null;
  mobile?: string | null;
  tel?: string | null;
  city?: string | null;
  address?: string | null;
};

export type OrganizationSummary = {
  code?: string | null;
  name?: string | null;
};

export type AdminCase = {
  id: string;
  organizationId?: string | null;
  organizationSummary?: OrganizationSummary | null;
  intakeLineChannelId?: string | null;
  caseNo: string;
  customerId: string;
  customerSummary?: CustomerSummary | null;
  status: CaseStatus;
  priority: CasePriority;
  warrantyStatus: WarrantyStatus;
  appointmentStatus?: string | null;
  completionStatus?: string | null;
  source: CaseSource;
  brand: string;
  caseType: CaseType;
  productType: string;
  modelNo: string;
  serialNo?: string | null;
  invoiceDate?: string | null;
  problemDescription: string;
  preferredVisitTime?: string | null;
  serviceRegion?: string | null;
  dispatchUnitId?: string | null;
  dispatchAssignmentSource?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  acceptedAt?: string | null;
  rejectedAt?: string | null;
  cancelledAt?: string | null;
  closedAt?: string | null;
  scheduledAt?: string | null;
  completedAt?: string | null;
  lastCustomerMessageAt?: string | null;
  lastInternalActivityAt?: string | null;
};

export type ListCasesParams = {
  organizationId?: string;
  status?: CaseStatus | '';
  priority?: CasePriority | '';
  caseType?: CaseType | '';
  source?: CaseSource | '';
  customerId?: string;
  caseNo?: string;
  createdFrom?: string;
  createdTo?: string;
  limit?: number;
  offset?: number;
  sort?:
    | 'createdAtDesc'
    | 'createdAtAsc'
    | 'submittedAtDesc'
    | 'prioritySubmittedAt'
    | 'lastCustomerMessageAtDesc'
    | 'lastInternalActivityAtDesc'
    | 'scheduledAtAsc';
};

export type PaginatedCases = {
  data: AdminCase[];
  pagination: {
    limit: number;
    offset: number;
    total?: number;
  };
};

export type CreateCasePayload = {
  organizationId?: string;
  customer:
    | { customerId: string }
    | {
        customerName: string;
        mobile: string;
        tel?: string;
        city: string;
        address: string;
        source?: CaseSource;
      };
  case: {
    source?: CaseSource;
    brand: string;
    caseType: CaseType;
    productType: string;
    modelNo: string;
    serialNo?: string;
    invoiceDate?: string;
    problemDescription: string;
    preferredVisitTime?: string;
    priority?: CasePriority;
    warrantyStatus?: WarrantyStatus;
    serviceRegion?: string;
  };
};

export type UpdateCasePayload = Partial<Pick<
  AdminCase,
  | 'priority'
  | 'warrantyStatus'
  | 'brand'
  | 'caseType'
  | 'productType'
  | 'modelNo'
  | 'serialNo'
  | 'invoiceDate'
  | 'problemDescription'
  | 'preferredVisitTime'
  | 'serviceRegion'
>>;

export type CaseWorkflowAction = 'submit' | 'review' | 'accept' | 'reject' | 'cancel' | 'close';

export type OptionalNoteWorkflowPayload = {
  note?: string;
};

export type RequiredReasonWorkflowPayload = {
  reason: string;
  note?: string;
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

function assertNoSensitiveFields(entity: Record<string, unknown>) {
  const foundKeys = SENSITIVE_KEYS.filter((key) => key in entity);

  if (foundKeys.length > 0 && import.meta.env.DEV) {
    console.warn('Case API response included sensitive field keys. The frontend ignored them.');
  }
}

function sanitizeCase(adminCase: AdminCase): AdminCase {
  assertNoSensitiveFields(adminCase as unknown as Record<string, unknown>);

  return {
    id: adminCase.id,
    organizationId: adminCase.organizationId,
    organizationSummary: adminCase.organizationSummary || null,
    intakeLineChannelId: adminCase.intakeLineChannelId,
    caseNo: adminCase.caseNo,
    customerId: adminCase.customerId,
    customerSummary: adminCase.customerSummary || null,
    status: adminCase.status,
    priority: adminCase.priority,
    warrantyStatus: adminCase.warrantyStatus,
    appointmentStatus: adminCase.appointmentStatus,
    completionStatus: adminCase.completionStatus,
    source: adminCase.source,
    brand: adminCase.brand,
    caseType: adminCase.caseType,
    productType: adminCase.productType,
    modelNo: adminCase.modelNo,
    serialNo: adminCase.serialNo,
    invoiceDate: adminCase.invoiceDate,
    problemDescription: adminCase.problemDescription,
    preferredVisitTime: adminCase.preferredVisitTime,
    serviceRegion: adminCase.serviceRegion,
    dispatchUnitId: adminCase.dispatchUnitId,
    dispatchAssignmentSource: adminCase.dispatchAssignmentSource,
    createdAt: adminCase.createdAt,
    updatedAt: adminCase.updatedAt,
    submittedAt: adminCase.submittedAt,
    reviewedAt: adminCase.reviewedAt,
    acceptedAt: adminCase.acceptedAt,
    rejectedAt: adminCase.rejectedAt,
    cancelledAt: adminCase.cancelledAt,
    closedAt: adminCase.closedAt,
    scheduledAt: adminCase.scheduledAt,
    completedAt: adminCase.completedAt,
    lastCustomerMessageAt: adminCase.lastCustomerMessageAt,
    lastInternalActivityAt: adminCase.lastInternalActivityAt
  };
}

export async function listCases(params: ListCasesParams = {}): Promise<PaginatedCases> {
  const query = buildQuery({
    organizationId: params.organizationId,
    status: params.status || undefined,
    priority: params.priority || undefined,
    caseType: params.caseType || undefined,
    source: params.source || undefined,
    customerId: params.customerId,
    caseNo: params.caseNo,
    createdFrom: params.createdFrom,
    createdTo: params.createdTo,
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
    sort: params.sort ?? 'createdAtDesc'
  });

  const envelope = await apiRequestEnvelope<AdminCase[]>(`/api/v1/admin/cases${query}`);

  return {
    data: (envelope.data || []).map(sanitizeCase),
    pagination: {
      limit: envelope.pagination?.limit ?? params.limit ?? 20,
      offset: envelope.pagination?.offset ?? params.offset ?? 0,
      total: envelope.pagination?.total
    }
  };
}

export async function getCase(caseId: string) {
  const adminCase = await apiRequest<AdminCase>(`/api/v1/admin/cases/${caseId}`);
  return sanitizeCase(adminCase);
}

export async function createCase(payload: CreateCasePayload) {
  const adminCase = await apiRequest<AdminCase>('/api/v1/admin/cases', {
    method: 'POST',
    body: payload
  });
  return sanitizeCase(adminCase);
}

export async function updateCase(caseId: string, payload: UpdateCasePayload) {
  const { status: _status, ...safePayload } = payload as UpdateCasePayload & { status?: never };
  const adminCase = await apiRequest<AdminCase>(`/api/v1/admin/cases/${caseId}`, {
    method: 'PATCH',
    body: safePayload
  });
  return sanitizeCase(adminCase);
}

function workflowRequest(caseId: string, action: CaseWorkflowAction, payload: OptionalNoteWorkflowPayload | RequiredReasonWorkflowPayload = {}) {
  return apiRequest<AdminCase>(`/api/v1/admin/cases/${caseId}/${action}`, {
    method: 'POST',
    body: payload
  }).then(sanitizeCase);
}

export function submitCase(caseId: string, payload: OptionalNoteWorkflowPayload = {}) {
  return workflowRequest(caseId, 'submit', payload);
}

export function reviewCase(caseId: string, payload: OptionalNoteWorkflowPayload = {}) {
  return workflowRequest(caseId, 'review', payload);
}

export function acceptCase(caseId: string, payload: OptionalNoteWorkflowPayload = {}) {
  return workflowRequest(caseId, 'accept', payload);
}

export function rejectCase(caseId: string, payload: RequiredReasonWorkflowPayload) {
  return workflowRequest(caseId, 'reject', payload);
}

export function cancelCase(caseId: string, payload: RequiredReasonWorkflowPayload) {
  return workflowRequest(caseId, 'cancel', payload);
}

export function closeCase(caseId: string, payload: OptionalNoteWorkflowPayload = {}) {
  return workflowRequest(caseId, 'close', payload);
}
