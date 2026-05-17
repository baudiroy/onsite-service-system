function toIso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function toAdminCaseDTO(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    organizationId: row.organization_id,
    organizationSummary: row.organization_id ? {
      code: row.organization_code || null,
      name: row.organization_name || null
    } : null,
    intakeLineChannelId: row.intake_line_channel_id,
    caseNo: row.case_no,
    customerId: row.customer_id,
    customerSummary: {
      name: row.customer_name,
      mobile: row.customer_mobile,
      tel: row.customer_tel,
      city: row.customer_city,
      address: row.customer_address
    },
    status: row.status,
    priority: row.priority,
    warrantyStatus: row.warranty_status,
    appointmentStatus: row.appointment_status,
    completionStatus: row.completion_status,
    source: row.source,
    brand: row.brand,
    caseType: row.case_type,
    productType: row.product_type,
    modelNo: row.model_no,
    serialNo: row.serial_no,
    invoiceDate: row.invoice_date,
    problemDescription: row.problem_description,
    preferredVisitTime: toIso(row.preferred_visit_time),
    serviceRegion: row.service_region,
    aiSummary: row.ai_summary,
    aiOcrStatus: row.ai_ocr_status,
    aiSuggestedDispatchUnitId: row.ai_suggested_dispatch_unit_id,
    dispatchUnitId: row.dispatch_unit_id,
    dispatchAssignmentSource: row.dispatch_assignment_source,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    submittedAt: toIso(row.submitted_at),
    reviewedAt: toIso(row.reviewed_at),
    acceptedAt: toIso(row.accepted_at),
    rejectedAt: toIso(row.rejected_at),
    cancelledAt: toIso(row.cancelled_at),
    closedAt: toIso(row.closed_at),
    scheduledAt: toIso(row.scheduled_at),
    completedAt: toIso(row.completed_at),
    lastCustomerMessageAt: toIso(row.last_customer_message_at),
    lastInternalActivityAt: toIso(row.last_internal_activity_at)
  };
}

module.exports = {
  toAdminCaseDTO
};
