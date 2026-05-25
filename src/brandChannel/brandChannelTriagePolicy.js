'use strict';

const TRIAGE_CATEGORIES = Object.freeze([
  'brand_product_question',
  'new_repair_or_installation',
  'existing_case_inquiry',
  'complaint_or_dispute',
  'high_risk',
  'unknown',
]);

const PRODUCT_HINTS = new Set([
  'brand_product_question',
  'product_question',
  'official_info',
  'faq',
  'warranty',
  'troubleshooting',
]);

const REPAIR_HINTS = new Set([
  'new_repair_or_installation',
  'new_repair',
  'repair_request',
  'installation_request',
  'open_repair_intake',
]);

const CASE_HINTS = new Set([
  'existing_case_inquiry',
  'case_inquiry',
  'reschedule',
  'missing_info',
  'completion_issue',
  'case_status',
]);

const COMPLAINT_HINTS = new Set([
  'complaint_or_dispute',
  'complaint',
  'dispute',
  'negative_feedback',
  'compensation_request',
]);

const HIGH_RISK_HINTS = new Set([
  'high_risk',
  'safety_issue',
  'emergency',
  'legal_risk',
  'identity_uncertain',
]);

function normalizeHint(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function hasAnyHint(hints, allowed) {
  return hints.some((hint) => allowed.has(hint));
}

function collectHints(input) {
  const rawHints = [
    input.intent_hint,
    input.intentHint,
    input.message_category,
    input.messageCategory,
    input.category_hint,
    input.categoryHint,
  ];

  if (Array.isArray(input.intent_hints)) {
    rawHints.push(...input.intent_hints);
  }
  if (Array.isArray(input.intentHints)) {
    rawHints.push(...input.intentHints);
  }

  return rawHints.map(normalizeHint).filter(Boolean);
}

function chooseCategory(hints) {
  if (hasAnyHint(hints, HIGH_RISK_HINTS)) {
    return 'high_risk';
  }
  if (hasAnyHint(hints, COMPLAINT_HINTS)) {
    return 'complaint_or_dispute';
  }
  if (hasAnyHint(hints, CASE_HINTS)) {
    return 'existing_case_inquiry';
  }
  if (hasAnyHint(hints, REPAIR_HINTS)) {
    return 'new_repair_or_installation';
  }
  if (hasAnyHint(hints, PRODUCT_HINTS)) {
    return 'brand_product_question';
  }
  return 'unknown';
}

function buildRoute(category, verified, caseBound) {
  if (category === 'brand_product_question') {
    return {
      route: 'brand_authorized_knowledge_future_path',
      requiredNextStep: 'use_brand_authorized_knowledge_only',
      reasonKey: 'brand_product_question_knowledge_only',
    };
  }

  if (category === 'new_repair_or_installation') {
    return {
      route: 'repair_intake_future_path',
      requiredNextStep: 'collect_or_continue_repair_intake',
      reasonKey: 'new_repair_or_installation_intake',
    };
  }

  if (category === 'existing_case_inquiry') {
    if (verified && caseBound) {
      return {
        route: 'customer_visible_case_policy_required',
        requiredNextStep: 'apply_customer_visible_data_policy',
        reasonKey: 'existing_case_inquiry_verified_case_bound',
      };
    }

    return {
      route: 'verification_and_case_binding_required',
      requiredNextStep: 'verify_customer_and_bind_case',
      reasonKey: 'existing_case_inquiry_requires_verification_case_binding',
    };
  }

  if (category === 'complaint_or_dispute') {
    return {
      route: 'human_escalation_required',
      requiredNextStep: 'create_escalation_or_complaint_record',
      reasonKey: 'complaint_or_dispute_human_required',
    };
  }

  if (category === 'high_risk') {
    return {
      route: 'human_review_required',
      requiredNextStep: 'stop_automation_and_route_to_human',
      reasonKey: 'high_risk_human_required',
    };
  }

  return {
    route: 'human_review_required',
    requiredNextStep: 'classify_or_request_human_review',
    reasonKey: 'unknown_intent_fails_safe',
  };
}

function classifyBrandChannelIntent(input = {}) {
  const raw = input && typeof input === 'object' ? input : {};
  const hints = collectHints(raw);
  const category = chooseCategory(hints);
  const verified = raw.verifiedCustomer === true || raw.customer_verified === true;
  const caseBound = raw.caseBound === true || raw.case_binding === true;
  const route = buildRoute(category, verified, caseBound);

  return {
    category,
    route: route.route,
    requiredNextStep: route.requiredNextStep,
    reasonKey: route.reasonKey,
    safeguards: {
      identityVerifiedByPolicy: false,
      caseBindingGrantedByPolicy: false,
      caseDataAccessGrantedByPolicy: false,
      aiDecisionAllowed: false,
      liabilityDecisionAllowed: false,
      compensationPromiseAllowed: false,
      quoteSettlementApprovalAllowed: false,
      complaintClosureAllowed: false,
    },
  };
}

module.exports = {
  TRIAGE_CATEGORIES,
  classifyBrandChannelIntent,
};
