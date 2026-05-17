function toIso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function toAIJobDTO(row) {
  if (!row) return null;

  return {
    id: row.id,
    organizationId: row.organization_id,
    lineChannelId: row.line_channel_id,
    customerId: row.customer_id,
    caseId: row.case_id,
    jobType: row.job_type,
    provider: row.provider,
    entityType: row.entity_type,
    entityId: row.entity_id,
    status: row.status,
    requestPayload: row.request_payload,
    responsePayload: row.response_payload,
    errorMessage: row.error_message,
    requestedByUserId: row.requested_by_user_id,
    startedAt: toIso(row.started_at),
    completedAt: toIso(row.completed_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
}

module.exports = {
  toAIJobDTO
};
