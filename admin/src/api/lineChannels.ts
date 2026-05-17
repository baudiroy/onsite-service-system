import { apiRequest, apiRequestEnvelope } from '../lib/apiClient';

export type LineChannel = {
  id: string;
  organizationId?: string | null;
  organizationName?: string | null;
  channelCode: string;
  channelName: string;
  channelId?: string | null;
  enabled?: boolean | null;
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ListLineChannelsParams = {
  organizationId?: string;
  channelCode?: string;
  enabled?: boolean | '';
  limit?: number;
  offset?: number;
};

export type PaginatedLineChannels = {
  data: LineChannel[];
  pagination: {
    limit: number;
    offset: number;
    total?: number;
  };
};

export type CreateLineChannelPayload = {
  organizationId: string;
  channelCode: string;
  channelName: string;
  channelId?: string;
  channelSecret: string;
  channelAccessToken?: string;
  webhookPath?: string;
  enabled?: boolean;
};

export type UpdateLineChannelPayload = Partial<Pick<
  CreateLineChannelPayload,
  'channelName' | 'channelId' | 'channelSecret' | 'channelAccessToken' | 'webhookPath' | 'enabled'
>>;

const SECRET_LIKE_KEYS = [
  'channelSecret',
  'channel_secret',
  'channelAccessToken',
  'channel_access_token',
  'accessToken',
  'token',
  'secret',
  'clientSecret',
  'apiKey',
  'password',
  'password_hash',
  'passwordHash',
  'DATABASE_URL',
  'JWT_SECRET',
  'OPENAI_API_KEY',
  'R2_SECRET_ACCESS_KEY'
];

function buildQuery(params: Record<string, string | number | boolean | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function warnIfSecretLikeKeys(entity: Record<string, unknown>) {
  const foundKeys = SECRET_LIKE_KEYS.filter((key) => key in entity);

  if (foundKeys.length > 0 && import.meta.env.DEV) {
    console.warn(`LINE channel response included secret-like keys. The frontend ignored these keys: ${foundKeys.join(', ')}`);
  }
}

function sanitizeLineChannel(channel: LineChannel): LineChannel {
  warnIfSecretLikeKeys(channel as unknown as Record<string, unknown>);

  return {
    id: channel.id,
    organizationId: channel.organizationId,
    organizationName: channel.organizationName,
    channelCode: channel.channelCode,
    channelName: channel.channelName,
    channelId: channel.channelId,
    enabled: channel.enabled,
    status: channel.status,
    createdAt: channel.createdAt,
    updatedAt: channel.updatedAt
  };
}

export async function listLineChannels(params: ListLineChannelsParams = {}): Promise<PaginatedLineChannels> {
  const query = buildQuery({
    organizationId: params.organizationId,
    channelCode: params.channelCode,
    enabled: params.enabled === '' ? undefined : params.enabled,
    limit: params.limit ?? 50,
    offset: params.offset ?? 0
  });

  const envelope = await apiRequestEnvelope<LineChannel[]>(`/api/v1/admin/line-channels${query}`);

  return {
    data: (envelope.data || []).map(sanitizeLineChannel),
    pagination: {
      limit: envelope.pagination?.limit ?? params.limit ?? 50,
      offset: envelope.pagination?.offset ?? params.offset ?? 0,
      total: envelope.pagination?.total
    }
  };
}

export async function createLineChannel(payload: CreateLineChannelPayload) {
  const channel = await apiRequest<LineChannel>('/api/v1/admin/line-channels', {
    method: 'POST',
    body: payload
  });
  return sanitizeLineChannel(channel);
}

export async function updateLineChannel(channelId: string, payload: UpdateLineChannelPayload) {
  const channel = await apiRequest<LineChannel>(`/api/v1/admin/line-channels/${channelId}`, {
    method: 'PATCH',
    body: payload
  });
  return sanitizeLineChannel(channel);
}
