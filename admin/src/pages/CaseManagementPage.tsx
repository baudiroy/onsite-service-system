import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AdminCase,
  CasePriority,
  CaseSource,
  CaseStatus,
  CaseType,
  WarrantyStatus,
  acceptCase,
  cancelCase,
  closeCase,
  createCase,
  getCase,
  listCases,
  rejectCase,
  reviewCase,
  submitCase,
  updateCase
} from '../api/cases';
import {
  AttachmentType,
  CaseAttachment,
  completeAttachmentUpload,
  createAttachmentDownloadUrl,
  createAttachmentUploadUrl,
  deleteAttachment,
  listCaseAttachments,
  requestAttachmentOcr,
  uploadFileToSignedUrl
} from '../api/caseAttachments';
import {
  BillingRecord,
  BillingStatus,
  Settlement,
  SettlementStatus,
  SettlementTargetType,
  createBillingSettlement,
  createCaseBilling,
  getCaseBilling,
  listBillingSettlements,
  updateBilling,
  updateSettlement
} from '../api/billing';
import {
  Appointment,
  AppointmentStatus,
  VisitType,
  createCaseAppointment,
  createDispatchAssignment,
  listCaseAppointments,
  updateAppointment,
  updateDispatchAssignment
} from '../api/caseDispatch';
import {
  FieldServiceReport,
  PartStatus,
  ServicePart,
  ServiceStatus,
  UpdateServiceReportPayload,
  addServicePart,
  createCaseServiceReport,
  deleteServicePart,
  getCaseServiceReport,
  listServiceParts,
  updateServicePart,
  updateServiceReport
} from '../api/fieldServiceReports';
import {
  CaseMessage,
  CaseMessageSort,
  createCaseMessage,
  deleteCaseMessage,
  listCaseMessages
} from '../api/caseMessages';
import { DispatchUnit, listDispatchUnits } from '../api/dispatchUnits';
import { Organization, listOrganizations } from '../api/organizations';
import { AdminUser, listUsers } from '../api/users';
import { useAuth } from '../auth/AuthContext';
import { CustomerLineIdentitiesPanel } from '../components/CustomerLineIdentitiesPanel';
import { ApiError } from '../lib/apiClient';
import {
  AvailableCaseAction,
  getAvailableCaseActions,
  getCaseActionLabel,
  getCaseStatusLabel
} from '../utils/caseWorkflow';
import { getCaseCloseReadiness } from '../utils/caseClose';

type CreateCaseFormState = {
  organizationId: string;
  customerName: string;
  mobile: string;
  tel: string;
  city: string;
  address: string;
  source: CaseSource;
  brand: string;
  caseType: CaseType;
  productType: string;
  modelNo: string;
  serialNo: string;
  invoiceDate: string;
  problemDescription: string;
  preferredVisitTime: string;
  priority: CasePriority;
  warrantyStatus: WarrantyStatus;
  serviceRegion: string;
};

type EditCaseFormState = Pick<
  CreateCaseFormState,
  | 'brand'
  | 'caseType'
  | 'productType'
  | 'modelNo'
  | 'serialNo'
  | 'invoiceDate'
  | 'problemDescription'
  | 'preferredVisitTime'
  | 'priority'
  | 'warrantyStatus'
  | 'serviceRegion'
>;

type DetailState = {
  adminCase: AdminCase | null;
  loading: boolean;
  error: string;
};

type WorkflowFormState = {
  reason: string;
  note: string;
};

type AttachmentUploadFormState = {
  attachmentType: AttachmentType;
  file: File | null;
};

type DispatchFormState = {
  dispatchUnitId: string;
  assignedEngineerId: string;
  assignmentNote: string;
};

type AppointmentFormState = {
  scheduledStartAt: string;
  scheduledEndAt: string;
  visitType: VisitType;
  timezone: string;
  note: string;
};

type AppointmentEditFormState = AppointmentFormState & {
  rescheduleReason: string;
  appointmentStatus: AppointmentStatus | '';
};

type AppointmentResultFormState = {
  visitResult: string;
  incompleteReason: string;
  nextAction: string;
  actualArrivalAt: string;
  actualFinishedAt: string;
  note: string;
};

type ServiceReportFormState = {
  diagnosisResult: string;
  repairAction: string;
  repairResult: string;
  engineerNote: string;
  customerNote: string;
  serviceStatus: ServiceStatus | '';
};

type ServicePartFormState = {
  partName: string;
  partNo: string;
  quantity: string;
  oldSerialNo: string;
  newSerialNo: string;
  partStatus: PartStatus;
  replacedAt: string;
};

type BillingFormState = {
  laborAmount: string;
  partsAmount: string;
  transportAmount: string;
  additionalAmount: string;
  customerChargeAmount: string;
  manufacturerClaimAmount: string;
  warrantyAmount: string;
  billingStatus: BillingStatus;
  billingNote: string;
};

type SettlementFormState = {
  settlementTargetType: SettlementTargetType;
  settlementTargetId: string;
  settlementAmount: string;
  settlementStatus: SettlementStatus;
  settlementNote: string;
};

type SettlementEditFormState = {
  settlementStatus: SettlementStatus;
  settlementNote: string;
};

const DEFAULT_LIMIT = 20;

const CASE_STATUS_OPTIONS: CaseStatus[] = [
  'draft',
  'pending_customer',
  'submitted',
  'reviewing',
  'accepted',
  'rejected',
  'cancelled',
  'dispatch_pending',
  'assigned',
  'scheduled',
  'on_site',
  'completed',
  'closed'
];
const PRIORITY_OPTIONS: CasePriority[] = ['low', 'normal', 'high', 'urgent', 'vip'];
const CASE_TYPE_OPTIONS: CaseType[] = ['repair', 'installation', 'maintenance', 'inspection', 'return', 'warranty', 'other'];
const SOURCE_OPTIONS: CaseSource[] = ['admin', 'line', 'website', 'api', 'phone', 'email', 'whatsapp', 'facebook', 'instagram'];
const WARRANTY_OPTIONS: WarrantyStatus[] = ['unknown', 'pending_review', 'in_warranty', 'out_of_warranty'];

const PRIORITY_LABELS: Record<string, string> = {
  low: '低',
  normal: '一般',
  high: '高',
  urgent: '急件',
  vip: 'VIP'
};

const CASE_TYPE_LABELS: Record<string, string> = {
  repair: '維修',
  installation: '安裝',
  maintenance: '保養',
  inspection: '檢測',
  return: '退換',
  warranty: '保固',
  other: '其他'
};

const WARRANTY_LABELS: Record<string, string> = {
  unknown: '未知',
  pending_review: '待確認',
  in_warranty: '保固內',
  out_of_warranty: '保固外'
};

const MESSAGE_TYPE_LABELS: Record<string, string> = {
  internal_note: '內部備註',
  system_event: '系統事件',
  customer_note: '客戶備註',
  workflow_event: '流程事件',
  line_message: 'LINE 訊息',
  ai_summary: 'AI 摘要',
  dispatch_note: '派工備註',
  engineer_note: '工程師備註'
};

const MESSAGE_LIMIT = 50;
const INTERNAL_NOTE_MAX_LENGTH = 2000;
const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

const ATTACHMENT_TYPE_OPTIONS: AttachmentType[] = [
  'fault_photo',
  'serial_photo',
  'invoice_photo',
  'product_photo',
  'issue_photo',
  'completion_photo',
  'signature',
  'other'
];

const ATTACHMENT_TYPE_LABELS: Record<string, string> = {
  fault_photo: '故障照片',
  serial_photo: '序號照片',
  invoice_photo: '發票照片',
  product_photo: '產品照片',
  issue_photo: '問題照片',
  completion_photo: '完修照片',
  signature: '簽名',
  other: '其他',
  faulty_part_photo: '故障零件照片',
  new_part_photo: '新零件照片',
  old_serial_photo: '舊序號照片',
  new_serial_photo: '新序號照片'
};

const OCR_ATTACHMENT_TYPES = new Set(['serial_photo', 'invoice_photo']);
const DISPATCH_READY_STATUSES = new Set(['accepted', 'dispatch_pending', 'assigned']);
const APPOINTMENT_READY_STATUSES = new Set(['accepted', 'dispatch_pending', 'assigned', 'scheduled']);
const APPOINTMENT_LIMIT = 50;

const VISIT_TYPE_OPTIONS: VisitType[] = ['repair', 'installation', 'inspection'];
const VISIT_TYPE_LABELS: Record<string, string> = {
  repair: '維修',
  installation: '安裝',
  inspection: '檢查'
};

const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  scheduled: '已預約',
  rescheduled: '已改期',
  cancelled: '已取消',
  completed: '已完成',
  no_show: '未到 / 未遇'
};

const VISIT_RESULT_LABELS: Record<string, string> = {
  completed: '已完成',
  pending_parts: '缺料',
  pending_quote: '需報價',
  need_second_visit: '需二次到府',
  customer_not_home: '客戶不在',
  customer_cancelled: '客戶取消',
  unable_to_repair: '無法維修',
  rescheduled: '已改期',
  no_show: '未到 / 空趟',
  cancelled: '已取消',
  other: '其他'
};

const VISIT_RESULT_OPTIONS = [
  'completed',
  'pending_parts',
  'pending_quote',
  'need_second_visit',
  'customer_not_home',
  'customer_cancelled',
  'unable_to_repair',
  'rescheduled',
  'no_show'
];

const NEXT_ACTION_LABELS: Record<string, string> = {
  close_case: '可結案',
  schedule_follow_up: '安排二次到府',
  wait_for_parts: '等待零件',
  wait_for_quote: '等待報價',
  wait_for_quote_approval: '等待報價核准',
  contact_customer: '聯繫客戶',
  manager_review: '主管確認',
  no_action: '無下一步',
  other: '其他'
};

const NEXT_ACTION_OPTIONS = [
  'close_case',
  'schedule_follow_up',
  'wait_for_parts',
  'wait_for_quote_approval',
  'contact_customer',
  'manager_review',
  'no_action'
];

const VISIT_RESULT_GUIDANCE: Record<string, string> = {
  completed: '表示本次到府已完成服務。後續完成正式服務報告時，後端會以 completed visit 推論 finalAppointmentId。',
  pending_parts: '表示本次因缺料未完成。通常下一步是等待零件，零件到位後再建立下一筆到府預約。',
  pending_quote: '表示本次需要報價或等待客戶核准。通常下一步是等待報價核准或聯繫客戶。',
  need_second_visit: '表示本次無法完修且需要二次到府。請補上未完成原因，後續再建立下一筆 appointment。',
  customer_not_home: '表示工程師到場但客戶不在。通常下一步是聯繫客戶或重新安排到府。',
  customer_cancelled: '表示客戶取消本次到府。請確認是否仍需後續聯繫、重約或主管確認。',
  unable_to_repair: '表示本次判定無法維修。通常需要主管確認或後續人工處理。',
  rescheduled: '表示本次到府已改期。若只是改時間，可優先使用「編輯 / 改期」。',
  no_show: '表示本次未遇 / 空趟。通常下一步是聯繫客戶或重新安排到府。'
};

const NEXT_ACTION_GUIDANCE: Record<string, string> = {
  close_case: '表示這次結果已可進入服務報告完修或後續結案流程，但本操作本身不會自動結案。',
  schedule_follow_up: '表示需要再安排下一次到府。儲存 terminal 到府結果後，即可建立下一筆 appointment。',
  wait_for_parts: '表示目前卡在備料。零件到位後再建立下一筆到府預約。',
  wait_for_quote_approval: '表示目前卡在報價核准。核准後再安排下一步。',
  contact_customer: '表示需要先聯繫客戶，例如重新約時間或補資料。',
  manager_review: '表示需要主管確認後再決定下一步。',
  no_action: '表示目前沒有額外下一步。通常用於已完成或已不需後續處理的到府結果。'
};

const TERMINAL_APPOINTMENT_STATUSES = new Set(['cancelled', 'completed', 'no_show']);
const TERMINAL_VISIT_RESULTS = new Set([
  'completed',
  'pending_parts',
  'pending_quote',
  'need_second_visit',
  'customer_not_home',
  'customer_cancelled',
  'unable_to_repair',
  'rescheduled',
  'no_show'
]);

const SERVICE_READY_STATUSES = new Set(['assigned', 'scheduled', 'on_site']);
const SERVICE_PART_LIMIT = 50;
const SERVICE_STATUS_OPTIONS: ServiceStatus[] = ['in_progress', 'pending_parts', 'completed', 'cancelled'];
const SERVICE_STATUS_LABELS: Record<string, string> = {
  in_progress: '處理中',
  pending_parts: '待料',
  completed: '已完修',
  cancelled: '已取消'
};
const PART_STATUS_OPTIONS: PartStatus[] = ['planned', 'used', 'replaced', 'returned', 'cancelled'];
const PART_STATUS_LABELS: Record<string, string> = {
  planned: '計畫使用',
  used: '已使用',
  replaced: '已更換',
  returned: '已退回',
  cancelled: '已取消'
};

const BILLING_READY_STATUSES = new Set(['completed', 'closed']);
const SETTLEMENT_LIMIT = 50;
const BILLING_STATUS_OPTIONS: BillingStatus[] = ['draft', 'pending_review', 'approved', 'submitted', 'settled', 'cancelled'];
const BILLING_STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  pending_review: '待審核',
  approved: '已核准',
  submitted: '已送出',
  settled: '已結算',
  cancelled: '已取消'
};
const SETTLEMENT_TARGET_OPTIONS: SettlementTargetType[] = ['engineer', 'manufacturer', 'internal'];
const SETTLEMENT_TARGET_LABELS: Record<string, string> = {
  engineer: '工程師',
  manufacturer: '原廠 / 製造商',
  internal: '內部',
  vendor: '廠商',
  distributor: '經銷商',
  partner: '合作夥伴',
  subcontractor: '外包商'
};
const SETTLEMENT_STATUS_OPTIONS: SettlementStatus[] = ['pending', 'submitted', 'completed', 'rejected'];
const SETTLEMENT_STATUS_LABELS: Record<string, string> = {
  pending: '待處理',
  submitted: '已送出',
  completed: '已完成',
  rejected: '已退回'
};

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatBytes(value?: number | null) {
  if (value === null || value === undefined) return '-';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function toDateTimeInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function fromDateTimeInput(value: string) {
  if (!value.trim()) return undefined;
  return new Date(value).toISOString();
}

function dateFilterToIso(value: string, endOfDay = false) {
  if (!value) return undefined;
  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`);
  return date.toISOString();
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const requestId = import.meta.env.DEV && error.requestId ? `（requestId: ${error.requestId}）` : '';
    return `${error.message || '操作失敗，請稍後再試。'}${requestId}`;
  }

  return '操作失敗，請稍後再試。';
}

function isAdminLikeUser(currentUser: ReturnType<typeof useAuth>['currentUser'], hasRole: (roleKey: string) => boolean) {
  return Boolean(currentUser?.userType === 'system' || hasRole('admin') || hasRole('system'));
}

function getInitialCreateForm(organizationId = ''): CreateCaseFormState {
  return {
    organizationId,
    customerName: '',
    mobile: '',
    tel: '',
    city: '',
    address: '',
    source: 'admin',
    brand: '',
    caseType: 'repair',
    productType: '',
    modelNo: '',
    serialNo: '',
    invoiceDate: '',
    problemDescription: '',
    preferredVisitTime: '',
    priority: 'normal',
    warrantyStatus: 'unknown',
    serviceRegion: ''
  };
}

function editFormFromCase(adminCase: AdminCase): EditCaseFormState {
  return {
    brand: adminCase.brand || '',
    caseType: adminCase.caseType || 'repair',
    productType: adminCase.productType || '',
    modelNo: adminCase.modelNo || '',
    serialNo: adminCase.serialNo || '',
    invoiceDate: adminCase.invoiceDate || '',
    problemDescription: adminCase.problemDescription || '',
    preferredVisitTime: toDateTimeInput(adminCase.preferredVisitTime),
    priority: adminCase.priority || 'normal',
    warrantyStatus: adminCase.warrantyStatus || 'unknown',
    serviceRegion: adminCase.serviceRegion || ''
  };
}

function validateCreateForm(form: CreateCaseFormState) {
  if (!form.organizationId.trim()) return '請選擇或輸入 organizationId。';
  if (!form.customerName.trim()) return '請輸入客戶姓名。';
  if (!form.mobile.trim()) return '請輸入手機。';
  if (!form.city.trim()) return '請輸入城市。';
  if (!form.address.trim()) return '請輸入地址。';
  if (!form.brand.trim()) return '請輸入品牌。';
  if (!form.productType.trim()) return '請輸入產品類型。';
  if (!form.modelNo.trim()) return '請輸入型號。';
  if (!form.problemDescription.trim()) return '請輸入問題描述。';
  if (!CASE_TYPE_OPTIONS.includes(form.caseType)) return '案件類型不正確。';
  if (!PRIORITY_OPTIONS.includes(form.priority)) return '優先度不正確。';
  if (!WARRANTY_OPTIONS.includes(form.warrantyStatus)) return '保固狀態不正確。';
  return '';
}

function validateEditForm(form: EditCaseFormState) {
  if (!form.brand.trim()) return '請輸入品牌。';
  if (!form.productType.trim()) return '請輸入產品類型。';
  if (!form.modelNo.trim()) return '請輸入型號。';
  if (!form.problemDescription.trim()) return '請輸入問題描述。';
  if (!CASE_TYPE_OPTIONS.includes(form.caseType)) return '案件類型不正確。';
  if (!PRIORITY_OPTIONS.includes(form.priority)) return '優先度不正確。';
  if (!WARRANTY_OPTIONS.includes(form.warrantyStatus)) return '保固狀態不正確。';
  return '';
}

function caseStatusLabel(status?: string | null) {
  return getCaseStatusLabel(status);
}

function customerInquiryPreviewHref(adminCase: AdminCase) {
  const params = new URLSearchParams();
  if (adminCase.caseNo) params.set('caseNo', adminCase.caseNo);
  const mobile = adminCase.customerSummary?.mobile?.trim();
  if (mobile) params.set('mobile', mobile);
  const query = params.toString();
  return `/customer-inquiries${query ? `?${query}` : ''}`;
}

function initialCaseNoFromQueryString() {
  return new URLSearchParams(window.location.search).get('caseNo')?.trim() || '';
}

function initialCaseIdFromQueryString() {
  return new URLSearchParams(window.location.search).get('caseId')?.trim() || '';
}

function syncCasesQueryString(updates: { caseNo?: string | null; caseId?: string | null }) {
  const params = new URLSearchParams(window.location.search);

  if ('caseNo' in updates) {
    const trimmedCaseNo = updates.caseNo?.trim() || '';
    if (trimmedCaseNo) {
      params.set('caseNo', trimmedCaseNo);
    } else {
      params.delete('caseNo');
    }
  }

  if ('caseId' in updates) {
    const trimmedCaseId = updates.caseId?.trim() || '';
    if (trimmedCaseId) {
      params.set('caseId', trimmedCaseId);
    } else {
      params.delete('caseId');
    }
  }

  const query = params.toString();
  window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
}

function getCaseStatusClass(status?: string | null) {
  if (status === 'cancelled' || status === 'rejected') return 'is-disabled';
  if (status === 'closed' || status === 'completed' || status === 'accepted') return 'is-active';
  return 'is-pending';
}

function messageTypeLabel(messageType?: string | null) {
  if (!messageType) return '其他';
  return MESSAGE_TYPE_LABELS[messageType] || '其他';
}

function messageSenderLabel(message: CaseMessage) {
  if (message.senderDisplayName) return message.senderDisplayName;
  if (message.senderType) return message.senderType;
  return 'system';
}

function attachmentTypeLabel(attachmentType?: string | null) {
  if (!attachmentType) return '其他';
  return ATTACHMENT_TYPE_LABELS[attachmentType] || attachmentType;
}

function ocrStatusLabel(status?: string | null) {
  if (!status) return '-';
  const labels: Record<string, string> = {
    not_started: '未開始',
    pending: '待處理',
    processing: '處理中',
    manual_review: '待人工確認',
    completed: '已完成',
    failed: '失敗'
  };
  return labels[status] || status;
}

function defaultAttachmentUploadForm(): AttachmentUploadFormState {
  return {
    attachmentType: 'serial_photo',
    file: null
  };
}

function defaultDispatchForm(): DispatchFormState {
  return {
    dispatchUnitId: '',
    assignedEngineerId: '',
    assignmentNote: ''
  };
}

function defaultAppointmentForm(caseType?: string | null): AppointmentFormState {
  return {
    scheduledStartAt: '',
    scheduledEndAt: '',
    visitType: caseType === 'installation' || caseType === 'inspection' ? caseType : 'repair',
    timezone: 'Asia/Taipei',
    note: ''
  };
}

function appointmentEditFormFromAppointment(appointment: Appointment): AppointmentEditFormState {
  return {
    scheduledStartAt: toDateTimeInput(appointment.scheduledStartAt),
    scheduledEndAt: toDateTimeInput(appointment.scheduledEndAt),
    visitType: appointment.visitType === 'installation' || appointment.visitType === 'inspection' ? appointment.visitType : 'repair',
    timezone: appointment.timezone || 'Asia/Taipei',
    note: appointment.note || '',
    rescheduleReason: appointment.rescheduleReason || '',
    appointmentStatus: ''
  };
}

function appointmentResultFormFromAppointment(appointment: Appointment): AppointmentResultFormState {
  return {
    visitResult: appointment.visitResult || '',
    incompleteReason: appointment.incompleteReason || '',
    nextAction: appointment.nextAction || '',
    actualArrivalAt: toDateTimeInput(appointment.actualArrivalAt),
    actualFinishedAt: toDateTimeInput(appointment.actualFinishedAt),
    note: appointment.note || ''
  };
}

function validateAppointmentRange(startValue: string, endValue: string) {
  if (!startValue) return '請輸入預約開始時間。';
  if (!endValue) return '請輸入預約結束時間。';

  const start = new Date(startValue);
  const end = new Date(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return '預約結束時間必須晚於開始時間。';
  }

  return '';
}

function validateAppointmentResultForm(form: AppointmentResultFormState) {
  if (!form.visitResult) return '請選擇到府結果。';

  if (form.actualArrivalAt && form.actualFinishedAt) {
    const arrival = new Date(form.actualArrivalAt);
    const finished = new Date(form.actualFinishedAt);
    if (
      Number.isNaN(arrival.getTime()) ||
      Number.isNaN(finished.getTime()) ||
      finished < arrival
    ) {
      return '實際完成時間必須晚於或等於實際到場時間。';
    }
  }

  return '';
}

function serviceStatusLabel(status?: string | null) {
  if (!status) return '-';
  return SERVICE_STATUS_LABELS[status] || status;
}

function visitResultLabel(result?: string | null) {
  if (!result) return '未記錄';
  return VISIT_RESULT_LABELS[result] || result;
}

function nextActionLabel(action?: string | null) {
  if (!action) return '—';
  return NEXT_ACTION_LABELS[action] || action;
}

function visitResultGuidance(result?: string | null) {
  if (!result) return '';
  return VISIT_RESULT_GUIDANCE[result] || '';
}

function nextActionGuidance(action?: string | null) {
  if (!action) return '';
  return NEXT_ACTION_GUIDANCE[action] || '';
}

function partStatusLabel(status?: string | null) {
  if (!status) return '-';
  return PART_STATUS_LABELS[status] || status;
}

function emptyDash(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

function formatVisitDate(value?: string | null) {
  if (!value) return '—';
  return formatDate(value);
}

function getAppointmentSortTime(appointment: Appointment) {
  const dateValue = appointment.scheduledStartAt || appointment.createdAt || '';
  const timestamp = Date.parse(dateValue);
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

function getAppointmentLatestTime(appointment: Appointment, key: 'actualFinishedAt' | 'scheduledEndAt') {
  const timestamp = Date.parse(appointment[key] || '');
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

function sortVisitHistory(appointments: Appointment[]) {
  return appointments
    .map((appointment, index) => ({ appointment, index }))
    .sort((left, right) => {
      const leftSequence = left.appointment.visitSequence;
      const rightSequence = right.appointment.visitSequence;

      if (typeof leftSequence === 'number' && typeof rightSequence === 'number' && leftSequence !== rightSequence) {
        return leftSequence - rightSequence;
      }
      if (typeof leftSequence === 'number' && typeof rightSequence !== 'number') return -1;
      if (typeof leftSequence !== 'number' && typeof rightSequence === 'number') return 1;

      const timeDelta = getAppointmentSortTime(left.appointment) - getAppointmentSortTime(right.appointment);
      if (timeDelta !== 0) return timeDelta;

      return left.index - right.index;
    })
    .map(({ appointment }) => appointment);
}

function isCompletedVisit(appointment: Appointment) {
  return appointment.visitResult?.toLowerCase() === 'completed';
}

function isTerminalAppointment(appointment: Appointment) {
  const appointmentStatus = appointment.appointmentStatus?.toLowerCase();
  const visitResult = appointment.visitResult?.toLowerCase();
  return Boolean(
    TERMINAL_APPOINTMENT_STATUSES.has(appointmentStatus) ||
    (visitResult && TERMINAL_VISIT_RESULTS.has(visitResult))
  );
}

function isOpenAppointment(appointment: Appointment) {
  return !isTerminalAppointment(appointment);
}

function canShowAppointmentResultAction(appointment: Appointment) {
  const appointmentStatus = appointment.appointmentStatus?.toLowerCase();
  return !appointmentStatus || !TERMINAL_APPOINTMENT_STATUSES.has(appointmentStatus);
}

function getAutoFinalAppointment(appointments: Appointment[]) {
  const completedAppointments = appointments
    .map((appointment, index) => ({ appointment, index }))
    .filter(({ appointment }) => isCompletedVisit(appointment));

  if (completedAppointments.length === 0) return null;

  return completedAppointments
    .sort((left, right) => {
      const leftSequence = typeof left.appointment.visitSequence === 'number'
        ? left.appointment.visitSequence
        : Number.NEGATIVE_INFINITY;
      const rightSequence = typeof right.appointment.visitSequence === 'number'
        ? right.appointment.visitSequence
        : Number.NEGATIVE_INFINITY;

      if (leftSequence !== rightSequence) return rightSequence - leftSequence;

      const actualFinishedDelta = getAppointmentLatestTime(right.appointment, 'actualFinishedAt') -
        getAppointmentLatestTime(left.appointment, 'actualFinishedAt');
      if (actualFinishedDelta !== 0) return actualFinishedDelta;

      const scheduledEndDelta = getAppointmentLatestTime(right.appointment, 'scheduledEndAt') -
        getAppointmentLatestTime(left.appointment, 'scheduledEndAt');
      if (scheduledEndDelta !== 0) return scheduledEndDelta;

      return right.index - left.index;
    })[0].appointment;
}

function describeAppointmentForConfirmation(appointment: Appointment) {
  if (appointment.visitSequence) return `第 ${appointment.visitSequence} 次`;
  const scheduledEnd = formatVisitDate(appointment.scheduledEndAt);
  if (scheduledEnd !== '—') return `預約結束時間 ${scheduledEnd}`;
  return `appointment ${appointment.id}`;
}

function defaultServiceReportForm(): ServiceReportFormState {
  return {
    diagnosisResult: '',
    repairAction: '',
    repairResult: '',
    engineerNote: '',
    customerNote: '',
    serviceStatus: ''
  };
}

function serviceReportFormFromReport(report: FieldServiceReport): ServiceReportFormState {
  return {
    diagnosisResult: report.diagnosisResult || '',
    repairAction: report.repairAction || '',
    repairResult: report.repairResult || '',
    engineerNote: report.engineerNote || '',
    customerNote: report.customerNote || '',
    serviceStatus: SERVICE_STATUS_OPTIONS.includes(report.serviceStatus as ServiceStatus)
      ? report.serviceStatus as ServiceStatus
      : ''
  };
}

function defaultServicePartForm(): ServicePartFormState {
  return {
    partName: '',
    partNo: '',
    quantity: '1',
    oldSerialNo: '',
    newSerialNo: '',
    partStatus: 'replaced',
    replacedAt: ''
  };
}

function servicePartFormFromPart(part: ServicePart): ServicePartFormState {
  return {
    partName: part.partName || '',
    partNo: part.partNo || '',
    quantity: String(part.quantity || 1),
    oldSerialNo: part.oldSerialNo || '',
    newSerialNo: part.newSerialNo || '',
    partStatus: PART_STATUS_OPTIONS.includes(part.partStatus as PartStatus) ? part.partStatus as PartStatus : 'replaced',
    replacedAt: toDateTimeInput(part.replacedAt)
  };
}

function validateServiceReportForm(form: ServiceReportFormState, hasReport: boolean) {
  const hasText = Boolean(
    form.diagnosisResult.trim() ||
    form.repairAction.trim() ||
    form.repairResult.trim() ||
    form.engineerNote.trim() ||
    form.customerNote.trim()
  );

  if (!hasReport && !hasText) return '請至少填寫診斷結果、維修動作或工程師備註。';
  if (form.serviceStatus && !SERVICE_STATUS_OPTIONS.includes(form.serviceStatus)) return '服務狀態不正確。';
  return '';
}

function validateServicePartForm(form: ServicePartFormState) {
  if (!form.partName.trim()) return '請輸入零件名稱。';
  const quantity = Number(form.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) return '零件數量必須是至少 1 的整數。';
  if (!PART_STATUS_OPTIONS.includes(form.partStatus)) return '零件狀態不正確。';
  if (form.replacedAt && !fromDateTimeInput(form.replacedAt)) return '更換時間格式不正確。';
  return '';
}

function billingStatusLabel(status?: string | null) {
  if (!status) return '-';
  return BILLING_STATUS_LABELS[status] || status;
}

function settlementTargetLabel(targetType?: string | null) {
  if (!targetType) return '-';
  return SETTLEMENT_TARGET_LABELS[targetType] || targetType;
}

function settlementStatusLabel(status?: string | null) {
  if (!status) return '-';
  return SETTLEMENT_STATUS_LABELS[status] || status;
}

function defaultBillingForm(): BillingFormState {
  return {
    laborAmount: '0',
    partsAmount: '0',
    transportAmount: '0',
    additionalAmount: '0',
    customerChargeAmount: '0',
    manufacturerClaimAmount: '0',
    warrantyAmount: '0',
    billingStatus: 'draft',
    billingNote: ''
  };
}

function billingFormFromRecord(record: BillingRecord): BillingFormState {
  return {
    laborAmount: String(record.laborAmount ?? 0),
    partsAmount: String(record.partsAmount ?? 0),
    transportAmount: String(record.transportAmount ?? 0),
    additionalAmount: String(record.additionalAmount ?? 0),
    customerChargeAmount: String(record.customerChargeAmount ?? 0),
    manufacturerClaimAmount: String(record.manufacturerClaimAmount ?? 0),
    warrantyAmount: String(record.warrantyAmount ?? 0),
    billingStatus: BILLING_STATUS_OPTIONS.includes(record.billingStatus as BillingStatus)
      ? record.billingStatus as BillingStatus
      : 'draft',
    billingNote: record.billingNote || ''
  };
}

function defaultSettlementForm(): SettlementFormState {
  return {
    settlementTargetType: 'engineer',
    settlementTargetId: '',
    settlementAmount: '0',
    settlementStatus: 'submitted',
    settlementNote: ''
  };
}

function settlementEditFormFromSettlement(settlement: Settlement): SettlementEditFormState {
  return {
    settlementStatus: SETTLEMENT_STATUS_OPTIONS.includes(settlement.settlementStatus as SettlementStatus)
      ? settlement.settlementStatus as SettlementStatus
      : 'submitted',
    settlementNote: settlement.settlementNote || ''
  };
}

function parseMoney(value: string) {
  if (!value.trim()) return 0;
  return Number(value);
}

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function validateMoneyFields(fields: Array<[string, string]>) {
  for (const [label, value] of fields) {
    const amount = parseMoney(value);
    if (!Number.isFinite(amount) || amount < 0) return `${label} 必須是 0 以上的數字。`;
  }
  return '';
}

function validateBillingForm(form: BillingFormState) {
  const moneyError = validateMoneyFields([
    ['工資', form.laborAmount],
    ['零件費', form.partsAmount],
    ['交通費', form.transportAmount],
    ['追加費用', form.additionalAmount],
    ['客戶收費', form.customerChargeAmount],
    ['原廠請款', form.manufacturerClaimAmount],
    ['保固金額', form.warrantyAmount]
  ]);
  if (moneyError) return moneyError;
  if (!BILLING_STATUS_OPTIONS.includes(form.billingStatus)) return '帳務狀態不正確。';
  return '';
}

function validateSettlementForm(form: SettlementFormState) {
  if (!SETTLEMENT_TARGET_OPTIONS.includes(form.settlementTargetType)) return '結算對象類型不正確。';
  const moneyError = validateMoneyFields([['結算金額', form.settlementAmount]]);
  if (moneyError) return moneyError;
  if (form.settlementTargetId.trim() && !isValidUuid(form.settlementTargetId.trim())) {
    return '結算對象 ID 必須是 UUID，或留空。';
  }
  if (!SETTLEMENT_STATUS_OPTIONS.includes(form.settlementStatus)) return '結算狀態不正確。';
  return '';
}

export function CaseManagementPage() {
  const { currentUser, hasPermission, hasRole } = useAuth();
  const adminLike = isAdminLikeUser(currentUser, hasRole);
  const canRead = hasPermission('cases.read') || adminLike;
  const canCreate = hasPermission('cases.create') || adminLike;
  const canUpdate = hasPermission('cases.update') || adminLike;
  const canReadAttachments = hasPermission('attachments.read') || adminLike;
  const canCreateAttachments = hasPermission('attachments.create') || adminLike;
  const canDeleteAttachments = hasPermission('attachments.delete') || adminLike;
  const canRequestAttachmentOcr = canReadAttachments && canUpdate && (hasPermission('ai.manage') || adminLike);
  const canManageDispatch = hasPermission('dispatch.manage') || adminLike;
  const canManageAppointments = hasPermission('appointments.manage') || adminLike;
  const canReadDispatchUnits = hasPermission('dispatch_units.manage') || adminLike;
  const canReadUsers = hasPermission('users.read') || adminLike;
  const canManageServiceReports = hasPermission('service_reports.manage') || adminLike;
  const canManageBilling = hasPermission('billing.manage') || adminLike;
  const canCloseCases = hasPermission('cases.close') || adminLike;

  const [cases, setCases] = useState<AdminCase[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [total, setTotal] = useState<number | undefined>();
  const [limit] = useState(DEFAULT_LIMIT);
  const [offset, setOffset] = useState(0);
  const [caseNoQuery, setCaseNoQuery] = useState(() => initialCaseNoFromQueryString());
  const [appliedCaseNo, setAppliedCaseNo] = useState(() => initialCaseNoFromQueryString());
  const [queryFilterNotice, setQueryFilterNotice] = useState(() => initialCaseNoFromQueryString() ? '已依案件編號篩選。' : '');
  const [organizationFilter, setOrganizationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<CaseStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<CasePriority | ''>('');
  const [caseTypeFilter, setCaseTypeFilter] = useState<CaseType | ''>('');
  const [sourceFilter, setSourceFilter] = useState<CaseSource | ''>('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [organizationLoading, setOrganizationLoading] = useState(false);
  const [error, setError] = useState('');
  const [organizationError, setOrganizationError] = useState('');
  const [notice, setNotice] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateCaseFormState>(() => getInitialCreateForm());
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingCase, setEditingCase] = useState<AdminCase | null>(null);
  const [editForm, setEditForm] = useState<EditCaseFormState>(() => editFormFromCase({
    id: '',
    caseNo: '',
    customerId: '',
    status: 'draft',
    priority: 'normal',
    warrantyStatus: 'unknown',
    source: 'admin',
    brand: '',
    caseType: 'repair',
    productType: '',
    modelNo: '',
    problemDescription: ''
  }));
  const [editError, setEditError] = useState('');
  const [updating, setUpdating] = useState(false);

  const [detailCaseId, setDetailCaseId] = useState(() => initialCaseIdFromQueryString());
  const [detail, setDetail] = useState<DetailState>({
    adminCase: null,
    loading: false,
    error: ''
  });
  const [pendingWorkflowAction, setPendingWorkflowAction] = useState<AvailableCaseAction | null>(null);
  const [workflowForm, setWorkflowForm] = useState<WorkflowFormState>({ reason: '', note: '' });
  const [workflowError, setWorkflowError] = useState('');
  const [workflowSubmitting, setWorkflowSubmitting] = useState(false);
  const [caseMessages, setCaseMessages] = useState<CaseMessage[]>([]);
  const [messagesTotal, setMessagesTotal] = useState<number | undefined>();
  const [messagesOffset, setMessagesOffset] = useState(0);
  const [messagesSort, setMessagesSort] = useState<CaseMessageSort>('createdAtDesc');
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [internalNoteError, setInternalNoteError] = useState('');
  const [creatingMessage, setCreatingMessage] = useState(false);
  const [pendingDeleteMessage, setPendingDeleteMessage] = useState<CaseMessage | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState('');
  const [attachments, setAttachments] = useState<CaseAttachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [attachmentsError, setAttachmentsError] = useState('');
  const [attachmentUploadForm, setAttachmentUploadForm] = useState<AttachmentUploadFormState>(() => defaultAttachmentUploadForm());
  const [attachmentFileInputKey, setAttachmentFileInputKey] = useState(0);
  const [attachmentUploadError, setAttachmentUploadError] = useState('');
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState('');
  const [pendingOcrAttachment, setPendingOcrAttachment] = useState<CaseAttachment | null>(null);
  const [ocrNote, setOcrNote] = useState('');
  const [ocrError, setOcrError] = useState('');
  const [ocrAttachmentId, setOcrAttachmentId] = useState('');
  const [pendingDeleteAttachment, setPendingDeleteAttachment] = useState<CaseAttachment | null>(null);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState('');
  const [dispatchUnits, setDispatchUnits] = useState<DispatchUnit[]>([]);
  const [dispatchUnitsLoading, setDispatchUnitsLoading] = useState(false);
  const [dispatchUnitsError, setDispatchUnitsError] = useState('');
  const [engineerUsers, setEngineerUsers] = useState<AdminUser[]>([]);
  const [engineerUsersLoading, setEngineerUsersLoading] = useState(false);
  const [engineerUsersError, setEngineerUsersError] = useState('');
  const [dispatchForm, setDispatchForm] = useState<DispatchFormState>(() => defaultDispatchForm());
  const [dispatchError, setDispatchError] = useState('');
  const [dispatchSubmitting, setDispatchSubmitting] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsTotal, setAppointmentsTotal] = useState<number | undefined>();
  const [appointmentsOffset, setAppointmentsOffset] = useState(0);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState('');
  const [appointmentForm, setAppointmentForm] = useState<AppointmentFormState>(() => defaultAppointmentForm());
  const [appointmentError, setAppointmentError] = useState('');
  const [appointmentSubmitting, setAppointmentSubmitting] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [appointmentEditForm, setAppointmentEditForm] = useState<AppointmentEditFormState>(() => ({
    ...defaultAppointmentForm(),
    rescheduleReason: '',
    appointmentStatus: ''
  }));
  const [appointmentEditError, setAppointmentEditError] = useState('');
  const [appointmentUpdating, setAppointmentUpdating] = useState(false);
  const [resultAppointment, setResultAppointment] = useState<Appointment | null>(null);
  const [appointmentResultForm, setAppointmentResultForm] = useState<AppointmentResultFormState>(() => ({
    visitResult: '',
    incompleteReason: '',
    nextAction: '',
    actualArrivalAt: '',
    actualFinishedAt: '',
    note: ''
  }));
  const [appointmentResultError, setAppointmentResultError] = useState('');
  const [appointmentResultSubmitting, setAppointmentResultSubmitting] = useState(false);
  const [serviceReport, setServiceReport] = useState<FieldServiceReport | null>(null);
  const [serviceReportLoading, setServiceReportLoading] = useState(false);
  const [serviceReportError, setServiceReportError] = useState('');
  const [serviceReportForm, setServiceReportForm] = useState<ServiceReportFormState>(() => defaultServiceReportForm());
  const [serviceReportSubmitError, setServiceReportSubmitError] = useState('');
  const [serviceReportSubmitting, setServiceReportSubmitting] = useState(false);
  const [serviceParts, setServiceParts] = useState<ServicePart[]>([]);
  const [servicePartsTotal, setServicePartsTotal] = useState<number | undefined>();
  const [servicePartsOffset, setServicePartsOffset] = useState(0);
  const [servicePartsLoading, setServicePartsLoading] = useState(false);
  const [servicePartsError, setServicePartsError] = useState('');
  const [servicePartForm, setServicePartForm] = useState<ServicePartFormState>(() => defaultServicePartForm());
  const [servicePartError, setServicePartError] = useState('');
  const [servicePartSubmitting, setServicePartSubmitting] = useState(false);
  const [editingServicePart, setEditingServicePart] = useState<ServicePart | null>(null);
  const [servicePartEditForm, setServicePartEditForm] = useState<ServicePartFormState>(() => defaultServicePartForm());
  const [servicePartEditError, setServicePartEditError] = useState('');
  const [servicePartUpdating, setServicePartUpdating] = useState(false);
  const [pendingDeleteServicePart, setPendingDeleteServicePart] = useState<ServicePart | null>(null);
  const [deletingServicePartId, setDeletingServicePartId] = useState('');
  const [billingRecord, setBillingRecord] = useState<BillingRecord | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState('');
  const [billingForm, setBillingForm] = useState<BillingFormState>(() => defaultBillingForm());
  const [billingSubmitError, setBillingSubmitError] = useState('');
  const [billingSubmitting, setBillingSubmitting] = useState(false);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [settlementsTotal, setSettlementsTotal] = useState<number | undefined>();
  const [settlementsOffset, setSettlementsOffset] = useState(0);
  const [settlementsLoading, setSettlementsLoading] = useState(false);
  const [settlementsError, setSettlementsError] = useState('');
  const [settlementForm, setSettlementForm] = useState<SettlementFormState>(() => defaultSettlementForm());
  const [settlementError, setSettlementError] = useState('');
  const [settlementSubmitting, setSettlementSubmitting] = useState(false);
  const [editingSettlement, setEditingSettlement] = useState<Settlement | null>(null);
  const [settlementEditForm, setSettlementEditForm] = useState<SettlementEditFormState>(() => settlementEditFormFromSettlement({
    id: '',
    billingRecordId: '',
    settlementTargetType: 'engineer',
    settlementAmount: 0,
    settlementStatus: 'submitted'
  }));
  const [settlementEditError, setSettlementEditError] = useState('');
  const [settlementUpdating, setSettlementUpdating] = useState(false);
  const [pendingCloseCase, setPendingCloseCase] = useState<AdminCase | null>(null);
  const [closeNote, setCloseNote] = useState('服務與帳務已確認，正式結案');
  const [closeError, setCloseError] = useState('');
  const [closeSubmitting, setCloseSubmitting] = useState(false);

  const organizationNameById = useMemo(() => {
    return new Map(organizations.map((organization) => [organization.id, organization.organizationName]));
  }, [organizations]);

  const hasNextPage = useMemo(() => {
    if (typeof total === 'number') return offset + limit < total;
    return cases.length === limit;
  }, [cases.length, limit, offset, total]);

  const hasPreviousPage = offset > 0;

  const hasNextMessagesPage = useMemo(() => {
    if (typeof messagesTotal === 'number') return messagesOffset + MESSAGE_LIMIT < messagesTotal;
    return caseMessages.length === MESSAGE_LIMIT;
  }, [caseMessages.length, messagesOffset, messagesTotal]);

  const hasPreviousMessagesPage = messagesOffset > 0;

  const hasNextAppointmentsPage = useMemo(() => {
    if (typeof appointmentsTotal === 'number') return appointmentsOffset + APPOINTMENT_LIMIT < appointmentsTotal;
    return appointments.length === APPOINTMENT_LIMIT;
  }, [appointments.length, appointmentsOffset, appointmentsTotal]);

  const hasPreviousAppointmentsPage = appointmentsOffset > 0;

  const hasNextServicePartsPage = useMemo(() => {
    if (typeof servicePartsTotal === 'number') return servicePartsOffset + SERVICE_PART_LIMIT < servicePartsTotal;
    return serviceParts.length === SERVICE_PART_LIMIT;
  }, [serviceParts.length, servicePartsOffset, servicePartsTotal]);

  const hasPreviousServicePartsPage = servicePartsOffset > 0;

  const hasNextSettlementsPage = useMemo(() => {
    if (typeof settlementsTotal === 'number') return settlementsOffset + SETTLEMENT_LIMIT < settlementsTotal;
    return settlements.length === SETTLEMENT_LIMIT;
  }, [settlements.length, settlementsOffset, settlementsTotal]);

  const hasPreviousSettlementsPage = settlementsOffset > 0;

  const dispatchUnitNameById = useMemo(() => {
    return new Map(dispatchUnits.map((unit) => [unit.id, `${unit.name} (${unit.code})`]));
  }, [dispatchUnits]);

  const loadOrganizations = useCallback(async () => {
    if (!canRead) return;

    setOrganizationLoading(true);
    setOrganizationError('');

    try {
      const result = await listOrganizations({
        limit: 100,
        offset: 0,
        sort: 'nameAsc'
      });
      setOrganizations(result.data);
    } catch (err) {
      setOrganizationError(errorMessage(err));
    } finally {
      setOrganizationLoading(false);
    }
  }, [canRead]);

  const loadCases = useCallback(async () => {
    if (!canRead) return;

    setLoading(true);
    setError('');

    try {
      const result = await listCases({
        organizationId: organizationFilter || undefined,
        caseNo: appliedCaseNo.trim() || undefined,
        status: statusFilter,
        priority: priorityFilter,
        caseType: caseTypeFilter,
        source: sourceFilter,
        createdFrom: dateFilterToIso(createdFrom),
        createdTo: dateFilterToIso(createdTo, true),
        limit,
        offset,
        sort: 'createdAtDesc'
      });
      setCases(result.data);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [appliedCaseNo, canRead, caseTypeFilter, createdFrom, createdTo, limit, offset, organizationFilter, priorityFilter, sourceFilter, statusFilter]);

  const loadMessages = useCallback(async (
    caseId: string,
    options: { sort?: CaseMessageSort; offset?: number } = {}
  ) => {
    if (!canRead || !caseId) return;

    const sort = options.sort ?? messagesSort;
    const nextOffset = options.offset ?? messagesOffset;

    setMessagesLoading(true);
    setMessagesError('');

    try {
      const result = await listCaseMessages(caseId, {
        sort,
        limit: MESSAGE_LIMIT,
        offset: nextOffset
      });
      setCaseMessages(result.data);
      setMessagesTotal(result.pagination.total);
    } catch (err) {
      setMessagesError(errorMessage(err));
    } finally {
      setMessagesLoading(false);
    }
  }, [canRead, messagesOffset, messagesSort]);

  const loadAttachments = useCallback(async (caseId: string) => {
    if (!canReadAttachments || !caseId) return;

    setAttachmentsLoading(true);
    setAttachmentsError('');

    try {
      const result = await listCaseAttachments(caseId);
      setAttachments(result);
    } catch (err) {
      setAttachmentsError(errorMessage(err));
    } finally {
      setAttachmentsLoading(false);
    }
  }, [canReadAttachments]);

  const loadDispatchUnitsForCase = useCallback(async (adminCase: AdminCase) => {
    if (!canReadDispatchUnits) return;

    setDispatchUnitsLoading(true);
    setDispatchUnitsError('');

    try {
      const result = await listDispatchUnits({
        organizationId: adminCase.organizationId || undefined,
        status: 'active',
        limit: 100,
        offset: 0,
        sort: 'nameAsc'
      });
      setDispatchUnits(result.data);
    } catch (err) {
      setDispatchUnitsError(errorMessage(err));
    } finally {
      setDispatchUnitsLoading(false);
    }
  }, [canReadDispatchUnits]);

  const loadEngineerUsers = useCallback(async () => {
    if (!canReadUsers) return;

    setEngineerUsersLoading(true);
    setEngineerUsersError('');

    try {
      const result = await listUsers({
        status: 'active',
        limit: 100,
        offset: 0,
        sort: 'emailAsc'
      });
      setEngineerUsers(result.data);
    } catch (err) {
      setEngineerUsersError(errorMessage(err));
    } finally {
      setEngineerUsersLoading(false);
    }
  }, [canReadUsers]);

  const loadAppointments = useCallback(async (caseId: string, nextOffset = appointmentsOffset) => {
    if (!canManageAppointments || !caseId) return;

    setAppointmentsLoading(true);
    setAppointmentsError('');

    try {
      const result = await listCaseAppointments(caseId, {
        limit: APPOINTMENT_LIMIT,
        offset: nextOffset
      });
      setAppointments(result.data);
      setAppointmentsTotal(result.pagination.total);
    } catch (err) {
      setAppointmentsError(errorMessage(err));
    } finally {
      setAppointmentsLoading(false);
    }
  }, [appointmentsOffset, canManageAppointments]);

  const loadServicePartsForReport = useCallback(async (reportId: string, nextOffset = servicePartsOffset) => {
    if (!canManageServiceReports || !reportId) return;

    setServicePartsLoading(true);
    setServicePartsError('');

    try {
      const result = await listServiceParts(reportId, {
        limit: SERVICE_PART_LIMIT,
        offset: nextOffset
      });
      setServiceParts(result.data);
      setServicePartsTotal(result.pagination.total);
    } catch (err) {
      setServicePartsError(errorMessage(err));
    } finally {
      setServicePartsLoading(false);
    }
  }, [canManageServiceReports, servicePartsOffset]);

  const loadServiceReportForCase = useCallback(async (caseId: string) => {
    if (!canManageServiceReports || !caseId) return;

    setServiceReportLoading(true);
    setServiceReportError('');

    try {
      const report = await getCaseServiceReport(caseId);
      setServiceReport(report);
      setServiceReportForm(serviceReportFormFromReport(report));
      await loadServicePartsForReport(report.id, servicePartsOffset);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setServiceReport(null);
        setServiceReportForm(defaultServiceReportForm());
        setServiceParts([]);
        setServicePartsTotal(undefined);
        setServicePartsError('');
      } else {
        setServiceReportError(errorMessage(err));
      }
    } finally {
      setServiceReportLoading(false);
    }
  }, [canManageServiceReports, loadServicePartsForReport, servicePartsOffset]);

  const loadSettlementsForBilling = useCallback(async (billingId: string, nextOffset = settlementsOffset) => {
    if (!canManageBilling || !billingId) return;

    setSettlementsLoading(true);
    setSettlementsError('');

    try {
      const result = await listBillingSettlements(billingId, {
        limit: SETTLEMENT_LIMIT,
        offset: nextOffset
      });
      setSettlements(result.data);
      setSettlementsTotal(result.pagination.total);
    } catch (err) {
      setSettlementsError(errorMessage(err));
    } finally {
      setSettlementsLoading(false);
    }
  }, [canManageBilling, settlementsOffset]);

  const loadBillingForCase = useCallback(async (caseId: string) => {
    if (!canManageBilling || !caseId) return;

    setBillingLoading(true);
    setBillingError('');

    try {
      const billing = await getCaseBilling(caseId);
      setBillingRecord(billing);
      setBillingForm(billingFormFromRecord(billing));
      await loadSettlementsForBilling(billing.id, settlementsOffset);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setBillingRecord(null);
        setBillingForm(defaultBillingForm());
        setSettlements([]);
        setSettlementsTotal(undefined);
        setSettlementsError('');
      } else {
        setBillingError(errorMessage(err));
      }
    } finally {
      setBillingLoading(false);
    }
  }, [canManageBilling, loadSettlementsForBilling, settlementsOffset]);

  useEffect(() => {
    void loadOrganizations();
  }, [loadOrganizations]);

  useEffect(() => {
    void loadCases();
  }, [loadCases]);

  useEffect(() => {
    if (!detailCaseId) return;

    let active = true;

    async function loadDetail() {
      setDetail({
        adminCase: null,
        loading: true,
        error: ''
      });

      try {
        const adminCase = await getCase(detailCaseId);
        if (!active) return;
        setDetail({
          adminCase,
          loading: false,
          error: ''
        });
      } catch (err) {
        if (!active) return;
        setDetail({
          adminCase: null,
          loading: false,
          error: errorMessage(err)
        });
      }
    }

    void loadDetail();

    return () => {
      active = false;
    };
  }, [detailCaseId]);

  useEffect(() => {
    if (!detailCaseId) {
      setCaseMessages([]);
      setMessagesTotal(undefined);
      setMessagesError('');
      setInternalNote('');
      setInternalNoteError('');
      setAttachments([]);
      setAttachmentsError('');
      setAttachmentUploadError('');
      setAttachmentUploadForm(defaultAttachmentUploadForm());
      setPendingOcrAttachment(null);
      setPendingDeleteAttachment(null);
      setDispatchUnits([]);
      setDispatchUnitsError('');
      setEngineerUsers([]);
      setEngineerUsersError('');
      setDispatchForm(defaultDispatchForm());
      setDispatchError('');
      setAppointments([]);
      setAppointmentsTotal(undefined);
      setAppointmentsError('');
      setAppointmentForm(defaultAppointmentForm());
      setAppointmentError('');
      setEditingAppointment(null);
      setResultAppointment(null);
      setAppointmentResultError('');
      setServiceReport(null);
      setServiceReportError('');
      setServiceReportSubmitError('');
      setServiceReportForm(defaultServiceReportForm());
      setServiceParts([]);
      setServicePartsTotal(undefined);
      setServicePartsError('');
      setServicePartForm(defaultServicePartForm());
      setServicePartError('');
      setEditingServicePart(null);
      setPendingDeleteServicePart(null);
      setBillingRecord(null);
      setBillingError('');
      setBillingSubmitError('');
      setBillingForm(defaultBillingForm());
      setSettlements([]);
      setSettlementsTotal(undefined);
      setSettlementsError('');
      setSettlementForm(defaultSettlementForm());
      setSettlementError('');
      setEditingSettlement(null);
      setPendingCloseCase(null);
      setCloseNote('服務與帳務已確認，正式結案');
      setCloseError('');
      return;
    }

    void loadMessages(detailCaseId);
    void loadAttachments(detailCaseId);
    void loadAppointments(detailCaseId);
    void loadEngineerUsers();
    void loadServiceReportForCase(detailCaseId);
    void loadBillingForCase(detailCaseId);
  }, [detailCaseId, loadAppointments, loadAttachments, loadBillingForCase, loadEngineerUsers, loadMessages, loadServiceReportForCase]);

  useEffect(() => {
    if (!detail.adminCase) return;
    setDispatchForm((current) => ({
      ...current,
      dispatchUnitId: current.dispatchUnitId || detail.adminCase?.dispatchUnitId || ''
    }));
    setAppointmentForm((current) => ({
      ...current,
      visitType: current.visitType || defaultAppointmentForm(detail.adminCase?.caseType).visitType
    }));
    void loadDispatchUnitsForCase(detail.adminCase);
  }, [detail.adminCase, loadDispatchUnitsForCase]);

  function applyFilters(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setOffset(0);
    const nextCaseNo = caseNoQuery.trim();
    setCaseNoQuery(nextCaseNo);
    setAppliedCaseNo(nextCaseNo);
    setQueryFilterNotice(nextCaseNo ? '已依案件編號篩選。' : '');
    syncCasesQueryString({ caseNo: nextCaseNo });
  }

  function resetFilters() {
    setCaseNoQuery('');
    setAppliedCaseNo('');
    setOrganizationFilter('');
    setStatusFilter('');
    setPriorityFilter('');
    setCaseTypeFilter('');
    setSourceFilter('');
    setCreatedFrom('');
    setCreatedTo('');
    setOffset(0);
    setQueryFilterNotice('');
    syncCasesQueryString({ caseNo: null });
  }

  function resetCreateForm() {
    setCreateForm(getInitialCreateForm(organizationFilter));
    setCreateError('');
  }

  function openCreate() {
    setCreateForm(getInitialCreateForm(organizationFilter));
    setCreateError('');
    setShowCreate(true);
  }

  function openCaseDetail(caseId: string) {
    setMessagesOffset(0);
    setMessagesSort('createdAtDesc');
    setPendingDeleteMessage(null);
    setPendingOcrAttachment(null);
    setPendingDeleteAttachment(null);
    setAppointmentsOffset(0);
    setEditingAppointment(null);
    setServicePartsOffset(0);
    setEditingServicePart(null);
    setPendingDeleteServicePart(null);
    setSettlementsOffset(0);
    setEditingSettlement(null);
    setDetailCaseId(caseId);
    syncCasesQueryString({ caseId });
  }

  function closeCaseDetail() {
    setDetailCaseId('');
    syncCasesQueryString({ caseId: null });
  }

  async function handleCreateCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError('');

    const validationError = validateCreateForm(createForm);
    if (validationError) {
      setCreateError(validationError);
      return;
    }

    setCreating(true);

    try {
      const created = await createCase({
        organizationId: createForm.organizationId.trim(),
        customer: {
          customerName: createForm.customerName.trim(),
          mobile: createForm.mobile.trim(),
          tel: createForm.tel.trim() || undefined,
          city: createForm.city.trim(),
          address: createForm.address.trim(),
          source: 'admin'
        },
        case: {
          source: createForm.source,
          brand: createForm.brand.trim(),
          caseType: createForm.caseType,
          productType: createForm.productType.trim(),
          modelNo: createForm.modelNo.trim(),
          serialNo: createForm.serialNo.trim() || undefined,
          invoiceDate: createForm.invoiceDate || undefined,
          problemDescription: createForm.problemDescription.trim(),
          preferredVisitTime: fromDateTimeInput(createForm.preferredVisitTime),
          priority: createForm.priority,
          warrantyStatus: createForm.warrantyStatus,
          serviceRegion: createForm.serviceRegion.trim() || undefined
        }
      });
      setShowCreate(false);
      resetCreateForm();
      setNotice(`案件已建立：${created.caseNo}`);
      setOffset(0);
      openCaseDetail(created.id);
      await loadCases();
    } catch (err) {
      setCreateError(errorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  function openEdit(adminCase: AdminCase) {
    setEditingCase(adminCase);
    setEditForm(editFormFromCase(adminCase));
    setEditError('');
  }

  async function handleUpdateCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingCase) return;

    setEditError('');
    const validationError = validateEditForm(editForm);
    if (validationError) {
      setEditError(validationError);
      return;
    }

    setUpdating(true);

    try {
      await updateCase(editingCase.id, {
        brand: editForm.brand.trim(),
        caseType: editForm.caseType,
        productType: editForm.productType.trim(),
        modelNo: editForm.modelNo.trim(),
        serialNo: editForm.serialNo.trim() || null,
        invoiceDate: editForm.invoiceDate || null,
        problemDescription: editForm.problemDescription.trim(),
        preferredVisitTime: fromDateTimeInput(editForm.preferredVisitTime) || null,
        priority: editForm.priority,
        warrantyStatus: editForm.warrantyStatus,
        serviceRegion: editForm.serviceRegion.trim() || null
      });
      setEditingCase(null);
      setNotice('案件已更新。');
      await loadCases();
      if (detailCaseId === editingCase.id) {
        setDetailCaseId('');
      }
    } catch (err) {
      setEditError(errorMessage(err));
    } finally {
      setUpdating(false);
    }
  }

  function openWorkflowAction(action: AvailableCaseAction) {
    setPendingWorkflowAction(action);
    setWorkflowForm({ reason: '', note: '' });
    setWorkflowError('');
  }

  async function handleWorkflowActionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pendingWorkflowAction || !detail.adminCase) return;

    setWorkflowError('');
    const reason = workflowForm.reason.trim();
    const note = workflowForm.note.trim();

    if ((pendingWorkflowAction.action === 'reject' || pendingWorkflowAction.action === 'cancel') && !reason) {
      setWorkflowError(`${getCaseActionLabel(pendingWorkflowAction.action)}需要填寫原因。`);
      return;
    }

    setWorkflowSubmitting(true);

    try {
      const notePayload = note ? { note } : {};
      let updated: AdminCase;

      if (pendingWorkflowAction.action === 'submit') {
        updated = await submitCase(detail.adminCase.id, notePayload);
      } else if (pendingWorkflowAction.action === 'review') {
        updated = await reviewCase(detail.adminCase.id, notePayload);
      } else if (pendingWorkflowAction.action === 'accept') {
        updated = await acceptCase(detail.adminCase.id, notePayload);
      } else if (pendingWorkflowAction.action === 'reject') {
        updated = await rejectCase(detail.adminCase.id, {
          reason,
          ...(note ? { note } : {})
        });
      } else if (pendingWorkflowAction.action === 'cancel') {
        updated = await cancelCase(detail.adminCase.id, {
          reason,
          ...(note ? { note } : {})
        });
      } else {
        throw new Error('此流程操作尚未開放。');
      }

      setDetail({
        adminCase: updated,
        loading: false,
        error: ''
      });
      setPendingWorkflowAction(null);
      setWorkflowForm({ reason: '', note: '' });
      setNotice(`${getCaseActionLabel(pendingWorkflowAction.action)}完成。`);
      await loadCases();
      await loadMessages(updated.id, { offset: messagesOffset });
    } catch (err) {
      setWorkflowError(errorMessage(err));
    } finally {
      setWorkflowSubmitting(false);
    }
  }

  async function refreshDetailCase(caseId: string) {
    try {
      const refreshed = await getCase(caseId);
      setDetail({
        adminCase: refreshed,
        loading: false,
        error: ''
      });
    } catch (err) {
      setDetail((current) => ({
        ...current,
        error: errorMessage(err)
      }));
    }
  }

  async function handleCreateInternalNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail.adminCase) return;

    setInternalNoteError('');
    const bodyText = internalNote.trim();

    if (!bodyText) {
      setInternalNoteError('請輸入內部備註。');
      return;
    }

    if (bodyText.length > INTERNAL_NOTE_MAX_LENGTH) {
      setInternalNoteError(`內部備註不可超過 ${INTERNAL_NOTE_MAX_LENGTH} 字。`);
      return;
    }

    setCreatingMessage(true);

    try {
      await createCaseMessage(detail.adminCase.id, {
        messageType: 'internal_note',
        bodyText
      });
      setInternalNote('');
      setMessagesOffset(0);
      setNotice('內部備註已新增。');
      await Promise.all([
        loadMessages(detail.adminCase.id, { offset: 0 }),
        refreshDetailCase(detail.adminCase.id)
      ]);
    } catch (err) {
      setInternalNoteError(errorMessage(err));
    } finally {
      setCreatingMessage(false);
    }
  }

  async function handleDeleteMessage() {
    if (!pendingDeleteMessage || !detail.adminCase) return;

    setDeletingMessageId(pendingDeleteMessage.id);

    try {
      await deleteCaseMessage(pendingDeleteMessage.id);
      setPendingDeleteMessage(null);
      setNotice('內部備註已刪除。');
      await Promise.all([
        loadMessages(detail.adminCase.id, { offset: messagesOffset }),
        refreshDetailCase(detail.adminCase.id)
      ]);
    } catch (err) {
      setMessagesError(errorMessage(err));
    } finally {
      setDeletingMessageId('');
    }
  }

  async function handleUploadAttachment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail.adminCase) return;

    setAttachmentUploadError('');
    const file = attachmentUploadForm.file;

    if (!file) {
      setAttachmentUploadError('請選擇要上傳的檔案。');
      return;
    }

    if (!ATTACHMENT_TYPE_OPTIONS.includes(attachmentUploadForm.attachmentType)) {
      setAttachmentUploadError('附件類型不正確。');
      return;
    }

    if (file.size > ATTACHMENT_MAX_BYTES) {
      setAttachmentUploadError(`檔案不可超過 ${formatBytes(ATTACHMENT_MAX_BYTES)}。`);
      return;
    }

    setUploadingAttachment(true);

    try {
      const contentType = file.type || 'application/octet-stream';
      const uploadResponse = await createAttachmentUploadUrl(detail.adminCase.id, {
        attachmentType: attachmentUploadForm.attachmentType,
        originalFilename: file.name,
        contentType,
        byteSize: file.size,
        sourceChannel: 'admin'
      });

      await uploadFileToSignedUrl(uploadResponse.upload, file);
      await completeAttachmentUpload(detail.adminCase.id, {
        attachmentId: uploadResponse.attachment.id,
        byteSize: file.size
      });

      setAttachmentUploadForm(defaultAttachmentUploadForm());
      setAttachmentFileInputKey((current) => current + 1);
      setNotice('附件已上傳。');
      await loadAttachments(detail.adminCase.id);
    } catch (err) {
      setAttachmentUploadError(errorMessage(err));
    } finally {
      setUploadingAttachment(false);
    }
  }

  async function handleDownloadAttachment(attachment: CaseAttachment) {
    setDownloadingAttachmentId(attachment.id);
    setAttachmentsError('');

    try {
      const response = await createAttachmentDownloadUrl(attachment.id, { ttlSeconds: 300 });
      const anchor = document.createElement('a');
      anchor.href = response.download.signedUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.click();
    } catch (err) {
      setAttachmentsError(errorMessage(err));
    } finally {
      setDownloadingAttachmentId('');
    }
  }

  async function handleRequestAttachmentOcr(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pendingOcrAttachment || !detail.adminCase) return;

    setOcrError('');
    setOcrAttachmentId(pendingOcrAttachment.id);

    try {
      await requestAttachmentOcr(pendingOcrAttachment.id, ocrNote.trim() ? { note: ocrNote.trim() } : {});
      setPendingOcrAttachment(null);
      setOcrNote('');
      setNotice('OCR 已送出。');
      await Promise.all([
        loadAttachments(detail.adminCase.id),
        loadMessages(detail.adminCase.id, { offset: messagesOffset })
      ]);
    } catch (err) {
      setOcrError(errorMessage(err));
    } finally {
      setOcrAttachmentId('');
    }
  }

  async function handleDeleteAttachment() {
    if (!pendingDeleteAttachment || !detail.adminCase) return;

    setDeletingAttachmentId(pendingDeleteAttachment.id);

    try {
      await deleteAttachment(pendingDeleteAttachment.id);
      setPendingDeleteAttachment(null);
      setNotice('附件紀錄已刪除。');
      await loadAttachments(detail.adminCase.id);
    } catch (err) {
      setAttachmentsError(errorMessage(err));
    } finally {
      setDeletingAttachmentId('');
    }
  }

  async function refreshCaseOperationalState(caseId: string) {
    await Promise.all([
      refreshDetailCase(caseId),
      loadCases(),
      loadMessages(caseId, { offset: messagesOffset }),
      loadAppointments(caseId, appointmentsOffset),
      loadServiceReportForCase(caseId),
      loadBillingForCase(caseId)
    ]);
  }

  async function handleDispatchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail.adminCase) return;

    setDispatchError('');

    if (!dispatchForm.dispatchUnitId.trim()) {
      setDispatchError('請選擇派工單位。');
      return;
    }

    const dispatchNote = dispatchForm.assignmentNote.trim();

    setDispatchSubmitting(true);

    try {
      if (detail.adminCase.dispatchUnitId) {
        if (!dispatchForm.assignedEngineerId && !dispatchNote) {
          setDispatchError('更新派工時請選擇工程師或填寫派工備註。');
          setDispatchSubmitting(false);
          return;
        }
        await updateDispatchAssignment(detail.adminCase.id, {
          ...(dispatchForm.assignedEngineerId ? { assignedEngineerId: dispatchForm.assignedEngineerId } : {}),
          ...(dispatchNote ? { assignmentNote: dispatchNote } : {})
        });
        setNotice('派工已更新。');
      } else {
        await createDispatchAssignment(detail.adminCase.id, {
          dispatchUnitId: dispatchForm.dispatchUnitId,
          ...(dispatchForm.assignedEngineerId ? { assignedEngineerId: dispatchForm.assignedEngineerId } : {}),
          ...(dispatchNote ? { assignmentNote: dispatchNote } : {})
        });
        setNotice('派工已建立。');
      }

      await refreshCaseOperationalState(detail.adminCase.id);
    } catch (err) {
      setDispatchError(errorMessage(err));
    } finally {
      setDispatchSubmitting(false);
    }
  }

  async function handleCreateAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail.adminCase) return;

    setAppointmentError('');

    const validationError = validateAppointmentRange(appointmentForm.scheduledStartAt, appointmentForm.scheduledEndAt);
    if (validationError) {
      setAppointmentError(validationError);
      return;
    }

    setAppointmentSubmitting(true);

    try {
      await createCaseAppointment(detail.adminCase.id, {
        scheduledStartAt: fromDateTimeInput(appointmentForm.scheduledStartAt) || '',
        scheduledEndAt: fromDateTimeInput(appointmentForm.scheduledEndAt) || '',
        visitType: appointmentForm.visitType,
        timezone: appointmentForm.timezone.trim() || 'Asia/Taipei',
        ...(appointmentForm.note.trim() ? { note: appointmentForm.note.trim() } : {})
      });
      setAppointmentForm(defaultAppointmentForm(detail.adminCase.caseType));
      setAppointmentsOffset(0);
      setNotice('預約已建立。');
      await refreshCaseOperationalState(detail.adminCase.id);
  } catch (err) {
      const message = errorMessage(err);
      setAppointmentError(
        message.includes('尚未結束的到府預約')
          ? `${message} 這是為了避免同一案件同時有多筆未結束 appointment。請先在上一筆到府紀錄中更新到府結果，再建立下一筆預約。`
          : message
      );
    } finally {
      setAppointmentSubmitting(false);
    }
  }

  function openAppointmentEdit(appointment: Appointment) {
    setEditingAppointment(appointment);
    setAppointmentEditForm(appointmentEditFormFromAppointment(appointment));
    setAppointmentEditError('');
  }

  function openAppointmentResultUpdate(appointment: Appointment) {
    setResultAppointment(appointment);
    setAppointmentResultForm(appointmentResultFormFromAppointment(appointment));
    setAppointmentResultError('');
  }

  async function handleUpdateAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingAppointment || !detail.adminCase) return;

    setAppointmentEditError('');

    const isRescheduling = Boolean(
      appointmentEditForm.scheduledStartAt &&
      appointmentEditForm.scheduledEndAt &&
      (
        appointmentEditForm.scheduledStartAt !== toDateTimeInput(editingAppointment.scheduledStartAt) ||
        appointmentEditForm.scheduledEndAt !== toDateTimeInput(editingAppointment.scheduledEndAt)
      )
    );

    const validationError = validateAppointmentRange(appointmentEditForm.scheduledStartAt, appointmentEditForm.scheduledEndAt);
    if (validationError) {
      setAppointmentEditError(validationError);
      return;
    }

    if (isRescheduling && !appointmentEditForm.rescheduleReason.trim()) {
      setAppointmentEditError('改期時請填寫改期原因。');
      return;
    }

    if (
      appointmentEditForm.appointmentStatus === 'cancelled' &&
      !appointmentEditForm.rescheduleReason.trim() &&
      !appointmentEditForm.note.trim()
    ) {
      setAppointmentEditError('取消預約時請填寫取消原因或備註。');
      return;
    }

    setAppointmentUpdating(true);

    try {
      await updateAppointment(editingAppointment.id, {
        scheduledStartAt: fromDateTimeInput(appointmentEditForm.scheduledStartAt),
        scheduledEndAt: fromDateTimeInput(appointmentEditForm.scheduledEndAt),
        visitType: appointmentEditForm.visitType,
        timezone: appointmentEditForm.timezone.trim() || 'Asia/Taipei',
        ...(appointmentEditForm.rescheduleReason.trim() ? { rescheduleReason: appointmentEditForm.rescheduleReason.trim() } : {}),
        ...(appointmentEditForm.note.trim() ? { note: appointmentEditForm.note.trim() } : {}),
        ...(appointmentEditForm.appointmentStatus ? { appointmentStatus: appointmentEditForm.appointmentStatus } : {})
      });
      setEditingAppointment(null);
      setNotice(appointmentEditForm.appointmentStatus === 'cancelled' ? '預約已取消。' : '預約已更新。');
      await refreshCaseOperationalState(detail.adminCase.id);
    } catch (err) {
      setAppointmentEditError(errorMessage(err));
    } finally {
      setAppointmentUpdating(false);
    }
  }

  async function handleUpdateAppointmentResult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resultAppointment || !detail.adminCase) return;

    setAppointmentResultError('');

    const validationError = validateAppointmentResultForm(appointmentResultForm);
    if (validationError) {
      setAppointmentResultError(validationError);
      return;
    }

    setAppointmentResultSubmitting(true);

    try {
      await updateAppointment(resultAppointment.id, {
        visitResult: appointmentResultForm.visitResult,
        ...(appointmentResultForm.incompleteReason.trim()
          ? { incompleteReason: appointmentResultForm.incompleteReason.trim() }
          : {}),
        ...(appointmentResultForm.nextAction ? { nextAction: appointmentResultForm.nextAction } : {}),
        ...(appointmentResultForm.actualArrivalAt
          ? { actualArrivalAt: fromDateTimeInput(appointmentResultForm.actualArrivalAt) }
          : {}),
        ...(appointmentResultForm.actualFinishedAt
          ? { actualFinishedAt: fromDateTimeInput(appointmentResultForm.actualFinishedAt) }
          : {}),
        ...(appointmentResultForm.note.trim() ? { note: appointmentResultForm.note.trim() } : {})
      });
      setResultAppointment(null);
      setNotice('到府結果已更新。');
      await refreshCaseOperationalState(detail.adminCase.id);
    } catch (err) {
      setAppointmentResultError(errorMessage(err));
    } finally {
      setAppointmentResultSubmitting(false);
    }
  }

  async function handleServiceReportSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail.adminCase) return;

    setServiceReportSubmitError('');
    const validationError = validateServiceReportForm(serviceReportForm, Boolean(serviceReport));
    if (validationError) {
      setServiceReportSubmitError(validationError);
      return;
    }

    const isCompletingServiceReport = serviceReportForm.serviceStatus === 'completed';
    const autoFinalAppointment = getAutoFinalAppointment(appointments);

    if (isCompletingServiceReport) {
      if (serviceReport?.serviceStatus !== 'completed') {
        const confirmationLines = appointments.length > 0 && autoFinalAppointment
          ? [
              '完成服務報告時，後端會依同一案件的 completed visit 自動解析 finalAppointmentId。',
              `目前畫面預覽最後完成到府為${describeAppointmentForConfirmation(autoFinalAppointment)}，到府結果：${visitResultLabel(autoFinalAppointment.visitResult)}。`,
              '這只是畫面資訊，不會由前端送出 finalAppointmentId，也不能由 operator 手動選擇。',
              '若後端找不到符合條件的 completed visit，會拒絕完成服務報告。',
              '完修後 case 會進入 completed；不會自動 close case，也不會自動建立 billing / settlement。',
              '確認繼續？'
            ]
          : appointments.length > 0
            ? [
                '完成服務報告時，後端會依同一案件的 completed visit 自動解析 finalAppointmentId。',
                '目前已載入的到府紀錄未顯示 completed visit；若後端找不到符合條件的 completed visit，會拒絕完成服務報告。',
                '前端不會送出 finalAppointmentId，也不能由 operator 手動選擇。',
                '完修後 case 會進入 completed；不會自動 close case，也不會自動建立 billing / settlement。',
                '確認繼續？'
              ]
          : [
              '此案件目前沒有到府紀錄，將由後端依 legacy 相容流程驗證。',
              '完修後 case 會進入 completed；不會自動 close case，也不會自動建立 billing / settlement。',
              '確認繼續？'
            ];
        const confirmed = window.confirm(confirmationLines.join('\n'));
        if (!confirmed) return;
      }
    }

    const payload: UpdateServiceReportPayload = {
      ...(serviceReportForm.diagnosisResult.trim() ? { diagnosisResult: serviceReportForm.diagnosisResult.trim() } : {}),
      ...(serviceReportForm.repairAction.trim() ? { repairAction: serviceReportForm.repairAction.trim() } : {}),
      ...(serviceReportForm.repairResult.trim() ? { repairResult: serviceReportForm.repairResult.trim() } : {}),
      ...(serviceReportForm.engineerNote.trim() ? { engineerNote: serviceReportForm.engineerNote.trim() } : {}),
      ...(serviceReportForm.customerNote.trim() ? { customerNote: serviceReportForm.customerNote.trim() } : {}),
      ...(serviceReport ? (serviceReportForm.serviceStatus ? { serviceStatus: serviceReportForm.serviceStatus } : {}) : {})
    };

    setServiceReportSubmitting(true);

    try {
      const updated = serviceReport
        ? await updateServiceReport(serviceReport.id, payload)
        : await createCaseServiceReport(detail.adminCase.id, payload);

      setServiceReport(updated);
      setServiceReportForm(serviceReportFormFromReport(updated));
      setNotice(serviceReport ? '到府服務紀錄已更新。' : '到府服務紀錄已建立。');
      await refreshCaseOperationalState(detail.adminCase.id);
    } catch (err) {
      setServiceReportSubmitError(errorMessage(err));
    } finally {
      setServiceReportSubmitting(false);
    }
  }

  async function handleAddServicePart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!serviceReport) return;

    setServicePartError('');
    const validationError = validateServicePartForm(servicePartForm);
    if (validationError) {
      setServicePartError(validationError);
      return;
    }

    setServicePartSubmitting(true);

    try {
      await addServicePart(serviceReport.id, {
        partName: servicePartForm.partName.trim(),
        ...(servicePartForm.partNo.trim() ? { partNo: servicePartForm.partNo.trim() } : {}),
        quantity: Number(servicePartForm.quantity),
        ...(servicePartForm.oldSerialNo.trim() ? { oldSerialNo: servicePartForm.oldSerialNo.trim() } : {}),
        ...(servicePartForm.newSerialNo.trim() ? { newSerialNo: servicePartForm.newSerialNo.trim() } : {}),
        partStatus: servicePartForm.partStatus,
        ...(servicePartForm.replacedAt ? { replacedAt: fromDateTimeInput(servicePartForm.replacedAt) } : {})
      });
      setServicePartForm(defaultServicePartForm());
      setServicePartsOffset(0);
      setNotice('服務零件已新增。');
      await Promise.all([
        loadServicePartsForReport(serviceReport.id, 0),
        detail.adminCase ? loadMessages(detail.adminCase.id, { offset: messagesOffset }) : Promise.resolve()
      ]);
    } catch (err) {
      setServicePartError(errorMessage(err));
    } finally {
      setServicePartSubmitting(false);
    }
  }

  function openServicePartEdit(part: ServicePart) {
    setEditingServicePart(part);
    setServicePartEditForm(servicePartFormFromPart(part));
    setServicePartEditError('');
  }

  async function handleUpdateServicePart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingServicePart || !serviceReport) return;

    setServicePartEditError('');
    const validationError = validateServicePartForm(servicePartEditForm);
    if (validationError) {
      setServicePartEditError(validationError);
      return;
    }

    setServicePartUpdating(true);

    try {
      await updateServicePart(editingServicePart.id, {
        partName: servicePartEditForm.partName.trim(),
        ...(servicePartEditForm.partNo.trim() ? { partNo: servicePartEditForm.partNo.trim() } : {}),
        quantity: Number(servicePartEditForm.quantity),
        ...(servicePartEditForm.oldSerialNo.trim() ? { oldSerialNo: servicePartEditForm.oldSerialNo.trim() } : {}),
        ...(servicePartEditForm.newSerialNo.trim() ? { newSerialNo: servicePartEditForm.newSerialNo.trim() } : {}),
        partStatus: servicePartEditForm.partStatus,
        ...(servicePartEditForm.replacedAt ? { replacedAt: fromDateTimeInput(servicePartEditForm.replacedAt) } : {})
      });
      setEditingServicePart(null);
      setNotice('服務零件已更新。');
      await loadServicePartsForReport(serviceReport.id, servicePartsOffset);
    } catch (err) {
      setServicePartEditError(errorMessage(err));
    } finally {
      setServicePartUpdating(false);
    }
  }

  async function handleDeleteServicePart() {
    if (!pendingDeleteServicePart || !serviceReport) return;

    setDeletingServicePartId(pendingDeleteServicePart.id);

    try {
      await deleteServicePart(pendingDeleteServicePart.id);
      setPendingDeleteServicePart(null);
      setNotice('服務零件紀錄已移除。');
      await loadServicePartsForReport(serviceReport.id, servicePartsOffset);
    } catch (err) {
      setServicePartsError(errorMessage(err));
    } finally {
      setDeletingServicePartId('');
    }
  }

  async function handleBillingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail.adminCase) return;

    setBillingSubmitError('');
    const validationError = validateBillingForm(billingForm);
    if (validationError) {
      setBillingSubmitError(validationError);
      return;
    }

    const payload = {
      ...(billingRecord ? {} : serviceReport?.id ? { fieldServiceReportId: serviceReport.id } : {}),
      laborAmount: parseMoney(billingForm.laborAmount),
      partsAmount: parseMoney(billingForm.partsAmount),
      transportAmount: parseMoney(billingForm.transportAmount),
      additionalAmount: parseMoney(billingForm.additionalAmount),
      customerChargeAmount: parseMoney(billingForm.customerChargeAmount),
      manufacturerClaimAmount: parseMoney(billingForm.manufacturerClaimAmount),
      warrantyAmount: parseMoney(billingForm.warrantyAmount),
      billingStatus: billingForm.billingStatus,
      ...(billingForm.billingNote.trim() ? { billingNote: billingForm.billingNote.trim() } : {})
    };

    setBillingSubmitting(true);

    try {
      const updated = billingRecord
        ? await updateBilling(billingRecord.id, payload)
        : await createCaseBilling(detail.adminCase.id, payload);

      setBillingRecord(updated);
      setBillingForm(billingFormFromRecord(updated));
      setNotice(billingRecord ? '帳務紀錄已更新。' : '帳務紀錄已建立。');
      await refreshCaseOperationalState(detail.adminCase.id);
    } catch (err) {
      setBillingSubmitError(errorMessage(err));
    } finally {
      setBillingSubmitting(false);
    }
  }

  async function handleCreateSettlement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!billingRecord || !detail.adminCase) return;

    setSettlementError('');
    const validationError = validateSettlementForm(settlementForm);
    if (validationError) {
      setSettlementError(validationError);
      return;
    }

    setSettlementSubmitting(true);

    try {
      await createBillingSettlement(billingRecord.id, {
        settlementTargetType: settlementForm.settlementTargetType,
        ...(settlementForm.settlementTargetId.trim() ? { settlementTargetId: settlementForm.settlementTargetId.trim() } : {}),
        settlementAmount: parseMoney(settlementForm.settlementAmount),
        settlementStatus: settlementForm.settlementStatus,
        ...(settlementForm.settlementNote.trim() ? { settlementNote: settlementForm.settlementNote.trim() } : {})
      });
      setSettlementForm(defaultSettlementForm());
      setSettlementsOffset(0);
      setNotice('結算紀錄已新增。');
      await Promise.all([
        loadSettlementsForBilling(billingRecord.id, 0),
        loadBillingForCase(detail.adminCase.id),
        loadMessages(detail.adminCase.id, { offset: messagesOffset })
      ]);
    } catch (err) {
      setSettlementError(errorMessage(err));
    } finally {
      setSettlementSubmitting(false);
    }
  }

  function openSettlementEdit(settlement: Settlement) {
    setEditingSettlement(settlement);
    setSettlementEditForm(settlementEditFormFromSettlement(settlement));
    setSettlementEditError('');
  }

  async function handleUpdateSettlement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingSettlement || !billingRecord || !detail.adminCase) return;

    setSettlementEditError('');
    if (!SETTLEMENT_STATUS_OPTIONS.includes(settlementEditForm.settlementStatus)) {
      setSettlementEditError('結算狀態不正確。');
      return;
    }

    if (settlementEditForm.settlementStatus === 'completed' || settlementEditForm.settlementStatus === 'rejected') {
      const confirmed = window.confirm(`確認將結算狀態更新為「${settlementStatusLabel(settlementEditForm.settlementStatus)}」？`);
      if (!confirmed) return;
    }

    setSettlementUpdating(true);

    try {
      await updateSettlement(editingSettlement.id, {
        settlementStatus: settlementEditForm.settlementStatus,
        ...(settlementEditForm.settlementNote.trim() ? { settlementNote: settlementEditForm.settlementNote.trim() } : {})
      });
      setEditingSettlement(null);
      setNotice('結算狀態已更新。');
      await Promise.all([
        loadSettlementsForBilling(billingRecord.id, settlementsOffset),
        loadBillingForCase(detail.adminCase.id),
        loadMessages(detail.adminCase.id, { offset: messagesOffset })
      ]);
    } catch (err) {
      setSettlementEditError(errorMessage(err));
    } finally {
      setSettlementUpdating(false);
    }
  }

  function openCloseCaseModal(adminCase: AdminCase) {
    setPendingCloseCase(adminCase);
    setCloseNote('服務與帳務已確認，正式結案');
    setCloseError('');
  }

  async function handleCloseCaseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pendingCloseCase) return;

    setCloseError('');
    setCloseSubmitting(true);

    try {
      const caseId = pendingCloseCase.id;
      await closeCase(caseId, closeNote.trim() ? { note: closeNote.trim() } : {});
      setPendingCloseCase(null);
      setCloseNote('服務與帳務已確認，正式結案');
      setNotice('案件已結案。');
      await refreshCaseOperationalState(caseId);
    } catch (err) {
      setCloseError(errorMessage(err));
    } finally {
      setCloseSubmitting(false);
    }
  }

  function renderWorkflowSection(adminCase: AdminCase) {
    const availableActions = getAvailableCaseActions(adminCase, currentUser);

    return (
      <section className="detail-section" data-testid="case-close-status">
        <h4>案件流程操作</h4>
        <div className="workflow-summary">
          <span>目前狀態</span>
          <strong>{caseStatusLabel(adminCase.status)}</strong>
        </div>
        {availableActions.length > 0 ? (
          <div className="workflow-actions">
            {availableActions.map((action) => (
              <button
                key={action.action}
                type="button"
                className={action.action === 'reject' || action.action === 'cancel' ? 'secondary-button' : 'primary-button'}
                onClick={() => openWorkflowAction(action)}
              >
                {getCaseActionLabel(action.action)}
              </button>
            ))}
          </div>
        ) : (
          <p className="muted">目前狀態沒有可執行的流程操作。</p>
        )}
      </section>
    );
  }

  function renderCloseWorkflowSection(adminCase: AdminCase) {
    const readiness = getCaseCloseReadiness(adminCase, billingRecord, settlements);

    return (
      <section className="detail-section">
        <div className="section-heading-row">
          <div>
            <h4>結案確認</h4>
            <p className="form-hint">前端只做 UX 提示；backend 仍是結案條件與權限的最終驗證來源。</p>
          </div>
        </div>

        <div className="workflow-summary">
          <span>目前狀態</span>
          <strong>{caseStatusLabel(adminCase.status)}</strong>
        </div>

        {adminCase.status === 'closed' ? (
          <div className="inline-state">案件已結案{adminCase.closedAt ? `，結案時間：${formatDate(adminCase.closedAt)}` : '。'}</div>
        ) : null}

        <ul className="compact-list">
          {readiness.checklist.map((item) => (
            <li key={item.label}>
              <strong>{item.status === 'pass' ? '通過' : item.status === 'warning' ? '提醒' : '未通過'}</strong>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>

        {readiness.reasons.length > 0 ? (
          <div className="form-error" role="alert">
            {readiness.reasons.map((reason) => (
              <div key={reason}>{reason}</div>
            ))}
          </div>
        ) : null}

        {readiness.warnings.length > 0 ? (
          <div className="inline-state">
            {readiness.warnings.map((warning) => (
              <div key={warning}>{warning}</div>
            ))}
          </div>
        ) : null}

        {!canCloseCases ? (
          <p className="form-hint">你需要 cases.close 權限才能正式結案。</p>
        ) : null}

        {canCloseCases && readiness.canCloseByFrontendCheck && adminCase.status !== 'closed' ? (
          <div className="form-actions">
            <button type="button" className="primary-button" onClick={() => openCloseCaseModal(adminCase)}>
              正式結案
            </button>
          </div>
        ) : null}
      </section>
    );
  }

  function renderMessagesSection(adminCase: AdminCase) {
    return (
      <section className="detail-section case-timeline-section">
        <div className="section-heading-row">
          <div>
            <h4>案件時間軸 / 訊息紀錄</h4>
            <p className="form-hint">顯示 workflow events、內部備註、客戶備註與系統事件。</p>
          </div>
          <div className="timeline-toolbar">
            <label>
              排序
              <select
                value={messagesSort}
                onChange={(event) => {
                  const nextSort = event.target.value as CaseMessageSort;
                  setMessagesSort(nextSort);
                  setMessagesOffset(0);
                }}
              >
                <option value="createdAtDesc">由新到舊</option>
                <option value="createdAtAsc">由舊到新</option>
              </select>
            </label>
            <button
              type="button"
              className="secondary-button"
              disabled={messagesLoading}
              onClick={() => void loadMessages(adminCase.id)}
            >
              重新整理
            </button>
          </div>
        </div>

        {canUpdate ? (
          <form className="message-composer" onSubmit={handleCreateInternalNote}>
            <label>
              新增內部備註
              <textarea
                value={internalNote}
                maxLength={INTERNAL_NOTE_MAX_LENGTH}
                onChange={(event) => setInternalNote(event.target.value)}
                rows={4}
                placeholder="輸入只供後台內部查看的備註"
              />
            </label>
            <div className="composer-footer">
              <span>{internalNote.trim().length} / {INTERNAL_NOTE_MAX_LENGTH}</span>
              <div className="row-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={creatingMessage || !internalNote}
                  onClick={() => {
                    setInternalNote('');
                    setInternalNoteError('');
                  }}
                >
                  清空
                </button>
                <button type="submit" className="primary-button" disabled={creatingMessage}>
                  {creatingMessage ? '新增中...' : '新增內部備註'}
                </button>
              </div>
            </div>
            {internalNoteError ? <div className="form-error" role="alert">{internalNoteError}</div> : null}
          </form>
        ) : (
          <p className="form-hint">你可以查看時間軸；新增或刪除內部備註需要 cases.update 權限。</p>
        )}

        {messagesError ? <div className="form-error" role="alert">{messagesError}</div> : null}
        {messagesLoading ? (
          <div className="inline-state">載入訊息紀錄中...</div>
        ) : caseMessages.length === 0 ? (
          <div className="inline-state">目前尚無訊息紀錄。</div>
        ) : (
          <ol className="timeline-list">
            {caseMessages.map((message) => (
              <li key={message.id} className="timeline-item">
                <div className="timeline-item-header">
                  <div>
                    <span className="timeline-type">{messageTypeLabel(message.messageType)}</span>
                    <span className="timeline-meta">
                      {formatDate(message.createdAt)} · {messageSenderLabel(message)}
                      {message.channel ? ` · ${message.channel}` : ''}
                    </span>
                  </div>
                  {canUpdate && message.messageType === 'internal_note' ? (
                    <button
                      type="button"
                      className="link-button danger-link"
                      disabled={deletingMessageId === message.id}
                      onClick={() => setPendingDeleteMessage(message)}
                    >
                      {deletingMessageId === message.id ? '刪除中...' : '刪除'}
                    </button>
                  ) : null}
                </div>
                <p className="timeline-body">{message.bodyText || '此訊息沒有文字內容。'}</p>
                {message.attachmentId ? (
                  <p className="form-hint">附件：{message.attachmentId}</p>
                ) : null}
              </li>
            ))}
          </ol>
        )}

        <div className="pagination-bar timeline-pagination">
          <span>
            顯示 {caseMessages.length} 筆
            {typeof messagesTotal === 'number' ? `，共 ${messagesTotal} 筆` : ''}
          </span>
          <div>
            <button
              type="button"
              className="secondary-button"
              disabled={!hasPreviousMessagesPage || messagesLoading}
              onClick={() => setMessagesOffset(Math.max(0, messagesOffset - MESSAGE_LIMIT))}
            >
              上一頁
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={!hasNextMessagesPage || messagesLoading}
              onClick={() => setMessagesOffset(messagesOffset + MESSAGE_LIMIT)}
            >
              下一頁
            </button>
          </div>
        </div>
      </section>
    );
  }

  function renderAttachmentsSection(adminCase: AdminCase) {
    return (
      <section className="detail-section case-attachments-section">
        <div className="section-heading-row">
          <div>
            <h4>案件附件</h4>
            <p className="form-hint">查看附件 metadata，產生上傳 / 下載 URL，並保留 OCR foundation。</p>
          </div>
          {canReadAttachments ? (
            <button
              type="button"
              className="secondary-button"
              disabled={attachmentsLoading}
              onClick={() => void loadAttachments(adminCase.id)}
            >
              重新整理
            </button>
          ) : null}
        </div>

        {!canReadAttachments ? (
          <div className="inline-state">你需要 attachments.read 權限才能查看案件附件。</div>
        ) : (
          <>
            {canCreateAttachments ? (
              <form className="message-composer" onSubmit={handleUploadAttachment}>
                <label>
                  新增附件
                  <input
                    key={attachmentFileInputKey}
                    type="file"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      setAttachmentUploadForm((current) => ({ ...current, file }));
                    }}
                  />
                </label>
                <label>
                  附件類型
                  <select
                    value={attachmentUploadForm.attachmentType}
                    onChange={(event) => setAttachmentUploadForm((current) => ({
                      ...current,
                      attachmentType: event.target.value as AttachmentType
                    }))}
                  >
                    {ATTACHMENT_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>{attachmentTypeLabel(type)}</option>
                    ))}
                  </select>
                </label>
                <p className="form-hint">
                  上傳流程：取得 signed PUT URL，再直接上傳至 storage，最後完成 metadata。前端不顯示或保存 signed URL。
                </p>
                {attachmentUploadForm.file ? (
                  <div className="readonly-field">
                    <span>選取檔案</span>
                    <strong>{attachmentUploadForm.file.name} · {formatBytes(attachmentUploadForm.file.size)}</strong>
                  </div>
                ) : null}
                {attachmentUploadError ? <div className="form-error" role="alert">{attachmentUploadError}</div> : null}
                <div className="form-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={uploadingAttachment}
                    onClick={() => {
                      setAttachmentUploadForm(defaultAttachmentUploadForm());
                      setAttachmentFileInputKey((current) => current + 1);
                      setAttachmentUploadError('');
                    }}
                  >
                    清空
                  </button>
                  <button type="submit" className="primary-button" disabled={uploadingAttachment}>
                    {uploadingAttachment ? '上傳中...' : '上傳附件'}
                  </button>
                </div>
              </form>
            ) : (
              <p className="form-hint">新增附件需要 attachments.create 權限。</p>
            )}

            {attachmentsError ? <div className="form-error" role="alert">{attachmentsError}</div> : null}
            {attachmentsLoading ? (
              <div className="inline-state">載入附件中...</div>
            ) : attachments.length === 0 ? (
              <div className="inline-state">目前尚無附件。</div>
            ) : (
              <div className="attachment-list">
                {attachments.map((attachment) => {
                  const canShowOcr = OCR_ATTACHMENT_TYPES.has(attachment.attachmentType) && canRequestAttachmentOcr;
                  return (
                    <article key={attachment.id} className="attachment-card">
                      <div className="attachment-card-header">
                        <div>
                          <span className="timeline-type">{attachmentTypeLabel(attachment.attachmentType)}</span>
                          <h5>{attachment.originalFilename || '未命名附件'}</h5>
                          <p className="timeline-meta">
                            {attachment.contentType || 'unknown'} · {formatBytes(attachment.byteSize)}
                          </p>
                        </div>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="link-button"
                            disabled={downloadingAttachmentId === attachment.id}
                            onClick={() => void handleDownloadAttachment(attachment)}
                          >
                            {downloadingAttachmentId === attachment.id ? '產生中...' : '下載'}
                          </button>
                          {canShowOcr ? (
                            <button
                              type="button"
                              className="link-button"
                              disabled={ocrAttachmentId === attachment.id}
                              onClick={() => {
                                setPendingOcrAttachment(attachment);
                                setOcrNote('');
                                setOcrError('');
                              }}
                            >
                              {ocrAttachmentId === attachment.id ? '送出中...' : 'OCR'}
                            </button>
                          ) : null}
                          {canDeleteAttachments ? (
                            <button
                              type="button"
                              className="link-button danger-link"
                              disabled={deletingAttachmentId === attachment.id}
                              onClick={() => setPendingDeleteAttachment(attachment)}
                            >
                              {deletingAttachmentId === attachment.id ? '刪除中...' : '刪除紀錄'}
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <dl className="attachment-meta-grid">
                        <div><dt>來源</dt><dd>{attachment.sourceChannel || '-'}</dd></div>
                        <div><dt>Storage</dt><dd>{attachment.storageProvider || '-'}</dd></div>
                        <div><dt>OCR 狀態</dt><dd>{ocrStatusLabel(attachment.ocrStatus)}</dd></div>
                        <div><dt>OCR Confidence</dt><dd>{attachment.ocrConfidence ?? '-'}</dd></div>
                        <div><dt>建立時間</dt><dd>{formatDate(attachment.createdAt)}</dd></div>
                        <div><dt>更新時間</dt><dd>{formatDate(attachment.updatedAt)}</dd></div>
                      </dl>
                    </article>
                  );
                })}
              </div>
            )}

            <p className="form-hint">
              未來附件類型可擴充 faulty_part_photo、new_part_photo、old_serial_photo、new_serial_photo。
            </p>
          </>
        )}
      </section>
    );
  }

  function renderDispatchAppointmentSection(adminCase: AdminCase) {
    const dispatchReady = DISPATCH_READY_STATUSES.has(adminCase.status);
    const appointmentReady = APPOINTMENT_READY_STATUSES.has(adminCase.status);
    const openAppointment = appointments.find(isOpenAppointment);

    return (
      <section className="detail-section case-dispatch-section" data-testid="dispatch-appointment-panel">
        <div className="section-heading-row">
          <div>
            <h4>派工 / 預約</h4>
            <p className="form-hint">從受理案件進入派工單位、工程師指派與到府預約。</p>
          </div>
          {canManageAppointments ? (
            <button
              type="button"
              className="secondary-button"
              disabled={appointmentsLoading}
              onClick={() => void loadAppointments(adminCase.id)}
            >
              重新整理預約
            </button>
          ) : null}
        </div>

        {openAppointment ? (
          <div className="inline-note" role="status">
            目前有尚未結束的到府預約：{describeAppointmentForConfirmation(openAppointment)}
            （狀態：{APPOINTMENT_STATUS_LABELS[openAppointment.appointmentStatus] || openAppointment.appointmentStatus || '—'}，
            結果：{visitResultLabel(openAppointment.visitResult)}）。
            若要建立下一筆預約，請先更新上一筆到府結果。
            {canManageAppointments && canShowAppointmentResultAction(openAppointment) ? (
              <>
                {' '}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => openAppointmentResultUpdate(openAppointment)}
                >
                  更新這筆到府結果
                </button>
              </>
            ) : null}
          </div>
        ) : null}

        <div className="split-panel">
          <section className="sub-panel">
            <h5>Dispatch</h5>
            <div className="workflow-summary">
              <span>目前狀態</span>
              <strong>{caseStatusLabel(adminCase.status)}</strong>
            </div>
            {adminCase.dispatchUnitId ? (
              <dl className="compact-definition-list">
                <div><dt>派工單位</dt><dd>{dispatchUnitNameById.get(adminCase.dispatchUnitId) || adminCase.dispatchUnitId}</dd></div>
                <div><dt>來源</dt><dd>{adminCase.dispatchAssignmentSource || '-'}</dd></div>
              </dl>
            ) : (
              <p className="form-hint">目前無派工資料。Case detail 尚未包含完整 dispatch assignment detail。</p>
            )}

            {!canManageDispatch ? (
              <p className="form-hint">建立或更新派工需要 dispatch.manage 權限。</p>
            ) : !dispatchReady ? (
              <p className="form-hint">案件需先受理後才能派工。後端目前接受 accepted / dispatch_pending / assigned。</p>
            ) : !canReadDispatchUnits ? (
              <p className="form-hint">派工單位 picker 需要 dispatch_units.manage 權限。</p>
            ) : (
              <form className="stacked-form" onSubmit={handleDispatchSubmit}>
                {dispatchUnitsError ? <div className="form-error" role="alert">{dispatchUnitsError}</div> : null}
                <label>
                  派工單位
                  <select
                    value={dispatchForm.dispatchUnitId}
                    onChange={(event) => setDispatchForm((current) => ({ ...current, dispatchUnitId: event.target.value }))}
                    disabled={dispatchUnitsLoading || dispatchSubmitting || Boolean(adminCase.dispatchUnitId)}
                    required
                  >
                    <option value="">請選擇 active dispatch unit</option>
                    {dispatchUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name} ({unit.code}) · {unit.serviceRegion || '-'}
                      </option>
                    ))}
                  </select>
                </label>
                {dispatchUnitsLoading ? <div className="inline-note">載入派工單位中...</div> : null}
                {canReadUsers ? (
                  <label>
                    工程師（optional）
                    <select
                      value={dispatchForm.assignedEngineerId}
                      onChange={(event) => setDispatchForm((current) => ({ ...current, assignedEngineerId: event.target.value }))}
                      disabled={engineerUsersLoading || dispatchSubmitting}
                    >
                      <option value="">暫不指派工程師</option>
                      {engineerUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.displayName} ({user.email}) · {user.userType || 'user'}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <p className="form-hint">無 users.read 權限，無法載入工程師清單。</p>
                )}
                {engineerUsersLoading ? <div className="inline-note">載入使用者清單中...</div> : null}
                {engineerUsersError ? <div className="form-error" role="alert">{engineerUsersError}</div> : null}
                <p className="form-hint">工程師 picker 是 foundation fallback；後端仍會驗證 userType=engineer 與 organization membership。</p>
                {adminCase.dispatchUnitId ? (
                  <p className="form-hint">已建立派工後，本頁更新只送工程師與備註，不變更派工單位。</p>
                ) : null}
                <label>
                  派工備註
                  <textarea
                    value={dispatchForm.assignmentNote}
                    onChange={(event) => setDispatchForm((current) => ({ ...current, assignmentNote: event.target.value }))}
                    rows={3}
                  />
                </label>
                {dispatchError ? <div className="form-error" role="alert">{dispatchError}</div> : null}
                <div className="form-actions">
                  <button type="submit" className="primary-button" disabled={dispatchSubmitting || dispatchUnits.length === 0}>
                    {dispatchSubmitting ? '送出中...' : adminCase.dispatchUnitId ? '更新派工' : '建立派工'}
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="sub-panel">
            <h5>Appointment</h5>
            {!canManageAppointments ? (
              <p className="form-hint">預約列表與操作需要 appointments.manage 權限。</p>
            ) : (
              <>
                {appointmentsError ? <div className="form-error" role="alert">{appointmentsError}</div> : null}
                {appointmentsLoading ? (
                  <div className="inline-state">載入預約中...</div>
                ) : appointments.length === 0 ? (
                  <div className="inline-state">目前尚無預約。</div>
                ) : (
                  <div className="appointment-list">
                    {appointments.map((appointment) => (
                      <article
                        key={appointment.id}
                        className="attachment-card"
                        data-appointment-id={appointment.id}
                        data-testid="appointment-card"
                      >
                        <div className="attachment-card-header">
                          <div>
                            <span className="timeline-type">{APPOINTMENT_STATUS_LABELS[appointment.appointmentStatus] || appointment.appointmentStatus}</span>
                            <h5>{VISIT_TYPE_LABELS[appointment.visitType] || appointment.visitType}</h5>
                            <p className="timeline-meta">
                              {formatDate(appointment.scheduledStartAt)} - {formatDate(appointment.scheduledEndAt)}
                            </p>
                          </div>
                          <div className="form-actions">
                            {canShowAppointmentResultAction(appointment) ? (
                              <button
                                type="button"
                                className="link-button"
                                data-testid="appointment-card-result-button"
                                onClick={() => openAppointmentResultUpdate(appointment)}
                              >
                                {appointment.visitResult ? '查看 / 修正結果' : '更新到府結果'}
                              </button>
                            ) : null}
                            <button type="button" className="link-button" onClick={() => openAppointmentEdit(appointment)}>
                              編輯 / 改期
                            </button>
                          </div>
                        </div>
                        <dl className="attachment-meta-grid">
                          <div><dt>Timezone</dt><dd>{appointment.timezone || '-'}</dd></div>
                          <div><dt>到府結果</dt><dd>{visitResultLabel(appointment.visitResult)}</dd></div>
                          <div><dt>下一步</dt><dd>{nextActionLabel(appointment.nextAction)}</dd></div>
                          <div><dt>未完成原因</dt><dd>{emptyDash(appointment.incompleteReason)}</dd></div>
                          <div><dt>Reason</dt><dd>{appointment.rescheduleReason || '-'}</dd></div>
                          <div><dt>Note</dt><dd>{appointment.note || '-'}</dd></div>
                          <div><dt>更新時間</dt><dd>{formatDate(appointment.updatedAt)}</dd></div>
                        </dl>
                      </article>
                    ))}
                  </div>
                )}
                <div className="pagination-bar timeline-pagination">
                  <span>
                    顯示 {appointments.length} 筆
                    {typeof appointmentsTotal === 'number' ? `，共 ${appointmentsTotal} 筆` : ''}
                  </span>
                  <div>
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={!hasPreviousAppointmentsPage || appointmentsLoading}
                      onClick={() => setAppointmentsOffset(Math.max(0, appointmentsOffset - APPOINTMENT_LIMIT))}
                    >
                      上一頁
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={!hasNextAppointmentsPage || appointmentsLoading}
                      onClick={() => setAppointmentsOffset(appointmentsOffset + APPOINTMENT_LIMIT)}
                    >
                      下一頁
                    </button>
                  </div>
                </div>

                <section className="sub-panel" aria-label="多次到府紀錄" data-testid="visit-history-section">
                  <div className="section-heading-row">
                    <div>
                      <h5>多次到府紀錄</h5>
                      <p className="form-hint">只讀顯示每次 appointment 的到府結果；正式服務報告仍維持一案一份。</p>
                    </div>
                  </div>

                  {appointmentsLoading ? (
                    <div className="inline-state">載入到府歷程中...</div>
                  ) : appointments.length === 0 ? (
                    <div className="inline-state">目前尚無到府紀錄。</div>
                  ) : (
                    <div className="appointment-list">
                      {sortVisitHistory(appointments).map((appointment) => {
                        const isFinalAppointment = Boolean(
                          serviceReport?.finalAppointmentId &&
                          appointment.id === serviceReport.finalAppointmentId
                        );

                        return (
                          <article
                            key={`visit-history-${appointment.id}`}
                            className="attachment-card"
                            data-appointment-id={appointment.id}
                            data-testid="visit-history-card"
                          >
                            <div className="attachment-card-header">
                              <div>
                                <span className="timeline-type">
                                  {appointment.visitSequence ? `第 ${appointment.visitSequence} 次到府` : '到府紀錄'}
                                </span>
                                {isFinalAppointment ? <span className="timeline-type" data-testid="visit-history-final-marker">最終完成到府</span> : null}
                                <h5>{visitResultLabel(appointment.visitResult)}</h5>
                                <p className="timeline-meta">
                                  預約：{formatVisitDate(appointment.scheduledStartAt)} - {formatVisitDate(appointment.scheduledEndAt)}
                                </p>
                              </div>
                              {canShowAppointmentResultAction(appointment) ? (
                                <button
                                  type="button"
                                  className="link-button"
                                  data-testid="appointment-card-result-button"
                                  onClick={() => openAppointmentResultUpdate(appointment)}
                                >
                                  {appointment.visitResult ? '查看 / 修正結果' : '更新到府結果'}
                                </button>
                              ) : null}
                            </div>
                            <dl className="attachment-meta-grid">
                              <div><dt>實際到場</dt><dd>{formatVisitDate(appointment.actualArrivalAt)}</dd></div>
                              <div><dt>實際完成</dt><dd>{formatVisitDate(appointment.actualFinishedAt)}</dd></div>
                              <div><dt>預約狀態</dt><dd>{APPOINTMENT_STATUS_LABELS[appointment.appointmentStatus] || appointment.appointmentStatus || '—'}</dd></div>
                              <div><dt>到府類型</dt><dd>{VISIT_TYPE_LABELS[appointment.visitType] || appointment.visitType || '—'}</dd></div>
                              <div><dt>本次結果</dt><dd>{visitResultLabel(appointment.visitResult)}</dd></div>
                              <div><dt>下一步</dt><dd>{nextActionLabel(appointment.nextAction)}</dd></div>
                              <div><dt>未完成原因</dt><dd>{emptyDash(appointment.incompleteReason)}</dd></div>
                              <div><dt>備註</dt><dd>{emptyDash(appointment.note)}</dd></div>
                            </dl>
                          </article>
                        );
                      })}
                    </div>
                  )}

                  {serviceReport?.finalAppointmentId && !appointments.some((appointment) => appointment.id === serviceReport.finalAppointmentId) ? (
                    <div className="inline-note" role="status">
                      目前列表未包含最終完成 appointment，可能因分頁或資料未載入。
                    </div>
                  ) : null}

                  {!serviceReport?.finalAppointmentId ? (
                    <div className="inline-note" role="status">
                      {adminCase.status === 'completed'
                        ? '此案件已完成但目前未顯示 finalAppointmentId，請確認是否為 legacy case 或資料尚未載入。'
                        : '尚未指定最終完成 appointment。'}
                    </div>
                  ) : null}
                </section>

                {appointmentReady ? (
                  <form className="stacked-form appointment-form" onSubmit={handleCreateAppointment}>
                    <h5>新增預約</h5>
                    {openAppointment ? (
                      <div className="inline-note" role="status">
                        目前有尚未結束的到府預約。系統會先擋下第二筆 appointment，避免同一案件同時有多筆未完成到府。
                        請先更新 {describeAppointmentForConfirmation(openAppointment)} 的到府結果，例如缺料、客戶不在、需報價或已完成，再建立下一筆。
                        {canShowAppointmentResultAction(openAppointment) ? (
                          <>
                            {' '}
                            <button
                              type="button"
                              className="link-button"
                              onClick={() => openAppointmentResultUpdate(openAppointment)}
                            >
                              更新這筆到府結果
                            </button>
                          </>
                        ) : null}
                      </div>
                    ) : null}
                    <label>
                      開始時間
                      <input
                        id="appointment-create-start"
                        name="scheduledStartAt"
                        type="datetime-local"
                        aria-label="新增預約開始時間"
                        aria-describedby="appointment-create-datetime-help"
                        data-testid="appointment-create-start"
                        data-qa="appointment-create-start"
                        placeholder="YYYY-MM-DDTHH:mm"
                        step={60}
                        value={appointmentForm.scheduledStartAt}
                        onChange={(event) => setAppointmentForm((current) => ({ ...current, scheduledStartAt: event.target.value }))}
                        required
                      />
                    </label>
                    <label>
                      結束時間
                      <input
                        id="appointment-create-end"
                        name="scheduledEndAt"
                        type="datetime-local"
                        aria-label="新增預約結束時間"
                        aria-describedby="appointment-create-datetime-help"
                        data-testid="appointment-create-end"
                        data-qa="appointment-create-end"
                        placeholder="YYYY-MM-DDTHH:mm"
                        step={60}
                        value={appointmentForm.scheduledEndAt}
                        onChange={(event) => setAppointmentForm((current) => ({ ...current, scheduledEndAt: event.target.value }))}
                        required
                      />
                    </label>
                    <p className="form-hint" id="appointment-create-datetime-help">
                      請選擇預約開始與結束時間。若要建立下一筆預約，上一筆到府需先有完成、缺料、客戶不在、需報價、未到或取消等結果。
                    </p>
                    <label>
                      到府類型
                      <select
                        value={appointmentForm.visitType}
                        onChange={(event) => setAppointmentForm((current) => ({ ...current, visitType: event.target.value as VisitType }))}
                      >
                        {VISIT_TYPE_OPTIONS.map((visitType) => (
                          <option key={visitType} value={visitType}>{VISIT_TYPE_LABELS[visitType]}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Timezone
                      <input
                        type="text"
                        value={appointmentForm.timezone}
                        onChange={(event) => setAppointmentForm((current) => ({ ...current, timezone: event.target.value }))}
                      />
                    </label>
                    <label>
                      備註
                      <textarea
                        data-testid="appointment-create-note"
                        value={appointmentForm.note}
                        onChange={(event) => setAppointmentForm((current) => ({ ...current, note: event.target.value }))}
                        rows={3}
                      />
                    </label>
                    {appointmentError ? <div className="form-error" role="alert" data-testid="appointment-create-error">{appointmentError}</div> : null}
                    <div className="form-actions">
                      <button type="submit" className="primary-button" data-testid="appointment-create-submit" disabled={appointmentSubmitting}>
                        {appointmentSubmitting ? '建立中...' : '建立預約'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="form-hint">案件進入 accepted / dispatch_pending / assigned / scheduled 後再建立預約。</p>
                )}
              </>
            )}
          </section>
        </div>
      </section>
    );
  }

  function renderServicePartForm(
    form: ServicePartFormState,
    onChange: (next: ServicePartFormState) => void,
    error: string,
    submitting: boolean,
    submitLabel: string
  ) {
    return (
      <form className="stacked-form appointment-form" onSubmit={editingServicePart ? handleUpdateServicePart : handleAddServicePart}>
        <label>
          零件名稱
          <input
            type="text"
            value={form.partName}
            onChange={(event) => onChange({ ...form, partName: event.target.value })}
            required
          />
        </label>
        <label>
          零件料號
          <input
            type="text"
            value={form.partNo}
            onChange={(event) => onChange({ ...form, partNo: event.target.value })}
          />
        </label>
        <label>
          數量
          <input
            type="number"
            min="1"
            value={form.quantity}
            onChange={(event) => onChange({ ...form, quantity: event.target.value })}
            required
          />
        </label>
        <label>
          舊序號
          <input
            type="text"
            value={form.oldSerialNo}
            onChange={(event) => onChange({ ...form, oldSerialNo: event.target.value })}
          />
        </label>
        <label>
          新序號
          <input
            type="text"
            value={form.newSerialNo}
            onChange={(event) => onChange({ ...form, newSerialNo: event.target.value })}
          />
        </label>
        <label>
          零件狀態
          <select
            value={form.partStatus}
            onChange={(event) => onChange({ ...form, partStatus: event.target.value as PartStatus })}
          >
            {PART_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>{partStatusLabel(status)}</option>
            ))}
          </select>
        </label>
        <label>
          更換時間
          <input
            type="datetime-local"
            value={form.replacedAt}
            onChange={(event) => onChange({ ...form, replacedAt: event.target.value })}
          />
        </label>
        {error ? <div className="form-error" role="alert">{error}</div> : null}
        <div className="form-actions">
          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? '儲存中...' : submitLabel}
          </button>
        </div>
      </form>
    );
  }

  function renderFieldServiceSection(adminCase: AdminCase) {
    const serviceReady = SERVICE_READY_STATUSES.has(adminCase.status);
    const autoFinalAppointment = getAutoFinalAppointment(appointments);

    return (
      <section className="detail-section case-field-service-section" data-testid="service-report-panel">
        <div className="section-heading-row">
          <div>
            <h4>到府服務紀錄</h4>
            <p className="form-hint">查看、建立與維護工程師到府服務報告與服務零件紀錄。</p>
          </div>
          {canManageServiceReports ? (
            <button
              type="button"
              className="secondary-button"
              disabled={serviceReportLoading}
              onClick={() => void loadServiceReportForCase(adminCase.id)}
            >
              重新整理
            </button>
          ) : null}
        </div>

        {!canManageServiceReports ? (
          <div className="inline-state">你需要 service_reports.manage 權限才能查看或管理到府服務紀錄。</div>
        ) : (
          <>
            {serviceReportError ? <div className="form-error" role="alert">{serviceReportError}</div> : null}
            {serviceReportLoading ? (
              <div className="inline-state">載入到府服務紀錄中...</div>
            ) : serviceReport ? (
              <dl className="attachment-meta-grid">
                <div><dt>案件狀態</dt><dd>{caseStatusLabel(adminCase.status)}</dd></div>
                <div><dt>服務狀態</dt><dd>{serviceStatusLabel(serviceReport.serviceStatus)}</dd></div>
                <div><dt>診斷結果</dt><dd>{serviceReport.diagnosisResult || '-'}</dd></div>
                <div><dt>維修動作</dt><dd>{serviceReport.repairAction || '-'}</dd></div>
                <div><dt>維修結果</dt><dd>{serviceReport.repairResult || '-'}</dd></div>
                <div><dt>工程師備註</dt><dd>{serviceReport.engineerNote || '-'}</dd></div>
                <div><dt>客戶備註</dt><dd>{serviceReport.customerNote || '-'}</dd></div>
                <div><dt>開始時間</dt><dd>{formatDate(serviceReport.onsiteStartedAt)}</dd></div>
                <div><dt>完成時間</dt><dd>{formatDate(serviceReport.onsiteCompletedAt)}</dd></div>
                <div><dt>建立時間</dt><dd>{formatDate(serviceReport.createdAt)}</dd></div>
                <div><dt>更新時間</dt><dd>{formatDate(serviceReport.updatedAt)}</dd></div>
              </dl>
            ) : (
              <div className="inline-state">目前尚無到府服務紀錄。</div>
            )}

            {!serviceReport && !serviceReady ? (
              <p className="form-hint">案件需派工或預約後再建立到府服務紀錄。後端目前接受 assigned / scheduled / on_site。</p>
            ) : (
              <form className="message-composer" onSubmit={handleServiceReportSubmit}>
                <h5>{serviceReport ? '編輯服務紀錄' : '建立服務紀錄'}</h5>
                <label>
                  診斷結果
                  <textarea
                    data-testid="service-report-diagnosis"
                    value={serviceReportForm.diagnosisResult}
                    onChange={(event) => setServiceReportForm((current) => ({ ...current, diagnosisResult: event.target.value }))}
                    rows={3}
                  />
                </label>
                <label>
                  維修動作
                  <textarea
                    data-testid="service-report-repair-action"
                    value={serviceReportForm.repairAction}
                    onChange={(event) => setServiceReportForm((current) => ({ ...current, repairAction: event.target.value }))}
                    rows={3}
                  />
                </label>
                {serviceReport ? (
                  <>
                    <label>
                      維修結果
                      <textarea
                        data-testid="service-report-repair-result"
                        value={serviceReportForm.repairResult}
                        onChange={(event) => setServiceReportForm((current) => ({ ...current, repairResult: event.target.value }))}
                        rows={3}
                      />
                    </label>
                    <label>
                      服務狀態
                      <select
                        data-testid="service-report-service-status"
                        value={serviceReportForm.serviceStatus}
                        onChange={(event) => setServiceReportForm((current) => ({ ...current, serviceStatus: event.target.value as ServiceStatus }))}
                      >
                        {SERVICE_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>{serviceStatusLabel(status)}</option>
                        ))}
                      </select>
                    </label>
                    {serviceReportForm.serviceStatus === 'completed' ? (
                      <p className="form-hint" data-testid="service-report-final-appointment-hint">
                        {appointments.length > 0 && autoFinalAppointment
                          ? `後端會在完成服務報告時解析 finalAppointmentId；目前畫面預覽 completed visit 為${describeAppointmentForConfirmation(autoFinalAppointment)}，僅供檢查，不會由前端送出。`
                          : appointments.length > 0
                            ? '後端會在完成服務報告時解析 finalAppointmentId；目前已載入到府紀錄未顯示 completed visit，若後端找不到 eligible completed visit 會拒絕完成。'
                            : '目前沒有到府紀錄，將依 legacy 相容流程交由後端驗證。'}
                      </p>
                    ) : null}
                  </>
                ) : null}
                <label>
                  工程師備註
                  <textarea
                    value={serviceReportForm.engineerNote}
                    onChange={(event) => setServiceReportForm((current) => ({ ...current, engineerNote: event.target.value }))}
                    rows={3}
                  />
                </label>
                {serviceReport ? (
                  <label>
                    客戶備註
                    <textarea
                      value={serviceReportForm.customerNote}
                      onChange={(event) => setServiceReportForm((current) => ({ ...current, customerNote: event.target.value }))}
                      rows={3}
                    />
                  </label>
                ) : null}
                <p className="form-hint">設為已完修只會讓後端完成服務報告與案件 completed，不會自動結案或建立帳務。</p>
                {serviceReportSubmitError ? <div className="form-error" role="alert" data-testid="service-report-error">{serviceReportSubmitError}</div> : null}
                <div className="form-actions">
                  <button
                    type="submit"
                    className="primary-button"
                    data-testid="service-report-submit"
                    disabled={serviceReportSubmitting || (!serviceReport && !serviceReady)}
                  >
                    {serviceReportSubmitting ? '儲存中...' : serviceReport ? '更新服務紀錄' : '建立服務紀錄'}
                  </button>
                </div>
              </form>
            )}

            {serviceReport ? (
              <div className="sub-panel">
                <div className="section-heading-row">
                  <div>
                    <h5>服務零件</h5>
                    <p className="form-hint">記錄更換或使用零件，不做庫存扣減。</p>
                  </div>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={servicePartsLoading}
                    onClick={() => void loadServicePartsForReport(serviceReport.id)}
                  >
                    重新整理零件
                  </button>
                </div>

                {servicePartsError ? <div className="form-error" role="alert">{servicePartsError}</div> : null}
                {servicePartsLoading ? (
                  <div className="inline-state">載入服務零件中...</div>
                ) : serviceParts.length === 0 ? (
                  <div className="inline-state">目前尚無服務零件紀錄。</div>
                ) : (
                  <div className="attachment-list">
                    {serviceParts.map((part) => (
                      <article key={part.id} className="attachment-card">
                        <div className="attachment-card-header">
                          <div>
                            <span className="timeline-type">{partStatusLabel(part.partStatus)}</span>
                            <h5>{part.partName}</h5>
                            <p className="timeline-meta">{part.partNo || '-'} · 數量 {part.quantity}</p>
                          </div>
                          <div className="row-actions">
                            <button type="button" className="link-button" onClick={() => openServicePartEdit(part)}>
                              編輯
                            </button>
                            <button
                              type="button"
                              className="link-button danger-link"
                              disabled={deletingServicePartId === part.id}
                              onClick={() => setPendingDeleteServicePart(part)}
                            >
                              {deletingServicePartId === part.id ? '移除中...' : '移除'}
                            </button>
                          </div>
                        </div>
                        <dl className="attachment-meta-grid">
                          <div><dt>舊序號</dt><dd>{part.oldSerialNo || '-'}</dd></div>
                          <div><dt>新序號</dt><dd>{part.newSerialNo || '-'}</dd></div>
                          <div><dt>更換時間</dt><dd>{formatDate(part.replacedAt)}</dd></div>
                          <div><dt>更新時間</dt><dd>{formatDate(part.updatedAt)}</dd></div>
                        </dl>
                      </article>
                    ))}
                  </div>
                )}

                <div className="pagination-bar timeline-pagination">
                  <span>
                    顯示 {serviceParts.length} 筆
                    {typeof servicePartsTotal === 'number' ? `，共 ${servicePartsTotal} 筆` : ''}
                  </span>
                  <div>
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={!hasPreviousServicePartsPage || servicePartsLoading}
                      onClick={() => setServicePartsOffset(Math.max(0, servicePartsOffset - SERVICE_PART_LIMIT))}
                    >
                      上一頁
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={!hasNextServicePartsPage || servicePartsLoading}
                      onClick={() => setServicePartsOffset(servicePartsOffset + SERVICE_PART_LIMIT)}
                    >
                      下一頁
                    </button>
                  </div>
                </div>

                <h5>新增服務零件</h5>
                {renderServicePartForm(
                  servicePartForm,
                  setServicePartForm,
                  servicePartError,
                  servicePartSubmitting,
                  '新增零件'
                )}
              </div>
            ) : null}
          </>
        )}
      </section>
    );
  }

  function renderMoneyInput(label: string, value: string, onChange: (value: string) => void) {
    return (
      <label>
        {label}
        <input
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    );
  }

  function renderBillingSection(adminCase: AdminCase) {
    const billingReady = BILLING_READY_STATUSES.has(adminCase.status);

    return (
      <section className="detail-section case-billing-section">
        <div className="section-heading-row">
          <div>
            <h4>帳務 / 結算</h4>
            <p className="form-hint">建立案件帳務紀錄，追蹤工程師、原廠或內部結算狀態。</p>
          </div>
          {canManageBilling ? (
            <button
              type="button"
              className="secondary-button"
              disabled={billingLoading}
              onClick={() => void loadBillingForCase(adminCase.id)}
            >
              重新整理
            </button>
          ) : null}
        </div>

        {!canManageBilling ? (
          <div className="inline-state">你需要 billing.manage 權限才能查看或管理帳務 / 結算。</div>
        ) : (
          <>
            {billingError ? <div className="form-error" role="alert">{billingError}</div> : null}
            {billingLoading ? (
              <div className="inline-state">載入帳務紀錄中...</div>
            ) : billingRecord ? (
              <dl className="attachment-meta-grid">
                <div><dt>案件狀態</dt><dd>{caseStatusLabel(adminCase.status)}</dd></div>
                <div><dt>帳務狀態</dt><dd>{billingStatusLabel(billingRecord.billingStatus)}</dd></div>
                <div><dt>工資</dt><dd>{billingRecord.laborAmount}</dd></div>
                <div><dt>零件費</dt><dd>{billingRecord.partsAmount}</dd></div>
                <div><dt>交通費</dt><dd>{billingRecord.transportAmount}</dd></div>
                <div><dt>追加費用</dt><dd>{billingRecord.additionalAmount}</dd></div>
                <div><dt>總額</dt><dd>{billingRecord.totalAmount}</dd></div>
                <div><dt>客戶收費</dt><dd>{billingRecord.customerChargeAmount}</dd></div>
                <div><dt>原廠請款</dt><dd>{billingRecord.manufacturerClaimAmount}</dd></div>
                <div><dt>保固金額</dt><dd>{billingRecord.warrantyAmount}</dd></div>
                <div><dt>帳務備註</dt><dd>{billingRecord.billingNote || '-'}</dd></div>
                <div><dt>建立時間</dt><dd>{formatDate(billingRecord.createdAt)}</dd></div>
                <div><dt>更新時間</dt><dd>{formatDate(billingRecord.updatedAt)}</dd></div>
              </dl>
            ) : (
              <div className="inline-state" data-testid="billing-empty-state">目前尚無帳務紀錄。</div>
            )}

            {!billingRecord && !billingReady ? (
              <p className="form-hint">案件需完成服務後再建立帳務。後端目前接受 completed / closed。</p>
            ) : (
              <form className="message-composer" onSubmit={handleBillingSubmit}>
                <h5>{billingRecord ? '編輯帳務' : '建立帳務'}</h5>
                <div className="form-grid">
                  {renderMoneyInput('工資', billingForm.laborAmount, (value) => setBillingForm((current) => ({ ...current, laborAmount: value })))}
                  {renderMoneyInput('零件費', billingForm.partsAmount, (value) => setBillingForm((current) => ({ ...current, partsAmount: value })))}
                  {renderMoneyInput('交通費', billingForm.transportAmount, (value) => setBillingForm((current) => ({ ...current, transportAmount: value })))}
                  {renderMoneyInput('追加費用', billingForm.additionalAmount, (value) => setBillingForm((current) => ({ ...current, additionalAmount: value })))}
                  {renderMoneyInput('客戶收費', billingForm.customerChargeAmount, (value) => setBillingForm((current) => ({ ...current, customerChargeAmount: value })))}
                  {renderMoneyInput('原廠請款', billingForm.manufacturerClaimAmount, (value) => setBillingForm((current) => ({ ...current, manufacturerClaimAmount: value })))}
                  {renderMoneyInput('保固金額', billingForm.warrantyAmount, (value) => setBillingForm((current) => ({ ...current, warrantyAmount: value })))}
                  <label>
                    帳務狀態
                    <select
                      value={billingForm.billingStatus}
                      onChange={(event) => setBillingForm((current) => ({ ...current, billingStatus: event.target.value as BillingStatus }))}
                    >
                      {BILLING_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{billingStatusLabel(status)}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  帳務備註
                  <textarea
                    value={billingForm.billingNote}
                    onChange={(event) => setBillingForm((current) => ({ ...current, billingNote: event.target.value }))}
                    rows={3}
                  />
                </label>
                <p className="form-hint">帳務總額由後端依工資、零件費、交通費與追加費用計算；本頁不做 invoice、payment、ERP 或自動結案。</p>
                {billingSubmitError ? <div className="form-error" role="alert">{billingSubmitError}</div> : null}
                <div className="form-actions">
                  <button type="submit" className="primary-button" disabled={billingSubmitting || (!billingRecord && !billingReady)}>
                    {billingSubmitting ? '儲存中...' : billingRecord ? '更新帳務' : '建立帳務'}
                  </button>
                </div>
              </form>
            )}

            {billingRecord ? (
              <div className="sub-panel">
                <div className="section-heading-row">
                  <div>
                    <h5>結算紀錄</h5>
                    <p className="form-hint">追蹤工程師、原廠或內部結算，不執行付款或會計分錄。</p>
                  </div>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={settlementsLoading}
                    onClick={() => void loadSettlementsForBilling(billingRecord.id)}
                  >
                    重新整理結算
                  </button>
                </div>

                {settlementsError ? <div className="form-error" role="alert">{settlementsError}</div> : null}
                {settlementsLoading ? (
                  <div className="inline-state">載入結算紀錄中...</div>
                ) : settlements.length === 0 ? (
                  <div className="inline-state">目前尚無結算紀錄。</div>
                ) : (
                  <div className="attachment-list">
                    {settlements.map((settlement) => (
                      <article key={settlement.id} className="attachment-card">
                        <div className="attachment-card-header">
                          <div>
                            <span className="timeline-type">{settlementStatusLabel(settlement.settlementStatus)}</span>
                            <h5>{settlementTargetLabel(settlement.settlementTargetType)}</h5>
                            <p className="timeline-meta">金額 {settlement.settlementAmount}</p>
                          </div>
                          <button type="button" className="link-button" onClick={() => openSettlementEdit(settlement)}>
                            更新狀態
                          </button>
                        </div>
                        <dl className="attachment-meta-grid">
                          <div><dt>Target ID</dt><dd>{settlement.settlementTargetId || '-'}</dd></div>
                          <div><dt>備註</dt><dd>{settlement.settlementNote || '-'}</dd></div>
                          <div><dt>完成時間</dt><dd>{formatDate(settlement.settledAt)}</dd></div>
                          <div><dt>更新時間</dt><dd>{formatDate(settlement.updatedAt)}</dd></div>
                        </dl>
                      </article>
                    ))}
                  </div>
                )}

                <div className="pagination-bar timeline-pagination">
                  <span>
                    顯示 {settlements.length} 筆
                    {typeof settlementsTotal === 'number' ? `，共 ${settlementsTotal} 筆` : ''}
                  </span>
                  <div>
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={!hasPreviousSettlementsPage || settlementsLoading}
                      onClick={() => setSettlementsOffset(Math.max(0, settlementsOffset - SETTLEMENT_LIMIT))}
                    >
                      上一頁
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={!hasNextSettlementsPage || settlementsLoading}
                      onClick={() => setSettlementsOffset(settlementsOffset + SETTLEMENT_LIMIT)}
                    >
                      下一頁
                    </button>
                  </div>
                </div>

                <form className="stacked-form appointment-form" onSubmit={handleCreateSettlement}>
                  <h5>新增結算</h5>
                  <label>
                    結算對象
                    <select
                      value={settlementForm.settlementTargetType}
                      onChange={(event) => setSettlementForm((current) => ({ ...current, settlementTargetType: event.target.value as SettlementTargetType }))}
                    >
                      {SETTLEMENT_TARGET_OPTIONS.map((targetType) => (
                        <option key={targetType} value={targetType}>{settlementTargetLabel(targetType)}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Target ID（optional UUID）
                    <input
                      type="text"
                      value={settlementForm.settlementTargetId}
                      onChange={(event) => setSettlementForm((current) => ({ ...current, settlementTargetId: event.target.value }))}
                    />
                  </label>
                  {renderMoneyInput('結算金額', settlementForm.settlementAmount, (value) => setSettlementForm((current) => ({ ...current, settlementAmount: value })))}
                  <label>
                    初始狀態
                    <select
                      value={settlementForm.settlementStatus}
                      onChange={(event) => setSettlementForm((current) => ({ ...current, settlementStatus: event.target.value as SettlementStatus }))}
                    >
                      {SETTLEMENT_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{settlementStatusLabel(status)}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    結算備註
                    <textarea
                      value={settlementForm.settlementNote}
                      onChange={(event) => setSettlementForm((current) => ({ ...current, settlementNote: event.target.value }))}
                      rows={3}
                    />
                  </label>
                  {settlementError ? <div className="form-error" role="alert">{settlementError}</div> : null}
                  <div className="form-actions">
                    <button type="submit" className="primary-button" disabled={settlementSubmitting}>
                      {settlementSubmitting ? '新增中...' : '新增結算'}
                    </button>
                  </div>
                </form>
              </div>
            ) : null}
          </>
        )}
      </section>
    );
  }

  function renderOrganizationInput(
    value: string,
    onChange: (value: string) => void,
    label = 'Organization'
  ) {
    if (organizations.length > 0) {
      return (
        <label>
          {label}
          <select value={value} onChange={(event) => onChange(event.target.value)} required>
            <option value="">請選擇 organization</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.organizationName} ({organization.organizationCode})
              </option>
            ))}
          </select>
        </label>
      );
    }

    return (
      <label>
        Organization ID
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="organization UUID"
          required
        />
      </label>
    );
  }

  if (!canRead) {
    return (
      <section className="page-hero">
        <p className="eyebrow">Permission Required</p>
        <h2>案件管理</h2>
        <p>你需要 cases.read 權限才能查看案件管理頁。</p>
      </section>
    );
  }

  return (
    <div className="admin-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Case Management</p>
          <h2>案件管理</h2>
          <p>查看、建立與維護到府服務案件基本資料。</p>
        </div>
        {canCreate ? (
          <button type="button" className="primary-button" onClick={openCreate}>
            新增案件
          </button>
        ) : null}
      </section>

      <section className="toolbar-panel">
        <form className="toolbar-form cases-toolbar-form" onSubmit={applyFilters}>
          <label>
            Organization
            {organizations.length > 0 ? (
              <select
                value={organizationFilter}
                onChange={(event) => {
                  setOrganizationFilter(event.target.value);
                  setOffset(0);
                }}
              >
                <option value="">全部</option>
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.organizationName} ({organization.organizationCode})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={organizationFilter}
                onChange={(event) => setOrganizationFilter(event.target.value)}
                placeholder="organization UUID"
              />
            )}
          </label>
          <label>
            案件編號
            <input
              type="search"
              value={caseNoQuery}
              onChange={(event) => setCaseNoQuery(event.target.value)}
              placeholder="TW-..."
            />
          </label>
          <label>
            狀態
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as CaseStatus | '');
                setOffset(0);
              }}
            >
              <option value="">全部</option>
              {CASE_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>{caseStatusLabel(status)}</option>
              ))}
            </select>
          </label>
          <label>
            優先度
            <select
              value={priorityFilter}
              onChange={(event) => {
                setPriorityFilter(event.target.value as CasePriority | '');
                setOffset(0);
              }}
            >
              <option value="">全部</option>
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>{PRIORITY_LABELS[priority]}</option>
              ))}
            </select>
          </label>
          <label>
            案件類型
            <select
              value={caseTypeFilter}
              onChange={(event) => {
                setCaseTypeFilter(event.target.value as CaseType | '');
                setOffset(0);
              }}
            >
              <option value="">全部</option>
              {CASE_TYPE_OPTIONS.map((caseType) => (
                <option key={caseType} value={caseType}>{CASE_TYPE_LABELS[caseType]}</option>
              ))}
            </select>
          </label>
          <label>
            來源
            <select
              value={sourceFilter}
              onChange={(event) => {
                setSourceFilter(event.target.value as CaseSource | '');
                setOffset(0);
              }}
            >
              <option value="">全部</option>
              {SOURCE_OPTIONS.map((source) => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </label>
          <label>
            建立起日
            <input type="date" value={createdFrom} onChange={(event) => setCreatedFrom(event.target.value)} />
          </label>
          <label>
            建立迄日
            <input type="date" value={createdTo} onChange={(event) => setCreatedTo(event.target.value)} />
          </label>
          <div className="toolbar-actions">
            <button type="submit" className="secondary-button">搜尋</button>
            <button type="button" className="secondary-button" onClick={resetFilters}>
              清除條件
            </button>
            <button type="button" className="secondary-button" onClick={() => void loadCases()} disabled={loading}>
              重新整理
            </button>
          </div>
        </form>
      </section>

      {organizationLoading ? <div className="inline-note">載入 organizations 中...</div> : null}
      {organizationError ? <div className="form-error" role="alert">{organizationError}</div> : null}
      {queryFilterNotice ? <div className="inline-state">{queryFilterNotice}</div> : null}
      {notice ? <div className="form-success" data-testid="notice-message">{notice}</div> : null}
      {error ? <div className="form-error" role="alert">{error}</div> : null}

      <section className="data-panel">
        {loading ? (
          <div className="inline-state">載入案件中...</div>
        ) : cases.length === 0 ? (
          <div className="inline-state">目前沒有符合條件的案件。</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table cases-table">
              <thead>
                <tr>
                  <th>案件編號</th>
                  <th>客戶</th>
                  <th>手機</th>
                  <th>品牌</th>
                  <th>產品類型</th>
                  <th>案件類型</th>
                  <th>狀態</th>
                  <th>優先度</th>
                  <th>服務區</th>
                  <th>建立時間</th>
                  <th>更新時間</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((adminCase) => (
                  <tr key={adminCase.id}>
                    <td>{adminCase.caseNo}</td>
                    <td>{adminCase.customerSummary?.name || '-'}</td>
                    <td>{adminCase.customerSummary?.mobile || '-'}</td>
                    <td>{adminCase.brand}</td>
                    <td>{adminCase.productType}</td>
                    <td>{CASE_TYPE_LABELS[adminCase.caseType] || adminCase.caseType}</td>
                    <td>
                      <span className={`status-pill ${getCaseStatusClass(adminCase.status)}`}>
                        {caseStatusLabel(adminCase.status)}
                      </span>
                    </td>
                    <td>{PRIORITY_LABELS[adminCase.priority] || adminCase.priority}</td>
                    <td>{adminCase.serviceRegion || '-'}</td>
                    <td>{formatDate(adminCase.createdAt)}</td>
                    <td>{formatDate(adminCase.updatedAt)}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="link-button" onClick={() => openCaseDetail(adminCase.id)}>
                          查看
                        </button>
                        {canUpdate ? (
                          <button type="button" className="link-button" onClick={() => openEdit(adminCase)}>
                            編輯
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="pagination-bar">
          <span>
            顯示 {cases.length} 筆
            {typeof total === 'number' ? `，共 ${total} 筆` : ''}
          </span>
          <div>
            <button
              type="button"
              className="secondary-button"
              disabled={!hasPreviousPage || loading}
              onClick={() => setOffset(Math.max(0, offset - limit))}
            >
              上一頁
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={!hasNextPage || loading}
              onClick={() => setOffset(offset + limit)}
            >
              下一頁
            </button>
          </div>
        </div>
      </section>

      {showCreate ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel modal-wide" aria-label="新增案件">
            <header className="modal-header">
              <h3>新增案件</h3>
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setShowCreate(false);
                  resetCreateForm();
                }}
              >
                關閉
              </button>
            </header>
            <form className="stacked-form" onSubmit={handleCreateCase}>
              <section className="form-section">
                <h4>Customer</h4>
                {renderOrganizationInput(createForm.organizationId, (value) => setCreateForm((current) => ({ ...current, organizationId: value })))}
                <label>
                  客戶姓名
                  <input
                    type="text"
                    value={createForm.customerName}
                    onChange={(event) => setCreateForm((current) => ({ ...current, customerName: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  手機
                  <input
                    type="text"
                    value={createForm.mobile}
                    onChange={(event) => setCreateForm((current) => ({ ...current, mobile: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  市話
                  <input
                    type="text"
                    value={createForm.tel}
                    onChange={(event) => setCreateForm((current) => ({ ...current, tel: event.target.value }))}
                  />
                </label>
                <label>
                  城市
                  <input
                    type="text"
                    value={createForm.city}
                    onChange={(event) => setCreateForm((current) => ({ ...current, city: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  地址
                  <input
                    type="text"
                    value={createForm.address}
                    onChange={(event) => setCreateForm((current) => ({ ...current, address: event.target.value }))}
                    required
                  />
                </label>
              </section>

              <section className="form-section">
                <h4>Case</h4>
                <label>
                  來源
                  <select
                    value={createForm.source}
                    onChange={(event) => setCreateForm((current) => ({ ...current, source: event.target.value as CaseSource }))}
                  >
                    {SOURCE_OPTIONS.map((source) => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                </label>
                <label>
                  品牌
                  <input
                    type="text"
                    value={createForm.brand}
                    onChange={(event) => setCreateForm((current) => ({ ...current, brand: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  案件類型
                  <select
                    value={createForm.caseType}
                    onChange={(event) => setCreateForm((current) => ({ ...current, caseType: event.target.value as CaseType }))}
                  >
                    {CASE_TYPE_OPTIONS.map((caseType) => (
                      <option key={caseType} value={caseType}>{CASE_TYPE_LABELS[caseType]}</option>
                    ))}
                  </select>
                </label>
                <label>
                  產品類型
                  <input
                    type="text"
                    value={createForm.productType}
                    onChange={(event) => setCreateForm((current) => ({ ...current, productType: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  型號
                  <input
                    type="text"
                    value={createForm.modelNo}
                    onChange={(event) => setCreateForm((current) => ({ ...current, modelNo: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  序號
                  <input
                    type="text"
                    value={createForm.serialNo}
                    onChange={(event) => setCreateForm((current) => ({ ...current, serialNo: event.target.value }))}
                  />
                </label>
                <label>
                  發票日期
                  <input
                    type="date"
                    value={createForm.invoiceDate}
                    onChange={(event) => setCreateForm((current) => ({ ...current, invoiceDate: event.target.value }))}
                  />
                </label>
                <label>
                  希望到府時間
                  <input
                    type="datetime-local"
                    value={createForm.preferredVisitTime}
                    onChange={(event) => setCreateForm((current) => ({ ...current, preferredVisitTime: event.target.value }))}
                  />
                </label>
                <label>
                  優先度
                  <select
                    value={createForm.priority}
                    onChange={(event) => setCreateForm((current) => ({ ...current, priority: event.target.value as CasePriority }))}
                  >
                    {PRIORITY_OPTIONS.map((priority) => (
                      <option key={priority} value={priority}>{PRIORITY_LABELS[priority]}</option>
                    ))}
                  </select>
                </label>
                <label>
                  保固狀態
                  <select
                    value={createForm.warrantyStatus}
                    onChange={(event) => setCreateForm((current) => ({ ...current, warrantyStatus: event.target.value as WarrantyStatus }))}
                  >
                    {WARRANTY_OPTIONS.map((status) => (
                      <option key={status} value={status}>{WARRANTY_LABELS[status]}</option>
                    ))}
                  </select>
                </label>
                <label>
                  服務區
                  <input
                    type="text"
                    value={createForm.serviceRegion}
                    onChange={(event) => setCreateForm((current) => ({ ...current, serviceRegion: event.target.value }))}
                  />
                </label>
                <label>
                  問題描述
                  <textarea
                    value={createForm.problemDescription}
                    onChange={(event) => setCreateForm((current) => ({ ...current, problemDescription: event.target.value }))}
                    rows={4}
                    required
                  />
                </label>
              </section>

              {createError ? <div className="form-error" role="alert">{createError}</div> : null}
              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={() => setShowCreate(false)}>
                  取消
                </button>
                <button type="submit" className="primary-button" disabled={creating}>
                  {creating ? '建立中...' : '建立'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {editingCase ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel modal-wide" aria-label="編輯案件">
            <header className="modal-header">
              <h3>編輯案件</h3>
              <button type="button" className="link-button" onClick={() => setEditingCase(null)}>
                關閉
              </button>
            </header>
            <form className="stacked-form" onSubmit={handleUpdateCase}>
              <div className="readonly-field">
                <span>狀態</span>
                <strong>{caseStatusLabel(editingCase.status)}（狀態變更需走 workflow action）</strong>
              </div>
              <label>
                品牌
                <input
                  type="text"
                  value={editForm.brand}
                  onChange={(event) => setEditForm((current) => ({ ...current, brand: event.target.value }))}
                  required
                />
              </label>
              <label>
                案件類型
                <select
                  value={editForm.caseType}
                  onChange={(event) => setEditForm((current) => ({ ...current, caseType: event.target.value as CaseType }))}
                >
                  {CASE_TYPE_OPTIONS.map((caseType) => (
                    <option key={caseType} value={caseType}>{CASE_TYPE_LABELS[caseType]}</option>
                  ))}
                </select>
              </label>
              <label>
                產品類型
                <input
                  type="text"
                  value={editForm.productType}
                  onChange={(event) => setEditForm((current) => ({ ...current, productType: event.target.value }))}
                  required
                />
              </label>
              <label>
                型號
                <input
                  type="text"
                  value={editForm.modelNo}
                  onChange={(event) => setEditForm((current) => ({ ...current, modelNo: event.target.value }))}
                  required
                />
              </label>
              <label>
                序號
                <input
                  type="text"
                  value={editForm.serialNo}
                  onChange={(event) => setEditForm((current) => ({ ...current, serialNo: event.target.value }))}
                />
              </label>
              <label>
                發票日期
                <input
                  type="date"
                  value={editForm.invoiceDate || ''}
                  onChange={(event) => setEditForm((current) => ({ ...current, invoiceDate: event.target.value }))}
                />
              </label>
              <label>
                希望到府時間
                <input
                  type="datetime-local"
                  value={editForm.preferredVisitTime}
                  onChange={(event) => setEditForm((current) => ({ ...current, preferredVisitTime: event.target.value }))}
                />
              </label>
              <label>
                優先度
                <select
                  value={editForm.priority}
                  onChange={(event) => setEditForm((current) => ({ ...current, priority: event.target.value as CasePriority }))}
                >
                  {PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority} value={priority}>{PRIORITY_LABELS[priority]}</option>
                  ))}
                </select>
              </label>
              <label>
                保固狀態
                <select
                  value={editForm.warrantyStatus}
                  onChange={(event) => setEditForm((current) => ({ ...current, warrantyStatus: event.target.value as WarrantyStatus }))}
                >
                  {WARRANTY_OPTIONS.map((status) => (
                    <option key={status} value={status}>{WARRANTY_LABELS[status]}</option>
                  ))}
                </select>
              </label>
              <label>
                服務區
                <input
                  type="text"
                  value={editForm.serviceRegion}
                  onChange={(event) => setEditForm((current) => ({ ...current, serviceRegion: event.target.value }))}
                />
              </label>
              <label>
                問題描述
                <textarea
                  value={editForm.problemDescription}
                  onChange={(event) => setEditForm((current) => ({ ...current, problemDescription: event.target.value }))}
                  rows={4}
                  required
                />
              </label>
              {editError ? <div className="form-error" role="alert">{editError}</div> : null}
              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={() => setEditingCase(null)}>
                  取消
                </button>
                <button type="submit" className="primary-button" disabled={updating}>
                  {updating ? '更新中...' : '更新'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {detailCaseId ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel modal-wide" aria-label="案件詳情" data-testid="case-detail-panel">
            <header className="modal-header">
              <h3>案件詳情</h3>
              <button type="button" className="link-button" onClick={closeCaseDetail}>
                關閉
              </button>
            </header>
            {detail.loading ? (
              <div className="inline-state">載入詳情中...</div>
            ) : detail.adminCase ? (
              <div className="detail-grid">
                <section className="detail-section">
                  <h4>案件資料</h4>
                  <dl>
                    <div><dt>ID</dt><dd>{detail.adminCase.id}</dd></div>
                    <div><dt>案件編號</dt><dd>{detail.adminCase.caseNo}</dd></div>
                    <div><dt>Organization</dt><dd>{organizationNameById.get(detail.adminCase.organizationId || '') || detail.adminCase.organizationSummary?.name || detail.adminCase.organizationId || '-'}</dd></div>
                    <div><dt>狀態</dt><dd data-testid="case-status-label">{caseStatusLabel(detail.adminCase.status)}</dd></div>
                    <div><dt>來源</dt><dd>{detail.adminCase.source}</dd></div>
                    <div><dt>品牌</dt><dd>{detail.adminCase.brand}</dd></div>
                    <div><dt>案件類型</dt><dd>{CASE_TYPE_LABELS[detail.adminCase.caseType] || detail.adminCase.caseType}</dd></div>
                    <div><dt>產品類型</dt><dd>{detail.adminCase.productType}</dd></div>
                    <div><dt>型號</dt><dd>{detail.adminCase.modelNo}</dd></div>
                    <div><dt>序號</dt><dd>{detail.adminCase.serialNo || '-'}</dd></div>
                    <div><dt>發票日期</dt><dd>{detail.adminCase.invoiceDate || '-'}</dd></div>
                    <div><dt>問題描述</dt><dd>{detail.adminCase.problemDescription}</dd></div>
                    <div><dt>希望到府時間</dt><dd>{formatDate(detail.adminCase.preferredVisitTime)}</dd></div>
                    <div><dt>優先度</dt><dd>{PRIORITY_LABELS[detail.adminCase.priority] || detail.adminCase.priority}</dd></div>
                    <div><dt>保固狀態</dt><dd>{WARRANTY_LABELS[detail.adminCase.warrantyStatus] || detail.adminCase.warrantyStatus}</dd></div>
                    <div><dt>服務區</dt><dd>{detail.adminCase.serviceRegion || '-'}</dd></div>
                  </dl>
                </section>

                <section className="detail-section">
                  <h4>Customer Snapshot</h4>
                  <dl>
                    <div><dt>Customer ID</dt><dd>{detail.adminCase.customerId}</dd></div>
                    <div><dt>姓名</dt><dd>{detail.adminCase.customerSummary?.name || '-'}</dd></div>
                    <div><dt>手機</dt><dd>{detail.adminCase.customerSummary?.mobile || '-'}</dd></div>
                    <div><dt>市話</dt><dd>{detail.adminCase.customerSummary?.tel || '-'}</dd></div>
                    <div><dt>城市</dt><dd>{detail.adminCase.customerSummary?.city || '-'}</dd></div>
                    <div><dt>地址</dt><dd>{detail.adminCase.customerSummary?.address || '-'}</dd></div>
                  </dl>
                  <div className="form-actions">
                    <a className="secondary-button" href={customerInquiryPreviewHref(detail.adminCase)}>
                      客戶查詢預覽
                    </a>
                  </div>
                  {detail.adminCase.customerSummary?.mobile ? (
                    <p className="form-hint">將帶入案件編號與 customer snapshot 手機；客戶查詢頁不會自動送出。</p>
                  ) : (
                    <p className="form-hint">此案件沒有可預填的手機號碼，前往後需手動輸入。</p>
                  )}
                </section>

                <CustomerLineIdentitiesPanel
                  customerId={detail.adminCase.customerId}
                  organizationId={detail.adminCase.organizationId}
                  onChanged={() => setNotice('Customer LINE 身分綁定已更新。')}
                />

                <section className="detail-section">
                  <h4>時間紀錄</h4>
                  <dl>
                    <div><dt>建立時間</dt><dd>{formatDate(detail.adminCase.createdAt)}</dd></div>
                    <div><dt>更新時間</dt><dd>{formatDate(detail.adminCase.updatedAt)}</dd></div>
                    <div><dt>送出時間</dt><dd>{formatDate(detail.adminCase.submittedAt)}</dd></div>
                    <div><dt>審核時間</dt><dd>{formatDate(detail.adminCase.reviewedAt)}</dd></div>
                    <div><dt>受理時間</dt><dd>{formatDate(detail.adminCase.acceptedAt)}</dd></div>
                    <div><dt>拒絕時間</dt><dd>{formatDate(detail.adminCase.rejectedAt)}</dd></div>
                    <div><dt>取消時間</dt><dd>{formatDate(detail.adminCase.cancelledAt)}</dd></div>
                    <div><dt>預約時間</dt><dd>{formatDate(detail.adminCase.scheduledAt)}</dd></div>
                    <div><dt>完工時間</dt><dd>{formatDate(detail.adminCase.completedAt)}</dd></div>
                    <div><dt>結案時間</dt><dd>{formatDate(detail.adminCase.closedAt)}</dd></div>
                  </dl>
                </section>

                {renderWorkflowSection(detail.adminCase)}
                {renderDispatchAppointmentSection(detail.adminCase)}
                {renderFieldServiceSection(detail.adminCase)}
                {renderBillingSection(detail.adminCase)}
                {renderCloseWorkflowSection(detail.adminCase)}
                {renderAttachmentsSection(detail.adminCase)}
                {renderMessagesSection(detail.adminCase)}

                <section className="detail-section">
                  <h4>後續擴充</h4>
                  <ul className="compact-list">
                    <li>
                      <strong>Billing / Settlement</strong>
                      <span>帳務與結算 foundation 已接入；payment、ERP、invoice 與 vendor-specific rule engine 尚未實作。</span>
                    </li>
                    <li>
                      <strong>Attachments / OCR / AI</strong>
                      <span>附件、OCR 與 AI summary 只保留擴充點，不在本頁顯示 raw payload。</span>
                    </li>
                  </ul>
                </section>
              </div>
            ) : (
              <div className="form-error">
                <strong>無法開啟指定案件</strong>
                <p>{detail.error || '案件詳情載入失敗。'}</p>
                <button type="button" className="secondary-button" onClick={closeCaseDetail}>
                  清除指定案件
                </button>
              </div>
            )}
          </section>
        </div>
      ) : null}

      {pendingWorkflowAction && detail.adminCase ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel" aria-label="案件流程操作確認">
            <header className="modal-header">
              <h3>{getCaseActionLabel(pendingWorkflowAction.action)}</h3>
              <button
                type="button"
                className="link-button"
                disabled={workflowSubmitting}
                onClick={() => setPendingWorkflowAction(null)}
              >
                關閉
              </button>
            </header>
            <form className="stacked-form" onSubmit={handleWorkflowActionSubmit}>
              <div className="readonly-field">
                <span>目前狀態</span>
                <strong>{caseStatusLabel(detail.adminCase.status)}</strong>
              </div>
              <div className="readonly-field">
                <span>目標狀態</span>
                <strong>{pendingWorkflowAction.targetStatus ? caseStatusLabel(pendingWorkflowAction.targetStatus) : '依後端 workflow 判斷'}</strong>
              </div>
              {pendingWorkflowAction.action === 'reject' || pendingWorkflowAction.action === 'cancel' ? (
                <label>
                  原因
                  <textarea
                    value={workflowForm.reason}
                    onChange={(event) => setWorkflowForm((current) => ({ ...current, reason: event.target.value }))}
                    rows={4}
                    required
                  />
                </label>
              ) : null}
              <label>
                備註
                <textarea
                  value={workflowForm.note}
                  onChange={(event) => setWorkflowForm((current) => ({ ...current, note: event.target.value }))}
                  rows={3}
                />
              </label>
              {workflowError ? <div className="form-error" role="alert">{workflowError}</div> : null}
              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={workflowSubmitting}
                  onClick={() => setPendingWorkflowAction(null)}
                >
                  取消
                </button>
                <button type="submit" className="primary-button" disabled={workflowSubmitting}>
                  {workflowSubmitting ? '執行中...' : '確認執行'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {pendingCloseCase ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel" aria-label="結案確認">
            <header className="modal-header">
              <h3>正式結案</h3>
              <button
                type="button"
                className="link-button"
                disabled={closeSubmitting}
                onClick={() => setPendingCloseCase(null)}
              >
                關閉
              </button>
            </header>
            <form className="stacked-form" onSubmit={handleCloseCaseSubmit}>
              <p className="modal-copy">結案後案件將進入 closed 狀態，不能再用一般流程操作。</p>
              <div className="readonly-field">
                <span>目前狀態</span>
                <strong>{caseStatusLabel(pendingCloseCase.status)}</strong>
              </div>
              <ul className="compact-list">
                {getCaseCloseReadiness(pendingCloseCase, billingRecord, settlements).checklist.map((item) => (
                  <li key={item.label}>
                    <strong>{item.status === 'pass' ? '通過' : item.status === 'warning' ? '提醒' : '未通過'}</strong>
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
              <label>
                結案備註
                <textarea
                  value={closeNote}
                  onChange={(event) => setCloseNote(event.target.value)}
                  rows={3}
                />
              </label>
              <p className="form-hint">前端 readiness 只是提示；backend 仍會重新檢查 completed、billing、settlement 與 cases.close 權限。</p>
              {closeError ? <div className="form-error" role="alert">{closeError}</div> : null}
              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={closeSubmitting}
                  onClick={() => setPendingCloseCase(null)}
                >
                  取消
                </button>
                <button type="submit" className="primary-button" disabled={closeSubmitting}>
                  {closeSubmitting ? '結案中...' : '確認結案'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {editingAppointment ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel" aria-label="預約編輯">
            <header className="modal-header">
              <h3>編輯 / 改期預約</h3>
              <button
                type="button"
                className="link-button"
                disabled={appointmentUpdating}
                onClick={() => setEditingAppointment(null)}
              >
                關閉
              </button>
            </header>
            <form className="stacked-form" onSubmit={handleUpdateAppointment}>
              <div className="readonly-field">
                <span>預約 ID</span>
                <strong>{editingAppointment.id}</strong>
              </div>
              <label>
                開始時間
                <input
                  id="appointment-edit-start"
                  name="editScheduledStartAt"
                  type="datetime-local"
                  aria-label="編輯預約開始時間"
                  aria-describedby="appointment-edit-datetime-help"
                  data-testid="appointment-edit-start"
                  data-qa="appointment-edit-start"
                  placeholder="YYYY-MM-DDTHH:mm"
                  step={60}
                  value={appointmentEditForm.scheduledStartAt}
                  onChange={(event) => setAppointmentEditForm((current) => ({ ...current, scheduledStartAt: event.target.value }))}
                  required
                />
              </label>
              <label>
                結束時間
                <input
                  id="appointment-edit-end"
                  name="editScheduledEndAt"
                  type="datetime-local"
                  aria-label="編輯預約結束時間"
                  aria-describedby="appointment-edit-datetime-help"
                  data-testid="appointment-edit-end"
                  data-qa="appointment-edit-end"
                  placeholder="YYYY-MM-DDTHH:mm"
                  step={60}
                  value={appointmentEditForm.scheduledEndAt}
                  onChange={(event) => setAppointmentEditForm((current) => ({ ...current, scheduledEndAt: event.target.value }))}
                  required
                />
              </label>
              <p className="form-hint" id="appointment-edit-datetime-help">
                改期仍是更新同一筆 appointment，不會建立新的到府紀錄。
              </p>
              <label>
                到府類型
                <select
                  value={appointmentEditForm.visitType}
                  onChange={(event) => setAppointmentEditForm((current) => ({ ...current, visitType: event.target.value as VisitType }))}
                >
                  {VISIT_TYPE_OPTIONS.map((visitType) => (
                    <option key={visitType} value={visitType}>{VISIT_TYPE_LABELS[visitType]}</option>
                  ))}
                </select>
              </label>
              <label>
                Timezone
                <input
                  type="text"
                  value={appointmentEditForm.timezone}
                  onChange={(event) => setAppointmentEditForm((current) => ({ ...current, timezone: event.target.value }))}
                />
              </label>
              <label>
                預約狀態
                <select
                  value={appointmentEditForm.appointmentStatus}
                  onChange={(event) => setAppointmentEditForm((current) => ({
                    ...current,
                    appointmentStatus: event.target.value as AppointmentStatus | ''
                  }))}
                >
                  <option value="">不變更狀態</option>
                  <option value="cancelled">取消預約</option>
                </select>
              </label>
              <label>
                改期 / 取消原因
                <textarea
                  value={appointmentEditForm.rescheduleReason}
                  onChange={(event) => setAppointmentEditForm((current) => ({ ...current, rescheduleReason: event.target.value }))}
                  rows={3}
                />
              </label>
              <label>
                備註
                <textarea
                  value={appointmentEditForm.note}
                  onChange={(event) => setAppointmentEditForm((current) => ({ ...current, note: event.target.value }))}
                  rows={3}
                />
              </label>
              <p className="form-hint">改期會送 scheduledStartAt / scheduledEndAt 與 rescheduleReason；取消預約使用 appointmentStatus=cancelled。</p>
              {appointmentEditError ? <div className="form-error" role="alert">{appointmentEditError}</div> : null}
              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={appointmentUpdating}
                  onClick={() => setEditingAppointment(null)}
                >
                  取消
                </button>
                <button type="submit" className="primary-button" disabled={appointmentUpdating}>
                  {appointmentUpdating ? '儲存中...' : '儲存預約'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {resultAppointment ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel" aria-label="更新到府結果" data-testid="appointment-result-modal">
            <header className="modal-header">
              <h3>{resultAppointment.visitResult ? '查看 / 修正到府結果' : '更新到府結果'}</h3>
              <button
                type="button"
                className="link-button"
                disabled={appointmentResultSubmitting}
                onClick={() => setResultAppointment(null)}
              >
                關閉
              </button>
            </header>
            <form className="stacked-form" onSubmit={handleUpdateAppointmentResult}>
              <div className="readonly-field">
                <span>預約</span>
                <strong>{describeAppointmentForConfirmation(resultAppointment)}</strong>
              </div>
              <p className="form-hint">
                請記錄這一次到府嘗試的實際結果。本操作只會更新 appointment，不會自動完成服務報告、結案或建立帳務。
              </p>
              {resultAppointment.visitResult ? (
                <div className="inline-note" role="status">
                  這筆到府紀錄已有結果；修正結果僅用於補登或資料修正。
                </div>
              ) : null}
              <label>
                到府結果
                <select
                  data-testid="appointment-result-visit-result"
                  value={appointmentResultForm.visitResult}
                  onChange={(event) => setAppointmentResultForm((current) => ({
                    ...current,
                    visitResult: event.target.value
                  }))}
                  required
                >
                  <option value="">請選擇到府結果</option>
                  {VISIT_RESULT_OPTIONS.map((visitResult) => (
                    <option key={visitResult} value={visitResult}>
                      {visitResultLabel(visitResult)}
                    </option>
                  ))}
                </select>
              </label>
              {visitResultGuidance(appointmentResultForm.visitResult) ? (
                <p className="form-hint">{visitResultGuidance(appointmentResultForm.visitResult)}</p>
              ) : null}
              <label>
                下一步
                <select
                  data-testid="appointment-result-next-action"
                  value={appointmentResultForm.nextAction}
                  onChange={(event) => setAppointmentResultForm((current) => ({
                    ...current,
                    nextAction: event.target.value
                  }))}
                >
                  <option value="">暫不設定</option>
                  {NEXT_ACTION_OPTIONS.map((nextAction) => (
                    <option key={nextAction} value={nextAction}>
                      {nextActionLabel(nextAction)}
                    </option>
                  ))}
                </select>
              </label>
              {nextActionGuidance(appointmentResultForm.nextAction) ? (
                <p className="form-hint">{nextActionGuidance(appointmentResultForm.nextAction)}</p>
              ) : null}
              <label>
                未完成原因 / 現場說明
                <textarea
                  data-testid="appointment-result-incomplete-reason"
                  value={appointmentResultForm.incompleteReason}
                  onChange={(event) => setAppointmentResultForm((current) => ({
                    ...current,
                    incompleteReason: event.target.value
                  }))}
                  rows={3}
                />
              </label>
              <div className="form-grid">
                <label>
                  實際到場時間
                  <input
                    id="appointment-result-arrival"
                    name="actualArrivalAt"
                    type="datetime-local"
                    aria-label="到府結果實際到場時間"
                    aria-describedby="appointment-result-actual-time-help"
                    data-testid="appointment-result-arrival"
                    data-qa="appointment-result-arrival"
                    placeholder="YYYY-MM-DDTHH:mm"
                    step={60}
                    value={appointmentResultForm.actualArrivalAt}
                    onChange={(event) => setAppointmentResultForm((current) => ({
                      ...current,
                      actualArrivalAt: event.target.value
                    }))}
                  />
                </label>
                <label>
                  實際完成時間
                  <input
                    id="appointment-result-finished"
                    name="actualFinishedAt"
                    type="datetime-local"
                    aria-label="到府結果實際完成時間"
                    aria-describedby="appointment-result-actual-time-help"
                    data-testid="appointment-result-finished"
                    data-qa="appointment-result-finished"
                    placeholder="YYYY-MM-DDTHH:mm"
                    step={60}
                    value={appointmentResultForm.actualFinishedAt}
                    onChange={(event) => setAppointmentResultForm((current) => ({
                      ...current,
                      actualFinishedAt: event.target.value
                    }))}
                  />
                </label>
              </div>
              <p className="form-hint" id="appointment-result-actual-time-help">
                實際時間可留空；若同時填寫，到場時間不可晚於完成時間。
              </p>
              <label>
                備註
                <textarea
                  value={appointmentResultForm.note}
                  onChange={(event) => setAppointmentResultForm((current) => ({
                    ...current,
                    note: event.target.value
                  }))}
                  rows={3}
                />
              </label>
              {appointmentResultForm.visitResult && appointmentResultForm.visitResult !== 'completed' ? (
                <p className="form-hint">非完修結果建議填寫未完成原因與下一步，方便後續建立下一筆到府預約與營運追蹤。</p>
              ) : null}
              {appointmentResultForm.visitResult === 'completed' ? (
                <p className="form-hint">完修結果可供後端在完成服務報告時解析 finalAppointmentId；本操作不會自動完成服務報告或結案。</p>
              ) : null}
              {appointmentResultError ? <div className="form-error" role="alert" data-testid="appointment-result-error">{appointmentResultError}</div> : null}
              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={appointmentResultSubmitting}
                  onClick={() => setResultAppointment(null)}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  data-testid="appointment-result-submit"
                  disabled={appointmentResultSubmitting}
                >
                  {appointmentResultSubmitting ? '儲存中...' : '儲存到府結果'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {editingServicePart ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel" aria-label="編輯服務零件">
            <header className="modal-header">
              <h3>編輯服務零件</h3>
              <button
                type="button"
                className="link-button"
                disabled={servicePartUpdating}
                onClick={() => setEditingServicePart(null)}
              >
                關閉
              </button>
            </header>
            {renderServicePartForm(
              servicePartEditForm,
              setServicePartEditForm,
              servicePartEditError,
              servicePartUpdating,
              '儲存零件'
            )}
          </section>
        </div>
      ) : null}

      {pendingDeleteServicePart ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel" aria-label="移除服務零件確認">
            <header className="modal-header">
              <h3>移除服務零件紀錄</h3>
              <button
                type="button"
                className="link-button"
                disabled={Boolean(deletingServicePartId)}
                onClick={() => setPendingDeleteServicePart(null)}
              >
                關閉
              </button>
            </header>
            <p className="modal-copy">這會移除服務零件紀錄；本頁不做庫存扣減或庫存回補。</p>
            <div className="readonly-field">
              <span>零件</span>
              <strong>{pendingDeleteServicePart.partName}</strong>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={Boolean(deletingServicePartId)}
                onClick={() => setPendingDeleteServicePart(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="primary-button danger-button"
                disabled={Boolean(deletingServicePartId)}
                onClick={() => void handleDeleteServicePart()}
              >
                {deletingServicePartId ? '移除中...' : '確認移除'}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {editingSettlement ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel" aria-label="更新結算狀態">
            <header className="modal-header">
              <h3>更新結算狀態</h3>
              <button
                type="button"
                className="link-button"
                disabled={settlementUpdating}
                onClick={() => setEditingSettlement(null)}
              >
                關閉
              </button>
            </header>
            <form className="stacked-form" onSubmit={handleUpdateSettlement}>
              <div className="readonly-field">
                <span>結算對象</span>
                <strong>{settlementTargetLabel(editingSettlement.settlementTargetType)}</strong>
              </div>
              <div className="readonly-field">
                <span>結算金額</span>
                <strong>{editingSettlement.settlementAmount}</strong>
              </div>
              <label>
                結算狀態
                <select
                  value={settlementEditForm.settlementStatus}
                  onChange={(event) => setSettlementEditForm((current) => ({
                    ...current,
                    settlementStatus: event.target.value as SettlementStatus
                  }))}
                >
                  {SETTLEMENT_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{settlementStatusLabel(status)}</option>
                  ))}
                </select>
              </label>
              <label>
                結算備註
                <textarea
                  value={settlementEditForm.settlementNote}
                  onChange={(event) => setSettlementEditForm((current) => ({ ...current, settlementNote: event.target.value }))}
                  rows={3}
                />
              </label>
              <p className="form-hint">完成或退回結算只更新營運紀錄；本頁不做 payment、ERP、invoice 或自動結案。</p>
              {settlementEditError ? <div className="form-error" role="alert">{settlementEditError}</div> : null}
              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={settlementUpdating}
                  onClick={() => setEditingSettlement(null)}
                >
                  取消
                </button>
                <button type="submit" className="primary-button" disabled={settlementUpdating}>
                  {settlementUpdating ? '儲存中...' : '儲存結算狀態'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {pendingOcrAttachment ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel" aria-label="附件 OCR 確認">
            <header className="modal-header">
              <h3>送出 OCR</h3>
              <button
                type="button"
                className="link-button"
                disabled={Boolean(ocrAttachmentId)}
                onClick={() => setPendingOcrAttachment(null)}
              >
                關閉
              </button>
            </header>
            <form className="stacked-form" onSubmit={handleRequestAttachmentOcr}>
              <div className="readonly-field">
                <span>附件</span>
                <strong>{pendingOcrAttachment.originalFilename || pendingOcrAttachment.id}</strong>
              </div>
              <div className="readonly-field">
                <span>類型</span>
                <strong>{attachmentTypeLabel(pendingOcrAttachment.attachmentType)}</strong>
              </div>
              <label>
                備註
                <textarea
                  value={ocrNote}
                  onChange={(event) => setOcrNote(event.target.value)}
                  rows={3}
                  placeholder="optional"
                />
              </label>
              <p className="form-hint">OCR 結果只會進入 AI/OCR job 與附件 OCR lifecycle，不會直接覆蓋案件正式欄位。</p>
              {ocrError ? <div className="form-error" role="alert">{ocrError}</div> : null}
              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={Boolean(ocrAttachmentId)}
                  onClick={() => setPendingOcrAttachment(null)}
                >
                  取消
                </button>
                <button type="submit" className="primary-button" disabled={Boolean(ocrAttachmentId)}>
                  {ocrAttachmentId ? '送出中...' : '確認送出'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {pendingDeleteAttachment ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel" aria-label="刪除附件紀錄確認">
            <header className="modal-header">
              <h3>刪除附件紀錄</h3>
              <button
                type="button"
                className="link-button"
                disabled={Boolean(deletingAttachmentId)}
                onClick={() => setPendingDeleteAttachment(null)}
              >
                關閉
              </button>
            </header>
            <p className="modal-copy">這會 soft-delete 附件 metadata，不代表 R2 物件已永久刪除。</p>
            <div className="readonly-field">
              <span>附件</span>
              <strong>{pendingDeleteAttachment.originalFilename || pendingDeleteAttachment.id}</strong>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={Boolean(deletingAttachmentId)}
                onClick={() => setPendingDeleteAttachment(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="primary-button danger-button"
                disabled={Boolean(deletingAttachmentId)}
                onClick={() => void handleDeleteAttachment()}
              >
                {deletingAttachmentId ? '刪除中...' : '確認刪除紀錄'}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {pendingDeleteMessage ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel" aria-label="刪除內部備註確認">
            <header className="modal-header">
              <h3>刪除內部備註</h3>
              <button
                type="button"
                className="link-button"
                disabled={Boolean(deletingMessageId)}
                onClick={() => setPendingDeleteMessage(null)}
              >
                關閉
              </button>
            </header>
            <p className="modal-copy">這會 soft delete 這則內部備註。流程事件與系統事件不在本頁提供刪除操作。</p>
            <div className="readonly-field">
              <span>備註時間</span>
              <strong>{formatDate(pendingDeleteMessage.createdAt)}</strong>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={Boolean(deletingMessageId)}
                onClick={() => setPendingDeleteMessage(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="primary-button danger-button"
                disabled={Boolean(deletingMessageId)}
                onClick={() => void handleDeleteMessage()}
              >
                {deletingMessageId ? '刪除中...' : '確認刪除'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
