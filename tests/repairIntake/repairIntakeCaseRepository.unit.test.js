'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  RepairIntakeCaseRepositoryError,
  createRepairIntakeCaseRepository,
} = require('../../src/repairIntake/repairIntakeCaseRepository');

function hasMarker(value, marker) {
  return JSON.stringify(value).includes(marker);
}

test('factory rejects missing or invalid injected case creation dependency', () => {
  assert.throws(
    () => createRepairIntakeCaseRepository(),
    RepairIntakeCaseRepositoryError,
  );

  assert.throws(
    () => createRepairIntakeCaseRepository({ caseCreationPort: { createCaseFromDraft: null } }),
    /REPAIR_INTAKE_CASE_REPOSITORY_CASE_CREATION_DEPENDENCY_REQUIRED/,
  );
});

test('invalid input fails before calling the injected dependency', async () => {
  let calls = 0;
  const repository = createRepairIntakeCaseRepository({
    caseCreationPort: {
      async createCaseFromDraft() {
        calls += 1;
        return { caseId: 'case-should-not-happen' };
      },
    },
  });

  const result = await repository.createCaseFromDraft({ draft: { draftId: 'draft-1' } });

  assert.equal(calls, 0);
  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_INPUT_INVALID');
});

test('valid input calls injected dependency exactly once with sanitized creation input', async () => {
  const calls = [];
  const repository = createRepairIntakeCaseRepository({
    caseCreationPort: {
      async createCaseFromDraft(input) {
        calls.push(input);
        return {
          caseId: 'case-1',
          caseRef: { caseId: 'case-1', displayId: 'CASE-1', rawRow: { secret: 'nope' } },
          draftId: input.draftId,
          organizationId: input.organizationId,
          tenantId: input.tenantId,
          requestId: input.requestId,
          actorId: input.actorId,
          status: 'created',
          summary: { safe: true, customerPhone: '0900', query: 'unsafe result query' },
          metadata: { source: 'repair-intake', token: 'secret-token' },
          warnings: ['review-note'],
          finalAppointmentId: 'appt-1',
          sql: 'select secret',
          stack: 'hidden-stack',
        };
      },
    },
  });

  const result = await repository.createCaseFromDraft({
    draft: {
      draftId: 'draft-1',
      id: 'draft-row-1',
      organizationId: 'org-1',
      tenantId: 'tenant-1',
      source: 'line',
      rawDraft: { token: 'secret' },
      address: 'hidden address',
      query: { unsafe: true },
      finalAppointmentId: 'appt-hidden',
    },
    plan: {
      status: 'ready',
      candidate: {
        sourceDraftId: 'draft-1',
        organizationId: 'org-1',
      },
      query: 'unsafe plan query',
      rawPlan: { sql: 'select *' },
    },
    context: {
      requestId: 'req-1',
      actorId: 'actor-1',
    },
    authorization: 'bearer secret',
    customerName: 'hidden customer',
    phone: 'hidden phone',
    query: 'unsafe top-level query',
  });

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    draft: {
      draftId: 'draft-1',
      id: 'draft-row-1',
      organizationId: 'org-1',
      tenantId: 'tenant-1',
      source: 'line',
    },
    plan: {
      status: 'ready',
      candidate: {
        sourceDraftId: 'draft-1',
        organizationId: 'org-1',
      },
    },
    draftId: 'draft-1',
    sourceDraftId: 'draft-1',
    organizationId: 'org-1',
    tenantId: 'tenant-1',
    requestId: 'req-1',
    actorId: 'actor-1',
    metadata: {},
    warnings: [],
  });

  assert.equal(result.ok, true);
  assert.equal(result.caseId, 'case-1');
  assert.equal(result.caseRef.caseId, 'case-1');
  assert.equal(result.draftId, 'draft-1');
  assert.equal(result.sourceDraftId, 'draft-1');
  assert.equal(result.organizationId, 'org-1');
  assert.equal(result.tenantId, 'tenant-1');
  assert.equal(result.requestId, 'req-1');
  assert.equal(result.actorId, 'actor-1');
  assert.deepEqual(result.metadata, { source: 'repair-intake' });
  assert.deepEqual(result.warnings, ['review-note']);

  for (const marker of [
    'finalAppointmentId',
    'customerPhone',
    'customerName',
    'phone',
    'query',
    'address',
    'authorization',
    'rawDraft',
    'rawPlan',
    'rawRow',
    'sql',
    'stack',
    'token',
  ]) {
    assert.equal(hasMarker(calls[0], marker), false, `delegated input leaked ${marker}`);
    assert.equal(hasMarker(result, marker), false, `result leaked ${marker}`);
  }
});

test('null or non-object dependency result fails closed', async () => {
  const repository = createRepairIntakeCaseRepository({
    caseService: {
      async createCaseFromDraft() {
        return null;
      },
    },
  });

  const result = await repository.createCaseFromDraft({
    draft: { draftId: 'draft-2', organizationId: 'org-2' },
    plan: { status: 'ready' },
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CREATE_FAILED');
  assert.equal(result.draftId, 'draft-2');
  assert.equal(result.organizationId, 'org-2');
});

test('thrown or rejected dependency error is sanitized', async () => {
  const repository = createRepairIntakeCaseRepository({
    caseRepository: {
      async createCaseFromDraft() {
        throw new Error('secret DATABASE_URL token stack phone raw sql');
      },
    },
  });

  const result = await repository.createCaseFromDraft({
    draft: { draftId: 'draft-3', organizationId: 'org-3' },
    plan: { status: 'ready' },
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_CASE_REPOSITORY_CREATE_FAILED');

  for (const marker of ['DATABASE_URL', 'secret', 'token', 'stack', 'phone', 'raw', 'sql']) {
    assert.equal(hasMarker(result, marker), false, `failure leaked ${marker}`);
  }
});

test('source has no forbidden imports or runtime markers', () => {
  const sourcePath = path.join(__dirname, '../../src/repairIntake/repairIntakeCaseRepository.js');
  const source = fs.readFileSync(sourcePath, 'utf8');
  const sourceWithoutDenyList = source.replace(
    /const UNSAFE_FIELD_NAMES = new Set\(\[[\s\S]*?\]\);\n\n/,
    '',
  );

  for (const marker of [
    'require(',
    '../repositories',
    '../db',
    'process.env',
    'DATABASE_URL',
    'provider',
    'admin',
    'billing',
  ]) {
    assert.equal(sourceWithoutDenyList.includes(marker), false, `source contains forbidden marker ${marker}`);
  }

  assert.equal(/\bAI\b/.test(sourceWithoutDenyList), false, 'source contains forbidden AI marker');
});
