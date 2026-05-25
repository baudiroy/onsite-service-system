'use strict';

const CHANNEL_PURPOSES = Object.freeze([
  'customer_service',
  'repair_intake',
  'service_status',
  'sales_membership',
  'regional_service',
  'dealer_channel',
  'campaign',
  'unknown',
]);

const CHANNEL_STATUSES = Object.freeze([
  'active',
  'paused',
  'disabled',
  'archived',
  'unknown',
]);

const FLOW_KEYS = Object.freeze([
  'brand_faq',
  'brand_knowledge_ai',
  'repair_intake',
  'repair_intake_referral',
  'verification_entry',
  'case_binding',
  'case_query',
  'appointment_status',
  'reschedule',
  'missing_info',
  'completion_report',
  'issue_reporting',
  'human_handoff',
  'regional_repair_intake',
  'dealer_referral',
  'campaign_referral',
  'product_info',
  'unknown',
]);

const PURPOSE_SET = new Set(CHANNEL_PURPOSES);
const STATUS_SET = new Set(CHANNEL_STATUSES);
const FLOW_SET = new Set(FLOW_KEYS);

const PURPOSE_DEFAULT_FLOWS = Object.freeze({
  customer_service: Object.freeze([
    'brand_faq',
    'brand_knowledge_ai',
    'repair_intake_referral',
    'verification_entry',
    'human_handoff',
  ]),
  repair_intake: Object.freeze([
    'repair_intake',
    'verification_entry',
    'case_binding',
    'case_query',
    'missing_info',
    'human_handoff',
  ]),
  service_status: Object.freeze([
    'verification_entry',
    'case_query',
    'appointment_status',
    'reschedule',
    'missing_info',
    'completion_report',
    'issue_reporting',
    'human_handoff',
  ]),
  sales_membership: Object.freeze([
    'product_info',
    'brand_faq',
    'brand_knowledge_ai',
    'repair_intake_referral',
    'human_handoff',
  ]),
  regional_service: Object.freeze([
    'brand_faq',
    'brand_knowledge_ai',
    'regional_repair_intake',
    'repair_intake_referral',
    'verification_entry',
    'human_handoff',
  ]),
  dealer_channel: Object.freeze([
    'dealer_referral',
    'repair_intake_referral',
    'human_handoff',
  ]),
  campaign: Object.freeze([
    'campaign_referral',
  ]),
  unknown: Object.freeze([]),
});

const CASE_RELATED_FLOWS = new Set([
  'case_binding',
  'case_query',
  'appointment_status',
  'reschedule',
  'missing_info',
  'completion_report',
  'issue_reporting',
]);

const AI_RAG_FLOWS = new Set([
  'brand_knowledge_ai',
]);

const SAFE_VALUE_PATTERN = /^[a-zA-Z0-9_.:/@ -]+$/;

function normalizeSafeString(value, { maxLength = 120, lower = false } = {}) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength || !SAFE_VALUE_PATTERN.test(trimmed)) {
    return null;
  }

  return lower ? trimmed.toLowerCase() : trimmed;
}

function normalizeIdentifier(value) {
  return normalizeSafeString(value, { maxLength: 80 });
}

function normalizePurpose(value) {
  const normalized = normalizeSafeString(value, { maxLength: 60, lower: true });
  if (!normalized || !PURPOSE_SET.has(normalized)) {
    return 'unknown';
  }
  return normalized;
}

function normalizeStatus(value) {
  const normalized = normalizeSafeString(value, { maxLength: 40, lower: true });
  if (!normalized || !STATUS_SET.has(normalized)) {
    return 'unknown';
  }
  return normalized;
}

function normalizeFlow(value) {
  const normalized = normalizeSafeString(value, { maxLength: 80, lower: true });
  if (!normalized || !FLOW_SET.has(normalized)) {
    return 'unknown';
  }
  return normalized;
}

function normalizeAllowedFlows(rawAllowedFlows, purpose) {
  const defaultFlows = PURPOSE_DEFAULT_FLOWS[purpose] || PURPOSE_DEFAULT_FLOWS.unknown;
  const candidates = Array.isArray(rawAllowedFlows) && rawAllowedFlows.length > 0
    ? rawAllowedFlows
    : defaultFlows;
  const defaultSet = new Set(defaultFlows);
  const normalized = [];

  for (const candidate of candidates) {
    const flow = normalizeFlow(candidate);
    if (flow !== 'unknown' && defaultSet.has(flow) && !normalized.includes(flow)) {
      normalized.push(flow);
    }
  }

  return normalized;
}

function normalizeMultiLineChannelConfig(input = {}) {
  const raw = input && typeof input === 'object' ? input : {};
  const purpose = normalizePurpose(raw.purpose || raw.channel_purpose || raw.channelPurpose);
  const status = normalizeStatus(raw.status);

  return {
    organizationId: normalizeIdentifier(raw.organization_id || raw.organizationId),
    brandId: normalizeIdentifier(raw.brand_id || raw.brandId),
    lineChannelId: normalizeIdentifier(raw.line_channel_id || raw.lineChannelId),
    channelName: normalizeSafeString(raw.channel_name || raw.channelName, { maxLength: 100 }),
    purpose,
    status,
    ownerDepartment: normalizeSafeString(raw.owner_department || raw.ownerDepartment, { maxLength: 80 }),
    allowedFlows: normalizeAllowedFlows(raw.allowed_flows || raw.allowedFlows, purpose),
    defaultLanguage: normalizeSafeString(raw.default_language || raw.defaultLanguage, {
      maxLength: 20,
      lower: true,
    }),
    messageTemplateKey: normalizeSafeString(raw.message_template_key || raw.messageTemplateKey, {
      maxLength: 80,
    }),
    knowledgeBaseId: normalizeIdentifier(raw.knowledge_base_id || raw.knowledgeBaseId),
    aiRagEnabled: raw.ai_rag_enabled === true || raw.aiRagEnabled === true,
  };
}

function baseResult(metadata, allowed, reasonKey, requiredNextStep) {
  return {
    allowed,
    reasonKey,
    requiredNextStep,
    metadata,
    safeguards: {
      identityVerifiedByPolicy: false,
      caseBindingGrantedByPolicy: false,
      caseDataAccessGrantedByPolicy: false,
      providerRuntimeAllowed: false,
      webhookRuntimeAllowed: false,
      aiRagRuntimeInvoked: false,
    },
  };
}

function evaluateMultiLineChannelFlow(input = {}, requestedFlow) {
  const metadata = normalizeMultiLineChannelConfig(input);
  const flow = normalizeFlow(requestedFlow || input.requested_flow || input.requestedFlow);

  if (!metadata.organizationId || !metadata.brandId || !metadata.lineChannelId) {
    return baseResult(metadata, false, 'missing_required_channel_scope', 'collect_valid_channel_scope');
  }

  if (metadata.purpose === 'unknown') {
    return baseResult(metadata, false, 'unknown_channel_purpose_fails_closed', 'configure_valid_channel_purpose');
  }

  if (metadata.status === 'unknown') {
    return baseResult(metadata, false, 'unknown_channel_status_fails_closed', 'configure_valid_channel_status');
  }

  if (metadata.status !== 'active') {
    return baseResult(metadata, false, `channel_${metadata.status}_fails_closed`, 'activate_channel_before_use');
  }

  if (flow === 'unknown') {
    return baseResult(metadata, false, 'unknown_flow_fails_closed', 'configure_valid_allowed_flow');
  }

  if (!metadata.allowedFlows.includes(flow)) {
    return baseResult(metadata, false, 'flow_not_allowed_for_channel_purpose', 'route_to_allowed_channel_flow');
  }

  if (AI_RAG_FLOWS.has(flow)) {
    if (!metadata.aiRagEnabled) {
      return baseResult(metadata, false, 'brand_knowledge_ai_not_enabled', 'disable_ai_or_enable_channel_ai_policy');
    }
    if (!metadata.knowledgeBaseId) {
      return baseResult(metadata, false, 'brand_knowledge_ai_missing_knowledge_base', 'configure_channel_knowledge_base');
    }
    return baseResult(metadata, true, 'brand_knowledge_ai_channel_scope_only', 'use_channel_authorized_knowledge_base_only');
  }

  if (CASE_RELATED_FLOWS.has(flow)) {
    return baseResult(metadata, true, 'case_related_flow_requires_verification_case_binding', 'verification_and_case_binding_required');
  }

  return baseResult(metadata, true, 'flow_allowed_metadata_only', 'continue_allowed_channel_flow');
}

module.exports = {
  CHANNEL_PURPOSES,
  CHANNEL_STATUSES,
  FLOW_KEYS,
  normalizeMultiLineChannelConfig,
  evaluateMultiLineChannelFlow,
};
