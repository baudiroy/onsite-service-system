const { BaseRepository } = require('./BaseRepository');

const ATTACHMENT_SELECT = `
  SELECT *
  FROM case_attachments
`;

class AttachmentRepository extends BaseRepository {
  async createAttachment(data, client) {
    return this.queryOne(
      `
        INSERT INTO case_attachments (
          case_id,
          attachment_type,
          storage_provider,
          bucket,
          object_key,
          original_filename,
          content_type,
          byte_size,
          checksum_sha256,
          uploaded_by_type,
          uploaded_by_id,
          source_channel,
          ocr_status,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `,
      [
        data.caseId,
        data.attachmentType,
        data.storageProvider || 'cloudflare_r2',
        data.bucket,
        data.objectKey,
        data.originalFilename || null,
        data.contentType || null,
        data.byteSize ?? null,
        data.checksumSha256 || null,
        data.uploadedByType || 'admin',
        data.uploadedById || null,
        data.sourceChannel || 'admin',
        data.ocrStatus || 'not_started',
        data.metadata || null
      ],
      client
    );
  }

  async getAttachmentById(attachmentId, client) {
    return this.queryOne(
      `
        ${ATTACHMENT_SELECT}
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [attachmentId],
      client
    );
  }

  async listCaseAttachments(caseId, client) {
    return this.queryMany(
      `
        ${ATTACHMENT_SELECT}
        WHERE case_id = $1
          AND deleted_at IS NULL
        ORDER BY created_at DESC
      `,
      [caseId],
      client
    );
  }

  async softDeleteAttachment(attachmentId, client) {
    return this.queryOne(
      `
        UPDATE case_attachments
        SET deleted_at = now()
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `,
      [attachmentId],
      client
    );
  }

  async updateAttachmentOcrResult(attachmentId, data, client) {
    return this.queryOne(
      `
        UPDATE case_attachments
        SET ocr_status = $2,
            ocr_result = $3,
            ocr_confidence = $4,
            ocr_processed_at = now(),
            ai_extraction_result = $3,
            ai_extraction_confidence = $4
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `,
      [attachmentId, data.ocrStatus, data.ocrResult || null, data.ocrConfidence ?? null],
      client
    );
  }

  async updateAttachmentStatus(attachmentId, data, client) {
    return this.queryOne(
      `
        UPDATE case_attachments
        SET ocr_status = coalesce($2, ocr_status),
            byte_size = coalesce($3, byte_size),
            checksum_sha256 = coalesce($4, checksum_sha256),
            object_version = coalesce($5, object_version),
            metadata = coalesce($6, metadata)
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `,
      [
        attachmentId,
        data.ocrStatus || null,
        data.byteSize ?? null,
        data.checksumSha256 || null,
        data.objectVersion || null,
        data.metadata || null
      ],
      client
    );
  }

  async updateSignedUrlLifecycle(attachmentId, expiresAt, client) {
    return this.queryOne(
      `
        UPDATE case_attachments
        SET last_signed_url_issued_at = now(),
            last_signed_url_expires_at = $2
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING *
      `,
      [attachmentId, expiresAt],
      client
    );
  }
}

module.exports = {
  AttachmentRepository
};
