'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  normalizeBrandReferralRequest,
} = require('../../src/brandChannel/brandReferralRequestNormalizer');
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

function baseRequest(overrides = {}) {
  return {
    body: {
      organization_id: 'org-1',
      brand_id: 'brand-a',
      source_channel: 'brand_line',
      referral_source: 'official-line',
      line_channel_id: 'line-channel-1',
      line_user_id: 'line-user-secret-1',
      ...overrides,
    },
  };
}

function baseChannel(overrides = {}) {
  return {
    organization_id: 'org-1',
    brand_id: 'brand-a',
    line_channel_id: 'line-channel-1',
    status: 'active',
    ...overrides,
  };
}

function assertNormalizerNoGrant(normalized) {
  assert.deepEqual(normalized.grants, {
    identityVerified: false,
    caseBinding: false,
    caseDataAccess: false,
    intakeCreated: false,
    auditWritten: false,
  });
}

function assertReferralNoGrant(referral) {
  assert.deepEqual(referral.grants, {
    identityVerified: false,
    caseBinding: false,
    caseDataAccess: false,
  });
}

function assertTriageNoGrant(triage) {
  assert.equal(triage.safeguards.identityVerifiedByPolicy, false);
  assert.equal(triage.safeguards.caseBindingGrantedByPolicy, false);
  assert.equal(triage.safeguards.caseDataAccessGrantedByPolicy, false);
  assert.equal(triage.safeguards.aiDecisionAllowed, false);
}

function assertChannelNoGrant(channel) {
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
  assert.doesNotMatch(serialized, /raw-ai-payload/i);
  assert.doesNotMatch(serialized, /full customer payload/i);
  assert.doesNotMatch(serialized, /full address/i);
  assert.doesNotMatch(serialized, /DATABASE_URL/);
}

test('integration guard imports only pure brandChannel policy and normalizer modules', () => {
  const source = fs.readFileSync(testPath, 'utf8');
  const requireTargets = Array.from(source.matchAll(/require\('([^']+)'\)/g))
    .map((match) => match[1])
    .sort();

  assert.deepEqual(requireTargets, [
    '../../src/brandChannel/brandChannelTriagePolicy',
    '../../src/brandChannel/brandReferralRequestNormalizer',
    '../../src/brandChannel/brandReferralSourcePolicy',
    '../../src/brandChannel/multiLineChannelPolicy',
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ].sort());
});

test('brand LINE request normalizer composes with referral policy as metadata only', () => {
  const normalized = normalizeBrandReferralRequest(baseRequest());
  const referral = normalizeBrandReferralSource({
    organization_id: normalized.metadata.organization_id,
    brand_id: normalized.metadata.brand_id,
    source_channel: normalized.metadata.source_channel,
    referral_source: normalized.metadata.referral_source,
    line_channel_id: normalized.metadata.line_channel_id,
    entry_context: normalized.metadata.entry_context,
  });
  const channel = evaluateMultiLineChannelFlow(baseChannel({ purpose: 'customer_service' }), 'brand_faq');

  assert.equal(normalized.metadata.has_scoped_line_context, true);
  assert.equal(normalized.metadata.line_channel_id, 'line-channel-1');
  assert.equal(Object.prototype.hasOwnProperty.call(normalized.metadata, 'line_user_id'), false);
  assert.equal(referral.metadata.sourceChannel, 'brand_line');
  assert.equal(channel.allowed, true);
  assertNormalizerNoGrant(normalized);
  assertReferralNoGrant(referral);
  assertChannelNoGrant(channel);
  assertNoSensitiveEcho(normalized, referral, channel);
});

test('brand website platform LINE and manual request-like inputs remain metadata-only', () => {
  const cases = [
    baseRequest({
      source_channel: 'brand_website',
      referral_source: 'brand-support-page',
      line_channel_id: undefined,
      line_user_id: undefined,
    }),
    baseRequest({
      source_channel: 'platform_line',
      referral_source: 'platform-rich-menu',
      line_channel_id: 'platform-line-channel',
      line_user_id: 'line-user-secret-2',
    }),
    baseRequest({
      source_channel: 'manual',
      referral_source: 'service-desk',
      line_channel_id: undefined,
      line_user_id: undefined,
    }),
  ];

  for (const request of cases) {
    const normalized = normalizeBrandReferralRequest(request);

    assert.equal(normalized.grants.identityVerified, false);
    assert.equal(normalized.grants.caseBinding, false);
    assert.equal(normalized.grants.caseDataAccess, false);
    assert.equal(normalized.grants.intakeCreated, false);
    assert.equal(normalized.grants.auditWritten, false);
    assertNoSensitiveEcho(normalized);
  }
});

test('repair intake and service status case inquiries require verification and Case Binding', () => {
  const normalized = normalizeBrandReferralRequest(baseRequest({
    source_channel: 'brand_line',
  }));
  const repairChannel = evaluateMultiLineChannelFlow(baseChannel({ purpose: 'repair_intake' }), 'case_query');
  const statusChannel = evaluateMultiLineChannelFlow(baseChannel({ purpose: 'service_status' }), 'completion_report');
  const triage = classifyBrandChannelIntent({
    intent_hint: 'case_status',
    referralMetadata: {
      organizationId: normalized.metadata.organization_id,
      brandId: normalized.metadata.brand_id,
      sourceChannel: normalized.metadata.source_channel,
      lineChannelId: normalized.metadata.line_channel_id,
    },
  });

  assert.equal(repairChannel.allowed, true);
  assert.equal(repairChannel.requiredNextStep, 'verification_and_case_binding_required');
  assert.equal(statusChannel.allowed, true);
  assert.equal(statusChannel.requiredNextStep, 'verification_and_case_binding_required');
  assert.equal(triage.route, 'verification_and_case_binding_required');
  assert.equal(triage.requiredNextStep, 'verify_customer_and_bind_case');
  assertNormalizerNoGrant(normalized);
  assertChannelNoGrant(repairChannel);
  assertChannelNoGrant(statusChannel);
  assertTriageNoGrant(triage);
});

test('campaign sales membership and dealer channels fail closed for direct case query despite case-status hint', () => {
  for (const purpose of ['campaign', 'sales_membership', 'dealer_channel']) {
    const normalized = normalizeBrandReferralRequest(baseRequest({
      source_channel: purpose === 'campaign' ? 'brand_line' : 'brand_website',
      referral_source: `${purpose}-entry`,
    }));
    const channel = evaluateMultiLineChannelFlow(baseChannel({
      purpose,
      allowed_flows: ['case_query', 'appointment_status', 'completion_report'],
    }), 'case_query');
    const triage = classifyBrandChannelIntent({
      intent_hint: 'case_status',
      referralMetadata: {
        sourceChannel: normalized.metadata.source_channel,
      },
    });

    assert.equal(channel.allowed, false, `${purpose} should not allow direct case query`);
    assert.equal(channel.reasonKey, 'flow_not_allowed_for_channel_purpose');
    assert.equal(triage.route, 'verification_and_case_binding_required');
    assertNormalizerNoGrant(normalized);
    assertChannelNoGrant(channel);
    assertTriageNoGrant(triage);
  }
});

test('product question may route only to channel-authorized knowledge future path', () => {
  const normalized = normalizeBrandReferralRequest(baseRequest({
    source_channel: 'brand_line',
  }));
  const channel = evaluateMultiLineChannelFlow(baseChannel({
    purpose: 'customer_service',
    ai_rag_enabled: true,
    knowledge_base_id: 'kb-brand-a-service',
  }), 'brand_knowledge_ai');
  const triage = classifyBrandChannelIntent({
    intent_hint: 'brand_product_question',
    referralMetadata: {
      sourceChannel: normalized.metadata.source_channel,
      lineChannelId: normalized.metadata.line_channel_id,
    },
  });

  assert.equal(channel.allowed, true);
  assert.equal(channel.reasonKey, 'brand_knowledge_ai_channel_scope_only');
  assert.equal(channel.requiredNextStep, 'use_channel_authorized_knowledge_base_only');
  assert.equal(triage.route, 'brand_authorized_knowledge_future_path');
  assert.equal(triage.requiredNextStep, 'use_brand_authorized_knowledge_only');
  assertNormalizerNoGrant(normalized);
  assertChannelNoGrant(channel);
  assertTriageNoGrant(triage);
});

test('channel-level Brand Knowledge AI requires enabled flag and knowledge base without invoking AI runtime', () => {
  const disabled = evaluateMultiLineChannelFlow(baseChannel({
    purpose: 'customer_service',
  }), 'brand_knowledge_ai');
  const missingKnowledgeBase = evaluateMultiLineChannelFlow(baseChannel({
    purpose: 'customer_service',
    ai_rag_enabled: true,
  }), 'brand_knowledge_ai');
  const allowed = evaluateMultiLineChannelFlow(baseChannel({
    purpose: 'customer_service',
    ai_rag_enabled: true,
    knowledge_base_id: 'kb-brand-a-service',
  }), 'brand_knowledge_ai');

  assert.equal(disabled.allowed, false);
  assert.equal(disabled.reasonKey, 'brand_knowledge_ai_not_enabled');
  assert.equal(missingKnowledgeBase.allowed, false);
  assert.equal(missingKnowledgeBase.reasonKey, 'brand_knowledge_ai_missing_knowledge_base');
  assert.equal(allowed.allowed, true);
  assert.equal(allowed.safeguards.aiRagRuntimeInvoked, false);
  assertChannelNoGrant(disabled);
  assertChannelNoGrant(missingKnowledgeBase);
  assertChannelNoGrant(allowed);
});

test('unsafe extras are stripped across normalizer referral triage and channel flow composition', () => {
  const normalized = normalizeBrandReferralRequest(baseRequest({
    customer_phone: '0912-345-678',
    token: 'credential-placeholder',
    secret: 'credential-placeholder',
    line_access_token: 'credential-placeholder',
    channel_secret: 'credential-placeholder',
    raw_provider_payload: 'raw-provider-payload',
    raw_ai_payload: 'raw-ai-payload',
    full_customer_payload: 'full customer payload',
    full_address: 'full address should not echo',
    DATABASE_URL: 'DATABASE_URL=credential-placeholder',
  }));
  const referral = normalizeBrandReferralSource({
    organization_id: normalized.metadata.organization_id,
    brand_id: normalized.metadata.brand_id,
    source_channel: normalized.metadata.source_channel,
    line_channel_id: normalized.metadata.line_channel_id,
  });
  const triage = classifyBrandChannelIntent({
    intent_hint: 'brand_product_question',
    raw_message: 'customer message should be ignored',
    raw_provider_payload: 'raw-provider-payload',
    raw_ai_payload: 'raw-ai-payload',
  });
  const channel = evaluateMultiLineChannelFlow(baseChannel({
    purpose: 'customer_service',
    raw_provider_payload: 'raw-provider-payload',
    raw_ai_payload: 'raw-ai-payload',
  }), 'brand_faq');

  assertNoSensitiveEcho(normalized, referral, triage, channel);
  assertNormalizerNoGrant(normalized);
  assertReferralNoGrant(referral);
  assertTriageNoGrant(triage);
  assertChannelNoGrant(channel);
});
