import { apiRequest, apiRequestEnvelope } from '../lib/apiClient';

export type CaseMessageType =
  | 'internal_note'
  | 'system_event'
  | 'customer_note'
  | 'workflow_event'
  | 'line_message'
  | 'ai_summary'
  | 'dispatch_note'
  | 'engineer_note';

export type CaseMessageSort = 'createdAtAsc' | 'createdAtDesc';

export type CaseMessage = {
  id: string;
  caseId: string;
  attachmentId?: string | null;
  senderType?: string | null;
  senderId?: string | null;
  senderDisplayName?: string | null;
  channel?: string | null;
  messageType: CaseMessageType | string;
  bodyText?: string | null;
  visibility?: string | null;
  createdAt?: string | null;
};

export type ListCaseMessagesParams = {
  sort?: CaseMessageSort;
  limit?: number;
  offset?: number;
};

export type PaginatedCaseMessages = {
  data: CaseMessage[];
  pagination: {
    limit: number;
    offset: number;
    total?: number;
  };
};

export type CreateCaseMessagePayload = {
  messageType: 'internal_note';
  bodyText: string;
  attachmentId?: string;
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
    console.warn('Case message API response included sensitive field keys. The frontend ignored them.');
  }
}

function sanitizeCaseMessage(message: CaseMessage): CaseMessage {
  assertNoSensitiveFields(message as unknown as Record<string, unknown>);

  return {
    id: message.id,
    caseId: message.caseId,
    attachmentId: message.attachmentId,
    senderType: message.senderType,
    senderId: message.senderId,
    senderDisplayName: message.senderDisplayName,
    channel: message.channel,
    messageType: message.messageType,
    bodyText: message.bodyText,
    visibility: message.visibility,
    createdAt: message.createdAt
  };
}

export async function listCaseMessages(
  caseId: string,
  params: ListCaseMessagesParams = {}
): Promise<PaginatedCaseMessages> {
  const query = buildQuery({
    sort: params.sort ?? 'createdAtDesc',
    limit: params.limit ?? 50,
    offset: params.offset ?? 0
  });

  const envelope = await apiRequestEnvelope<CaseMessage[]>(`/api/v1/admin/cases/${caseId}/messages${query}`);

  return {
    data: (envelope.data || []).map(sanitizeCaseMessage),
    pagination: {
      limit: envelope.pagination?.limit ?? params.limit ?? 50,
      offset: envelope.pagination?.offset ?? params.offset ?? 0,
      total: envelope.pagination?.total
    }
  };
}

export async function createCaseMessage(caseId: string, payload: CreateCaseMessagePayload) {
  const message = await apiRequest<CaseMessage>(`/api/v1/admin/cases/${caseId}/messages`, {
    method: 'POST',
    body: payload
  });

  return sanitizeCaseMessage(message);
}

export function deleteCaseMessage(messageId: string) {
  return apiRequest<{ deleted: boolean }>(`/api/v1/admin/messages/${messageId}`, {
    method: 'DELETE'
  });
}
