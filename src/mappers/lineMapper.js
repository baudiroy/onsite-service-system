function toIso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function maskSecret(value) {
  if (!value) return null;
  return '[masked]';
}

function maskLineUserId(value) {
  if (!value) return null;
  if (value.length <= 8) return '***';
  return `${value.slice(0, 6)}***${value.slice(-4)}`;
}

function toLineChannelDTO(row) {
  if (!row) return null;

  return {
    id: row.id,
    organizationId: row.organization_id,
    channelCode: row.channel_code,
    channelName: row.channel_name,
    channelId: row.channel_id,
    channelSecret: maskSecret(row.channel_secret),
    channelAccessToken: maskSecret(row.channel_access_token),
    webhookPath: row.webhook_path,
    enabled: row.enabled,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
}

function toLineEventDTO(row) {
  if (!row) return null;

  return {
    id: row.id,
    organizationId: row.organization_id,
    lineChannelId: row.line_channel_id,
    lineUserId: row.line_user_id ? '[masked]' : null,
    eventType: row.event_type,
    messageType: row.message_type,
    externalEventId: row.external_event_id,
    linkedCustomerId: row.linked_customer_id,
    linkedCaseId: row.linked_case_id,
    processedStatus: row.processed_status,
    createdAt: toIso(row.created_at)
  };
}

function toCustomerLineIdentityDTO(row) {
  if (!row) return null;

  return {
    id: row.id,
    customerId: row.customer_id,
    organizationId: row.organization_id,
    lineChannelId: row.line_channel_id,
    channelCode: row.channel_code || null,
    channelName: row.channel_name || null,
    lineUserIdMasked: maskLineUserId(row.line_user_id),
    displayName: row.display_name || null,
    linkedAt: toIso(row.linked_at),
    createdAt: toIso(row.created_at)
  };
}

module.exports = {
  toLineChannelDTO,
  toLineEventDTO,
  toCustomerLineIdentityDTO,
  maskLineUserId
};
