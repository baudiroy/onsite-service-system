function toIso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function toNotificationPreferenceDTO(row) {
  if (!row) return null;

  return {
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    eventKey: row.event_key,
    channel: row.channel,
    enabled: row.enabled,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
}

function toNotificationTemplateDTO(row) {
  if (!row) return null;

  return {
    id: row.id,
    eventKey: row.event_key,
    channel: row.channel,
    templateName: row.template_name,
    subject: row.subject,
    bodyTemplate: row.body_template,
    enabled: row.enabled,
    version: row.version,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
}

function toNotificationLogDTO(row) {
  if (!row) return null;

  return {
    id: row.id,
    eventKey: row.event_key,
    channel: row.channel,
    targetType: row.target_type,
    targetId: row.target_id,
    recipient: row.recipient,
    status: row.status,
    payload: row.payload,
    providerResponse: row.provider_response,
    errorMessage: row.error_message,
    createdAt: toIso(row.created_at),
    sentAt: toIso(row.sent_at)
  };
}

module.exports = {
  toNotificationPreferenceDTO,
  toNotificationTemplateDTO,
  toNotificationLogDTO
};
