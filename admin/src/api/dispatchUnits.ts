import { apiRequest, apiRequestEnvelope } from '../lib/apiClient';

export type DispatchUnitStatus = 'active' | 'disabled';

export type DispatchUnit = {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  serviceRegion?: string | null;
  status: DispatchUnitStatus;
  city?: string | null;
  productTypes: string[];
  priority: number;
  routingRules?: Record<string, unknown> | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ListDispatchUnitsParams = {
  organizationId?: string;
  q?: string;
  status?: DispatchUnitStatus | '';
  serviceRegion?: string;
  limit?: number;
  offset?: number;
  sort?: 'createdAtDesc' | 'createdAtAsc' | 'nameAsc';
};

export type PaginatedDispatchUnits = {
  data: DispatchUnit[];
  pagination: {
    limit: number;
    offset: number;
    total?: number;
  };
};

export type CreateDispatchUnitPayload = {
  organizationId: string;
  name: string;
  code: string;
  serviceRegion?: string;
  status: DispatchUnitStatus;
  city?: string;
  productTypes: string[];
  priority: number;
  routingRules?: Record<string, unknown>;
};

export type UpdateDispatchUnitPayload = Partial<Omit<CreateDispatchUnitPayload, 'organizationId'>>;

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

function assertNoSensitiveFields(dispatchUnit: DispatchUnit) {
  const maybeUnsafe = dispatchUnit as DispatchUnit & Record<string, unknown>;
  const foundKeys = SENSITIVE_KEYS.filter((key) => key in maybeUnsafe);

  if (foundKeys.length > 0 && import.meta.env.DEV) {
    console.warn('Dispatch unit API response included sensitive field keys. The frontend ignored them.');
  }
}

function sanitizeDispatchUnit(dispatchUnit: DispatchUnit): DispatchUnit {
  assertNoSensitiveFields(dispatchUnit);
  return {
    id: dispatchUnit.id,
    organizationId: dispatchUnit.organizationId,
    name: dispatchUnit.name,
    code: dispatchUnit.code,
    serviceRegion: dispatchUnit.serviceRegion,
    status: dispatchUnit.status,
    city: dispatchUnit.city,
    productTypes: Array.isArray(dispatchUnit.productTypes) ? dispatchUnit.productTypes : [],
    priority: dispatchUnit.priority,
    routingRules: dispatchUnit.routingRules,
    createdAt: dispatchUnit.createdAt,
    updatedAt: dispatchUnit.updatedAt
  };
}

export async function listDispatchUnits(params: ListDispatchUnitsParams = {}): Promise<PaginatedDispatchUnits> {
  const query = buildQuery({
    organizationId: params.organizationId,
    q: params.q,
    status: params.status || undefined,
    serviceRegion: params.serviceRegion,
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
    sort: params.sort ?? 'createdAtDesc'
  });
  const envelope = await apiRequestEnvelope<DispatchUnit[]>(`/api/v1/admin/dispatch-units${query}`);

  return {
    data: (envelope.data || []).map(sanitizeDispatchUnit),
    pagination: {
      limit: envelope.pagination?.limit ?? params.limit ?? 20,
      offset: envelope.pagination?.offset ?? params.offset ?? 0,
      total: envelope.pagination?.total
    }
  };
}

export async function getDispatchUnit(dispatchUnitId: string) {
  const dispatchUnit = await apiRequest<DispatchUnit>(`/api/v1/admin/dispatch-units/${dispatchUnitId}`);
  return sanitizeDispatchUnit(dispatchUnit);
}

export async function createDispatchUnit(payload: CreateDispatchUnitPayload) {
  const dispatchUnit = await apiRequest<DispatchUnit>('/api/v1/admin/dispatch-units', {
    method: 'POST',
    body: payload
  });
  return sanitizeDispatchUnit(dispatchUnit);
}

export async function updateDispatchUnit(dispatchUnitId: string, payload: UpdateDispatchUnitPayload) {
  const dispatchUnit = await apiRequest<DispatchUnit>(`/api/v1/admin/dispatch-units/${dispatchUnitId}`, {
    method: 'PATCH',
    body: payload
  });
  return sanitizeDispatchUnit(dispatchUnit);
}

export function disableDispatchUnit(dispatchUnitId: string) {
  return apiRequest<DispatchUnit>(`/api/v1/admin/dispatch-units/${dispatchUnitId}`, {
    method: 'DELETE'
  }).then(sanitizeDispatchUnit);
}
