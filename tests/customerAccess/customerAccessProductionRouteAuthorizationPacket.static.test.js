'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');
const TASK_DOC = 'docs/task-917-customer-access-production-route-authorization-packet-no-route-implementation.md';
const STATIC_TEST = 'tests/customerAccess/customerAccessProductionRouteAuthorizationPacket.static.test.js';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function exists(file) {
  return fs.existsSync(path.join(repoRoot, file));
}

function escaped(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('Task917 authorization packet and static guard exist', () => {
  for (const file of [TASK_DOC, STATIC_TEST]) {
    assert.equal(exists(file), true, `${file} should exist`);
  }
});

test('Task917 packet explicitly does not authorize route or runtime implementation', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'does not authorize route implementation',
    'does not authorize public API rollout',
    'does not authorize DB/migration/psql/db:migrate/DDL/SQL',
    'does not authorize auth/session/JWT runtime',
    'requires a separate explicit PM task',
    'No production source files are modified',
    'No route/app/bootstrap/listen file is modified',
    'No runtime behavior changes',
    'No API shape changes',
  ]) {
    assert.match(doc, new RegExp(escaped(phrase), 'i'));
  }
});
test('future route implementation prerequisites and safe response boundaries are recorded', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'Task908 projection service',
    'Task909 handler',
    'Task911 context resolver',
    'Task914 adapter pattern',
    'generic safe-deny',
    'organization isolation',
    'customer-visible allowlist',
    'no existence leakage',
    'no raw phone/address/LINE id',
    'no finalAppointmentId',
    'no internal notes',
    'no raw DB rows',
    'no SQL/stack/token/secret leakage',
  ]) {
    assert.match(doc, new RegExp(escaped(phrase), 'i'));
  }
});

test('future route implementation forbidden mutations and route-mode decision are recorded', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'must not create/approve/publish Field Service Report',
    'must not mutate Case, Appointment, customer identity, provider state, or finalAppointmentId',
    'internal test-only route',
    'authenticated customer portal route',
    'brand/customer channel route',
    'public unauthenticated route',
    'forbidden unless separately justified',
  ]) {
    assert.match(doc, new RegExp(escaped(phrase), 'i'));
  }
});

test('Task917 packet keeps forbidden implementation areas closed', () => {
  const doc = read(TASK_DOC);

  for (const phrase of [
    'No production source change',
    'No src/** modification',
    'No admin/src',
    'No migrations',
    'No route registration',
    'No app/server/bootstrap/listen',
    'No auth/session/JWT runtime',
    'No real DB/repository/transaction',
    'No provider',
    'No AI/RAG runtime',
    'No billing/settlement',
    'No package/env/config/credential',
    'No smoke/shared runtime',
  ]) {
    assert.match(doc, new RegExp(escaped(phrase), 'i'));
  }
});
