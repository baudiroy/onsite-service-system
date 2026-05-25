'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  CHANNEL_PURPOSES,
  CHANNEL_STATUSES,
  FLOW_KEYS,
  normalizeMultiLineChannelConfig,
  evaluateMultiLineChannelFlow,
} = require('../../src/brandChannel/multiLineChannelPolicy');

const modulePath = path.resolve(__dirname, '../../src/brandChannel/multiLineChannelPolicy.js');

function baseChannel(overrides = {}) {
  return {
    organization_id: 'org-1',
    brand_id: 'brand-a',
    line_channel_id: 'line-channel-1',
    channel_name: 'Repair Service',
    purpose: 'repair_intake',
    status: 'active',
    owner_department: 'service',
    default_language: 'ZH-TW',
    message_template_key: 'repair-intake-default',
    ...overrides,
  };
}

function assertNoRuntimeGrants(result) {
  assert.deepEqual(result.safeguards, {
    identityVerifiedByPolicy: false,
    caseBindingGrantedByPolicy: false,
    caseDataAccessGrantedByPolicy: false,
    providerRuntimeAllowed: false,
    webhookRuntimeAllowed: false,
    aiRagRuntimeInvoked: false,
  });
}

function assertNoSensitiveEcho(result) {
  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /line-user-/);
  assert.doesNotMatch(serialized, /0912/);
  assert.doesNotMatch(serialized, /credential-placeholder/);
  assert.doesNotMatch(serialized, /raw-provider-payload/);
  assert.doesNotMatch(serialized, /full customer payload/i);
  assert.doesNotMatch(serialized, /raw-ai-payload/i);
}

test('module remains pure and does not import runtime, DB, provider, env, fs, network, logger, config, or entitlement code', () => {
  const source = fs.readFileSync(modulePath, 'utf8');

  assert.doesNotMatch(source, /require\(/);
  assert.doesNotMatch(source, /import\s+/);
  assert.doesNotMatch(source, /process\.env/);
  assert.doesNotMatch(source, /fetch\(/);
  assert.doesNotMatch(source, /axios|pg|pool|repository|router|express|logger|openai|entitlement/i);
});

test('exports canonical channel purposes statuses and flow keys', () => {
  assert.deepEqual(CHANNEL_PURPOSES, [
    'customer_service',
    'repair_intake',
    'service_status',
    'sales_membership',
    'regional_service',
    'dealer_channel',
    'campaign',
    'unknown',
  ]);

  assert.deepEqual(CHANNEL_STATUSES, [
    'active',
    'paused',
    'disabled',
    'archived',
    'unknown',
  ]);

  assert.ok(FLOW_KEYS.includes('brand_knowledge_ai'));
  assert.ok(FLOW_KEYS.includes('case_query'));
  assert.ok(FLOW_KEYS.includes('campaign_referral'));
});

test('normalizes safe channel metadata and strips unsafe extras', () => {
  const metadata = normalizeMultiLineChannelConfig(baseChannel({
    purpose: 'customer_service',
    allowed_flows: ['brand_faq', 'brand_knowledge_ai', 'case_query', 'not-real'],
    knowledge_base_id: 'kb-brand-a',
    ai_rag_enabled: true,
    line_user_id: 'line-user-secret-1',
    customer_phone: '0912-345-678',
    ['token']: 'credential-placeholder',
    raw_provider_payload: 'raw-provider-payload',
    raw_ai_payload: 'raw-ai-payload',
    full_customer_payload: 'full customer payload',
  }));

  assert.equal(metadata.organizationId, 'org-1');
  assert.equal(metadata.brandId, 'brand-a');
  assert.equal(metadata.lineChannelId, 'line-channel-1');
  assert.equal(metadata.channelName, 'Repair Service');
  assert.equal(metadata.purpose, 'customer_service');
  assert.equal(metadata.status, 'active');
  assert.equal(metadata.ownerDepartment, 'service');
  assert.deepEqual(metadata.allowedFlows, ['brand_faq', 'brand_knowledge_ai']);
  assert.equal(metadata.defaultLanguage, 'zh-tw');
  assert.equal(metadata.messageTemplateKey, 'repair-intake-default');
  assert.equal(metadata.knowledgeBaseId, 'kb-brand-a');
  assert.equal(metadata.aiRagEnabled, true);
  assertNoSensitiveEcho({ metadata });
});

test('each supported purpose has an allowed metadata-only path when active and in scope', () => {
  const cases = [
    ['customer_service', 'brand_faq'],
    ['repair_intake', 'repair_intake'],
    ['service_status', 'human_handoff'],
    ['sales_membership', 'product_info'],
    ['regional_service', 'regional_repair_intake'],
    ['dealer_channel', 'dealer_referral'],
    ['campaign', 'campaign_referral'],
  ];

  for (const [purpose, flow] of cases) {
    const result = evaluateMultiLineChannelFlow(baseChannel({ purpose }), flow);
    assert.equal(result.allowed, true, `${purpose} should allow ${flow}`);
    assert.equal(result.requiredNextStep, 'continue_allowed_channel_flow');
    assert.equal(result.metadata.purpose, purpose);
    assertNoRuntimeGrants(result);
  }
});

test('missing organization brand or line channel scope fails closed', () => {
  for (const missing of ['organization_id', 'brand_id', 'line_channel_id']) {
    const channel = baseChannel();
    delete channel[missing];
    const result = evaluateMultiLineChannelFlow(channel, 'repair_intake');

    assert.equal(result.allowed, false);
    assert.equal(result.reasonKey, 'missing_required_channel_scope');
    assert.equal(result.requiredNextStep, 'collect_valid_channel_scope');
    assertNoRuntimeGrants(result);
  }
});

test('unknown purpose status and flow fail closed', () => {
  const unknownPurpose = evaluateMultiLineChannelFlow(baseChannel({ purpose: 'support-everything' }), 'repair_intake');
  assert.equal(unknownPurpose.allowed, false);
  assert.equal(unknownPurpose.reasonKey, 'unknown_channel_purpose_fails_closed');

  const unknownStatus = evaluateMultiLineChannelFlow(baseChannel({ status: 'draft' }), 'repair_intake');
  assert.equal(unknownStatus.allowed, false);
  assert.equal(unknownStatus.reasonKey, 'unknown_channel_status_fails_closed');

  const unknownFlow = evaluateMultiLineChannelFlow(baseChannel(), 'export_all_customer_data');
  assert.equal(unknownFlow.allowed, false);
  assert.equal(unknownFlow.reasonKey, 'unknown_flow_fails_closed');
});

test('paused disabled and archived channels fail closed before flow handling', () => {
  for (const status of ['paused', 'disabled', 'archived']) {
    const result = evaluateMultiLineChannelFlow(baseChannel({ status }), 'repair_intake');

    assert.equal(result.allowed, false);
    assert.equal(result.reasonKey, `channel_${status}_fails_closed`);
    assert.equal(result.requiredNextStep, 'activate_channel_before_use');
  }
});

test('campaign sales membership and dealer channels cannot directly query case data', () => {
  for (const purpose of ['campaign', 'sales_membership', 'dealer_channel']) {
    const result = evaluateMultiLineChannelFlow(baseChannel({
      purpose,
      allowed_flows: ['case_query', 'appointment_status', 'completion_report'],
    }), 'case_query');

    assert.equal(result.allowed, false);
    assert.equal(result.reasonKey, 'flow_not_allowed_for_channel_purpose');
    assert.equal(result.requiredNextStep, 'route_to_allowed_channel_flow');
    assertNoRuntimeGrants(result);
  }
});

test('repair intake and service status case flows require verification and Case Binding without direct case-data access', () => {
  const repair = evaluateMultiLineChannelFlow(baseChannel({ purpose: 'repair_intake' }), 'case_query');
  assert.equal(repair.allowed, true);
  assert.equal(repair.reasonKey, 'case_related_flow_requires_verification_case_binding');
  assert.equal(repair.requiredNextStep, 'verification_and_case_binding_required');
  assertNoRuntimeGrants(repair);

  const service = evaluateMultiLineChannelFlow(baseChannel({ purpose: 'service_status' }), 'completion_report');
  assert.equal(service.allowed, true);
  assert.equal(service.reasonKey, 'case_related_flow_requires_verification_case_binding');
  assert.equal(service.requiredNextStep, 'verification_and_case_binding_required');
  assertNoRuntimeGrants(service);
});

test('brand knowledge AI flow requires channel AI flag and knowledge base while granting no case-data access', () => {
  const disabled = evaluateMultiLineChannelFlow(baseChannel({
    purpose: 'customer_service',
  }), 'brand_knowledge_ai');
  assert.equal(disabled.allowed, false);
  assert.equal(disabled.reasonKey, 'brand_knowledge_ai_not_enabled');

  const noKnowledgeBase = evaluateMultiLineChannelFlow(baseChannel({
    purpose: 'customer_service',
    ai_rag_enabled: true,
  }), 'brand_knowledge_ai');
  assert.equal(noKnowledgeBase.allowed, false);
  assert.equal(noKnowledgeBase.reasonKey, 'brand_knowledge_ai_missing_knowledge_base');

  const allowed = evaluateMultiLineChannelFlow(baseChannel({
    purpose: 'customer_service',
    ai_rag_enabled: true,
    knowledge_base_id: 'kb-brand-service',
  }), 'brand_knowledge_ai');
  assert.equal(allowed.allowed, true);
  assert.equal(allowed.reasonKey, 'brand_knowledge_ai_channel_scope_only');
  assert.equal(allowed.requiredNextStep, 'use_channel_authorized_knowledge_base_only');
  assert.equal(allowed.metadata.knowledgeBaseId, 'kb-brand-service');
  assertNoRuntimeGrants(allowed);
});

test('explicit allowedFlows cannot expand beyond purpose boundaries', () => {
  const result = evaluateMultiLineChannelFlow(baseChannel({
    purpose: 'campaign',
    allowed_flows: ['campaign_referral', 'case_query', 'brand_knowledge_ai'],
    ai_rag_enabled: true,
    knowledge_base_id: 'kb-campaign',
  }), 'brand_knowledge_ai');

  assert.equal(result.allowed, false);
  assert.equal(result.reasonKey, 'flow_not_allowed_for_channel_purpose');
  assert.deepEqual(result.metadata.allowedFlows, ['campaign_referral']);
  assertNoRuntimeGrants(result);
});

test('unsafe extras are never echoed into decision result', () => {
  const result = evaluateMultiLineChannelFlow(baseChannel({
    line_user_id: 'line-user-secret-2',
    customer_phone: '0912-345-678',
    ['token']: 'credential-placeholder',
    raw_provider_payload: 'raw-provider-payload',
    raw_ai_payload: 'raw-ai-payload',
    full_customer_payload: 'full customer payload',
  }), 'repair_intake');

  assert.equal(result.allowed, true);
  assertNoSensitiveEcho(result);
});
