import type { BillingRecord, Settlement } from '../api/billing';
import type { AdminCase } from '../api/cases';

export type CaseCloseChecklistItem = {
  label: string;
  status: 'pass' | 'fail' | 'warning';
};

export type CaseCloseReadiness = {
  canCloseByFrontendCheck: boolean;
  reasons: string[];
  warnings: string[];
  checklist: CaseCloseChecklistItem[];
};

const CLOSE_READY_BILLING_STATUSES = new Set(['approved', 'settled']);
const BLOCKING_SETTLEMENT_STATUSES = new Set(['pending', 'submitted']);

function addChecklistItem(
  checklist: CaseCloseChecklistItem[],
  label: string,
  status: CaseCloseChecklistItem['status']
) {
  checklist.push({ label, status });
}

export function getCaseCloseReadiness(
  adminCase: AdminCase,
  billingRecord: BillingRecord | null,
  settlements: Settlement[]
): CaseCloseReadiness {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const checklist: CaseCloseChecklistItem[] = [];

  if (adminCase.status === 'closed') {
    reasons.push('案件已結案');
    addChecklistItem(checklist, '案件尚未結案', 'fail');
  } else {
    addChecklistItem(checklist, '案件尚未結案', 'pass');
  }

  if (adminCase.status === 'completed') {
    addChecklistItem(checklist, '案件狀態為服務已完成', 'pass');
  } else {
    reasons.push('案件狀態必須為服務已完成');
    addChecklistItem(checklist, '案件狀態為服務已完成', 'fail');
  }

  if (adminCase.completedAt) {
    addChecklistItem(checklist, '服務完成時間存在', 'pass');
  } else {
    warnings.push('目前前端無法確認 completedAt，將交由 backend 驗證');
    addChecklistItem(checklist, '服務完成時間存在', 'warning');
  }

  if (billingRecord) {
    if (CLOSE_READY_BILLING_STATUSES.has(String(billingRecord.billingStatus))) {
      addChecklistItem(checklist, '帳務狀態為已核准或已結清', 'pass');
    } else {
      reasons.push('帳務狀態必須為已核准或已結清');
      addChecklistItem(checklist, '帳務狀態為已核准或已結清', 'fail');
    }
  } else {
    warnings.push('目前尚無帳務紀錄；若 backend 規則允許，仍可由 backend 最終判斷');
    addChecklistItem(checklist, '帳務狀態為已核准或已結清', 'warning');
  }

  const blockingSettlements = settlements.filter((settlement) =>
    BLOCKING_SETTLEMENT_STATUSES.has(String(settlement.settlementStatus))
  );

  if (blockingSettlements.length > 0) {
    reasons.push('仍有待處理或已送出的結算紀錄');
    addChecklistItem(checklist, '無 pending / submitted 結算紀錄', 'fail');
  } else {
    addChecklistItem(checklist, '無 pending / submitted 結算紀錄', 'pass');
  }

  return {
    canCloseByFrontendCheck: reasons.length === 0,
    reasons,
    warnings,
    checklist
  };
}
