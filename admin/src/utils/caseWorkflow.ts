import type { AdminCase, CaseStatus } from '../api/cases';
import { hasPermission, hasRole, isAdminLike } from '../auth/permissions';
import type { CurrentUser } from '../types/auth';

export type CaseWorkflowAction = 'submit' | 'review' | 'accept' | 'reject' | 'cancel' | 'close';

export type AvailableCaseAction = {
  action: CaseWorkflowAction;
  requiredPermission: string;
  targetStatus?: CaseStatus;
};

const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  pending_customer: '等待客戶補件',
  submitted: '已送出',
  reviewing: '審核中',
  accepted: '已受理',
  rejected: '未受理',
  cancelled: '已取消',
  dispatch_pending: '安排派工中',
  assigned: '已指派',
  scheduled: '已預約',
  on_site: '工程師處理中',
  completed: '服務已完成',
  closed: '已結案'
};

const ACTION_LABELS: Record<CaseWorkflowAction, string> = {
  submit: '送出案件',
  review: '開始審核',
  accept: '受理案件',
  reject: '駁回案件',
  cancel: '取消案件',
  close: '結案'
};

function canUsePermission(user: CurrentUser | null, permissionKey: string) {
  return isAdminLike(user) || hasRole(user, 'admin') || hasRole(user, 'system') || hasPermission(user, permissionKey);
}

export function getCaseStatusLabel(status?: string | null) {
  return status ? STATUS_LABELS[status] || status : '-';
}

export function getCaseActionLabel(action: CaseWorkflowAction) {
  return ACTION_LABELS[action];
}

export function getAvailableCaseActions(adminCase: AdminCase, currentUser: CurrentUser | null): AvailableCaseAction[] {
  const candidates: AvailableCaseAction[] = [];

  if (adminCase.status === 'draft' || adminCase.status === 'pending_customer') {
    candidates.push({ action: 'submit', requiredPermission: 'cases.update', targetStatus: 'submitted' });
  }

  if (adminCase.status === 'submitted') {
    candidates.push(
      { action: 'review', requiredPermission: 'cases.review', targetStatus: 'reviewing' },
      { action: 'cancel', requiredPermission: 'cases.cancel', targetStatus: 'cancelled' }
    );
  }

  if (adminCase.status === 'reviewing') {
    candidates.push(
      { action: 'accept', requiredPermission: 'cases.accept', targetStatus: 'accepted' },
      { action: 'reject', requiredPermission: 'cases.reject', targetStatus: 'rejected' },
      { action: 'cancel', requiredPermission: 'cases.cancel', targetStatus: 'cancelled' }
    );
  }

  return candidates.filter((candidate) => canUsePermission(currentUser, candidate.requiredPermission));
}
