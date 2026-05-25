'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  normalizeBrandReferralSource,
} = require('../../src/brandChannel/brandReferralSourcePolicy');
const {
  classifyBrandChannelIntent,
} = require('../../src/brandChannel/brandChannelTriagePolicy');

function assertNoReferralAccessGrants(result) {
  assert.deepEqual(result.grants, {
    identityVerified: false,
    caseBinding: false,
    caseDataAccess: false,
  });
}

function assertNoTriageAccessOrAiDecision(result) {
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

function assertNoSensitiveEcho(value) {
  const serialized = JSON.stringify(value);
  assert.doesNotMatch(serialized, /line-user-/);
  assert.doesNotMatch(serialized, /0912/);
  assert.doesNotMatch(serialized, /credential-placeholder/);
  assert.doesNotMatch(serialized, /raw-provider-payload/);
  assert.doesNotMatch(serialized, /ai-payload/);
  assert.doesNotMatch(serialized, /full customer payload/i);
}

test('integration test imports only the two pure brand channel policy modules', () => {
  assert.equal(typeof normalizeBrandReferralSource, 'function');
  assert.equal(typeof classifyBrandChannelIntent, 'function');
});

test('brand LINE referral metadata can feed case inquiry triage without identity or case-data grants', () => {
  const referral = normalizeBrandReferralSource({
    organization_id: 'org-1',
    brand_id: 'brand-a',
    source_channel: 'brand_line',
    referral_source: 'official-rich-menu',
    line_channel_id: 'line-channel-1',
    line_user_id: 'line-user-sensitive',
  });

  const triage = classifyBrandChannelIntent({
    intentHint: 'case_status',
    referralMetadata: referral.metadata,
  });

  assert.equal(referral.metadata.sourceChannel, 'brand_line');
  assert.equal(referral.metadata.hasScopedLineContext, true);
  assert.equal(triage.category, 'existing_case_inquiry');
  assert.equal(triage.route, 'verification_and_case_binding_required');
  assert.equal(triage.requiredNextStep, 'verify_customer_and_bind_case');
  assertNoReferralAccessGrants(referral);
  assertNoTriageAccessOrAiDecision(triage);
  assertNoSensitiveEcho({ referral, triage });
});

test('scoped LINE metadata remains metadata only and raw line user id is not returned', () => {
  const referral = normalizeBrandReferralSource({
    organization_id: 'org-1',
    source_channel: 'platform_line',
    line_channel_id: 'line-channel-1',
    line_user_id: 'line-user-sensitive-2',
  });

  assert.equal(referral.metadata.lineChannelId, 'line-channel-1');
  assert.equal(referral.metadata.hasScopedLineContext, true);
  assert.equal(referral.metadata.hasRawLineUserId, true);
  assert.equal(Object.prototype.hasOwnProperty.call(referral.metadata, 'lineUserId'), false);
  assertNoReferralAccessGrants(referral);
  assertNoSensitiveEcho(referral);
});

test('verified flags move existing case inquiry only to customer-visible policy step, not direct case access grant', () => {
  const referral = normalizeBrandReferralSource({
    organization_id: 'org-1',
    source_channel: 'brand_line',
    line_channel_id: 'line-channel-1',
    line_user_id: 'line-user-sensitive-3',
  });
  const triage = classifyBrandChannelIntent({
    intentHint: 'reschedule',
    referralMetadata: referral.metadata,
    verifiedCustomer: true,
    caseBound: true,
  });

  assert.equal(triage.category, 'existing_case_inquiry');
  assert.equal(triage.route, 'customer_visible_case_policy_required');
  assert.equal(triage.requiredNextStep, 'apply_customer_visible_data_policy');
  assertNoReferralAccessGrants(referral);
  assertNoTriageAccessOrAiDecision(triage);
});

test('product question from brand website routes to brand-authorized knowledge and cannot read case data', () => {
  const referral = normalizeBrandReferralSource({
    organization_id: 'org-1',
    brand_id: 'brand-a',
    source_channel: 'brand_website',
    referral_source: 'support-page',
  });
  const triage = classifyBrandChannelIntent({
    intentHint: 'warranty',
    referralMetadata: referral.metadata,
  });

  assert.equal(referral.metadata.sourceChannel, 'brand_website');
  assert.equal(triage.category, 'brand_product_question');
  assert.equal(triage.route, 'brand_authorized_knowledge_future_path');
  assert.equal(triage.requiredNextStep, 'use_brand_authorized_knowledge_only');
  assertNoReferralAccessGrants(referral);
  assertNoTriageAccessOrAiDecision(triage);
});

test('complaint and high-risk hints override normal automation and route to human handling', () => {
  const referral = normalizeBrandReferralSource({
    organization_id: 'org-1',
    source_channel: 'brand_line',
    line_channel_id: 'line-channel-1',
    line_user_id: 'line-user-sensitive-4',
  });
  const complaint = classifyBrandChannelIntent({
    intentHint: 'compensation_request',
    referralMetadata: referral.metadata,
  });
  const highRisk = classifyBrandChannelIntent({
    intentHint: 'safety_issue',
    referralMetadata: referral.metadata,
  });

  assert.equal(complaint.category, 'complaint_or_dispute');
  assert.equal(complaint.route, 'human_escalation_required');
  assert.equal(complaint.requiredNextStep, 'create_escalation_or_complaint_record');
  assert.equal(highRisk.category, 'high_risk');
  assert.equal(highRisk.route, 'human_review_required');
  assert.equal(highRisk.requiredNextStep, 'stop_automation_and_route_to_human');
  assertNoTriageAccessOrAiDecision(complaint);
  assertNoTriageAccessOrAiDecision(highRisk);
});

test('unsafe extras are stripped or ignored across referral and triage composition', () => {
  const referral = normalizeBrandReferralSource({
    organization_id: 'org-1',
    source_channel: 'brand_line',
    line_channel_id: 'line-channel-1',
    line_user_id: 'line-user-sensitive-5',
    customer_phone: '0912-345-678',
    full_address: 'full address',
    ['token']: 'credential-placeholder',
    raw_provider_payload: 'raw-provider-payload',
    ai_payload: 'ai-payload',
    full_customer_payload: 'full customer payload',
  });
  const triage = classifyBrandChannelIntent({
    intentHint: 'repair_request',
    referralMetadata: referral.metadata,
    raw_message: 'contains 0912-345-678 and line-user-sensitive-5',
    raw_provider_payload: 'raw-provider-payload',
    ai_payload: 'ai-payload',
    full_customer_payload: 'full customer payload',
  });

  assert.equal(triage.category, 'new_repair_or_installation');
  assert.equal(triage.route, 'repair_intake_future_path');
  assertNoSensitiveEcho({ referral, triage });
  assertNoReferralAccessGrants(referral);
  assertNoTriageAccessOrAiDecision(triage);
});
