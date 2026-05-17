import { apiRequestEnvelope } from '../lib/apiClient';

export type AuditLog = {
  id: string;
  actorUserId?: string | null;
  actorType?: string | null;
  actorDisplayName?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  organizationId?: string | null;
  metadata?: Record<string, unknown> | null;
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt?: string | null;
};

export type ListAuditLogsParams = {
  actorUserId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  organizationId?: string;
  requestId?: string;
  createdFrom?: string;
  createdTo?: string;
  limit?: number;
  offset?: number;
  sort?: 'createdAtDesc' | 'createdAtAsc';
};

export type PaginatedAuditLogs = {
  data: AuditLog[];
  pagination: {
    limit: number;
    offset: number;
    total?: number;
  };
};

const SENSITIVE_METADATA_KEYS = [
  'password',
  'password_hash',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'channelSecret',
  'channelAccessToken',
  'secret',
  'apiKey',
  'lineUserId',
  'rawLineUserId',
  'line_user_id',
  'mobile',
  'customerMobile',
  'customer_mobile',
  'tel',
  'phone',
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function warnIfSensitiveMetadataKeys(metadata: unknown) {
  if (!isRecord(metadata)) return;

  const foundKeys = SENSITIVE_METADATA_KEYS.filter((key) => key in metadata);
  if (foundKeys.length > 0 && import.meta.env.DEV) {
    console.warn(`Audit log metadata included sensitive field keys. The frontend ignored these keys: ${foundKeys.join(', ')}`);
  }
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function sanitizeMetadata(metadata: unknown) {
  if (!isRecord(metadata)) return null;
  warnIfSensitiveMetadataKeys(metadata);
  return metadata;
}

function sanitizeAuditLog(auditLog: AuditLog): AuditLog {
  const metadata = sanitizeMetadata(auditLog.metadata);

  return {
    id: auditLog.id,
    actorUserId: auditLog.actorUserId,
    actorType: auditLog.actorType,
    actorDisplayName: auditLog.actorDisplayName,
    action: auditLog.action,
    entityType: auditLog.entityType,
    entityId: auditLog.entityId,
    organizationId: auditLog.organizationId || readString(metadata?.organizationId) || readString(metadata?.organization_id),
    metadata,
    requestId: auditLog.requestId || readString(metadata?.requestId),
    ipAddress: auditLog.ipAddress,
    userAgent: auditLog.userAgent,
    createdAt: auditLog.createdAt
  };
}

export async function listAuditLogs(params: ListAuditLogsParams = {}): Promise<PaginatedAuditLogs> {
  const query = buildQuery({
    actorUserId: params.actorUserId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    organizationId: params.organizationId,
    requestId: params.requestId,
    createdFrom: params.createdFrom,
    createdTo: params.createdTo,
    limit: params.limit ?? 50,
    offset: params.offset ?? 0,
    sort: params.sort ?? 'createdAtDesc'
  });

  const envelope = await apiRequestEnvelope<AuditLog[]>(`/api/v1/admin/audit-logs${query}`);

  return {
    data: (envelope.data || []).map(sanitizeAuditLog),
    pagination: {
      limit: envelope.pagination?.limit ?? params.limit ?? 50,
      offset: envelope.pagination?.offset ?? params.offset ?? 0,
      total: envelope.pagination?.total
    }
  };
}

export function getSafeMetadataKeys(metadata?: Record<string, unknown> | null) {
  if (!metadata) return [];
  return Object.keys(metadata).filter((key) => !SENSITIVE_METADATA_KEYS.includes(key));
}
