'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DATA_ACCESS_PURPOSES,
  DATA_CLASSIFICATIONS,
  classifyField,
} = require('../../src/security/dataClassificationPolicy');
const {
  FIELD_VISIBILITY_PURPOSES,
  FIELD_VISIBILITY_ROLES,
  evaluateFieldVisibility,
} = require('../../src/security/fieldVisibilityPolicy');
const {
  EXPORT_CONTROL_PURPOSES,
  evaluateExportControl,
} = require('../../src/security/exportControlPolicy');
const {
  FILE_ACCESS_ACTIONS,
  evaluateFileAccess,
} = require('../../src/security/fileAccessControlPolicy');
const {
  AI_RETRIEVAL_PURPOSES,
  AI_RETRIEVAL_ROLES,
  evaluateAiRetrievalGuard,
} = require('../../src/security/aiRetrievalGuardPolicy');
const {
  PROVIDER_SECRET_PLACEHOLDERS,
  evaluateProviderSecretGuard,
} = require('../../src/security/providerSecretGuard');

const forbiddenStrings = [
  'Bearer abcdefghijklmnopqrstuvwxyz123456',
  'abcdefghijklmnopqrstuvwxyz123456',
  'postgres://user:pass@example.test/db',
  'sk-proj-abcdefghijklmnopqrstuvwxyz123456',
  'raw customer payload should not leak',
  'https://signed.example.test',
  'prompt should not leak',
  'embedding should not leak',
];

function assertNoForbiddenStrings(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of forbiddenStrings) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

test('all foundational ISO security modules are importable and classify sensitive fields', () => {
  assert.equal(classifyField('case_no'), DATA_CLASSIFICATIONS.CUSTOMER_VISIBLE);
  assert.equal(classifyField('internal_note'), DATA_CLASSIFICATIONS.RESTRICTED);
  assert.equal(classifyField('line_access_token'), DATA_CLASSIFICATIONS.SECRET);
  assert.equal(DATA_ACCESS_PURPOSES.EXPORT, 'export');
});

test('restricted and secret fields are denied across customer-visible, export, file, and AI paths', () => {
  for (const fieldKey of ['internal_note', 'line_access_token']) {
    assert.equal(
      evaluateFieldVisibility({
        organizationId: 'org_iso_guard',
        role: FIELD_VISIBILITY_ROLES.CUSTOMER,
        purpose: FIELD_VISIBILITY_PURPOSES.CUSTOMER_VISIBLE,
        fieldKey,
      }).allowed,
      false,
      `field visibility leaked ${fieldKey}`,
    );
  }

  const exportDecision = evaluateExportControl({
    organizationId: 'org_iso_guard',
    role: FIELD_VISIBILITY_ROLES.ADMIN,
    purpose: EXPORT_CONTROL_PURPOSES.EXPORT,
    fields: ['case_no', 'internal_note', 'line_access_token'],
  });
  assert.equal(exportDecision.allowed, false);
  assert.deepEqual(exportDecision.allowedFields.map((field) => field.fieldKey), ['case_no']);
  assert.deepEqual(exportDecision.deniedFields.map((field) => field.fieldKey), [
    'internal_note',
    'line_access_token',
  ]);

  for (const classification of [DATA_CLASSIFICATIONS.RESTRICTED, DATA_CLASSIFICATIONS.SECRET]) {
    assert.equal(
      evaluateFileAccess({
        organizationId: 'org_iso_guard',
        role: FIELD_VISIBILITY_ROLES.CUSTOMER,
        caseRelationship: 'customer_self',
        action: FILE_ACCESS_ACTIONS.DOWNLOAD,
        classification,
      }).allowed,
      false,
      `file access leaked ${classification}`,
    );
  }

  for (const fieldKey of ['internal_note', 'line_access_token']) {
    assert.equal(
      evaluateAiRetrievalGuard({
        organizationId: 'org_iso_guard',
        role: AI_RETRIEVAL_ROLES.DISPATCHER,
        purpose: AI_RETRIEVAL_PURPOSES.DISPATCHER_AI,
        fieldKey,
        permissionContext: {
          aiRetrievalAllowed: true,
        },
      }).allowed,
      false,
      `AI retrieval leaked ${fieldKey}`,
    );
  }
});

test('cross-scope organization mismatch fails closed across visibility, export, file, and AI policies', () => {
  const scope = {
    organizationId: 'org_a',
    resourceOrganizationId: 'org_b',
  };

  assert.equal(
    evaluateFieldVisibility({
      ...scope,
      role: FIELD_VISIBILITY_ROLES.ADMIN,
      purpose: FIELD_VISIBILITY_PURPOSES.INTERNAL_VIEW,
      fieldKey: 'case_status',
    }).allowed,
    false,
  );

  assert.equal(
    evaluateExportControl({
      ...scope,
      role: FIELD_VISIBILITY_ROLES.ADMIN,
      purpose: EXPORT_CONTROL_PURPOSES.EXPORT,
      fields: ['case_no'],
    }).allowed,
    false,
  );

  assert.equal(
    evaluateFileAccess({
      ...scope,
      role: FIELD_VISIBILITY_ROLES.ADMIN,
      action: FILE_ACCESS_ACTIONS.PREVIEW,
      classification: DATA_CLASSIFICATIONS.INTERNAL,
    }).allowed,
    false,
  );

  assert.equal(
    evaluateAiRetrievalGuard({
      ...scope,
      role: AI_RETRIEVAL_ROLES.DISPATCHER,
      purpose: AI_RETRIEVAL_PURPOSES.DISPATCHER_AI,
      fieldKey: 'case_status',
      permissionContext: {
        aiRetrievalAllowed: true,
      },
    }).allowed,
    false,
  );
});

test('provider secret guard redacts before hypothetical export log or prompt use', () => {
  const result = evaluateProviderSecretGuard({
    lineAccessToken: 'Bearer abcdefghijklmnopqrstuvwxyz123456',
    aiProviderKey: 'sk-proj-abcdefghijklmnopqrstuvwxyz123456',
    databaseUrl: 'postgres://user:pass@example.test/db',
    publicName: 'safe public name',
    prompt: 'prompt should not leak',
  }, {
    allowedPublicKeys: ['publicName'],
  });

  assert.equal(result.allowed, false);
  assert.equal(result.redactedValue.line_access_token, PROVIDER_SECRET_PLACEHOLDERS.SECRET);
  assert.equal(result.redactedValue.ai_provider_key, PROVIDER_SECRET_PLACEHOLDERS.SECRET);
  assert.equal(result.redactedValue.database_url, PROVIDER_SECRET_PLACEHOLDERS.SECRET);
  assert.equal(result.redactedValue.public_name, 'safe public name');
  assertNoForbiddenStrings(result);
});

test('auditIntent metadata remains safe across policy decisions', () => {
  const decisions = [
    evaluateExportControl({
      organizationId: 'org_iso_guard',
      role: FIELD_VISIBILITY_ROLES.ADMIN,
      purpose: EXPORT_CONTROL_PURPOSES.EXPORT,
      fields: [
        { fieldKey: 'case_no', value: 'raw customer payload should not leak' },
        { fieldKey: 'line_access_token', value: 'Bearer abcdefghijklmnopqrstuvwxyz123456' },
      ],
    }),
    evaluateFileAccess({
      organizationId: 'org_iso_guard',
      role: FIELD_VISIBILITY_ROLES.ADMIN,
      action: FILE_ACCESS_ACTIONS.DOWNLOAD,
      classification: DATA_CLASSIFICATIONS.CUSTOMER_VISIBLE,
      signedUrl: 'https://signed.example.test/token=abcdefghijklmnopqrstuvwxyz123456',
    }),
    evaluateAiRetrievalGuard({
      organizationId: 'org_iso_guard',
      role: AI_RETRIEVAL_ROLES.DISPATCHER,
      purpose: AI_RETRIEVAL_PURPOSES.DISPATCHER_AI,
      fieldKey: 'case_status',
      permissionContext: {
        aiRetrievalAllowed: true,
      },
      prompt: 'prompt should not leak',
      embedding: 'embedding should not leak',
    }),
    evaluateProviderSecretGuard({
      token: 'Bearer abcdefghijklmnopqrstuvwxyz123456',
    }),
  ];

  for (const decision of decisions) {
    assert.equal(typeof decision.auditIntent, 'object');
    assert.equal(decision.auditIntent.required, true);
    assertNoForbiddenStrings(decision.auditIntent);
    assertNoForbiddenStrings(decision);
  }
});
