import { ApiError, apiRequest } from '../lib/apiClient';

export type AttachmentType =
  | 'fault_photo'
  | 'serial_photo'
  | 'invoice_photo'
  | 'product_photo'
  | 'issue_photo'
  | 'completion_photo'
  | 'signature'
  | 'other';

export type SourceChannel = 'line' | 'website' | 'admin' | 'api' | 'phone' | 'whatsapp' | 'facebook' | 'instagram' | 'email';

export type CaseAttachment = {
  id: string;
  caseId: string;
  attachmentType: AttachmentType | string;
  storageProvider?: string | null;
  originalFilename?: string | null;
  contentType?: string | null;
  byteSize?: number | null;
  checksumSha256?: string | null;
  uploadedByType?: string | null;
  uploadedById?: string | null;
  sourceChannel?: SourceChannel | string | null;
  ocrStatus?: string | null;
  ocrConfidence?: number | null;
  ocrProcessedAt?: string | null;
  objectVersion?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type CreateAttachmentUploadUrlPayload = {
  attachmentType: AttachmentType;
  originalFilename: string;
  contentType: string;
  byteSize?: number;
  checksumSha256?: string;
  sourceChannel?: SourceChannel;
  ttlSeconds?: number;
};

export type CompleteAttachmentUploadPayload = {
  attachmentId: string;
  byteSize?: number;
  checksumSha256?: string;
  objectVersion?: string;
};

export type AttachmentUploadResponse = {
  attachment: CaseAttachment;
  upload: {
    method: string;
    signedUrl: string;
    expiresAt?: string | null;
    contentType?: string | null;
  };
};

export type AttachmentDownloadResponse = {
  attachment: CaseAttachment;
  download: {
    method: string;
    signedUrl: string;
    expiresAt?: string | null;
  };
};

export type AttachmentOcrJob = {
  id: string;
  jobType?: string;
  entityType?: string;
  entityId?: string;
  status?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type RequestAttachmentOcrPayload = {
  note?: string;
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
  'signedUrl'
];

function assertNoSensitiveFields(entity: Record<string, unknown>) {
  const foundKeys = SENSITIVE_KEYS.filter((key) => key in entity);

  if (foundKeys.length > 0 && import.meta.env.DEV) {
    console.warn('Attachment API response included sensitive field keys. The frontend ignored them.');
  }
}

function sanitizeAttachment(attachment: CaseAttachment): CaseAttachment {
  assertNoSensitiveFields(attachment as unknown as Record<string, unknown>);

  return {
    id: attachment.id,
    caseId: attachment.caseId,
    attachmentType: attachment.attachmentType,
    storageProvider: attachment.storageProvider,
    originalFilename: attachment.originalFilename,
    contentType: attachment.contentType,
    byteSize: attachment.byteSize,
    checksumSha256: attachment.checksumSha256,
    uploadedByType: attachment.uploadedByType,
    uploadedById: attachment.uploadedById,
    sourceChannel: attachment.sourceChannel,
    ocrStatus: attachment.ocrStatus,
    ocrConfidence: attachment.ocrConfidence,
    ocrProcessedAt: attachment.ocrProcessedAt,
    objectVersion: attachment.objectVersion,
    createdAt: attachment.createdAt,
    updatedAt: attachment.updatedAt
  };
}

function sanitizeUploadResponse(response: AttachmentUploadResponse): AttachmentUploadResponse {
  return {
    attachment: sanitizeAttachment(response.attachment),
    upload: {
      method: response.upload.method,
      signedUrl: response.upload.signedUrl,
      expiresAt: response.upload.expiresAt,
      contentType: response.upload.contentType
    }
  };
}

function sanitizeDownloadResponse(response: AttachmentDownloadResponse): AttachmentDownloadResponse {
  return {
    attachment: sanitizeAttachment(response.attachment),
    download: {
      method: response.download.method,
      signedUrl: response.download.signedUrl,
      expiresAt: response.download.expiresAt
    }
  };
}

export async function listCaseAttachments(caseId: string) {
  const attachments = await apiRequest<CaseAttachment[]>(`/api/v1/admin/cases/${caseId}/attachments`);
  return (attachments || []).map(sanitizeAttachment);
}

export async function createAttachmentUploadUrl(caseId: string, payload: CreateAttachmentUploadUrlPayload) {
  const response = await apiRequest<AttachmentUploadResponse>(`/api/v1/admin/cases/${caseId}/attachments/upload-url`, {
    method: 'POST',
    body: payload
  });

  return sanitizeUploadResponse(response);
}

export async function completeAttachmentUpload(caseId: string, payload: CompleteAttachmentUploadPayload) {
  const attachment = await apiRequest<CaseAttachment>(`/api/v1/admin/cases/${caseId}/attachments/complete`, {
    method: 'POST',
    body: payload
  });

  return sanitizeAttachment(attachment);
}

export async function createAttachmentDownloadUrl(attachmentId: string, payload: { ttlSeconds?: number } = {}) {
  const response = await apiRequest<AttachmentDownloadResponse>(`/api/v1/admin/attachments/${attachmentId}/download-url`, {
    method: 'POST',
    body: payload
  });

  return sanitizeDownloadResponse(response);
}

export function requestAttachmentOcr(attachmentId: string, payload: RequestAttachmentOcrPayload = {}) {
  return apiRequest<AttachmentOcrJob>(`/api/v1/admin/attachments/${attachmentId}/ocr`, {
    method: 'POST',
    body: payload
  });
}

export function deleteAttachment(attachmentId: string) {
  return apiRequest<CaseAttachment>(`/api/v1/admin/attachments/${attachmentId}`, {
    method: 'DELETE'
  }).then(sanitizeAttachment);
}

export async function uploadFileToSignedUrl(upload: AttachmentUploadResponse['upload'], file: File) {
  const response = await fetch(upload.signedUrl, {
    method: upload.method || 'PUT',
    headers: {
      'Content-Type': upload.contentType || file.type || 'application/octet-stream'
    },
    body: file
  });

  if (!response.ok) {
    throw new ApiError('檔案上傳至儲存空間失敗。', response.status, 'STORAGE_UPLOAD_FAILED');
  }
}
