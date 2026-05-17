function toIso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function toMessageDTO(row) {
  if (!row) return null;

  return {
    id: row.id,
    caseId: row.case_id,
    attachmentId: row.attachment_id,
    senderType: row.sender_type,
    senderId: row.sender_id,
    senderDisplayName: row.sender_display_name,
    channel: row.channel,
    messageType: row.message_type,
    bodyText: row.body_text,
    visibility: row.metadata?.visibility || 'admin',
    createdAt: toIso(row.created_at)
  };
}

module.exports = {
  toMessageDTO
};
