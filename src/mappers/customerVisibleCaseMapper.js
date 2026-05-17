function toIso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

const CUSTOMER_VISIBLE_STATUS_CODE = Object.freeze({
  draft: 'processing',
  pending_customer: 'waiting_for_customer',
  submitted: 'submitted',
  reviewing: 'under_review',
  accepted: 'accepted',
  rejected: 'not_accepted',
  cancelled: 'cancelled',
  dispatch_pending: 'arranging_service',
  assigned: 'engineer_assigned',
  scheduled: 'scheduled',
  on_site: 'in_service',
  completed: 'completed',
  closed: 'closed'
});

const CUSTOMER_VISIBLE_STATUS = Object.freeze({
  draft: '處理中',
  pending_customer: '等待補件',
  submitted: '案件已送出',
  reviewing: '案件審核中',
  accepted: '已受理',
  rejected: '案件未受理',
  cancelled: '已取消',
  dispatch_pending: '安排派工中',
  assigned: '已指派工程師',
  scheduled: '已預約到府',
  on_site: '工程師處理中',
  completed: '服務已完成',
  closed: '案件已結案'
});

function toCustomerVisibleMessageDTO(row) {
  if (!row) return null;

  return {
    messageType: row.message_type,
    bodyText: row.body_text,
    createdAt: toIso(row.created_at)
  };
}

function toCustomerVisibleCaseDTO(caseRow, latestMessage = null) {
  if (!caseRow) return null;

  return {
    caseNo: caseRow.case_no,
    status: CUSTOMER_VISIBLE_STATUS_CODE[caseRow.status] || 'processing',
    customerVisibleStatus: CUSTOMER_VISIBLE_STATUS[caseRow.status] || '處理中',
    brand: caseRow.brand,
    productType: caseRow.product_type,
    modelNo: caseRow.model_no,
    createdAt: toIso(caseRow.created_at),
    updatedAt: toIso(caseRow.updated_at),
    preferredVisitTime: toIso(caseRow.preferred_visit_time),
    latestCustomerVisibleMessage: toCustomerVisibleMessageDTO(latestMessage),
    customerVisibleAttachments: []
  };
}

module.exports = {
  CUSTOMER_VISIBLE_STATUS_CODE,
  CUSTOMER_VISIBLE_STATUS,
  toCustomerVisibleCaseDTO
};
