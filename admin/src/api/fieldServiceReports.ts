import { apiRequest, apiRequestEnvelope } from '../lib/apiClient';

export type ServiceStatus = 'in_progress' | 'pending_parts' | 'completed' | 'cancelled';
export type PartStatus = 'planned' | 'used' | 'replaced' | 'returned' | 'cancelled';

export type FieldServiceReport = {
  id: string;
  caseId: string;
  finalAppointmentId?: string | null;
  diagnosisResult?: string | null;
  repairAction?: string | null;
  repairResult?: string | null;
  serviceStatus: ServiceStatus | string;
  engineerNote?: string | null;
  customerNote?: string | null;
  installationChecklist?: Record<string, unknown> | null;
  onsiteStartedAt?: string | null;
  onsiteCompletedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type RawFieldServiceReport = FieldServiceReport & {
  final_appointment_id?: string | null;
};

export type ServicePart = {
  id: string;
  serviceReportId: string;
  partName: string;
  partNo?: string | null;
  quantity: number;
  oldSerialNo?: string | null;
  newSerialNo?: string | null;
  partStatus: PartStatus | string;
  replacedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type CreateServiceReportPayload = {
  diagnosisResult?: string;
  repairAction?: string;
  repairResult?: string;
  engineerNote?: string;
  customerNote?: string;
  onsiteStartedAt?: string;
  finalAppointmentId?: string | null;
};

export type UpdateServiceReportPayload = CreateServiceReportPayload & {
  serviceStatus?: ServiceStatus;
  onsiteCompletedAt?: string;
};

export type ListServicePartsParams = {
  limit?: number;
  offset?: number;
};

export type PaginatedServiceParts = {
  data: ServicePart[];
  pagination: {
    limit: number;
    offset: number;
    total?: number;
  };
};

export type CreateServicePartPayload = {
  partName: string;
  partNo?: string;
  quantity?: number;
  oldSerialNo?: string;
  newSerialNo?: string;
  partStatus?: PartStatus;
  replacedAt?: string;
};

export type UpdateServicePartPayload = {
  partName?: string;
  partNo?: string;
  quantity?: number;
  oldSerialNo?: string;
  newSerialNo?: string;
  partStatus?: PartStatus;
  replacedAt?: string;
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

function sanitizeFieldServiceReport(report: FieldServiceReport): FieldServiceReport {
  assertNoSensitiveFields(report as unknown as Record<string, unknown>, 'Field service report');
  const rawReport = report as RawFieldServiceReport;

  return {
    id: report.id,
    caseId: report.caseId,
    finalAppointmentId: report.finalAppointmentId ?? rawReport.final_appointment_id,
    diagnosisResult: report.diagnosisResult,
    repairAction: report.repairAction,
    repairResult: report.repairResult,
    serviceStatus: report.serviceStatus,
    engineerNote: report.engineerNote,
    customerNote: report.customerNote,
    installationChecklist: report.installationChecklist,
    onsiteStartedAt: report.onsiteStartedAt,
    onsiteCompletedAt: report.onsiteCompletedAt,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt
  };
}

function sanitizeServicePart(part: ServicePart): ServicePart {
  assertNoSensitiveFields(part as unknown as Record<string, unknown>, 'Service part');

  return {
    id: part.id,
    serviceReportId: part.serviceReportId,
    partName: part.partName,
    partNo: part.partNo,
    quantity: part.quantity,
    oldSerialNo: part.oldSerialNo,
    newSerialNo: part.newSerialNo,
    partStatus: part.partStatus,
    replacedAt: part.replacedAt,
    createdAt: part.createdAt,
    updatedAt: part.updatedAt
  };
}

export async function getCaseServiceReport(caseId: string) {
  const report = await apiRequest<FieldServiceReport>(`/api/v1/admin/cases/${caseId}/service-report`);
  return sanitizeFieldServiceReport(report);
}

export async function createCaseServiceReport(caseId: string, payload: CreateServiceReportPayload) {
  const report = await apiRequest<FieldServiceReport>(`/api/v1/admin/cases/${caseId}/service-report`, {
    method: 'POST',
    body: payload
  });
  return sanitizeFieldServiceReport(report);
}

export async function updateServiceReport(reportId: string, payload: UpdateServiceReportPayload) {
  const report = await apiRequest<FieldServiceReport>(`/api/v1/admin/service-reports/${reportId}`, {
    method: 'PATCH',
    body: payload
  });
  return sanitizeFieldServiceReport(report);
}

export async function listServiceParts(
  reportId: string,
  params: ListServicePartsParams = {}
): Promise<PaginatedServiceParts> {
  const query = buildQuery({
    limit: params.limit ?? 50,
    offset: params.offset ?? 0
  });
  const envelope = await apiRequestEnvelope<ServicePart[]>(`/api/v1/admin/service-reports/${reportId}/parts${query}`);

  return {
    data: (envelope.data || []).map(sanitizeServicePart),
    pagination: {
      limit: envelope.pagination?.limit ?? params.limit ?? 50,
      offset: envelope.pagination?.offset ?? params.offset ?? 0,
      total: envelope.pagination?.total
    }
  };
}

export async function addServicePart(reportId: string, payload: CreateServicePartPayload) {
  const part = await apiRequest<ServicePart>(`/api/v1/admin/service-reports/${reportId}/parts`, {
    method: 'POST',
    body: payload
  });
  return sanitizeServicePart(part);
}

export async function updateServicePart(partId: string, payload: UpdateServicePartPayload) {
  const part = await apiRequest<ServicePart>(`/api/v1/admin/service-parts/${partId}`, {
    method: 'PATCH',
    body: payload
  });
  return sanitizeServicePart(part);
}

export function deleteServicePart(partId: string) {
  return apiRequest<ServicePart>(`/api/v1/admin/service-parts/${partId}`, {
    method: 'DELETE'
  }).then(sanitizeServicePart);
}
