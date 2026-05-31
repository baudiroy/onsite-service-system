import { apiRequest } from '../lib/apiClient';

export type DepotWorkshopAssignmentIntentPreviewPayload = Record<string, unknown>;

export type DepotWorkshopAssignmentIntentPreviewResponse = {
  data?: {
    depotRepair?: {
      repairOrderDraftSummary?: Record<string, unknown> | null;
      repairOrderTransitionPlanSummary?: Record<string, unknown> | null;
      repairOrderAuditIntentSummary?: Record<string, unknown> | null;
      repairOrderCustomerProjectionPreview?: Record<string, unknown> | null;
      writeRequired?: false;
    } | null;
  };
  meta?: {
    written?: false;
    requestId?: string | null;
  };
  requestId?: string | null;
};

function isPlainObject(value: unknown): value is DepotWorkshopAssignmentIntentPreviewPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function previewPayloadFrom(payload: unknown): DepotWorkshopAssignmentIntentPreviewPayload {
  if (!isPlainObject(payload)) {
    throw new TypeError('Depot Workshop preview payload must be a plain object.');
  }

  return { ...payload };
}

function depotIntakePathSegment(depotIntakeId: string) {
  const normalized = String(depotIntakeId || '').trim();

  if (!normalized) {
    throw new TypeError('depotIntakeId is required for Depot Workshop preview.');
  }

  return encodeURIComponent(normalized);
}

export function previewDepotWorkshopAssignmentIntent(
  depotIntakeId: string,
  payload: DepotWorkshopAssignmentIntentPreviewPayload = {}
) {
  const depotIntakePath = depotIntakePathSegment(depotIntakeId);

  return apiRequest<DepotWorkshopAssignmentIntentPreviewResponse>(
    `/api/v1/depot/repairs/${depotIntakePath}/assignment-intent`,
    {
      method: 'POST',
      body: previewPayloadFrom(payload)
    }
  );
}
