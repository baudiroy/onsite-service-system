'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  normalizeBrandReferralSource,
} = require('../../src/brandChannel/brandReferralSourcePolicy');
const {
  classifyBrandChannelIntent,
} = require('../../src/brandChannel/brandChannelTriagePolicy');
const {
  evaluateMultiLineChannelFlow,
} = require('../../src/brandChannel/multiLineChannelPolicy');

const testPath = __filename;

function baseChannel(overrides = {}) {
  return {
    organization_id: 'org-1',
    brand_id: 'brand-a',
    line_channel_id: 'line-channel-1',
    status: 'active',
    ...overrides,
  };
}

function brandLineReferral(overrides = {}) {
  return normalizeBrandReferralSource({
    organization_id: 'org-1',
    brand_id: 'brand-a',
    source_channel: 'brand_line',
    referral_source: 'official-line',
    line_channel_id: 'line-channel-1',
    line_user_id: 'line-user-secret-1',
    ...overrides,
  });
}

function assertNoReferralGrant(referral) {
  assert.deepEqual(referral.grants, {
    identityVerified: false,
    caseBinding: false,
    caseDataAccess: false,
  });
}

function assertNoTriageGrant(triage) {
  assert.equal(triage.safeguards.identityVerifiedByPolicy, false);
  assert.equal(triage.safeguards.caseBindingGrantedByPolicy, false);
  assert.equal(triage.safeguards.caseDataAccessGrantedByPolicy, false);
  assert.equal(triage.safeguards.aiDecisionAllowed, false);
}

function assertNoChannelGrant(channel) {
  assert.equal(channel.safeguards.identityVerifiedByPolicy, false);
  assert.equal(channel.safeguards.caseBindingGrantedByPolicy, false);
  assert.equal(channel.safeguards.caseDataAccessGrantedByPolicy, false);
  assert.equal(channel.safeguards.providerRuntimeAllowed, false);
  assert.equal(channel.safeguards.webhookRuntimeAllowed, false);
  assert.equal(channel.safeguards.aiRagRuntimeInvoked, false);
}

function assertNoSensitiveEcho(...parts) {
  const serialized = JSON.stringify(parts);
  assert.doesNotMatch(serialized, /line-user-/);
  assert.doesNotMatch(serialized, /0912/);
  assert.doesNotMatch(serialized, /credential-placeholder/);
  assert.doesNotMatch(serialized, /raw-provider-payload/);
  assert.doesNotMatch(serialized, /raw-ai-payload/);
  assert.doesNotMatch(serialized, /full customer payload/i);
}

test('integration test imports only the pure brand channel policy modules', () => {
  const source = fs.readFileSync(testPath, 'utf8');
  const requireTargets = Array.from(source.matchAll(/require\('([^']+)'\)/g))
    .map((match) => match[1])
    .sort();

  assert.match(source, /brandReferralSourcePolicy/);
  assert.match(source, /brandChannelTriagePolicy/);
  assert.match(source, /multiLineChannelPolicy/);
  assert.deepEqual(requireTargets, [
    '../../src/brandChannel/brandChannelTriagePolicy',
    '../../src/brandChannel/brandReferralSourcePolicy',
    '../../src/brandChannel/multiLineChannelPolicy',
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ].sort());
});

test('brand LINE referral metadata plus scoped channel remains metadata only', () => {
  const referral = brandLineReferral();
  const channel = evaluateMultiLineChannelFlow(baseChannel({
    purpose: 'customer_service',
  }), 'brand_faq');

  assert.equal(referral.metadata.hasScopedLineContext, true);
  assert.equal(referral.metadata.lineChannelId, 'line-channel-1');
  assert.equal(Object.prototype.hasOwnProperty.call(referral.metadata, 'lineUserId'), false);
  assert.equal(channel.allowed, true);
  assertNoReferralGrant(referral);
  assertNoChannelGrant(channel);
  assertNoSensitiveEcho(referral, channel);
});

test('customer service product question composes to brand-authorized knowledge only', () => {
  const referral = brandLineReferral();
  const channel = evaluateMultiLineChannelFlow(baseChannel({
    purpose: 'customer_service',
    ai_rag_enabled: true,
    knowledge_base_id: 'kb-brand-customer-service',
  }), 'brand_knowledge_ai');
  const triage = classifyBrandChannelIntent({
    intent_hint: 'brand_product_question',
    referralMetadata: referral.metadata,
  });

  assert.equal(channel.allowed, true);
  assert.equal(channel.reasonKey, 'brand_knowledge_ai_channel_scope_only');
  assert.equal(channel.requiredNextStep, 'use_channel_authorized_knowledge_base_only');
  assert.equal(triage.route, 'brand_authorized_knowledge_future_path');
  assert.equal(triage.requiredNextStep, 'use_brand_authorized_knowledge_only');
  assertNoReferralGrant(referral);
  assertNoChannelGrant(channel);
  assertNoTriageGrant(triage);
});

test('repair intake case inquiry requires verification and Case Binding before customer-visible policy', () => {
  const referral = brandLineReferral();
  const channel = evaluateMultiLineChannelFlow(baseChannel({
    purpose: 'repair_intake',
  }), 'case_query');
  const triage = classifyBrandChannelIntent({
    intent_hint: 'case_status',
    referralMetadata: referral.metadata,
  });

  assert.equal(channel.allowed, true);
  assert.equal(channel.requiredNextStep, 'verification_and_case_binding_required');
  assert.equal(triage.route, 'verification_and_case_binding_required');
  assert.equal(triage.requiredNextStep, 'verify_customer_and_bind_case');
  assertNoReferralGrant(referral);
  assertNoChannelGrant(channel);
  assertNoTriageGrant(triage);
});

test('service status verified flags still require customer-visible policy and do not directly grant case data', () => {
  const channel = evaluateMultiLineChannelFlow(baseChannel({
    purpose: 'service_status',
  }), 'completion_report');
  const triage = classifyBrandChannelIntent({
    intent_hint: 'completion_issue',
    verifiedCustomer: true,
    caseBound: true,
  });

  assert.equal(channel.allowed, true);
  assert.equal(channel.requiredNextStep, 'verification_and_case_binding_required');
  assert.equal(triage.route, 'customer_visible_case_policy_required');
  assert.equal(triage.requiredNextStep, 'apply_customer_visible_data_policy');
  assertNoChannelGrant(channel);
  assertNoTriageGrant(triage);
});

test('sales membership dealer and campaign channels cannot become direct case query channels', () => {
  for (const purpose of ['sales_membership', 'dealer_channel', 'campaign']) {
    const channel = evaluateMultiLineChannelFlow(baseChannel({
      purpose,
      allowed_flows: ['case_query', 'appointment_status', 'completion_report'],
    }), 'case_query');
    const triage = classifyBrandChannelIntent({
      intent_hint: 'case_status',
    });

    assert.equal(channel.allowed, false, `${purpose} should deny case_query`);
    assert.equal(channel.reasonKey, 'flow_not_allowed_for_channel_purpose');
    assert.equal(triage.route, 'verification_and_case_binding_required');
    assertNoChannelGrant(channel);
    assertNoTriageGrant(triage);
  }
});

test('regional service channel may route to regional intake but not direct case data', () => {
  const regionalIntake = evaluateMultiLineChannelFlow(baseChannel({
    purpose: 'regional_service',
  }), 'regional_repair_intake');
  const regionalCase = evaluateMultiLineChannelFlow(baseChannel({
    purpose: 'regional_service',
  }), 'case_query');

  assert.equal(regionalIntake.allowed, true);
  assert.equal(regionalIntake.requiredNextStep, 'continue_allowed_channel_flow');
  assert.equal(regionalCase.allowed, false);
  assert.equal(regionalCase.reasonKey, 'flow_not_allowed_for_channel_purpose');
  assertNoChannelGrant(regionalIntake);
  assertNoChannelGrant(regionalCase);
});

test('paused disabled archived and unknown channels fail closed before useful triage route is trusted', () => {
  for (const status of ['paused', 'disabled', 'archived']) {
    const channel = evaluateMultiLineChannelFlow(baseChannel({
      purpose: 'repair_intake',
      status,
    }), 'repair_intake');
    assert.equal(channel.allowed, false);
    assert.equal(channel.reasonKey, `channel_${status}_fails_closed`);
    assertNoChannelGrant(channel);
  }

  const unknown = evaluateMultiLineChannelFlow(baseChannel({
    purpose: 'not-a-purpose',
  }), 'repair_intake');
  assert.equal(unknown.allowed, false);
  assert.equal(unknown.reasonKey, 'unknown_channel_purpose_fails_closed');
  assertNoChannelGrant(unknown);
});

test('unsafe extras are stripped or ignored across referral channel and triage composition', () => {
  const referral = brandLineReferral({
    customer_phone: '0912-345-678',
    ['token']: 'credential-placeholder',
    raw_provider_payload: 'raw-provider-payload',
    full_customer_payload: 'full customer payload',
  });
  const channel = evaluateMultiLineChannelFlow(baseChannel({
    purpose: 'customer_service',
    line_user_id: 'line-user-secret-2',
    customer_phone: '0912-345-678',
    raw_provider_payload: 'raw-provider-payload',
    raw_ai_payload: 'raw-ai-payload',
    full_customer_payload: 'full customer payload',
  }), 'brand_faq');
  const triage = classifyBrandChannelIntent({
    intent_hint: 'brand_product_question',
    raw_message: 'customer message 0912-345-678',
    raw_provider_payload: 'raw-provider-payload',
    raw_ai_payload: 'raw-ai-payload',
  });

  assertNoSensitiveEcho(referral, channel, triage);
  assertNoReferralGrant(referral);
  assertNoChannelGrant(channel);
  assertNoTriageGrant(triage);
});
