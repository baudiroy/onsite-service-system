function toIso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function toDispatchAssignmentDTO(row) {
  if (!row) return null;

  return {
    id: row.id,
    caseId: row.case_id,
    dispatchUnitId: row.dispatch_unit_id,
    assignedEngineerId: row.assigned_engineer_id,
    dispatchStatus: row.dispatch_status,
    assignmentNote: row.assignment_note,
    assignedAt: toIso(row.assigned_at),
    assignedByUserId: row.assigned_by_user_id,
    reassignedByUserId: row.reassigned_by_user_id,
    reassignedAt: toIso(row.reassigned_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
}

module.exports = {
  toDispatchAssignmentDTO
};
