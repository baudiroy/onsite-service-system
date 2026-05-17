function toIso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function toFieldServiceReportDTO(row) {
  if (!row) return null;

  return {
    id: row.id,
    caseId: row.case_id,
    finalAppointmentId: row.final_appointment_id,
    diagnosisResult: row.diagnosis_result,
    repairAction: row.repair_action,
    repairResult: row.repair_result,
    serviceStatus: row.service_status,
    engineerNote: row.engineer_note,
    customerNote: row.customer_note,
    installationChecklist: row.installation_checklist,
    onsiteStartedAt: toIso(row.onsite_started_at),
    onsiteCompletedAt: toIso(row.onsite_completed_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
}

function toServicePartDTO(row) {
  if (!row) return null;

  return {
    id: row.id,
    serviceReportId: row.service_report_id,
    partName: row.part_name,
    partNo: row.part_no,
    quantity: row.quantity,
    oldSerialNo: row.old_serial_no,
    newSerialNo: row.new_serial_no,
    partStatus: row.part_status,
    replacedAt: toIso(row.replaced_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
}

module.exports = {
  toFieldServiceReportDTO,
  toServicePartDTO
};
