'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const READ_ONLY_SOURCE_FILES = [
  'src/engineerMobile/engineerMobileAssignedAppointmentsHandler.js',
  'src/engineerMobile/engineerMobileAssignedAppointmentDetailHandler.js',
  'src/engineerMobile/engineerMobileAssignedAppointmentProjection.js',
  'src/engineerMobile/engineerMobileWorkbenchSafeEnvelope.js',
  'src/engineerMobile/engineerMobileWorkbenchReadOnlyHttpAdapter.js',
  'src/engineerMobile/engineerMobileWorkbenchReadOnlyModule.js',
  'src/engineerMobile/engineerMobileWorkbenchRequestContextResolver.js',
  'src/engineerMobile/engineerMobileAssignedAppointmentRepositoryGuard.js',
];

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(absolutePath(relativePath), 'utf8');
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

function sourcesByPath(files) {
  return Object.fromEntries(files.map((file) => [file, read(file)]));
}

function assertNoPattern(source, patterns, label) {
  for (const pattern of patterns) {
    assert.doesNotMatch(source, pattern, `${label} contains forbidden pattern ${pattern}`);
  }
}

function assertContainsAll(source, patterns, label) {
  for (const pattern of patterns) {
    assert.match(source, pattern, `${label} is missing ${pattern}`);
  }
}

test('Engineer Mobile Workbench read-only boundary source files exist', () => {
  for (const file of READ_ONLY_SOURCE_FILES) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('read-only boundary files do not import global runtime, DB, provider, AI, billing, or admin surfaces', () => {
  const forbiddenImportPatterns = [
    /(?:^|[/.-])app(?:$|[/.-])/i,
    /(?:^|[/.-])server(?:$|[/.-])/i,
    /(?:^|[/.-])routes?(?:$|[/.-])/i,
    /migrations?/i,
    /(?:^|[/.-])admin(?:$|[/.-])/i,
    /package(?:-lock)?\.json/i,
    /(?:^|[/.-])db(?:$|[/.-])/i,
    /database/i,
    /postgres/i,
    /(?:^|[/.-])pg(?:$|[/.-])/i,
    /pool/i,
    /sql/i,
    /provider/i,
    /webhook/i,
    /sms/i,
    /email/i,
    /line/i,
    /push/i,
    /openai/i,
    /(?:^|[/.-])ai(?:$|[/.-])/i,
    /rag/i,
    /vector/i,
    /billing/i,
    /settlement/i,
  ];
  const sources = sourcesByPath(READ_ONLY_SOURCE_FILES);

  for (const [file, source] of Object.entries(sources)) {
    for (const specifier of requireSpecifiers(source)) {
      for (const pattern of forbiddenImportPatterns) {
        assert.equal(
          pattern.test(specifier),
          false,
          `${file} imports forbidden boundary ${specifier}`,
        );
      }
    }
  }
});

test('read-only boundary files do not contain direct DB, listen, provider sending, AI, billing, admin, or workflow mutation calls', () => {
  const forbiddenSourcePatterns = [
    /process\.env/,
    /\bnew\s+Pool\b/,
    /\bPool\s*\(/,
    /\.query\s*\(/,
    /\bsql\s*`/,
    /\bpsql\b/i,
    /db:migrate/i,
    /\.listen\s*\(/,
    /\bserver\.listen\b/,
    /\bcreateServer\s*\(/,
    /\bstartServer\s*\(/,
    /\bsendProviderMessage\s*\(/i,
    /\bsendLine\s*\(/i,
    /\bsendSms\s*\(/i,
    /\bsendEmail\s*\(/i,
    /\bsendWebhook\s*\(/i,
    /\bdispatchPush\s*\(/i,
    /\bopenai\b/i,
    /\brag\b/i,
    /\bvector(?:Db|Database)?\b/i,
    /\bbilling(?:Service|Repository|Runtime)?\b/i,
    /\bsettlement(?:Service|Repository|Runtime)?\b/i,
    /\badmin(?:Ui|Frontend|Route)?\b/i,
    /\bcreateFieldServiceReport\s*\(/i,
    /\bupdateFieldServiceReport\s*\(/i,
    /\bsubmitFieldServiceReport\s*\(/i,
    /\bpublishFieldServiceReport\s*\(/i,
    /\bcreateCompletionReport\s*\(/i,
    /\bupdateCompletionReport\s*\(/i,
    /\bsubmitCompletionReport\s*\(/i,
    /\bpublishCompletionReport\s*\(/i,
    /\bsubmitCompletion\s*\(/i,
    /\bcompleteAppointment\s*\(/i,
    /\bupdateAppointment\s*\(/i,
    /\bcreateAppointment\s*\(/i,
    /\bupdateCase\s*\(/i,
  ];
  const sources = sourcesByPath(READ_ONLY_SOURCE_FILES);

  for (const [file, source] of Object.entries(sources)) {
    assertNoPattern(source, forbiddenSourcePatterns, file);
  }
});

test('canonical injected routes are present only in the read-only adapter boundary', () => {
  const adapter = read('src/engineerMobile/engineerMobileWorkbenchReadOnlyHttpAdapter.js');
  const moduleSource = read('src/engineerMobile/engineerMobileWorkbenchReadOnlyModule.js');

  assertContainsAll(
    adapter,
    [
      /DEFAULT_WORKBENCH_ASSIGNED_APPOINTMENTS_PATH = '\/engineer-mobile\/appointments'/,
      /DEFAULT_WORKBENCH_ASSIGNED_APPOINTMENT_DETAIL_PATH = '\/engineer-mobile\/appointments\/:appointmentId'/,
      /target\.get\(listPath, listHandler\)/,
      /target\.get\(detailPath, detailHandler\)/,
      /INTERNAL_WORKBENCH_ASSIGNED_APPOINTMENTS_ALIAS_PATH = '\/__internal\/engineer-mobile\/workbench\/assigned-appointments'/,
      /INTERNAL_WORKBENCH_ASSIGNED_APPOINTMENT_DETAIL_ALIAS_PATH = '\/__internal\/engineer-mobile\/workbench\/assigned-appointments\/:appointmentId'/,
      /includeInternalAliases !== false/,
    ],
    'read-only HTTP adapter',
  );

  assertContainsAll(
    moduleSource,
    [
      /routeOptionsFrom\(source\)/,
      /'app'/,
      /'router'/,
      /adapter\.register/,
    ],
    'read-only module injected route options',
  );

  assertNoPattern(moduleSource, [/\.listen\s*\(/], 'read-only module');
});

test('repository guard and request context resolver remain injected-only', () => {
  const repositoryGuard = read('src/engineerMobile/engineerMobileAssignedAppointmentRepositoryGuard.js');
  const requestContextResolver = read('src/engineerMobile/engineerMobileWorkbenchRequestContextResolver.js');

  assert.deepEqual(requireSpecifiers(repositoryGuard), []);
  assert.deepEqual(requireSpecifiers(requestContextResolver), []);

  assertContainsAll(
    repositoryGuard,
    [
      /delegateMethod\(delegateRepository, methodName\)/,
      /delegateRepository\[methodName\]/,
      /findAssignedAppointments/,
      /findAssignedAppointmentDetail/,
      /throw safeRepositoryError\(\)/,
      /Object\.freeze/,
    ],
    'repository guard injected delegate boundary',
  );

  assertContainsAll(
    requestContextResolver,
    [
      /resolveEngineerMobileWorkbenchRequestContext/,
      /source\.request/,
      /request\.context/,
      /request\.auth/,
      /request\.session/,
      /request\.user/,
      /READ_PERMISSION/,
      /buildSafeDenyEnvelope/,
      /buildAllowEnvelope/,
    ],
    'request context resolver injected request boundary',
  );
});

test('projection remains allowlist-oriented and safe envelope remains sanitizer-oriented', () => {
  const projection = read('src/engineerMobile/engineerMobileAssignedAppointmentProjection.js');
  const safeEnvelope = read('src/engineerMobile/engineerMobileWorkbenchSafeEnvelope.js');

  assertContainsAll(
    projection,
    [
      /assignIfPresent\(appointment, 'caseReference'/,
      /assignIfPresent\(appointment, 'appointmentWindow'/,
      /assignIfPresent\(appointment, 'scheduledStart'/,
      /assignIfPresent\(appointment, 'serviceType'/,
      /assignIfPresent\(appointment, 'customerDisplayName'/,
      /assignIfPresent\(appointment, 'locationLabel'/,
      /assignIfPresent\(appointment, 'publicCustomerNotes'/,
      /safeChecklistPreview/,
    ],
    'assigned appointment projection allowlist',
  );

  assertNoPattern(projection, [
    /\binternalNote\b/,
    /\brawSql\b/,
    /\brawDbRows?\b/,
    /\bproviderRawPayload\b/,
    /\baiRawPayload\b/,
    /\bfinalAppointmentId\b/,
  ], 'assigned appointment projection');

  assertContainsAll(
    safeEnvelope,
    [
      /SAFE_METADATA_KEYS/,
      /UNSAFE_KEYS/,
      /sanitizeWorkbenchPayload/,
      /sanitizeWorkbenchMetadata/,
      /createEngineerMobileWorkbenchSuccessEnvelope/,
      /createEngineerMobileWorkbenchDenyEnvelope/,
      /createEngineerMobileWorkbenchErrorEnvelope/,
      /'rawError'/,
      /'rawSql'/,
      /'rawDbRows'/,
      /'token'/,
      /'cookie'/,
      /'password'/,
      /'secret'/,
      /'authorization'/,
      /'rawSession'/,
      /'rawUser'/,
      /'providerDebug'/,
      /'internalNote'/,
      /'finalAppointmentId'/,
    ],
    'workbench safe envelope sanitizer',
  );
});
