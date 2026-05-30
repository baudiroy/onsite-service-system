'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  helper: 'src/customerAccess/customerAccessResolverDecisionHelper.js',
  unitTest: 'tests/customerAccess/customerAccessResolverDecisionHelper.unit.test.js',
  task2259: 'docs/task-2259-customer-access-pure-resolver-decision-helper-no-route-no-db-no-smoke-no-provider.md',
});

const PROJECTION_KEYS = Object.freeze([
  'customerReportReference',
  'caseReference',
  'serviceStatus',
  'appointmentWindow',
  'engineerDisplayName',
  'serviceSummary',
  'completionTime',
  'publicAttachments',
]);

const PUBLIC_ATTACHMENT_KEYS = Object.freeze([
  'attachmentId',
  'label',
  'mimeType',
]);

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

function objectFreezeArray(source, constantName) {
  const match = source.match(new RegExp(`${constantName} = Object\\.freeze\\(\\[([\\s\\S]*?)\\]\\);`));

  assert.ok(match, `${constantName} should be declared as an Object.freeze array`);

  return [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1]);
}

function functionSource(source, functionName, nextFunctionName) {
  const start = source.indexOf(`function ${functionName}`);
  const end = nextFunctionName
    ? source.indexOf(`function ${nextFunctionName}`, start + 1)
    : -1;

  assert.notEqual(start, -1, `${functionName} should exist`);

  return source.slice(start, end === -1 ? undefined : end);
}

function assertContainsAll(source, patterns, label) {
  for (const pattern of patterns) {
    assert.match(source, pattern, label);
  }
}

test('Task2260 static guard source unit test and evidence files exist', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }
});

test('resolver decision helper exports only the accepted pure decision APIs', () => {
  const helper = read(FILES.helper);
  const unitTest = read(FILES.unitTest);
  const task2259 = read(FILES.task2259);

  assert.match(helper, /function buildCustomerAccessResolverDecision\(input\)/);
  assert.match(helper, /function buildCustomerAccessResolverDenyDecision\(\)/);
  assert.match(helper, /module\.exports = \{\s*buildCustomerAccessResolverDecision,\s*buildCustomerAccessResolverDenyDecision,\s*\};/);
  assert.match(unitTest, /buildCustomerAccessResolverDecision/);
  assert.match(unitTest, /buildCustomerAccessResolverDenyDecision/);
  assert.match(task2259, /standalone pure Customer Access resolver decision helper/);
});

test('resolver decision helper stays standalone with no runtime DB provider AI billing env or server dependencies', () => {
  const helper = read(FILES.helper);
  const currentGuard = read('tests/customerAccess/customerAccessResolverDecisionHelperBoundary.static.test.js');

  assert.deepEqual(requireSpecifiers(helper), []);
  assert.doesNotMatch(helper, /import\s+/);
  assert.doesNotMatch(helper, /pg\b|knex|sequelize|prisma|mysql|sqlite|repository|Repository|dbClient|query\(|SQL|select |insert |update |delete |transaction/i);
  assert.doesNotMatch(helper, /routes?|controllers?|app\.|server|listen\(|express|Router|runtime/i);
  assert.doesNotMatch(helper, /provider|LINE|SMS|email|webhook|push|axios|fetch\(|http\.request|https\.request/i);
  assert.doesNotMatch(helper, /OpenAI|AI\/RAG|RAG|vector|embedding|model/i);
  assert.doesNotMatch(helper, /billing|settlement|payment|invoice/i);
  assert.doesNotMatch(helper, /process\.env|DATABASE_URL|Zeabur|credential|config/i);
  assert.deepEqual(requireSpecifiers(currentGuard), [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
});

test('generic deny decision shape remains unavailable and non-disclosing', () => {
  const helper = read(FILES.helper);
  const unitTest = read(FILES.unitTest);

  assert.match(helper, /const DENY_MESSAGE_KEY = 'customerAccess\.unavailable';/);
  assertContainsAll(functionSource(helper, 'buildCustomerAccessResolverDenyDecision', 'normalizedContext'), [
    /allowed:\s*false/,
    /status:\s*'deny'/,
    /messageKey:\s*DENY_MESSAGE_KEY/,
  ], FILES.helper);
  assert.match(unitTest, /buildCustomerAccessResolverDenyDecision returns generic safe-deny only/);
  assert.match(unitTest, /function assertGenericDeny\(output\)/);
  assert.match(unitTest, /messageKey:\s*'customerAccess\.unavailable'/);
});

test('allow decision shape projection keys and attachment keys stay explicitly allowlisted', () => {
  const helper = read(FILES.helper);
  const unitTest = read(FILES.unitTest);
  const task2259 = read(FILES.task2259);

  assert.deepEqual([...objectFreezeArray(helper, 'PROJECTION_KEYS'), 'publicAttachments'], PROJECTION_KEYS);
  assert.deepEqual(objectFreezeArray(helper, 'PUBLIC_ATTACHMENT_KEYS'), PUBLIC_ATTACHMENT_KEYS);
  assertContainsAll(functionSource(helper, 'buildCustomerAccessResolverDecision'), [
    /allowed:\s*true/,
    /status:\s*'allow'/,
    /messageKey:\s*ALLOW_MESSAGE_KEY/,
    /projection,/,
  ], FILES.helper);
  assert.match(unitTest, /output shape never contains fields outside approved decision and projection keys/);
  assert.match(unitTest, /const allowedDecisionKeys = new Set\(\['allowed', 'status', 'messageKey', 'projection'\]\)/);

  for (const key of PROJECTION_KEYS) {
    assert.match(unitTest, new RegExp(`'${key}'`), `${key} should stay covered in unit output shape`);
    assert.equal(task2259.includes(`- \`${key}\``), true, `${key} should stay documented`);
  }

  for (const key of PUBLIC_ATTACHMENT_KEYS) {
    assert.match(unitTest, new RegExp(`'${key}'`), `${key} should stay covered in unit attachment shape`);
    assert.equal(task2259.includes(`- \`${key}\``), true, `${key} should stay documented`);
  }
});

test('helper only trusts explicit customerAccessContext and does not use raw request containers', () => {
  const helper = read(FILES.helper);
  const unitTest = read(FILES.unitTest);
  const task2259 = read(FILES.task2259);
  const contextNormalizer = functionSource(helper, 'normalizedContext', 'projectionSource');

  assert.match(contextNormalizer, /input\.customerAccessContext/);
  assertContainsAll(contextNormalizer, [
    /const params = isPlainObject\(context\.params\) \? context\.params : \{\};/,
    /const auth = isPlainObject\(context\.auth\) \? context\.auth : \{\};/,
    /const access = isPlainObject\(context\.access\) \? context\.access : \{\};/,
    /safeProperty\(auth,\s*'customerIdentityVerified'\) !== true/,
    /safeProperty\(access,\s*'organizationScopeMatched'\) !== true/,
    /safeProperty\(access,\s*'caseLinkedToCustomer'\) !== true/,
    /safeProperty\(access,\s*'publicationAllowed'\) !== true/,
    /safeProperty\(access,\s*'customerVisiblePolicyPassed'\) !== true/,
  ], FILES.helper);
  assert.doesNotMatch(contextNormalizer, /body|query|headers|cookies|session|user|providerPayload|debug|env/i);
  assert.match(unitTest, /raw request containers and client-controlled internal fields cannot authorize access/);
  assert.match(task2259, /trusts only explicit `customerAccessContext`/);

  for (const rawContainer of [
    'body',
    'query',
    'headers',
    'cookies',
    'session',
    'user',
    'providerPayload',
    'debug',
    'env',
  ]) {
    assert.match(unitTest, new RegExp(`${rawContainer}`), `${rawContainer} sentinel should remain covered`);
  }
});

test('unit coverage keeps internal raw private system provider AI billing and debug sentinels visible', () => {
  const unitTest = read(FILES.unitTest);
  const task2259 = read(FILES.task2259);

  for (const marker of [
    'appointment_should_not_leak',
    'final_appointment_should_not_leak',
    'completion_report_should_not_leak',
    'field_service_report_should_not_leak',
    'internal_actor_should_not_leak',
    'engineer_user_should_not_leak',
    'role_should_not_leak',
    'permission_should_not_leak',
    'raw_case_should_not_leak',
    'raw_appointment_should_not_leak',
    'raw_completion_should_not_leak',
    'raw_fsr_should_not_leak',
    'repository_row_should_not_leak',
    'db_row_should_not_leak',
    'audit_actor_should_not_leak',
    'audit_context_should_not_leak',
    'audit_writer_result_should_not_leak',
    'provider_payload_should_not_leak',
    'line_user_should_not_leak',
    'sms_should_not_leak',
    'email_should_not_leak',
    'app_push_should_not_leak',
    'webhook_should_not_leak',
    'ai_raw_should_not_leak',
    'rag_result_should_not_leak',
    'vector_result_should_not_leak',
    'openai_should_not_leak',
    'billing_internal_should_not_leak',
    'settlement_internal_should_not_leak',
    'payment_should_not_leak',
    'invoice_should_not_leak',
    'debug_should_not_leak',
    'secret_should_not_leak',
    'token_should_not_leak',
    'password_should_not_leak',
  ]) {
    assert.match(unitTest, new RegExp(marker), `${marker} sentinel should remain covered`);
  }

  assert.match(task2259, /raw Case\/Appointment\/Completion Report \/ Field Service Report objects/);
  assert.match(task2259, /repository\/DB rows/);
  assert.match(task2259, /audit data/);
  assert.match(task2259, /provider internals/);
  assert.match(task2259, /AI\/RAG\/vector\/OpenAI data/);
  assert.match(task2259, /billing\/settlement\/payment\/invoice data/);
});

test('safe-deny coverage keeps unavailable and existence-marker denial cases non-disclosing', () => {
  const helper = read(FILES.helper);
  const unitTest = read(FILES.unitTest);
  const task2259 = read(FILES.task2259);

  assertContainsAll(functionSource(helper, 'projectionSource', 'safeAttachment'), [
    /lookup\.status === 'deny'/,
    /lookup\.status === 'not_found'/,
    /lookup\.available === false/,
    /input\.status === 'deny'/,
  ], FILES.helper);
  assert.match(unitTest, /status:\s*'not_found'/);
  assert.match(unitTest, /available:\s*false/);
  assert.match(unitTest, /case_exists_should_not_leak/);
  assert.match(unitTest, /report_exists_should_not_leak/);
  assert.match(unitTest, /raw_denial_reason_should_not_leak/);
  assert.match(unitTest, /safe-deny never reveals case or report existence or raw denial details/);
  assert.match(task2259, /Safe-deny output does not reveal Case\/report existence or raw denial details/);
});

test('helper copies output into new allowlisted objects and unit tests keep immutability coverage', () => {
  const helper = read(FILES.helper);
  const unitTest = read(FILES.unitTest);

  assertContainsAll(functionSource(helper, 'safeAttachment', 'safeAttachments'), [
    /const attachment = \{\};/,
    /for \(const key of PUBLIC_ATTACHMENT_KEYS\)/,
    /attachment\[key\] = value/,
  ], FILES.helper);
  assertContainsAll(functionSource(helper, 'safeProjection', 'buildCustomerAccessResolverDecision'), [
    /const projection = \{\};/,
    /for \(const key of PROJECTION_KEYS\)/,
    /projection\[key\] = value/,
    /projection\.publicAttachments = publicAttachments/,
  ], FILES.helper);
  assert.doesNotMatch(helper, /\.\.\.\s*(?:input|source|projection|attachment|context)|Object\.assign\(/);
  assert.match(unitTest, /input context projection and attachments are not mutated/);
  assert.match(unitTest, /const before = JSON\.stringify\(input\)/);
});
