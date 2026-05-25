'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DATA_CLASSIFICATIONS,
} = require('../../src/security/dataClassificationPolicy');
const {
  FIELD_VISIBILITY_ROLES,
} = require('../../src/security/fieldVisibilityPolicy');
const {
  FILE_ACCESS_ACTIONS,
  FILE_ACCESS_DECISIONS,
  FILE_ACCESS_REASON_KEYS,
  evaluateFileAccess,
} = require('../../src/security/fileAccessControlPolicy');

function fileAccess(overrides = {}) {
  return evaluateFileAccess({
    organizationId: 'org_file_access',
    role: FIELD_VISIBILITY_ROLES.ADMIN,
    action: FILE_ACCESS_ACTIONS.PREVIEW,
    classification: DATA_CLASSIFICATIONS.INTERNAL,
    ...overrides,
  });
}

function assertDenied(result, reasonKey) {
  assert.equal(result.allowed, false);
  assert.equal(result.decision, FILE_ACCESS_DECISIONS.DENY);
  assert.equal(result.reasonKey, reasonKey);
}

test('unknown role, action, classification, missing scope, and cross-scope mismatch fail closed', () => {
  assertDenied(fileAccess({ role: 'unknown_role' }), FILE_ACCESS_REASON_KEYS.UNKNOWN_ROLE);
  assertDenied(fileAccess({ action: 'unknown_action' }), FILE_ACCESS_REASON_KEYS.UNKNOWN_ACTION);
  assertDenied(fileAccess({ classification: 'unknown_classification' }), FILE_ACCESS_REASON_KEYS.UNKNOWN_CLASSIFICATION);
  assertDenied(fileAccess({ organizationId: undefined }), FILE_ACCESS_REASON_KEYS.MISSING_SCOPE);
  assertDenied(
    fileAccess({ organizationId: 'org_a', resourceOrganizationId: 'org_b' }),
    FILE_ACCESS_REASON_KEYS.CROSS_SCOPE,
  );
});

test('customer can preview and download only in-scope customer-visible files', () => {
  for (const action of [FILE_ACCESS_ACTIONS.PREVIEW, FILE_ACCESS_ACTIONS.DOWNLOAD]) {
    assert.equal(
      fileAccess({
        role: FIELD_VISIBILITY_ROLES.CUSTOMER,
        caseRelationship: 'customer_self',
        action,
        classification: DATA_CLASSIFICATIONS.CUSTOMER_VISIBLE,
      }).allowed,
      true,
    );

    assertDenied(
      fileAccess({
        role: FIELD_VISIBILITY_ROLES.CUSTOMER,
        caseRelationship: 'other_customer',
        action,
        classification: DATA_CLASSIFICATIONS.CUSTOMER_VISIBLE,
      }),
      FILE_ACCESS_REASON_KEYS.NOT_ASSIGNED,
    );

    for (const classification of [
      DATA_CLASSIFICATIONS.INTERNAL,
      DATA_CLASSIFICATIONS.CONFIDENTIAL,
      DATA_CLASSIFICATIONS.RESTRICTED,
    ]) {
      assertDenied(
        fileAccess({
          role: FIELD_VISIBILITY_ROLES.CUSTOMER,
          caseRelationship: 'customer_self',
          action,
          classification,
        }),
        FILE_ACCESS_REASON_KEYS.CUSTOMER_DENIED,
      );
    }
  }
});

test('engineer and subcontractor access requires assignment and excludes confidential or restricted files', () => {
  assert.equal(
    fileAccess({
      role: FIELD_VISIBILITY_ROLES.ENGINEER,
      caseRelationship: 'assigned_engineer',
      action: FILE_ACCESS_ACTIONS.PREVIEW,
      classification: DATA_CLASSIFICATIONS.INTERNAL,
    }).allowed,
    true,
  );
  assertDenied(
    fileAccess({
      role: FIELD_VISIBILITY_ROLES.ENGINEER,
      caseRelationship: 'unassigned',
      action: FILE_ACCESS_ACTIONS.PREVIEW,
      classification: DATA_CLASSIFICATIONS.INTERNAL,
    }),
    FILE_ACCESS_REASON_KEYS.NOT_ASSIGNED,
  );
  assertDenied(
    fileAccess({
      role: FIELD_VISIBILITY_ROLES.SUBCONTRACTOR,
      caseRelationship: 'assigned_executor',
      action: FILE_ACCESS_ACTIONS.DOWNLOAD,
      classification: DATA_CLASSIFICATIONS.RESTRICTED,
    }),
    FILE_ACCESS_REASON_KEYS.RESTRICTED_DENIED,
  );
});

test('internal roles can preview/download internal and confidential files but restricted remains bounded', () => {
  assert.equal(
    fileAccess({
      role: FIELD_VISIBILITY_ROLES.SERVICE_PROVIDER,
      action: FILE_ACCESS_ACTIONS.DOWNLOAD,
      classification: DATA_CLASSIFICATIONS.CONFIDENTIAL,
    }).allowed,
    true,
  );
  assertDenied(
    fileAccess({
      role: FIELD_VISIBILITY_ROLES.SERVICE_PROVIDER,
      action: FILE_ACCESS_ACTIONS.DOWNLOAD,
      classification: DATA_CLASSIFICATIONS.RESTRICTED,
    }),
    FILE_ACCESS_REASON_KEYS.RESTRICTED_DENIED,
  );
  assert.equal(
    fileAccess({
      role: FIELD_VISIBILITY_ROLES.AUDITOR,
      action: FILE_ACCESS_ACTIONS.PREVIEW,
      classification: DATA_CLASSIFICATIONS.RESTRICTED,
    }).allowed,
    true,
  );
});

test('secret files are never downloadable through this policy', () => {
  for (const action of [
    FILE_ACCESS_ACTIONS.PREVIEW,
    FILE_ACCESS_ACTIONS.DOWNLOAD,
    FILE_ACCESS_ACTIONS.DELETE,
  ]) {
    assertDenied(
      fileAccess({
        role: FIELD_VISIBILITY_ROLES.ADMIN,
        action,
        classification: DATA_CLASSIFICATIONS.SECRET,
        elevatedFileDelete: true,
      }),
      FILE_ACCESS_REASON_KEYS.SECRET_NEVER_DOWNLOADABLE,
    );
  }
});

test('delete requires elevated admin or auditor context', () => {
  assertDenied(
    fileAccess({
      role: FIELD_VISIBILITY_ROLES.ADMIN,
      action: FILE_ACCESS_ACTIONS.DELETE,
      classification: DATA_CLASSIFICATIONS.INTERNAL,
    }),
    FILE_ACCESS_REASON_KEYS.DELETE_DENIED,
  );
  assert.equal(
    fileAccess({
      role: FIELD_VISIBILITY_ROLES.ADMIN,
      action: FILE_ACCESS_ACTIONS.DELETE,
      classification: DATA_CLASSIFICATIONS.INTERNAL,
      elevatedFileDelete: true,
    }).allowed,
    true,
  );

  for (const role of [
    FIELD_VISIBILITY_ROLES.CUSTOMER,
    FIELD_VISIBILITY_ROLES.ENGINEER,
    FIELD_VISIBILITY_ROLES.BRAND,
    FIELD_VISIBILITY_ROLES.SERVICE_PROVIDER,
    FIELD_VISIBILITY_ROLES.SUBCONTRACTOR,
  ]) {
    assertDenied(
      fileAccess({
        role,
        action: FILE_ACCESS_ACTIONS.DELETE,
        classification: DATA_CLASSIFICATIONS.INTERNAL,
        elevatedFileDelete: true,
      }),
      FILE_ACCESS_REASON_KEYS.DELETE_DENIED,
    );
  }
});

test('decision and audit intent do not include file content, path, signed URL, or secrets', () => {
  const result = fileAccess({
    action: FILE_ACCESS_ACTIONS.DOWNLOAD,
    classification: DATA_CLASSIFICATIONS.CUSTOMER_VISIBLE,
    fileContent: 'raw-file-content-should-not-leak',
    storagePath: 's3://private-bucket/customer-file',
    signedUrl: 'https://signed.example.test/token=secret',
    token: 'secret-token-value',
  });
  const serialized = JSON.stringify(result);

  assert.equal(result.allowed, true);
  assert.equal(serialized.includes('raw-file-content-should-not-leak'), false);
  assert.equal(serialized.includes('s3://private-bucket/customer-file'), false);
  assert.equal(serialized.includes('https://signed.example.test'), false);
  assert.equal(serialized.includes('secret-token-value'), false);
  assert.deepEqual(Object.keys(result.auditIntent).sort(), ['eventType', 'required', 'safeSummary']);
});
