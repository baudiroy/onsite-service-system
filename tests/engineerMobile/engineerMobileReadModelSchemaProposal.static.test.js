'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const proposalFile = path.join(repoRoot, 'docs/design/engineer-mobile-read-model-schema-proposal.md');

function readProposal() {
  return fs.readFileSync(proposalFile, 'utf8');
}

function assertIncludesAll(source, values) {
  for (const value of values) {
    assert.equal(source.includes(value), true, `missing ${value}`);
  }
}

test('proposal doc exists', () => {
  assert.equal(fs.existsSync(proposalFile), true);
});

test('status says no migration and no DB execution', () => {
  const source = readProposal();

  assertIncludesAll(source, [
    'Status: read model schema proposal / no migration / no DB execution.',
    'does not authorize migration',
    'DB connection',
    'SQL execution',
  ]);
});

test('proposed source concepts are present', () => {
  const source = readProposal();

  assertIncludesAll(source, [
    'cases',
    'appointments',
    'dispatch assignments / engineer assignment source',
    'customers / masked customer contact projection',
    'repair intake / product issue summary',
  ]);
});

test('required read model fields are present', () => {
  const source = readProposal();

  assertIncludesAll(source, [
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
    'service_summary',
    'site_note_safe',
    'checklist_summary',
    'evidence_refs',
  ]);
});

test('forbidden fields section includes raw identity secrets and final appointment fields', () => {
  const source = readProposal();

  assertIncludesAll(source, [
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
  ]);
});

test('organization scope invariant is present', () => {
  const source = readProposal();

  assertIncludesAll(source, [
    'Every read model row must include `organization_id`.',
    'List queries must be organization-scoped and engineer-assigned.',
    'Detail queries must be organization-scoped, engineer-assigned, and appointment-specific.',
  ]);
});

test('assigned engineer invariant is present', () => {
  const source = readProposal();

  assertIncludesAll(source, [
    'Every engineer-visible task row must include `assigned_engineer_id`.',
    'engineer-assigned',
  ]);
});

test('appointmentId detail invariant is present', () => {
  const source = readProposal();

  assertIncludesAll(source, [
    '`appointment_id` is required for detail query.',
    'appointment-specific',
  ]);
});

test('masked contact and safe address invariants are present', () => {
  const source = readProposal();

  assertIncludesAll(source, [
    'Customer contact fields must be masked or summarized only.',
    'Address fields must be safe summaries only.',
  ]);
});

test('read-only no Case Appointment FSR mutation invariant is present', () => {
  const source = readProposal();

  assertIncludesAll(source, [
    'read-only',
    'must not mutate Case, Appointment, or Field Service Report data',
  ]);
});

test('task detail is not FSR invariant is present', () => {
  const source = readProposal();

  assertIncludesAll(source, [
    'Task detail is not a Field Service Report.',
    'Task detail route must not expose `finalAppointmentId`.',
  ]);
});

test('query boundary executable false placeholder and no interpolation are present', () => {
  const source = readProposal();

  assertIncludesAll(source, [
    'executable:false',
    'placeholders',
    'must not interpolate raw values',
    'must not request forbidden fields',
  ]);
});

test('future DB execution separate authorization is present', () => {
  const source = readProposal();

  assertIncludesAll(source, [
    'future DB execution requires separate authorization',
    'shared DB and production DB access are forbidden without an explicit task',
    'migration apply or dry-run is forbidden without an explicit DB approval packet',
  ]);
});

test('conceptual indexes are present', () => {
  const source = readProposal();

  assertIncludesAll(source, [
    '`organization_id`, `assigned_engineer_id`, `scheduled_start`',
    '`organization_id`, `assigned_engineer_id`, `appointment_id`',
    '`organization_id`, `case_id`',
  ]);
});

test('Task692 Task709 and Task713 references are present', () => {
  const source = readProposal();

  assertIncludesAll(source, [
    'Task692',
    'Task709',
    'Task713',
  ]);
});

test('no real-looking credential or DB URL examples are present', () => {
  const source = readProposal();

  assert.equal(/postgres:\/\/|postgresql:\/\/|mysql:\/\/|mongodb:\/\//i.test(source), false);
  assert.equal(/sk-[A-Za-z0-9_-]{12,}/.test(source), false);
  assert.equal(/Bearer\s+[A-Za-z0-9._-]{12,}/i.test(source), false);
});
