function toIso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function toAppointmentDTO(row) {
  if (!row) return null;

  return {
    id: row.id,
    caseId: row.case_id,
    dispatchAssignmentId: row.dispatch_assignment_id,
    scheduledStartAt: toIso(row.scheduled_start_at),
    scheduledEndAt: toIso(row.scheduled_end_at),
    appointmentStatus: row.appointment_status,
    visitType: row.visit_type,
    timezone: row.timezone,
    rescheduleReason: row.reschedule_reason,
    note: row.note,
    visitSequence: row.visit_sequence,
    visitResult: row.visit_result,
    incompleteReason: row.incomplete_reason,
    nextAction: row.next_action,
    actualArrivalAt: toIso(row.actual_arrival_at),
    actualFinishedAt: toIso(row.actual_finished_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
}

module.exports = {
  toAppointmentDTO
};
