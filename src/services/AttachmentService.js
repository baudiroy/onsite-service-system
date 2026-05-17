const crypto = require('node:crypto');
const path = require('node:path');

const { env } = require('../config/env');
const { AttachmentRepository } = require('../repositories/AttachmentRepository');
const { CaseRepository } = require('../repositories/CaseRepository');
const { AuditService } = require('./AuditService');
const { OrganizationAccessService } = require('./OrganizationAccessService');
const { R2StorageProvider } = require('../integrations/storage/R2StorageProvider');
const { withTransaction } = require('../db/transaction');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { toAttachmentDTO } = require('../mappers/attachmentMapper');

const OCR_ATTACHMENT_TYPES = new Set(['serial_photo', 'invoice_photo']);

function sanitizeExtension(filename = '') {
  const ext = path.extname(filename).toLowerCase().replace(/[^a-z0-9.]/g, '');
  return ext || '';
}

function createObjectKey({ caseId, attachmentType, originalFilename }) {
  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const random = crypto.randomUUID();
  const ext = sanitizeExtension(originalFilename);
  return `cases/${yyyy}/${mm}/${caseId}/${attachmentType}/${random}${ext}`;
}

class AttachmentService {
  constructor({
    attachmentRepository = new AttachmentRepository(),
    caseRepository = new CaseRepository(),
    auditService = new AuditService(),
    storageProvider = new R2StorageProvider(),
    organizationAccessService = new OrganizationAccessService()
  } = {}) {
    this.attachmentRepository = attachmentRepository;
    this.caseRepository = caseRepository;
    this.auditService = auditService;
    this.storageProvider = storageProvider;
    this.organizationAccessService = organizationAccessService;
  }

  async ensureCaseExists(caseId, client, actor = null) {
    const caseRow = await this.caseRepository.getCaseById(caseId, client);

    if (!caseRow) {
      throw new NotFoundError('Case not found.');
    }

    if (actor) {
      await this.organizationAccessService.assertAccess(actor, caseRow.organization_id, client);
    }

    return caseRow;
  }

  async createAttachmentMetadata(caseId, input, actor, req = null, client = null) {
    await this.ensureCaseExists(caseId, client, actor);

    const shouldOcr = OCR_ATTACHMENT_TYPES.has(input.attachmentType);
    const objectKey = createObjectKey({
      caseId,
      attachmentType: input.attachmentType,
      originalFilename: input.originalFilename
    });
    const attachment = await this.attachmentRepository.createAttachment({
      caseId,
      attachmentType: input.attachmentType,
      bucket: env.r2Bucket,
      objectKey,
      originalFilename: input.originalFilename,
      contentType: input.contentType,
      byteSize: input.byteSize,
      checksumSha256: input.checksumSha256,
      uploadedByType: actor?.userType || 'admin',
      uploadedById: actor?.id || null,
      sourceChannel: input.sourceChannel || 'admin',
      ocrStatus: shouldOcr ? 'pending' : 'not_started',
      metadata: {
        uploadStatus: 'pending',
        visibility: 'internal_only',
        futureVisibilityPolicy: 'customer_visible / engineer_only / internal_only can be added later.'
      }
    }, client);

    await this.auditService.record({
      actorType: actor?.userType || 'admin',
      actorId: actor?.id || null,
      actorDisplayName: actor?.displayName || null,
      action: 'attachment.metadata_created',
      entityType: 'attachment',
      entityId: attachment.id,
      afterData: {
        caseId,
        attachmentType: attachment.attachment_type,
        storageProvider: attachment.storage_provider,
        bucket: attachment.bucket,
        objectKey: attachment.object_key,
        ocrStatus: attachment.ocr_status
      },
      ipAddress: req?.ip || null,
      userAgent: req?.get?.('user-agent') || null,
      metadata: {
        requestId: req?.requestId || null
      }
    }, client);

    return attachment;
  }

  async generateUploadUrl(caseId, input, actor, req = null) {
    return withTransaction(async (client) => {
      const attachment = await this.createAttachmentMetadata(caseId, input, actor, req, client);
      const signed = this.storageProvider.createSignedUploadUrl({
        objectKey: attachment.object_key,
        contentType: attachment.content_type,
        ttlSeconds: input.ttlSeconds
      });

      await this.attachmentRepository.updateSignedUrlLifecycle(
        attachment.id,
        signed.expiresAt,
        client
      );

      return {
        attachment: toAttachmentDTO(attachment),
        upload: {
          method: signed.method,
          signedUrl: signed.signedUrl,
          expiresAt: signed.expiresAt,
          contentType: attachment.content_type
        }
      };
    });
  }

  async generateDownloadUrl(attachmentId, input, actor, req = null) {
    return withTransaction(async (client) => {
      const attachment = await this.attachmentRepository.getAttachmentById(attachmentId, client);

      if (!attachment) {
        throw new NotFoundError('Attachment not found.');
      }

      await this.ensureCaseExists(attachment.case_id, client, actor);

      const signed = this.storageProvider.createSignedDownloadUrl({
        objectKey: attachment.object_key,
        ttlSeconds: input.ttlSeconds
      });

      await this.attachmentRepository.updateSignedUrlLifecycle(
        attachment.id,
        signed.expiresAt,
        client
      );

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'attachment.download_url_generated',
        entityType: 'attachment',
        entityId: attachment.id,
        afterData: {
          caseId: attachment.case_id,
          attachmentType: attachment.attachment_type,
          expiresAt: signed.expiresAt
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: {
          requestId: req?.requestId || null
        }
      }, client);

      return {
        attachment: toAttachmentDTO(attachment),
        download: {
          method: signed.method,
          signedUrl: signed.signedUrl,
          expiresAt: signed.expiresAt
        }
      };
    });
  }

  async markUploadCompleted(caseId, input, actor, req = null) {
    return withTransaction(async (client) => {
      await this.ensureCaseExists(caseId, client, actor);
      const attachment = await this.attachmentRepository.getAttachmentById(input.attachmentId, client);

      if (!attachment || attachment.case_id !== caseId) {
        throw new NotFoundError('Attachment not found.');
      }

      const updated = await this.attachmentRepository.updateAttachmentStatus(
        attachment.id,
        {
          byteSize: input.byteSize,
          checksumSha256: input.checksumSha256,
          objectVersion: input.objectVersion,
          metadata: {
            ...(attachment.metadata || {}),
            uploadStatus: 'completed',
            uploadCompletedAt: new Date().toISOString()
          }
        },
        client
      );

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'attachment.upload_completed',
        entityType: 'attachment',
        entityId: attachment.id,
        beforeData: {
          byteSize: attachment.byte_size,
          checksumSha256: attachment.checksum_sha256,
          objectVersion: attachment.object_version
        },
        afterData: {
          byteSize: updated.byte_size,
          checksumSha256: updated.checksum_sha256,
          objectVersion: updated.object_version
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: {
          requestId: req?.requestId || null
        }
      }, client);

      return toAttachmentDTO(updated);
    });
  }

  async requestOcrProcessing(attachmentId, actor, req = null) {
    return withTransaction(async (client) => {
      const attachment = await this.attachmentRepository.getAttachmentById(attachmentId, client);

      if (!attachment) {
        throw new NotFoundError('Attachment not found.');
      }

      await this.ensureCaseExists(attachment.case_id, client, actor);

      if (!OCR_ATTACHMENT_TYPES.has(attachment.attachment_type)) {
        throw new ValidationError('OCR is only supported for serial_photo and invoice_photo.', [
          {
            field: 'attachmentType',
            message: 'OCR is only supported for serial_photo and invoice_photo.',
            code: 'unsupported_attachment_type'
          }
        ]);
      }

      const updated = await this.attachmentRepository.updateAttachmentStatus(
        attachment.id,
        { ocrStatus: 'pending' },
        client
      );

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'attachment.ocr_requested',
        entityType: 'attachment',
        entityId: attachment.id,
        beforeData: {
          ocrStatus: attachment.ocr_status
        },
        afterData: {
          ocrStatus: updated.ocr_status
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: {
          requestId: req?.requestId || null,
          provider: 'placeholder',
          note: 'OCR provider is not implemented in Task 014.'
        }
      }, client);

      return toAttachmentDTO(updated);
    });
  }


  async updateOcrResult(attachmentId, input, actor, req = null) {
    return withTransaction(async (client) => {
      const attachment = await this.attachmentRepository.getAttachmentById(attachmentId, client);

      if (!attachment) {
        throw new NotFoundError('Attachment not found.');
      }

      await this.ensureCaseExists(attachment.case_id, client, actor);

      const updated = await this.attachmentRepository.updateAttachmentOcrResult(
        attachment.id,
        input,
        client
      );

      await this.auditService.record({
        actorType: actor?.userType || 'system',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'attachment.ocr_result_updated',
        entityType: 'attachment',
        entityId: attachment.id,
        beforeData: {
          ocrStatus: attachment.ocr_status,
          ocrConfidence: attachment.ocr_confidence ?? attachment.ai_extraction_confidence ?? null
        },
        afterData: {
          ocrStatus: updated.ocr_status,
          ocrConfidence: updated.ocr_confidence ?? updated.ai_extraction_confidence ?? null,
          hasOcrResult: Boolean(updated.ocr_result || updated.ai_extraction_result)
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: {
          requestId: req?.requestId || null,
          provider: 'placeholder'
        }
      }, client);

      return toAttachmentDTO(updated);
    });
  }

  async listCaseAttachments(caseId, actor) {
    await this.ensureCaseExists(caseId, undefined, actor);
    const rows = await this.attachmentRepository.listCaseAttachments(caseId);
    return rows.map(toAttachmentDTO);
  }

  async softDeleteAttachment(attachmentId, actor, req = null) {
    return withTransaction(async (client) => {
      const attachment = await this.attachmentRepository.getAttachmentById(attachmentId, client);

      if (!attachment) {
        throw new NotFoundError('Attachment not found.');
      }

      await this.ensureCaseExists(attachment.case_id, client, actor);
      const deleted = await this.attachmentRepository.softDeleteAttachment(attachment.id, client);

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'attachment.deleted',
        entityType: 'attachment',
        entityId: attachment.id,
        beforeData: {
          caseId: attachment.case_id,
          attachmentType: attachment.attachment_type,
          storageProvider: attachment.storage_provider,
          bucket: attachment.bucket,
          objectKey: attachment.object_key
        },
        afterData: {
          deletedAt: deleted.deleted_at
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: {
          requestId: req?.requestId || null,
          retentionNote: 'R2 object is not hard-deleted by Task 014.'
        }
      }, client);

      return toAttachmentDTO(deleted);
    });
  }
}

module.exports = {
  AttachmentService,
  createObjectKey,
  OCR_ATTACHMENT_TYPES
};
