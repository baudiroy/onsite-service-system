function toIso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function toApiStatus(dbStatus) {
  return dbStatus === 'inactive' ? 'disabled' : dbStatus;
}

function toDbStatus(apiStatus) {
  return apiStatus === 'disabled' ? 'inactive' : apiStatus;
}

function toUserDTO(row, { roles = null, organizations = null } = {}) {
  if (!row) return null;

  const dto = {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    userType: row.user_type,
    status: toApiStatus(row.status),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };

  if (roles) dto.roles = roles;
  if (organizations) dto.organizations = organizations;

  return dto;
}

function toUserRoleDTO(row) {
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    roleId: row.role_id,
    roleKey: row.role_key,
    name: row.name,
    description: row.description,
    enabled: row.enabled,
    assignedBy: row.assigned_by,
    assignedAt: toIso(row.assigned_at)
  };
}

module.exports = {
  toApiStatus,
  toDbStatus,
  toUserDTO,
  toUserRoleDTO
};
