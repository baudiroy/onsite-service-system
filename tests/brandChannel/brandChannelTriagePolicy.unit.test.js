'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  TRIAGE_CATEGORIES,
  classifyBrandChannelIntent,
} = require('../../src/brandChannel/brandChannelTriagePolicy');

const modulePath = path.resolve(__dirname, '../../src/brandChannel/brandChannelTriagePolicy.js');

function assertNoAccessOrAiDecision(result) {
  assert.deepEqual(result.safeguards, {
    identityVerifiedByPolicy: false,
    caseBindingGrantedByPolicy: false,
    caseDataAccessGrantedByPolicy: false,
    aiDecisionAllowed: false,
    liabilityDecisionAllowed: false,
    compensationPromiseAllowed: false,
    quoteSettlementApprovalAllowed: false,
    complaintClosureAllowed: false,
  });
}

function assertNoSensitiveEcho(result) {
  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /raw customer message/i);
  assert.doesNotMatch(serialized, /credential-placeholder/);
  assert.doesNotMatch(serialized, /0912/);
  assert.doesNotMatch(serialized, /line-user-/);
  assert.doesNotMatch(serialized, /raw-provider-payload/);
  assert.doesNotMatch(serialized, /full customer payload/i);
}

test('module remains pure and does not import runtime, DB, provider, env, fs, network, logger, or config code', () => {
  const source = fs.readFileSync(modulePath, 'utf8');

  assert.doesNotMatch(source, /require\(/);
  assert.doesNotMatch(source, /import\s+/);
  assert.doesNotMatch(source, /process\.env/);
  assert.doesNotMatch(source, /fetch\(/);
  assert.doesNotMatch(source, /axios|pg|pool|repository|router|express|logger|config|openai|rag/i);
});

test('exports canonical triage categories', () => {
  assert.deepEqual(TRIAGE_CATEGORIES, [
    'brand_product_question',
    'new_repair_or_installation',
    'existing_case_inquiry',
    'complaint_or_dispute',
    'high_risk',
    'unknown',
  ]);
});

test('routes brand product questions to brand-authorized knowledge future path without case-data access', () => {
  const result = classifyBrandChannelIntent({
    intent_hint: 'brand_product_question',
    referralMetadata: {
      sourceChannel: 'brand_line',
      hasScopedLineContext: true,
    },
  });

  assert.equal(result.category, 'brand_product_question');
  assert.equal(result.route, 'brand_authorized_knowledge_future_path');
  assert.equal(result.requiredNextStep, 'use_brand_authorized_knowledge_only');
  assert.equal(result.reasonKey, 'brand_product_question_knowledge_only');
  assertNoAccessOrAiDecision(result);
});

test('routes new repair and installation requests to repair intake without verification grants', () => {
  const result = classifyBrandChannelIntent({
    message_category: 'installation request',
  });

  assert.equal(result.category, 'new_repair_or_installation');
  assert.equal(result.route, 'repair_intake_future_path');
  assert.equal(result.requiredNextStep, 'collect_or_continue_repair_intake');
  assertNoAccessOrAiDecision(result);
});

test('existing case inquiry before verification requires verification and Case Binding', () => {
  const result = classifyBrandChannelIntent({
    intentHint: 'case_inquiry',
    verifiedCustomer: false,
    caseBound: false,
  });

  assert.equal(result.category, 'existing_case_inquiry');
  assert.equal(result.route, 'verification_and_case_binding_required');
  assert.equal(result.requiredNextStep, 'verify_customer_and_bind_case');
  assert.equal(result.reasonKey, 'existing_case_inquiry_requires_verification_case_binding');
  assertNoAccessOrAiDecision(result);
});

test('existing case inquiry after verification still requires customer-visible policy rather than granting access directly', () => {
  const result = classifyBrandChannelIntent({
    intentHint: 'reschedule',
    verifiedCustomer: true,
    caseBound: true,
  });

  assert.equal(result.category, 'existing_case_inquiry');
  assert.equal(result.route, 'customer_visible_case_policy_required');
  assert.equal(result.requiredNextStep, 'apply_customer_visible_data_policy');
  assert.equal(result.reasonKey, 'existing_case_inquiry_verified_case_bound');
  assertNoAccessOrAiDecision(result);
});

test('complaint or dispute routes to human escalation and forbids AI closure or compensation decisions', () => {
  const result = classifyBrandChannelIntent({
    intent_hints: ['negative_feedback', 'compensation_request'],
  });

  assert.equal(result.category, 'complaint_or_dispute');
  assert.equal(result.route, 'human_escalation_required');
  assert.equal(result.requiredNextStep, 'create_escalation_or_complaint_record');
  assert.equal(result.reasonKey, 'complaint_or_dispute_human_required');
  assertNoAccessOrAiDecision(result);
});

test('high-risk input routes to human review before any automated handling', () => {
  const result = classifyBrandChannelIntent({
    category_hint: 'safety issue',
  });

  assert.equal(result.category, 'high_risk');
  assert.equal(result.route, 'human_review_required');
  assert.equal(result.requiredNextStep, 'stop_automation_and_route_to_human');
  assert.equal(result.reasonKey, 'high_risk_human_required');
  assertNoAccessOrAiDecision(result);
});

test('unknown and ambiguous input fails safe to human review without case-data access', () => {
  const result = classifyBrandChannelIntent({
    messageCategory: 'random_chat',
  });

  assert.equal(result.category, 'unknown');
  assert.equal(result.route, 'human_review_required');
  assert.equal(result.requiredNextStep, 'classify_or_request_human_review');
  assert.equal(result.reasonKey, 'unknown_intent_fails_safe');
  assertNoAccessOrAiDecision(result);
});

test('unsafe extras and raw messages are never echoed into triage result', () => {
  const result = classifyBrandChannelIntent({
    intent_hint: 'brand_product_question',
    raw_message: 'raw customer message with 0912-345-678',
    full_address: 'full address should not echo',
    ['token']: 'credential-placeholder',
    line_user_id: 'line-user-secret-1',
    raw_provider_payload: 'raw-provider-payload',
    full_customer_payload: 'full customer payload',
  });

  assert.equal(result.category, 'brand_product_question');
  assertNoSensitiveEcho(result);
});

test('brand LINE metadata does not change triage into identity or Case Binding grant', () => {
  const result = classifyBrandChannelIntent({
    intentHint: 'case_status',
    referralMetadata: {
      sourceChannel: 'brand_line',
      organizationId: 'org-1',
      lineChannelId: 'line-channel-1',
      hasScopedLineContext: true,
    },
  });

  assert.equal(result.category, 'existing_case_inquiry');
  assert.equal(result.route, 'verification_and_case_binding_required');
  assertNoAccessOrAiDecision(result);
});
