'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const proposalPath = path.join(
  repoRoot,
  'docs/design/data-correction-persistence-schema-proposal.md',
);

function readProposal() {
  return fs.readFileSync(proposalPath, 'utf8');
}

function assertIncludesAll(source, values) {
  for (const value of values) {
    assert.equal(source.includes(value), true, `missing ${value}`);
  }
}

test('schema proposal doc exists', () => {
  assert.equal(fs.existsSync(proposalPath), true);
});

test('proposal states no migration and no DB execution authorization', () => {
  const source = readProposal();

  assertIncludesAll(source, [
    'does not authorize a migration',
    'does not connect to a database',
    'does not execute SQL',
    'future migration task must be separately approved',
  ]);
});

test('proposal includes all conceptual table names', () => {
  const source = readProposal();

  assertIncludesAll(source, [
    'data_correction_audit_events',
    'data_correction_contact_logs',
    'data_correction_dispatch_notes',
    'data_correction_engineer_notification_intents',
    'data_correction_appointment_results',
    'data_correction_evidence_refs',
    'data_correction_follow_up_drafts',
    'data_correction_application_records',
  ]);
});

test('proposal includes all common required fields', () => {
  const source = readProposal();

  assertIncludesAll(source, [
    'id',
    'organization_id',
    'case_id',
    'appointment_id',
    'actor_user_id',
    'actor_role',
    'action_type',
    'decision',
    'reason_code',
    'safe_message_key',
    'created_at',
    'safe_metadata',
  ]);
});

test('proposal includes every record type to table mapping', () => {
  const source = readProposal();

  assertIncludesAll(source, [
    'audit -> `data_correction_audit_events`',
    'contact_log -> `data_correction_contact_logs`',
    'dispatch_note -> `data_correction_dispatch_notes`',
    'engineer_notification_intent -> `data_correction_engineer_notification_intents`',
    'appointment_result -> `data_correction_appointment_results`',
    'evidence -> `data_correction_evidence_refs`',
    'follow_up_draft -> `data_correction_follow_up_drafts`',
    'correction_application -> `data_correction_application_records`',
  ]);
});

test('proposal includes sensitive data storage invariants', () => {
  const source = readProposal();

  assertIncludesAll(source, [
    'no raw phone or full phone value storage',
    'no full address storage',
    'no raw LINE user id storage',
    'no token, secret, binding token, access token, channel secret, webhook secret, password, or DB URL storage',
    'no raw `fromValue` or `toValue` storage',
    'no AI raw payload storage',
    'no full request or response dump storage',
  ]);
});

test('proposal includes workflow invariants', () => {
  const source = readProposal();

  assertIncludesAll(source, [
    'no table mutates Case / Appointment / Field Service Report',
    'no table creates a second formal Field Service Report',
    'no table stores or changes `finalAppointmentId`',
    'follow-up draft records do not create formal appointments',
    'appointment result records do not create Field Service Reports',
    'phone changes require a re-verification flow and must not be persisted as a direct overwrite record',
  ]);
});

test('proposal includes organization-scoped conceptual indexes', () => {
  const source = readProposal();

  assertIncludesAll(source, [
    'organization_id, case_id',
    'organization_id, appointment_id',
    'organization_id, action_type',
    'organization_id, created_at',
  ]);
});

test('proposal includes future migration separate authorization boundary', () => {
  const source = readProposal();

  assertIncludesAll(source, [
    'A future migration task must be separate and explicitly approved',
    'rollback plan',
    'no shared DB apply unless separately approved',
    'no `psql` unless separately approved',
    'no secret logging',
    'General "continue", "go ahead", or "do next task" instructions must not be treated as migration approval',
  ]);
});

test('proposal avoids real-looking credential or DB URL examples', () => {
  const source = readProposal();

  assert.doesNotMatch(source, /postgres:\/\/|postgresql:\/\/|mysql:\/\//i);
  assert.doesNotMatch(source, /\bDATABASE_URL\s*=/);
  assert.doesNotMatch(source, /\bLINE_CHANNEL_ACCESS_TOKEN\s*=/);
  assert.doesNotMatch(source, /\bLINE_CHANNEL_SECRET\s*=/);
  assert.doesNotMatch(source, /\bBearer\s+[A-Za-z0-9._-]+/);
  assert.doesNotMatch(source, /\bsk-[A-Za-z0-9]{12,}/);
});
