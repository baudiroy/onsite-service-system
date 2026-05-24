'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createRepairIntakeDraftRepositoryContract,
} = require('../../src/repairIntake/repairIntakeDraftRepositoryContract');
const {
  createRepairIntakeDraftReaderPortAdapter,
} = require('../../src/repairIntake/repairIntakeDraftReaderPortAdapter');

const UNSAFE_ERROR_MESSAGE = [
  'SQL SELECT * FROM unsafe_task1074_table',
  'DATABASE_URL=postgres://unsafe-task1074',
  'phone +886900001074',
  'address unsafe task1074 address',
  'customerName unsafe task1074 customer',
  'lineUserId unsafe_task1074_line',
  'lineAccessToken unsafe_task1074_line_token',
  'finalAppointmentId unsafe_task1074_final',
  'stack trace at unsafe task1074',
].join(' ');

function unsafeInput() {
  return {
    draftId: 'draft_task1074',
    organizationId: 'org_task1074',
    tenantId: 'tenant_task1074',
    requestId: 'req_task1074',
    actorId: 'actor_task1074_top',
    actor: {
      actorId: 'actor_task1074_actor',
      token: 'unsafe actor token',
    },
    context: {
      actorId: 'actor_task1074_context',
      lineUserId: 'unsafe_task1074_line',
    },
    phone: '+886900001074',
    address: 'unsafe task1074 address',
    customerPhone: '+886900001074',
    customerName: 'unsafe task1074 customer',
    lineUserId: 'unsafe_task1074_line',
    lineAccessToken: 'unsafe_task1074_line_token',
    finalAppointmentId: 'unsafe_task1074_final',
    rawRows: [{ phone: '+886900001074' }],
    sql: 'SELECT * FROM unsafe_lookup',
    db: 'unsafe db',
    repository: { unsafe: true },
    stack: 'unsafe stack',
  };
}

function createRawRepository(calls, options = {}) {
  return {
    findDraftForConversion: async (lookup) => {
      calls.push(lookup);

      if (options.throwRead) {
        throw new Error(UNSAFE_ERROR_MESSAGE);
      }

      if (options.rejectRead) {
        return Promise.reject(new Error(UNSAFE_ERROR_MESSAGE));
      }

      if (options.notFound) {
        return null;
      }

      if (options.nonObject) {
        return 'not-object';
      }

      return {
        draftId: 'draft_task1074_result',
        organizationId: 'org_task1074_result',
        tenantId: 'tenant_task1074_result',
        status: 'ready',
        source: 'repair_intake',
        sourceRef: 'source_task1074',
        intakeSource: 'manual',
        summary: {
          title: 'safe task1074 draft summary',
          phone: '+886900001074',
        },
        metadata: {
          safeKey: 'safe metadata',
          rawRows: [{ phone: '+886900001074' }],
        },
        warnings: ['safe warning', '', 42],
        raw: { phone: '+886900001074' },
        rawRow: { address: 'unsafe task1074 raw address' },
        rawRows: [{ customerPhone: '+886900001074' }],
        sql: 'SELECT * FROM unsafe_result',
        query: 'SELECT unsafe query',
        paramsSql: ['unsafe param'],
        db: 'unsafe db',
        databaseUrl: 'postgres://unsafe-task1074',
        DATABASE_URL: 'postgres://unsafe-task1074-uppercase',
        authorization: 'Bearer unsafe',
        cookie: 'unsafe cookie',
        headers: { authorization: 'Bearer unsafe' },
        phone: '+886900001074',
        address: 'unsafe task1074 address',
        customerPhone: '+886900001074',
        customerName: 'unsafe task1074 customer',
        lineUserId: 'unsafe_task1074_line',
        lineAccessToken: 'unsafe_task1074_line_token',
        finalAppointmentId: 'unsafe_task1074_final',
        stack: 'unsafe task1074 stack',
        error: new Error(UNSAFE_ERROR_MESSAGE),
        repository: { unsafe: true },
        connection: { unsafe: true },
      };
    },
  };
}

function createInjectedChain(calls, repositoryOptions) {
  const repositoryContract = createRepairIntakeDraftRepositoryContract({
    draftRepository: createRawRepository(calls, repositoryOptions),
  });

  const draftReader = createRepairIntakeDraftReaderPortAdapter({
    draftRepository: repositoryContract,
  });

  return { draftReader, repositoryContract };
}

function assertNoUnsafeText(value) {
  const serialized = JSON.stringify(value);

  for (const forbidden of [
    'SELECT *',
    'unsafe_task1074_table',
    'unsafe_lookup',
    'unsafe_result',
    'unsafe query',
    'unsafe param',
    'DATABASE_URL',
    'databaseUrl',
    'postgres://',
    '+886900001074',
    'unsafe task1074 address',
    'unsafe task1074 customer',
    'unsafe_task1074_line',
    'unsafe_task1074_line_token',
    'unsafe_task1074_final',
    'unsafe task1074 stack',
    'stack trace',
    'Bearer unsafe',
    'unsafe cookie',
    'unsafe task1074 raw address',
    'unsafe actor token',
    'rawRows',
    'rawRow',
    'raw',
    'sql',
    'query',
    'paramsSql',
    'db',
    'authorization',
    'cookie',
    'headers',
    'phone',
    'address',
    'customerPhone',
    'customerName',
    'lineUserId',
    'lineAccessToken',
    'finalAppointmentId',
    'stack',
    'error',
    'repository',
    'connection',
    'token',
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }
}

function stripTestBlock(source, testName) {
  const marker = `test('${testName}'`;
  const start = source.indexOf(marker);

  if (start === -1) {
    return source;
  }

  const firstBrace = source.indexOf('{', start);

  if (firstBrace === -1) {
    return source;
  }

  let depth = 0;

  for (let index = firstBrace; index < source.length; index += 1) {
    const char = source[index];

    if (char === '{') {
      depth += 1;
    }

    if (char === '}') {
      depth -= 1;

      if (depth === 0) {
        const blockEnd = source.indexOf(');', index);
        const end = blockEnd === -1 ? index + 1 : blockEnd + 2;

        return `${source.slice(0, start)}${source.slice(end)}`;
      }
    }
  }

  return source;
}

test('contract can back draftReader success path without forwarding unsafe lookup or result fields', async () => {
  const calls = [];
  const { draftReader } = createInjectedChain(calls);

  const result = await draftReader.getDraftForConversion(unsafeInput());

  assert.deepEqual(calls, [
    {
      draftId: 'draft_task1074',
      organizationId: 'org_task1074',
      tenantId: 'tenant_task1074',
      requestId: 'req_task1074',
      actorId: 'actor_task1074_top',
    },
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.id, 'draft_task1074_result');
  assert.equal(result.draftId, 'draft_task1074_result');
  assert.equal(result.organizationId, 'org_task1074_result');
  assert.equal(result.tenantId, 'tenant_task1074_result');
  assert.equal(result.status, 'ready');
  assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_DRAFT_READY');
  assert.deepEqual(result.summary, { title: 'safe task1074 draft summary' });
  assertNoUnsafeText(calls);
  assertNoUnsafeText(result);
});

test('contract not-found envelope remains sanitized when consumed by draftReader', async () => {
  for (const repositoryOptions of [{ notFound: true }, { nonObject: true }]) {
    const calls = [];
    const { draftReader } = createInjectedChain(calls, repositoryOptions);

    const result = await draftReader.getDraftForConversion(unsafeInput());

    assert.equal(calls.length, 1);
    assert.equal(result.status, 'not_found');
    assert.equal(
      result.reasonCode,
      'REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_DRAFT_NOT_FOUND',
    );
    assert.deepEqual(result.requiredActions, ['verify_draft_exists']);
    assertNoUnsafeText(calls);
    assertNoUnsafeText(result);
  }
});

test('contract read failure envelope remains sanitized when raw repository throws or rejects', async () => {
  for (const repositoryOptions of [{ throwRead: true }, { rejectRead: true }]) {
    const calls = [];
    const { draftReader } = createInjectedChain(calls, repositoryOptions);

    const result = await draftReader.getDraftForConversion(unsafeInput());

    assert.equal(calls.length, 1);
    assert.equal(result.status, 'failed');
    assert.equal(result.reasonCode, 'REPAIR_INTAKE_DRAFT_REPOSITORY_CONTRACT_READ_FAILED');
    assert.deepEqual(result.requiredActions, ['retry_or_manual_review']);
    assertNoUnsafeText(calls);
    assertNoUnsafeText(result);
  }
});

test('integration test source stays limited to contract and draftReader adapter imports', () => {
  const source = require('node:fs').readFileSync(__filename, 'utf8');
  const sourceWithoutSelfCheck = stripTestBlock(
    source,
    'integration test source stays limited to contract and draftReader adapter imports',
  );
  const repairIntakeRequires = Array.from(
    source.matchAll(/require\('\.\.\/\.\.\/src\/repairIntake\/([^']+)'\)/g),
    (match) => match[1],
  );

  assert.deepEqual(repairIntakeRequires, [
    'repairIntakeDraftRepositoryContract',
    'repairIntakeDraftReaderPortAdapter',
  ]);

  for (const forbidden of [
    "require('../../src/repositories",
    "require('../../src/db",
    "require('../../src/routes",
    "require('../../src/controllers",
    "require('../../src/app",
    "require('../../src/server",
    'app.listen',
    'server.listen',
    'fetch(',
    'axios',
    'process.env',
    'sendLine',
    'sendSms',
    'sendEmail',
    'openai',
    'vector',
    'billing',
    'invoice',
    'payment',
  ]) {
    assert.equal(
      sourceWithoutSelfCheck.includes(forbidden),
      false,
      `forbidden integration source marker ${forbidden}`,
    );
  }
});
