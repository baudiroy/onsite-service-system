'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  detailMapper: 'src/engineerMobile/engineerMobileTaskDetailReadModelMapper.js',
  detailProjectionService: 'src/engineerMobile/engineerAssignedAppointmentDetailProjectionService.js',
  listMapper: 'src/engineerMobile/engineerMobileTaskListReadModelMapper.js',
  listProjectionService: 'src/engineerMobile/engineerAssignedAppointmentsProjectionService.js',
  permissionAssignmentGuard: 'src/engineerMobile/engineerMobilePermissionAssignmentGuard.js',
  preDepartureEligibility: 'src/engineerMobile/engineerPreDepartureActionEligibility.js',
  safeEnvelope: 'src/engineerMobile/engineerMobileWorkbenchSafeEnvelope.js',
  task2266Doc: 'docs/task-2266-engineer-mobile-branch-re-entry-planning-checkpoint-no-runtime-change-no-db-no-smoke-no-provider.md',
  workbenchBoundaryTest: 'tests/engineerMobile/engineerMobileWorkbenchReadOnlyBoundary.static.test.js',
});

const LIST_READ_MODEL_FIELDS = Object.freeze([
  'case_id',
  'appointment_id',
  'organization_id',
  'assigned_engineer_id',
  'scheduled_start',
  'scheduled_end',
  'appointment_status',
  'customer_name_masked',
  'customer_phone_masked',
  'address_summary',
  'product_summary',
  'issue_summary',
  'service_type',
]);

const DETAIL_READ_MODEL_FIELDS = Object.freeze([
  'organization_id',
  'case_id',
  'appointment_id',
  'assigned_engineer_id',
  'scheduled_start',
  'scheduled_end',
  'status',
  'customer_name_masked',
  'customer_phone_masked',
  'address_summary',
  'product_summary',
  'issue_summary',
  'service_type',
  'site_note_safe',
  'checklist_summary',
  'evidence_refs',
]);

const ASSIGNED_APPOINTMENTS_PROJECTION_FIELDS = Object.freeze([
  'appointment_id',
  'case_reference',
  'appointment_window',
  'scheduled_start',
  'scheduled_end',
  'service_type',
  'customer_display_name',
  'location_label',
  'appointment_status',
  'priority_label',
  'organization_id',
  'assigned_engineer_id',
]);

const ASSIGNED_APPOINTMENT_DETAIL_PROJECTION_FIELDS = Object.freeze([
  ...ASSIGNED_APPOINTMENTS_PROJECTION_FIELDS.slice(0, -2),
  'service_summary',
  'public_customer_notes',
  'checklist_preview',
  'organization_id',
  'assigned_engineer_id',
]);

const SAFE_ENVELOPE_UNSAFE_KEYS = Object.freeze([
  'authorization',
  'authorizationHeader',
  'cookie',
  'cookies',
  'debug',
  'debugPayload',
  'dbRow',
  'dbRows',
  'dispatcherNote',
  'fieldServiceReportId',
  'finalAppointmentId',
  'fullAddress',
  'internalNote',
  'lineUserId',
  'password',
  'phone',
  'providerDebug',
  'providerRawPayload',
  'rawDbRow',
  'rawDbRows',
  'rawError',
  'rawRows',
  'rawSession',
  'rawSql',
  'rawUser',
  'secret',
  'session',
  'stack',
  'token',
  'where',
]);

const FORBIDDEN_OUTPUT_MARKERS = Object.freeze([
  'auditInternal',
  'auditRow',
  'authorization',
  'billingInternal',
  'completionReportId',
  'debugPayload',
  'fieldServiceReportId',
  'finalAppointmentId',
  'fullAddress',
  'internalNote',
  'invoiceInternal',
  'lineUserId',
  'password',
  'paymentInternal',
  'providerRawPayload',
  'rawAppointmentPayload',
  'rawCasePayload',
  'rawDbRow',
  'rawRows',
  'rawSql',
  'secret',
  'settlementInternal',
  'token',
]);

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(absolutePath(relativePath), 'utf8');
}

function quotedStrings(source) {
  return Array.from(source.matchAll(/'([^']+)'/g), (match) => match[1]);
}

function constArrayBody(source, name) {
  const patterns = [
    new RegExp(`const ${name} = Object\\.freeze\\(\\[([\\s\\S]*?)\\]\\);`),
    new RegExp(`const ${name} = \\[([\\s\\S]*?)\\];`),
    new RegExp(`const ${name} = new Set\\(\\[([\\s\\S]*?)\\]\\);`),
  ];
  const match = patterns
    .map((pattern) => source.match(pattern))
    .find(Boolean);

  assert.ok(match, `missing ${name}`);

  return match[1];
}

function functionBody(source, name) {
  const signatureIndex = source.indexOf(`function ${name}(`);

  assert.notEqual(signatureIndex, -1, `missing function ${name}`);

  const openingBraceIndex = source.indexOf('{', signatureIndex);
  let depth = 0;

  for (let index = openingBraceIndex; index < source.length; index += 1) {
    const char = source[index];

    if (char === '{') {
      depth += 1;
    }

    if (char === '}') {
      depth -= 1;

      if (depth === 0) {
        return source.slice(openingBraceIndex + 1, index);
      }
    }
  }

  assert.fail(`unterminated function ${name}`);
}

function assertIncludesAll(source, values, label) {
  for (const value of values) {
    assert.equal(source.includes(value), true, `${label} missing ${value}`);
  }
}

function assertNoForbiddenMarkers(source, label) {
  for (const marker of FORBIDDEN_OUTPUT_MARKERS) {
    assert.equal(source.includes(marker), false, `${label} exposes ${marker}`);
  }
}

function assertNoRawPassThrough(body, label) {
  const rawPassThroughPatterns = [
    /\.\.\.\s*(row|rows|source|input|result|candidate|appointment)\b/,
    /Object\.assign\(\s*(appointment|mapped|task|data)\s*,\s*(row|rows|source|input|result|candidate|appointment)\s*\)/,
    /return\s+(row|rows|source|input|result|candidate)\b/,
  ];

  for (const pattern of rawPassThroughPatterns) {
    assert.doesNotMatch(body, pattern, `${label} contains raw pass-through ${pattern}`);
  }
}

test('Task2267 static guard input files exist and are read as text only', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }

  const thisSource = fs.readFileSync(__filename, 'utf8');

  assert.doesNotMatch(thisSource, /require\(['"]\.\.\/\.\.\/src\//);
  assert.doesNotMatch(thisSource, /require\(['"]node:child_process['"]\)/);
  assert.doesNotMatch(thisSource, /require\(['"]pg['"]\)/);
});

test('Engineer Mobile task list read model uses an explicit safe field allowlist', () => {
  const source = read(FILES.listMapper);
  const fields = quotedStrings(constArrayBody(source, 'ENGINEER_MOBILE_TASK_LIST_QUERY_FIELDS'));
  const mapperBody = functionBody(source, 'mapEngineerMobileTaskRow');

  assert.deepEqual(fields, LIST_READ_MODEL_FIELDS);
  assertIncludesAll(mapperBody, [
    "firstPresent(row, ['organization_id', 'organizationId'])",
    "firstPresent(row, ['case_id', 'caseId'])",
    "firstPresent(row, ['appointment_id', 'appointmentId'])",
    "firstPresent(row, ['assigned_engineer_id', 'assignedEngineerId'])",
    "firstPresent(row, ['customer_name_masked', 'customerNameMasked'])",
    "firstPresent(row, ['customer_phone_masked', 'customerPhoneMasked'])",
    "firstPresent(row, ['address_summary', 'addressSummary'])",
  ], 'task list mapper allowlist');
  assertNoRawPassThrough(mapperBody, 'task list mapper');
  assertNoForbiddenMarkers(mapperBody, 'task list mapper');
});

test('Engineer Mobile task detail read model uses explicit fields and safe evidence references', () => {
  const source = read(FILES.detailMapper);
  const fields = quotedStrings(constArrayBody(source, 'ENGINEER_MOBILE_TASK_DETAIL_FIELDS'));
  const mapperBody = functionBody(source, 'mapEngineerMobileTaskDetailRow');
  const evidenceGuardBody = functionBody(source, 'isUnsafeEvidenceRef');

  assert.deepEqual(fields, DETAIL_READ_MODEL_FIELDS);
  assertIncludesAll(source, [
    'appointmentId: row.appointment_id',
    'assignedEngineerId: row.assigned_engineer_id',
    'caseId: row.case_id',
    'organizationId: row.organization_id',
    "['customerNameMasked', row.customer_name_masked]",
    "['customerPhoneMasked', row.customer_phone_masked]",
    "['addressSummary', row.address_summary]",
    "['siteNoteSafe', row.site_note_safe]",
    "['checklistSummary', row.checklist_summary]",
    'safeEvidenceRefs(row.evidence_refs)',
  ], 'task detail mapper allowlist');
  assertIncludesAll(evidenceGuardBody, [
    '/https?:\\/\\//i',
    '/signed/i',
    '/token/i',
    '/secret/i',
    '/storage[_-]?path/i',
  ], 'safe evidence reference guard');
  assertNoRawPassThrough(mapperBody, 'task detail mapper');
  assertNoForbiddenMarkers(mapperBody, 'task detail mapper');
});

test('assigned appointment projection services shape output from explicit selected fields only', () => {
  const listSource = read(FILES.listProjectionService);
  const detailSource = read(FILES.detailProjectionService);
  const listQueryFields = quotedStrings(constArrayBody(listSource, 'ASSIGNED_APPOINTMENTS_QUERY_TEXT'));
  const detailQueryFields = quotedStrings(constArrayBody(detailSource, 'ASSIGNED_APPOINTMENT_DETAIL_QUERY_TEXT'));
  const listMapperBody = functionBody(listSource, 'mapAppointmentProjection');
  const detailMapperBody = functionBody(detailSource, 'mapAppointmentDetailProjection');

  for (const field of ASSIGNED_APPOINTMENTS_PROJECTION_FIELDS) {
    assert.equal(listQueryFields.join(' ').includes(field), true, `list query missing ${field}`);
  }
  for (const field of ASSIGNED_APPOINTMENT_DETAIL_PROJECTION_FIELDS) {
    assert.equal(detailQueryFields.join(' ').includes(field), true, `detail query missing ${field}`);
  }

  assertIncludesAll(listMapperBody, [
    "rowValue(row, 'appointment_id', 'appointmentId')",
    "rowValue(row, 'case_reference', 'caseReference', 'caseDisplayId')",
    "rowValue(row, 'customer_display_name', 'customerDisplayName')",
    "rowValue(row, 'location_label', 'locationLabel')",
    'appointment.canOpenDetails = true',
    'Object.assign(appointment, preDepartureEligibilityHints(engineerContext, row))',
  ], 'list appointment projection');
  assertIncludesAll(detailMapperBody, [
    "assignIfPresent(appointment, 'customerDisplayName'",
    "assignIfPresent(appointment, 'locationLabel'",
    "assignIfPresent(appointment, 'publicCustomerNotes'",
    "assignIfPresent(appointment, 'checklistPreview'",
    'Object.assign(appointment, preDepartureEligibilityHints(engineerContext, row))',
  ], 'detail appointment projection');
  assertNoRawPassThrough(listMapperBody, 'list appointment projection');
  assertNoRawPassThrough(detailMapperBody, 'detail appointment projection');
  assertNoForbiddenMarkers(listMapperBody, 'list appointment projection');
  assertNoForbiddenMarkers(detailMapperBody, 'detail appointment projection');
});

test('workbench safe envelope blocks raw internal provider audit DB and sensitive keys', () => {
  const source = read(FILES.safeEnvelope);
  const unsafeKeys = quotedStrings(constArrayBody(source, 'UNSAFE_KEYS'));
  const safeMetadataKeys = quotedStrings(constArrayBody(source, 'SAFE_METADATA_KEYS'));
  const sanitizeObjectBody = functionBody(source, 'sanitizeObject');

  assert.deepEqual(unsafeKeys, SAFE_ENVELOPE_UNSAFE_KEYS);
  assert.deepEqual(safeMetadataKeys, [
    'appointmentId',
    'engineerUserId',
    'organizationId',
    'reason',
    'reasonCode',
    'requestId',
    'statusCode',
    'traceId',
  ]);
  assertIncludesAll(sanitizeObjectBody, [
    'Object.entries(source)',
    'if (unsafeKey(key) || value instanceof Error)',
    'continue;',
    'sanitizeWorkbenchPayload(value)',
  ], 'safe envelope object sanitizer');
  assertIncludesAll(source, [
    'for (const key of SAFE_METADATA_KEYS)',
    'safeCode(source[key])',
  ], 'safe envelope metadata sanitizer');
});

test('assignment permission organization scope and action eligibility markers remain represented', () => {
  const listSource = read(FILES.listProjectionService);
  const detailSource = read(FILES.detailProjectionService);
  const permissionGuard = read(FILES.permissionAssignmentGuard);
  const preDeparture = read(FILES.preDepartureEligibility);

  for (const source of [listSource, detailSource]) {
    assertIncludesAll(source, [
      "READ_PERMISSION = 'engineer_mobile.assigned_appointments.read'",
      'organizationScopeMatched',
      'engineerAssignmentScopeMatched',
      'assignedAppointmentsReadAllowed',
      'arrayIncludes(permissions, READ_PERMISSION)',
    ], 'projection service assignment scope');
  }
  assertIncludesAll(listSource, [
    'rowOrganizationId !== organizationId',
    'rowEngineerId !== engineerId',
  ], 'list projection row scope filter');
  assertIncludesAll(detailSource, [
    'rowOrganizationId === organizationId',
    'rowEngineerId === engineerId',
    'rowAppointmentId === appointmentId',
  ], 'detail projection row scope filter');

  assertIncludesAll(permissionGuard, [
    'ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_REQUIRED_PERMISSIONS',
    "'engineer_mobile.tasks.read'",
    "'engineer_mobile.tasks.read.assigned'",
    "'engineer_mobile.workbench.access'",
    'ENGINEER_MOBILE_PERMISSION_ASSIGNMENT_ALLOWED_ROLES',
    'CROSS_ORGANIZATION',
    'MISSING_ASSIGNMENT',
    'MISSING_PERMISSION',
  ], 'permission assignment guard markers');
  assertIncludesAll(preDeparture, [
    'ALLOW_START_TRAVEL_STATUSES',
    'DENY_START_TRAVEL_STATUSES',
    'appointmentOrganizationId(appointment) !== organizationId',
    'appointmentEngineerId(appointment) !== engineerId',
    'contextReadAllowed(engineerContext)',
    'canStartTravel: true',
    'canRecordArrival: false',
    'canPrepareCompletionDraft: false',
  ], 'pre-departure eligibility markers');
});

test('planning docs and existing boundary test preserve non-runtime allowlist guardrails', () => {
  const task2266Doc = read(FILES.task2266Doc);
  const workbenchBoundaryTest = read(FILES.workbenchBoundaryTest);

  assertIncludesAll(task2266Doc, [
    'Static guard for Engineer Mobile projection/read-model allowlist',
    'must not expose raw Case, Appointment, Completion Report, Field Service Report, repository row, DB row, audit, provider, AI/RAG, billing, settlement, debug, or internal objects',
    '`finalAppointmentId` remains system-owned',
    'assignment/permission',
    'organization isolation',
    'customer private/contact/address data',
    'This recommendation is not authorization',
  ], 'Task2266 planning checkpoint');
  assertIncludesAll(workbenchBoundaryTest, [
    'projection remains allowlist-oriented',
    'safe envelope remains sanitizer-oriented',
    'read-only boundary files do not import global runtime',
    'read-only boundary files do not contain direct DB',
  ], 'existing workbench boundary static test');
});
