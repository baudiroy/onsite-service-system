'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  ENGINEER_MOBILE_TASK_LIST_QUERY_FIELDS,
  buildEngineerMobileTaskListQuerySpec,
} = require('../../src/engineerMobile/engineerMobileTaskListReadModelMapper');
const {
  ENGINEER_MOBILE_TASK_DETAIL_FIELDS,
  buildEngineerMobileTaskDetailQuerySpec,
} = require('../../src/engineerMobile/engineerMobileTaskDetailReadModelMapper');

const repoRoot = path.resolve(__dirname, '../..');
const listMapperFile = path.join(repoRoot, 'src/engineerMobile/engineerMobileTaskListReadModelMapper.js');
const detailMapperFile = path.join(repoRoot, 'src/engineerMobile/engineerMobileTaskDetailReadModelMapper.js');
const migrationFile = path.join(repoRoot, 'migrations/022_create_engineer_mobile_read_model.sql');
const proposalFile = path.join(repoRoot, 'docs/design/engineer-mobile-read-model-schema-proposal.md');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function uncommentedSql(source) {
  return source
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n');
}

function columnNames(sql) {
  const tableMatch = sql.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+engineer_mobile_task_read_models\s*\(([\s\S]*?)\n\);/i);

  assert.ok(tableMatch, 'table body not found');

  return tableMatch[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('CONSTRAINT'))
    .map((line) => line.replace(/,$/, '').split(/\s+/)[0])
    .filter((name) => /^[a-z_][a-z0-9_]*$/i.test(name));
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

function assertIncludesAll(source, values) {
  for (const value of values) {
    assert.equal(source.includes(value), true, `missing ${value}`);
  }
}

function assertNoForbiddenFields(values) {
  for (const forbidden of [
    'raw_phone',
    'raw_address',
    'raw_line_user_id',
    'line_user_id',
    'token',
    'secret',
    'password',
    'database_url',
    'DATABASE_URL',
    'internal_note',
    'audit_log',
    'ai_raw_payload',
    'billing_internal',
    'settlement_internal',
    'final_appointment_id',
    'field_service_report_id',
    'full_customer_payload',
  ]) {
    assert.equal(values.includes(forbidden), false, `forbidden field ${forbidden}`);
  }
}

test('migration draft contains engineer mobile read model table', () => {
  const sql = uncommentedSql(read(migrationFile));

  assert.match(sql, /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+engineer_mobile_task_read_models/i);
});

test('design proposal contains equivalent read model naming', () => {
  const proposal = read(proposalFile);

  assert.match(proposal, /Engineer Mobile read model/i);
  assert.match(proposal, /read-side row shape/i);
});

test('list mapper safe fields align with migration fields', () => {
  const migrationColumns = columnNames(uncommentedSql(read(migrationFile)));
  const requiredListFields = [
    'organization_id',
    'case_id',
    'appointment_id',
    'assigned_engineer_id',
    'scheduled_start',
    'customer_name_masked',
    'customer_phone_masked',
    'address_summary',
    'product_summary',
    'issue_summary',
  ];

  for (const field of requiredListFields) {
    assert.equal(ENGINEER_MOBILE_TASK_LIST_QUERY_FIELDS.includes(field), true, `list mapper missing ${field}`);
    assert.equal(migrationColumns.includes(field), true, `migration missing ${field}`);
  }

  assert.equal(ENGINEER_MOBILE_TASK_LIST_QUERY_FIELDS.includes('appointment_status'), true);
  assert.equal(migrationColumns.includes('status'), true);
});

test('detail mapper safe fields align with migration fields', () => {
  const migrationColumns = columnNames(uncommentedSql(read(migrationFile)));
  const requiredDetailFields = [
    'organization_id',
    'case_id',
    'appointment_id',
    'assigned_engineer_id',
    'scheduled_start',
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
  ];

  for (const field of requiredDetailFields) {
    assert.equal(ENGINEER_MOBILE_TASK_DETAIL_FIELDS.includes(field), true, `detail mapper missing ${field}`);
    assert.equal(migrationColumns.includes(field), true, `migration missing ${field}`);
  }

  assert.equal(migrationColumns.includes('service_summary'), true);
});

test('query specs remain non executable by default and use placeholders', () => {
  const listSpec = buildEngineerMobileTaskListQuerySpec({
    organizationId: 'org_static_alignment',
    engineerId: 'eng_static_alignment',
    dateRange: {
      from: '2026-05-21',
      to: '2026-05-28',
    },
  });
  const detailSpec = buildEngineerMobileTaskDetailQuerySpec({
    organizationId: 'org_static_alignment',
    engineerId: 'eng_static_alignment',
    appointmentId: 'apt_static_alignment',
  });

  assert.equal(listSpec.ok, true);
  assert.equal(detailSpec.ok, true);
  assert.equal(listSpec.executable, false);
  assert.equal(detailSpec.executable, false);
  assert.match(listSpec.sql, /\$1/);
  assert.match(listSpec.sql, /\$2/);
  assert.match(detailSpec.sql, /\$1/);
  assert.match(detailSpec.sql, /\$2/);
  assert.match(detailSpec.sql, /\$3/);
  assert.equal(listSpec.sql.includes('org_static_alignment'), false);
  assert.equal(listSpec.sql.includes('eng_static_alignment'), false);
  assert.equal(detailSpec.sql.includes('org_static_alignment'), false);
  assert.equal(detailSpec.sql.includes('eng_static_alignment'), false);
  assert.equal(detailSpec.sql.includes('apt_static_alignment'), false);
});

test('query spec fields do not request forbidden fields', () => {
  assertNoForbiddenFields(ENGINEER_MOBILE_TASK_LIST_QUERY_FIELDS);
  assertNoForbiddenFields(ENGINEER_MOBILE_TASK_DETAIL_FIELDS);
});

test('migration draft does not contain forbidden columns', () => {
  const migrationColumns = columnNames(uncommentedSql(read(migrationFile)));

  assertNoForbiddenFields(migrationColumns);
});

test('design proposal lists forbidden fields and invariants', () => {
  const proposal = read(proposalFile);

  assertIncludesAll(proposal, [
    'raw_phone',
    'raw_address',
    'raw_line_user_id',
    'line_user_id',
    'token',
    'secret',
    'password',
    'DATABASE_URL',
    'internal_note',
    'audit_log',
    'ai_raw_payload',
    'billing_internal',
    'settlement_internal',
    'final_appointment_id',
    'finalAppointmentId',
    'full_customer_payload',
    'Every read model row must include `organization_id`.',
    'Every engineer-visible task row must include `assigned_engineer_id`.',
    'Task detail is not a Field Service Report.',
  ]);
});

test('detail query requires organization engineer and appointment', () => {
  const spec = buildEngineerMobileTaskDetailQuerySpec({
    organizationId: 'org_static_alignment',
    engineerId: 'eng_static_alignment',
    appointmentId: 'apt_static_alignment',
  });

  assert.deepEqual(spec.requiredParams, ['organizationId', 'engineerId', 'appointmentId']);
  assert.deepEqual(spec.params, {
    appointmentId: 'apt_static_alignment',
    engineerId: 'eng_static_alignment',
    organizationId: 'org_static_alignment',
  });
});

test('list query requires organization and engineer', () => {
  const spec = buildEngineerMobileTaskListQuerySpec({
    organizationId: 'org_static_alignment',
    engineerId: 'eng_static_alignment',
  });

  assert.deepEqual(spec.requiredParams, ['organizationId', 'engineerId']);
  assert.equal(spec.params.organizationId, 'org_static_alignment');
  assert.equal(spec.params.engineerId, 'eng_static_alignment');
});

test('migration indexes align with query needs', () => {
  const migration = read(migrationFile);

  assertIncludesAll(migration, [
    'ON engineer_mobile_task_read_models(organization_id, assigned_engineer_id, scheduled_start)',
    'ON engineer_mobile_task_read_models(organization_id, assigned_engineer_id, appointment_id)',
    'ON engineer_mobile_task_read_models(organization_id, case_id)',
    'ON engineer_mobile_task_read_models(organization_id, appointment_id)',
  ]);
});

test('mapper modules import no DB repository provider AI route app or server', () => {
  const listSpecifiers = requireSpecifiers(read(listMapperFile));
  const detailSpecifiers = requireSpecifiers(read(detailMapperFile));
  const combined = [...listSpecifiers, ...detailSpecifiers];

  assert.deepEqual(combined, []);
  assert.equal(combined.some((specifier) => /db|pool|repositories?|transaction|provider|line|sms|email|push|openai|aiProvider|ai_|rag|vector|routes?|controllers?|(^|\/|\.)app($|\.|\/)|(^|\/|\.)server($|\.|\/)/i.test(specifier)), false);
});

test('proposal and migration contain no real-looking credentials or DB URLs', () => {
  const combined = `${read(proposalFile)}\n${read(migrationFile)}`;

  assert.equal(/postgres:\/\/|postgresql:\/\/|mysql:\/\/|mongodb:\/\//i.test(combined), false);
  assert.equal(/sk-[A-Za-z0-9_-]{12,}/.test(combined), false);
  assert.equal(/Bearer\s+[A-Za-z0-9._-]{12,}/i.test(combined), false);
});
