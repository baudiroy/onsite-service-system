import { apiRequest, apiRequestEnvelope } from '../lib/apiClient';

export type OrganizationStatus = 'active' | 'disabled';

export type Organization = {
  id: string;
  organizationCode: string;
  organizationName: string;
  status: OrganizationStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ListOrganizationsParams = {
  q?: string;
  organizationCode?: string;
  status?: OrganizationStatus | '';
  limit?: number;
  offset?: number;
  sort?: 'createdAtDesc' | 'createdAtAsc' | 'codeAsc' | 'nameAsc';
};

export type PaginatedOrganizations = {
  data: Organization[];
  pagination: {
    limit: number;
    offset: number;
    total?: number;
  };
};

export type CreateOrganizationPayload = {
  organizationCode: string;
  organizationName: string;
  status: OrganizationStatus;
};

export type UpdateOrganizationPayload = {
  organizationName?: string;
  status?: OrganizationStatus;
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

function assertNoSensitiveFields(organization: Organization) {
  const maybeUnsafe = organization as Organization & Record<string, unknown>;
  const foundKeys = SENSITIVE_KEYS.filter((key) => key in maybeUnsafe);

  if (foundKeys.length > 0 && import.meta.env.DEV) {
    console.warn('Organization API response included sensitive field keys. The frontend ignored them.');
  }
}

function sanitizeOrganization(organization: Organization): Organization {
  assertNoSensitiveFields(organization);
  return {
    id: organization.id,
    organizationCode: organization.organizationCode,
    organizationName: organization.organizationName,
    status: organization.status,
    createdAt: organization.createdAt,
    updatedAt: organization.updatedAt
  };
}

export async function listOrganizations(params: ListOrganizationsParams = {}): Promise<PaginatedOrganizations> {
  const query = buildQuery({
    q: params.q,
    organizationCode: params.organizationCode,
    status: params.status || undefined,
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
    sort: params.sort ?? 'createdAtDesc'
  });
  const envelope = await apiRequestEnvelope<Organization[]>(`/api/v1/admin/organizations${query}`);

  return {
    data: (envelope.data || []).map(sanitizeOrganization),
    pagination: {
      limit: envelope.pagination?.limit ?? params.limit ?? 20,
      offset: envelope.pagination?.offset ?? params.offset ?? 0,
      total: envelope.pagination?.total
    }
  };
}

export async function getOrganization(organizationId: string) {
  const organization = await apiRequest<Organization>(`/api/v1/admin/organizations/${organizationId}`);
  return sanitizeOrganization(organization);
}

export async function createOrganization(payload: CreateOrganizationPayload) {
  const organization = await apiRequest<Organization>('/api/v1/admin/organizations', {
    method: 'POST',
    body: payload
  });
  return sanitizeOrganization(organization);
}

export async function updateOrganization(organizationId: string, payload: UpdateOrganizationPayload) {
  const organization = await apiRequest<Organization>(`/api/v1/admin/organizations/${organizationId}`, {
    method: 'PATCH',
    body: payload
  });
  return sanitizeOrganization(organization);
}
