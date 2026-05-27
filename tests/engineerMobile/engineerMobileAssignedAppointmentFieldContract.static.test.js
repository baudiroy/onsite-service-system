'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  acceptance: 'tests/engineerMobile/engineerMobileWorkbenchDbAdapterSyntheticHttpAcceptance.unit.test.js',
  mapper: 'src/engineerMobile/engineerMobileAssignedAppointmentDbRowMapper.js',
  projection: 'src/engineerMobile/engineerMobileAssignedAppointmentProjection.js',
  repository: 'src/engineerMobile/engineerMobileAssignedAppointmentDbRepository.js',
  sqlBuilder: 'src/engineerMobile/engineerMobileAssignedAppointmentSqlQueryBuilder.js',
});

const SQL_SELECTED_FIELDS = Object.freeze([
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
  'service_summary',
  'public_customer_notes',
  'checklist_preview',
]);

const MAPPER_OUTPUT_FIELDS = Object.freeze([
  'appointmentId',
  'organizationId',
  'engineerUserId',
  'caseId',
  'caseReference',
  'appointmentWindow',
  'scheduledStart',
  'scheduledEnd',
  'serviceType',
  'customerDisplayName',
  'locationLabel',
  'status',
  'priorityLabel',
  'serviceSummary',
  'publicCustomerNotes',
  'checklistPreview',
]);

const LIST_PROJECTION_OUTPUT_FIELDS = Object.freeze([
  'appointmentId',
  'caseReference',
  'appointmentWindow',
  'scheduledStart',
  'scheduledEnd',
  'serviceType',
  'customerDisplayName',
  'locationLabel',
  'status',
  'priorityLabel',
  'canOpenDetails',
]);

const DETAIL_PROJECTION_OUTPUT_FIELDS = Object.freeze([
  ...LIST_PROJECTION_OUTPUT_FIELDS,
  'serviceSummary',
  'publicCustomerNotes',
  'checklistPreview',
]);

const SQL_TO_MAPPER_FIELD = Object.freeze({
  appointment_id: 'appointmentId',
  appointment_status: 'status',
  appointment_window: 'appointmentWindow',
  case_reference: 'caseReference',
  checklist_preview: 'checklistPreview',
  customer_display_name: 'customerDisplayName',
  location_label: 'locationLabel',
  priority_label: 'priorityLabel',
  public_customer_notes: 'publicCustomerNotes',
  scheduled_end: 'scheduledEnd',
  scheduled_start: 'scheduledStart',
  service_summary: 'serviceSummary',
  service_type: 'serviceType',
});

const DETAIL_ONLY_FIELDS = Object.freeze([
  'serviceSummary',
  'publicCustomerNotes',
  'checklistPreview',
]);

const FORBIDDEN_FIELD_PATTERNS = Object.freeze([
  /\bfinalAppointmentId\b/,
  /\bfinal_appointment_id\b/,
  /\braw_phone\b/,
  /\brawPhone\b/,
  /\braw_address\b/,
  /\brawAddress\b/,
  /\braw_sql\b/,
  /\brawSql\b/,
  /\braw_db_row\b/,
  /\brawDbRow\b/,
  /\bstack\b/,
  /\binternal_notes\b/,
  /\binternalNotes\b/,
  /\bprovider_payload\b/,
  /\bproviderPayload\b/,
  /\bproviderDebug\b/,
  /\btoken\b/,
  /\bcookie\b/,
  /\bpassword\b/,
  /\bsecret\b/,
  /\bauthorization\b/,
]);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function quotedStrings(source) {
  return Array.from(source.matchAll(/'([^']+)'/g), (match) => match[1]);
}

function sourceForExportedArray(source, name) {
  const match = source.match(new RegExp(`const ${name} = Object\\.freeze\\(\\[([\\s\\S]*?)\\]\\);`));

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

function assertDoesNotIncludeForbiddenFieldNames(values, label) {
  for (const value of values) {
    for (const pattern of FORBIDDEN_FIELD_PATTERNS) {
      assert.doesNotMatch(value, pattern, `${label} includes forbidden ${value}`);
    }
  }
}

function assertSourceDoesNotExposeForbiddenFields(source, label) {
  for (const pattern of FORBIDDEN_FIELD_PATTERNS) {
    assert.doesNotMatch(source, pattern, `${label} exposes ${pattern}`);
  }
}

test('SQL builder selected fields are the accepted DB read field contract', () => {
  const source = read(FILES.sqlBuilder);
  const selectedFields = quotedStrings(
    sourceForExportedArray(source, 'ASSIGNED_APPOINTMENT_SAFE_SELECTED_FIELDS'),
  );

  assert.deepEqual(selectedFields, SQL_SELECTED_FIELDS);
  assertDoesNotIncludeForbiddenFieldNames(selectedFields, 'SQL selected fields');

  for (const field of SQL_SELECTED_FIELDS) {
    assert.match(source, new RegExp(` AS ${field}\\b`), `SQL must alias ${field}`);
  }
});

test('SQL selected fields align with DB row mapper accepted input fields', () => {
  const mapperSource = read(FILES.mapper);

  for (const [dbField, mappedField] of Object.entries(SQL_TO_MAPPER_FIELD)) {
    assert.equal(
      mapperSource.includes(`'${dbField}'`) || mapperSource.includes(`.${dbField}`),
      true,
      `mapper must accept ${dbField}`,
    );
    assert.equal(mapperSource.includes(`'${mappedField}'`), true, `mapper must output ${mappedField}`);
  }

  assert.match(mapperSource, /'scheduledStart', firstString\(row, \[\s*'scheduledStart',\s*'scheduled_start',\s*'scheduledStartAt',\s*'scheduled_start_at',\s*\]\)/);
  assert.match(mapperSource, /'scheduledEnd', firstString\(row, \[\s*'scheduledEnd',\s*'scheduled_end',\s*'scheduledEndAt',\s*'scheduled_end_at',\s*\]\)/);
});

test('DB row mapper output fields align with projection normalizer input fields', () => {
  const mapperSource = read(FILES.mapper);
  const projectionSource = read(FILES.projection);

  assert.match(mapperSource, /const mapped = \{\s*appointmentId,\s*\};/);

  for (const field of MAPPER_OUTPUT_FIELDS.filter((field) => field !== 'appointmentId')) {
    assert.equal(mapperSource.includes(`mapped, '${field}'`), true, `mapper must assign ${field}`);
  }

  for (const field of LIST_PROJECTION_OUTPUT_FIELDS.filter((field) => !['canOpenDetails'].includes(field))) {
    assert.equal(projectionSource.includes(`'${field}'`), true, `projection list/detail must read ${field}`);
  }

  for (const field of DETAIL_ONLY_FIELDS) {
    assert.equal(projectionSource.includes(`'${field}'`), true, `projection detail must read ${field}`);
  }
});

test('projection visible output remains allowlist-oriented with separate list and detail sets', () => {
  const projectionSource = read(FILES.projection);
  const listBody = functionBody(projectionSource, 'projectEngineerMobileAssignedAppointmentListItem');
  const detailBody = functionBody(projectionSource, 'projectEngineerMobileAssignedAppointmentDetail');

  assert.match(listBody, /const appointment = \{\s*appointmentId,\s*\};/);
  assert.match(listBody, /appointment\.canOpenDetails = true;/);
  assert.match(detailBody, /const appointment = \{\s*appointmentId,\s*canOpenDetails: true,\s*\};/);

  for (const field of LIST_PROJECTION_OUTPUT_FIELDS.filter((field) => !['appointmentId', 'canOpenDetails'].includes(field))) {
    assert.equal(listBody.includes(`appointment, '${field}'`), true, `list projection must assign ${field}`);
    assert.equal(detailBody.includes(`appointment, '${field}'`), true, `detail projection must assign ${field}`);
  }

  for (const field of DETAIL_ONLY_FIELDS) {
    assert.equal(listBody.includes(`appointment, '${field}'`), false, `list projection must not expose ${field}`);
    assert.equal(detailBody.includes(`appointment, '${field}'`), true, `detail projection must expose ${field}`);
  }

  assert.doesNotMatch(listBody, /\.\.\.row|\.\.\.source|\.\.\.appointment/);
  assert.doesNotMatch(detailBody, /\.\.\.row|\.\.\.source|\.\.\.appointment/);
  assertDoesNotIncludeForbiddenFieldNames(LIST_PROJECTION_OUTPUT_FIELDS, 'list projection fields');
  assertDoesNotIncludeForbiddenFieldNames(DETAIL_PROJECTION_OUTPUT_FIELDS, 'detail projection fields');
});

test('repository adapter maps DB executor rows before returning rows', () => {
  const source = read(FILES.repository);
  const mapperRequire = 'require' + "('./engineerMobileAssignedAppointmentDbRowMapper')";

  assertIncludesAll(source, [
    mapperRequire,
    'mapAssignedAppointmentDetailDbRow',
    'mapAssignedAppointmentListDbRow',
    'function mapRowsForRepository(rows, detail)',
    'const mapper = detail ? mapAssignedAppointmentDetailDbRow : mapAssignedAppointmentListDbRow;',
    'return rows.map(mapper).filter(Boolean);',
    'const rows = mapRowsForRepository(normalizeRows(await execute(spec)), detail);',
    'return detail ? rows[0] : rows;',
  ], 'repository adapter');
});

test('synthetic HTTP acceptance covers snake_case DB executor rows and forbidden sentinels', () => {
  const source = read(FILES.acceptance);

  assertIncludesAll(source, [
    'appointment_id',
    'appointment_status',
    'appointment_window',
    'assigned_engineer_id',
    'case_reference',
    'checklist_preview',
    'customer_display_name',
    'location_label',
    'organization_id',
    'priority_label',
    'public_customer_notes',
    'scheduled_end',
    'scheduled_start',
    'service_summary',
    'service_type',
  ], 'synthetic DB row');

  assertIncludesAll(source, [
    'final_appointment_id_should_not_leak',
    'finalAppointmentId_should_not_leak',
    'raw DB rows should_not_leak',
    'raw sql should_not_leak',
    'raw phone should_not_leak',
    'raw address should_not_leak',
    'internal_note_should_not_leak',
    'provider_debug_should_not_leak',
    'authorization_header_should_not_leak',
    'cookie_should_not_leak',
    'password_should_not_leak',
    'secret_should_not_leak',
    'token_should_not_leak',
    'stack_trace_should_not_leak',
  ], 'synthetic forbidden sentinels');
});

test('forbidden fields are not selected mapped or visible', () => {
  const sqlBuilderSource = read(FILES.sqlBuilder);
  const mapperSource = read(FILES.mapper);
  const projectionSource = read(FILES.projection);
  const selectedFields = quotedStrings(
    sourceForExportedArray(sqlBuilderSource, 'ASSIGNED_APPOINTMENT_SAFE_SELECTED_FIELDS'),
  );

  assertDoesNotIncludeForbiddenFieldNames(selectedFields, 'SQL selected fields');
  assertSourceDoesNotExposeForbiddenFields(mapperSource, 'DB row mapper');
  assertSourceDoesNotExposeForbiddenFields(projectionSource, 'projection normalizer');
});

test('static guard stays file-only and does not import DB clients or execute SQL', () => {
  const source = fs.readFileSync(__filename, 'utf8');
  const requireSpecifiers = Array.from(source.matchAll(/require\(['"]([^'"]+)['"]\)/g), (match) => match[1]);
  const childProcessPattern = new RegExp('\\bchild_' + 'process\\b');

  assert.deepEqual(requireSpecifiers, [
    'node:assert/strict',
    'node:fs',
    'node:path',
    'node:test',
  ]);
  assert.doesNotMatch(source, /require\(['"]\.\.\/\.\.\/src\//);
  assert.doesNotMatch(source, /require\(['"](?:pg|postgres|postgresql|mysql|knex|sequelize)['"]\)/i);
  assert.doesNotMatch(source, /process\.env/);
  assert.doesNotMatch(source, /postgres:\/\/|postgresql:\/\/|mysql:\/\/|mongodb:\/\//i);
  assert.doesNotMatch(source, childProcessPattern);
  assert.doesNotMatch(source, /\bexec(?:File|Sync)?\s*\(/);
});
