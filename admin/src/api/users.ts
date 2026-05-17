import { apiRequest, apiRequestEnvelope } from '../lib/apiClient';

export type UserStatus = 'active' | 'disabled';

export type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  userType?: string | null;
  status: UserStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type UserRole = {
  id?: string;
  userId?: string;
  roleId?: string;
  roleKey?: string;
  name?: string;
  description?: string | null;
  enabled?: boolean;
  assignedBy?: string | null;
  assignedAt?: string | null;
};

export type UserOrganization = {
  id?: string;
  userId?: string;
  organizationId?: string;
  roleNote?: string | null;
  organization?: {
    id?: string;
    organizationCode?: string;
    organizationName?: string;
    status?: string;
  };
  userSummary?: {
    displayName?: string;
    email?: string;
  };
  createdAt?: string | null;
};

export type ListUsersParams = {
  q?: string;
  email?: string;
  status?: UserStatus | '';
  limit?: number;
  offset?: number;
  sort?: 'createdAtDesc' | 'createdAtAsc' | 'emailAsc';
};

export type PaginatedUsers = {
  data: AdminUser[];
  pagination: {
    limit: number;
    offset: number;
    total?: number;
  };
};

export type CreateUserPayload = {
  email: string;
  password: string;
  displayName: string;
  status: UserStatus;
};

export type UpdateUserPayload = {
  displayName?: string;
  status?: UserStatus;
};

function buildQuery(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function assertNoPasswordFields(user: AdminUser) {
  const maybeUnsafe = user as AdminUser & { password_hash?: unknown; passwordHash?: unknown };
  if ('password_hash' in maybeUnsafe || 'passwordHash' in maybeUnsafe) {
    if (import.meta.env.DEV) {
      console.warn('User API response included a password field key. The frontend ignored it.');
    }
  }
}

function sanitizeUser(user: AdminUser): AdminUser {
  assertNoPasswordFields(user);
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    userType: user.userType,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

export async function listUsers(params: ListUsersParams = {}): Promise<PaginatedUsers> {
  const query = buildQuery({
    q: params.q,
    email: params.email,
    status: params.status || undefined,
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
    sort: params.sort ?? 'createdAtDesc'
  });
  const envelope = await apiRequestEnvelope<AdminUser[]>(`/api/v1/admin/users${query}`);

  return {
    data: (envelope.data || []).map(sanitizeUser),
    pagination: {
      limit: envelope.pagination?.limit ?? params.limit ?? 20,
      offset: envelope.pagination?.offset ?? params.offset ?? 0,
      total: envelope.pagination?.total
    }
  };
}

export async function getUser(userId: string) {
  const user = await apiRequest<AdminUser>(`/api/v1/admin/users/${userId}`);
  return sanitizeUser(user);
}

export async function createUser(payload: CreateUserPayload) {
  const user = await apiRequest<AdminUser>('/api/v1/admin/users', {
    method: 'POST',
    body: payload
  });
  return sanitizeUser(user);
}

export async function updateUser(userId: string, payload: UpdateUserPayload) {
  const user = await apiRequest<AdminUser>(`/api/v1/admin/users/${userId}`, {
    method: 'PATCH',
    body: payload
  });
  return sanitizeUser(user);
}

export function disableUser(userId: string) {
  return apiRequest<AdminUser>(`/api/v1/admin/users/${userId}`, {
    method: 'DELETE'
  });
}

export function listUserRoles(userId: string) {
  return apiRequest<UserRole[]>(`/api/v1/admin/users/${userId}/roles`);
}

export function assignUserRole(userId: string, roleId: string) {
  return apiRequest<UserRole>(`/api/v1/admin/users/${userId}/roles`, {
    method: 'POST',
    body: { roleId }
  });
}

export function removeUserRole(userId: string, roleId: string) {
  return apiRequest<{ removed: boolean }>(`/api/v1/admin/users/${userId}/roles/${roleId}`, {
    method: 'DELETE'
  });
}

export function listUserOrganizations(userId: string) {
  return apiRequest<UserOrganization[]>(`/api/v1/admin/users/${userId}/organizations`);
}

export function assignUserOrganization(userId: string, organizationId: string, roleNote?: string) {
  return apiRequest<UserOrganization>(`/api/v1/admin/users/${userId}/organizations`, {
    method: 'POST',
    body: {
      organizationId,
      roleNote: roleNote || undefined
    }
  });
}

export function removeUserOrganization(userId: string, organizationId: string) {
  return apiRequest<{ removed: boolean }>(`/api/v1/admin/users/${userId}/organizations/${organizationId}`, {
    method: 'DELETE'
  });
}
