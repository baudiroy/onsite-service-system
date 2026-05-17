import { apiRequest } from '../lib/apiClient';

export type CustomerLineIdentity = {
  id: string;
  customerId: string;
  organizationId?: string | null;
  lineChannelId: string;
  channelCode?: string | null;
  channelName?: string | null;
  lineUserIdMasked?: string | null;
  displayName?: string | null;
  linkedAt?: string | null;
  createdAt?: string | null;
};

export type LinkCustomerLineIdentityPayload = {
  lineChannelId: string;
  lineUserId: string;
  displayName?: string;
};

const SENSITIVE_KEYS = [
  'lineUserId',
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

function warnIfSensitiveKeys(identity: CustomerLineIdentity) {
  const maybeUnsafe = identity as CustomerLineIdentity & Record<string, unknown>;
  const foundKeys = SENSITIVE_KEYS.filter((key) => key in maybeUnsafe);

  if (foundKeys.length > 0 && import.meta.env.DEV) {
    console.warn('Customer LINE identity response included sensitive field keys. The frontend ignored them.');
  }
}

function sanitizeCustomerLineIdentity(identity: CustomerLineIdentity): CustomerLineIdentity {
  warnIfSensitiveKeys(identity);

  return {
    id: identity.id,
    customerId: identity.customerId,
    organizationId: identity.organizationId,
    lineChannelId: identity.lineChannelId,
    channelCode: identity.channelCode,
    channelName: identity.channelName,
    lineUserIdMasked: identity.lineUserIdMasked,
    displayName: identity.displayName,
    linkedAt: identity.linkedAt,
    createdAt: identity.createdAt
  };
}

export async function listCustomerLineIdentities(customerId: string) {
  const identities = await apiRequest<CustomerLineIdentity[]>(`/api/v1/admin/customers/${customerId}/line-identities`);
  return (identities || []).map(sanitizeCustomerLineIdentity);
}

export async function linkCustomerLineIdentity(customerId: string, payload: LinkCustomerLineIdentityPayload) {
  const identity = await apiRequest<CustomerLineIdentity>(`/api/v1/admin/customers/${customerId}/line-identities`, {
    method: 'POST',
    body: payload
  });
  return sanitizeCustomerLineIdentity(identity);
}

export async function unlinkCustomerLineIdentity(customerId: string, identityId: string) {
  const identity = await apiRequest<CustomerLineIdentity>(`/api/v1/admin/customers/${customerId}/line-identities/${identityId}`, {
    method: 'DELETE'
  });
  return sanitizeCustomerLineIdentity(identity);
}
