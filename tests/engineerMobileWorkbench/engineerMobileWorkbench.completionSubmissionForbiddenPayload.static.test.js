const assert = require('node:assert/strict');
const test = require('node:test');

const {
  engineerMobileWorkbenchRepositorySyntheticFixture,
  repositorySyntheticFixtureForbiddenKeys,
  repositorySyntheticFixtureInvariantNotes
} = require('../../fixtures/engineerMobileWorkbench/repositorySynthetic.fixture');

const forbiddenKeySet = new Set(repositorySyntheticFixtureForbiddenKeys);

const forbiddenExamplePayloadKeys = () =>
  engineerMobileWorkbenchRepositorySyntheticFixture.forbiddenPayloadExamples.flatMap(
    (example) => Object.keys(example.payloadShape)
  );

const joinedInvariantNotes = () => repositorySyntheticFixtureInvariantNotes.join(' ');

const assertForbiddenKeysInclude = (keys, message) => {
  for (const key of keys) {
    assert.equal(forbiddenKeySet.has(key), true, `${message}: ${key}`);
  }
};

test('forbidden payload registry covers client authority fields', () => {
  assertForbiddenKeysInclude(
    [
      'organizationId',
      'engineerProfileId',
      'finalAppointmentId',
      'caseCompleted',
      'formalFieldServiceReportApproved'
    ],
    'client authority key must be forbidden'
  );

  const exampleKeys = new Set(forbiddenExamplePayloadKeys());

  assert.equal(exampleKeys.has('finalAppointmentId'), true);
  assert.equal(exampleKeys.has('caseCompleted'), true);
  assert.equal(exampleKeys.has('formalFieldServiceReportApproved'), true);

  assert.match(joinedInvariantNotes(), /final-appointment-id-is-system-owned/);
  assert.match(joinedInvariantNotes(), /not-case-completed/);
  assert.match(joinedInvariantNotes(), /not-formal-field-service-report/);
});

test('forbidden payload registry covers raw binary and object-storage bypass attempts', () => {
  assertForbiddenKeysInclude(
    ['rawFileBinary', 'rawPhotoBinary', 'rawSignatureBinary'],
    'raw binary key must be forbidden'
  );

  const examples = engineerMobileWorkbenchRepositorySyntheticFixture.forbiddenPayloadExamples;
  const rawFileExample = examples.find((example) =>
    Object.prototype.hasOwnProperty.call(example.payloadShape, 'rawFileBinary')
  );

  assert.ok(rawFileExample);
  assert.equal(rawFileExample.payloadShape.rawFileBinary, 'forbidden-raw-binary-marker');
  assert.equal(rawFileExample.expectedRejection, 'metadata-refs-only');

  for (const objectRef of engineerMobileWorkbenchRepositorySyntheticFixture.objectRefs) {
    assert.equal(objectRef.containsBinary, false);
    assert.match(objectRef.objectType, /metadata/);
    assert.match(objectRef.storageRef, /^synthetic-object-ref-/);
    assert.match(objectRef.checksumRef, /^synthetic-checksum-/);
  }
});

test('forbidden payload registry covers provider AI internal and settlement payloads', () => {
  assertForbiddenKeysInclude(
    ['providerPayload', 'aiRawPayload', 'auditLog', 'internalNote'],
    'provider AI or internal key must be forbidden'
  );
  assertForbiddenKeysInclude(
    ['billingInternalData', 'settlementInternalData'],
    'billing settlement internal key must be forbidden'
  );

  const examples = engineerMobileWorkbenchRepositorySyntheticFixture.forbiddenPayloadExamples;
  const providerExample = examples.find((example) =>
    Object.prototype.hasOwnProperty.call(example.payloadShape, 'providerPayload')
  );
  const aiExample = examples.find((example) =>
    Object.prototype.hasOwnProperty.call(example.payloadShape, 'aiRawPayload')
  );

  assert.ok(providerExample);
  assert.equal(providerExample.payloadShape.providerPayload, 'forbidden-provider-payload-marker');
  assert.equal(providerExample.expectedRejection, 'provider-payload-not-accepted');

  assert.ok(aiExample);
  assert.equal(aiExample.payloadShape.aiRawPayload, 'forbidden-ai-raw-payload-marker');
  assert.equal(aiExample.expectedRejection, 'ai-raw-payload-not-accepted');

  assert.match(joinedInvariantNotes(), /no-survey-provider-billing-settlement-ai-approval-trigger/);
});

test('forbidden examples express rejection without persistence or formal completion authority', () => {
  for (const example of engineerMobileWorkbenchRepositorySyntheticFixture.forbiddenPayloadExamples) {
    assert.equal(typeof example.id, 'string');
    assert.match(example.id, /^forbidden_/);
    assert.equal(Object.keys(example.payloadShape).length, 1);
    assert.equal(typeof example.expectedRejection, 'string');
    assert.match(example.expectedRejection, /server-owned|cannot|not-accepted|metadata/);
  }

  const notes = joinedInvariantNotes();

  assert.match(notes, /source-data-only/);
  assert.match(notes, /not-formal-field-service-report/);
  assert.match(notes, /not-case-completed/);
  assert.match(notes, /multiple-submissions-do-not-create-multiple-formal-reports/);
  assert.match(notes, /no-survey-provider-billing-settlement-ai-approval-trigger/);
});

test('completion submission fixture keeps source-data records separate from formal FSR state', () => {
  const submissions = engineerMobileWorkbenchRepositorySyntheticFixture.completionSubmissions;
  const reports = engineerMobileWorkbenchRepositorySyntheticFixture.fieldServiceReports;
  const formalReportCaseIds = new Set(reports.map((report) => report.caseId));

  assert.ok(submissions.length > 0);

  for (const submission of submissions) {
    assert.equal(
      Object.prototype.hasOwnProperty.call(submission, 'finalAppointmentId'),
      false,
      `${submission.id} must not carry client-selected finalAppointmentId`
    );
    assert.equal(
      Object.prototype.hasOwnProperty.call(submission, 'caseCompleted'),
      false,
      `${submission.id} must not carry client case completion authority`
    );
    assert.equal(
      Object.prototype.hasOwnProperty.call(submission, 'formalFieldServiceReportApproved'),
      false,
      `${submission.id} must not carry formal report approval authority`
    );
    assert.equal(formalReportCaseIds.has(submission.caseId), false);
  }

  assert.equal(reports.length, 1);
  assert.equal(reports[0].invariant, 'one_case_one_formal_report');
});

test('serialized fixture has no obvious secret or real personal data values', () => {
  const serialized = JSON.stringify({
    engineerMobileWorkbenchRepositorySyntheticFixture,
    repositorySyntheticFixtureForbiddenKeys,
    repositorySyntheticFixtureInvariantNotes
  });

  const forbiddenValuePatterns = [
    /DATABASE_URL/i,
    /access_token/i,
    /channel_secret/i,
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
    /09\d{8}/,
    /sk-[A-Za-z0-9_-]{20,}/,
    /ghp_[A-Za-z0-9_]{20,}/,
    /xox[baprs]-[A-Za-z0-9-]{20,}/,
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/
  ];

  for (const pattern of forbiddenValuePatterns) {
    assert.equal(pattern.test(serialized), false, `${pattern} must not match fixture`);
  }

  const harmlessMarkerValues = [
    'forbidden-raw-binary-marker',
    'forbidden-provider-payload-marker',
    'forbidden-ai-raw-payload-marker'
  ];

  for (const markerValue of harmlessMarkerValues) {
    assert.equal(serialized.includes(markerValue), true);
  }

  assert.equal(serialized.includes('line_user_id'), false);
});
