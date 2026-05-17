function toIso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function toOrganizationDTO(row) {
  if (!row) return null;

  return {
    id: row.id,
    organizationCode: row.organization_code,
    organizationName: row.organization_name,
    status: row.status,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
}

function toUserOrganizationDTO(row) {
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    organizationId: row.organization_id,
    roleNote: row.role_note,
    organization: {
      id: row.organization_id,
      organizationCode: row.organization_code,
      organizationName: row.organization_name,
      status: row.organization_status
    },
    userSummary: {
      displayName: row.user_display_name,
      email: row.user_email
    },
    createdAt: toIso(row.created_at)
  };
}

module.exports = {
  toOrganizationDTO,
  toUserOrganizationDTO
};
