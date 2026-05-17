function toIso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function toAttachmentDTO(row) {
  if (!row) return null;

  return {
    id: row.id,
    caseId: row.case_id,
    attachmentType: row.attachment_type,
    storageProvider: row.storage_provider,
    originalFilename: row.original_filename,
    contentType: row.content_type,
    byteSize: row.byte_size === null || row.byte_size === undefined ? null : Number(row.byte_size),
    checksumSha256: row.checksum_sha256,
    uploadedByType: row.uploaded_by_type,
    uploadedById: row.uploaded_by_id,
    sourceChannel: row.source_channel,
    ocrStatus: row.ocr_status,
    ocrResult: row.ocr_result || row.ai_extraction_result || null,
    ocrConfidence: row.ocr_confidence ?? row.ai_extraction_confidence ?? null,
    ocrProcessedAt: toIso(row.ocr_processed_at),
    objectVersion: row.object_version,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
}

module.exports = {
  toAttachmentDTO
};
