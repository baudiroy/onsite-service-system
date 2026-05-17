import { apiRequest, apiRequestEnvelope } from '../lib/apiClient';
import type { AdminCase, CaseSource } from './cases';

export type Customer = {
  id: string;
  organizationId?: string | null;
  organizationSummary?: {
    code?: string | null;
    name?: string | null;
  } | null;
  customerName: string;
  mobile: string;
  tel?: string | null;
  lineUserIdMasked?: string | null;
  city: string;
  address: string;
  source: CaseSource;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ListCustomersParams = {
  organizationId?: string;
  q?: string;
  mobile?: string;
  lineUserId?: string;
  city?: string;
  source?: CaseSource | '';
  limit?: number;
  offset?: number;
  sort?: 'createdAtDesc' | 'createdAtAsc' | 'updatedAtDesc' | 'nameAsc';
};

export type CreateCustomerPayload = {
  organizationId?: string;
  customerName: string;
  mobile: string;
  tel?: string;
  lineUserId?: string;
  city: string;
  address: string;
  source?: CaseSource;
};

export type UpdateCustomerPayload = Partial<Pick<
  CreateCustomerPayload,
  'customerName' | 'mobile' | 'tel' | 'city' | 'address' | 'source'
>>;

export type ListCustomerCasesParams = {
  limit?: number;
  offset?: number;
  sort?: 'createdAtDesc' | 'createdAtAsc' | 'submittedAtDesc';
};

export type PaginatedCustomers = {
  data: Customer[];
  pagination: {
    limit: number;
    offset: number;
    total?: number;
  };
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
  'R2_SECRET_ACCESS_KEY',
  'lineUserId'
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

function assertNoSensitiveFields(customer: Customer) {
  const maybeUnsafe = customer as Customer & Record<string, unknown>;
  const foundKeys = SENSITIVE_KEYS.filter((key) => key in maybeUnsafe);

  if (foundKeys.length > 0 && import.meta.env.DEV) {
    console.warn('Customer API response included sensitive field keys. The frontend ignored them.');
  }
}

function sanitizeCustomer(customer: Customer): Customer {
  assertNoSensitiveFields(customer);
  return {
    id: customer.id,
    organizationId: customer.organizationId,
    organizationSummary: customer.organizationSummary || null,
    customerName: customer.customerName,
    mobile: customer.mobile,
    tel: customer.tel,
    lineUserIdMasked: customer.lineUserIdMasked,
    city: customer.city,
    address: customer.address,
    source: customer.source,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt
  };
}

export async function listCustomers(params: ListCustomersParams = {}): Promise<PaginatedCustomers> {
  const query = buildQuery({
    organizationId: params.organizationId,
    q: params.q,
    mobile: params.mobile,
    lineUserId: params.lineUserId,
    city: params.city,
    source: params.source || undefined,
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
    sort: params.sort ?? 'createdAtDesc'
  });

  const envelope = await apiRequestEnvelope<Customer[]>(`/api/v1/admin/customers${query}`);

  return {
    data: (envelope.data || []).map(sanitizeCustomer),
    pagination: {
      limit: envelope.pagination?.limit ?? params.limit ?? 20,
      offset: envelope.pagination?.offset ?? params.offset ?? 0,
      total: envelope.pagination?.total
    }
  };
}

export async function getCustomer(customerId: string) {
  const customer = await apiRequest<Customer>(`/api/v1/admin/customers/${customerId}`);
  return sanitizeCustomer(customer);
}

export async function createCustomer(payload: CreateCustomerPayload) {
  const customer = await apiRequest<Customer>('/api/v1/admin/customers', {
    method: 'POST',
    body: payload
  });
  return sanitizeCustomer(customer);
}

export async function updateCustomer(customerId: string, payload: UpdateCustomerPayload) {
  const customer = await apiRequest<Customer>(`/api/v1/admin/customers/${customerId}`, {
    method: 'PATCH',
    body: payload
  });
  return sanitizeCustomer(customer);
}

export async function listCustomerCases(customerId: string, params: ListCustomerCasesParams = {}) {
  const query = buildQuery({
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
    sort: params.sort ?? 'createdAtDesc'
  });
  const envelope = await apiRequestEnvelope<AdminCase[]>(`/api/v1/admin/customers/${customerId}/cases${query}`);

  return {
    data: envelope.data || [],
    pagination: {
      limit: envelope.pagination?.limit ?? params.limit ?? 20,
      offset: envelope.pagination?.offset ?? params.offset ?? 0,
      total: envelope.pagination?.total
    }
  };
}
