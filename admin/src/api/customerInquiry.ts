import { apiRequest } from '../lib/apiClient';

export type CaseInquiryPayload = {
  caseNo: string;
  mobile: string;
};

export type LineCaseInquiryPayload = {
  channelCode: string;
  caseNo: string;
  lineUserId: string;
};

export type CustomerVisibleMessage = {
  messageType?: string | null;
  bodyText?: string | null;
  createdAt?: string | null;
};

export type CustomerVisibleAttachment = {
  attachmentType?: string | null;
  originalFilename?: string | null;
  contentType?: string | null;
  byteSize?: number | null;
  createdAt?: string | null;
};

export type CustomerVisibleCase = {
  caseNo?: string | null;
  status?: string | null;
  customerVisibleStatus?: string | null;
  brand?: string | null;
  productType?: string | null;
  modelNo?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  preferredVisitTime?: string | null;
  latestCustomerVisibleMessage?: CustomerVisibleMessage | null;
  customerVisibleAttachments?: CustomerVisibleAttachment[];
};

export type CustomerInquiryResponse = {
  verified: boolean;
  message?: string;
  case?: CustomerVisibleCase | null;
};

const INTERNAL_ONLY_KEYS = [
  'internalNote',
  'internalNotes',
  'auditLogs',
  'audit_logs',
  'aiRawOutput',
  'ocrRawOutput',
  'dispatchRules',
  'engineerNotes',
  'billing',
  'billingData',
  'permissions',
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

function findInternalKeys(value: unknown, path = 'response', found = new Set<string>()) {
  if (!value || typeof value !== 'object') return found;

  if (Array.isArray(value)) {
    value.forEach((item, index) => findInternalKeys(item, `${path}[${index}]`, found));
    return found;
  }

  Object.keys(value as Record<string, unknown>).forEach((key) => {
    if (INTERNAL_ONLY_KEYS.includes(key)) {
      found.add(`${path}.${key}`);
      return;
    }
    findInternalKeys((value as Record<string, unknown>)[key], `${path}.${key}`, found);
  });

  return found;
}

export function warnIfCustomerInquiryContainsInternalKeys(value: unknown) {
  const foundKeys = Array.from(findInternalKeys(value));
  if (foundKeys.length > 0 && import.meta.env.DEV) {
    console.warn(`Customer inquiry response included internal-only keys. The frontend ignored these keys: ${foundKeys.join(', ')}`);
  }
}

function sanitizeMessage(message?: CustomerVisibleMessage | null): CustomerVisibleMessage | null {
  if (!message) return null;
  return {
    messageType: message.messageType,
    bodyText: message.bodyText,
    createdAt: message.createdAt
  };
}

function sanitizeAttachment(attachment: CustomerVisibleAttachment): CustomerVisibleAttachment {
  return {
    attachmentType: attachment.attachmentType,
    originalFilename: attachment.originalFilename,
    contentType: attachment.contentType,
    byteSize: attachment.byteSize,
    createdAt: attachment.createdAt
  };
}

function sanitizeVisibleCase(visibleCase?: CustomerVisibleCase | null): CustomerVisibleCase | null {
  if (!visibleCase) return null;
  return {
    caseNo: visibleCase.caseNo,
    status: visibleCase.status,
    customerVisibleStatus: visibleCase.customerVisibleStatus,
    brand: visibleCase.brand,
    productType: visibleCase.productType,
    modelNo: visibleCase.modelNo,
    createdAt: visibleCase.createdAt,
    updatedAt: visibleCase.updatedAt,
    preferredVisitTime: visibleCase.preferredVisitTime,
    latestCustomerVisibleMessage: sanitizeMessage(visibleCase.latestCustomerVisibleMessage),
    customerVisibleAttachments: (visibleCase.customerVisibleAttachments || []).map(sanitizeAttachment)
  };
}

function sanitizeInquiryResponse(response: CustomerInquiryResponse): CustomerInquiryResponse {
  warnIfCustomerInquiryContainsInternalKeys(response);
  return {
    verified: Boolean(response.verified),
    message: response.message,
    case: sanitizeVisibleCase(response.case)
  };
}

export function inquiryByCaseNoAndMobile(payload: CaseInquiryPayload) {
  return apiRequest<CustomerInquiryResponse>('/api/v1/public/case-inquiry', {
    method: 'POST',
    skipAuth: true,
    body: payload
  }).then(sanitizeInquiryResponse);
}

export function inquiryByLineUser(payload: LineCaseInquiryPayload) {
  return apiRequest<CustomerInquiryResponse>('/api/v1/public/line-case-inquiry', {
    method: 'POST',
    skipAuth: true,
    body: payload
  }).then(sanitizeInquiryResponse);
}
