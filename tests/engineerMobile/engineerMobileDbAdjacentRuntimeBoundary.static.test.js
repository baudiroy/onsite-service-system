'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const DB_ADJACENT_SOURCE_FILES = [
  'src/engineerMobile/engineerMobileAssignedAppointmentSqlQueryBuilder.js',
  'src/engineerMobile/engineerMobileAssignedAppointmentDbRepository.js',
  'src/engineerMobile/engineerMobileAssignedAppointmentDbRowMapper.js',
  'src/engineerMobile/engineerMobileAssignedAppointmentQueryExecutorGuard.js',
  'src/engineerMobile/engineerMobileWorkbenchReadOnlyModule.js',
];

const SYNTHETIC_ACCEPTANCE_TEST =
  'tests/engineerMobile/engineerMobileWorkbenchDbAdapterSyntheticHttpAcceptance.unit.test.js';

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

function sourcesByPath(paths) {
  return Object.fromEntries(paths.map((relativePath) => [relativePath, read(relativePath)]));
}

test('Task1774 DB-adjacent source and synthetic acceptance files exist', () => {
  for (const file of [...DB_ADJACENT_SOURCE_FILES, SYNTHETIC_ACCEPTANCE_TEST]) {
    assert.equal(fs.existsSync(absolutePath(file)), true, `${file} should exist`);
  }
});

test('DB-adjacent source files do not import DB clients, app, routes, providers, admin, package, or migrations', () => {
  const forbiddenImportPatterns = [
    /^(?:pg|postgres|postgresql|mysql|mysql2|knex|sequelize|prisma|typeorm|mongodb|mssql|sqlite3?)$/i,
    /(?:^|[/.-])(?:dbClient|databaseClient|pool|connection|transaction)(?:$|[/.-])/i,
    /(?:^|[/.-])app(?:$|[/.-])/i,
    /(?:^|[/.-])server(?:$|[/.-])/i,
    /(?:^|[/.-])routes?(?:$|[/.-])/i,
    /migrations?/i,
    /(?:^|[/.-])admin(?:$|[/.-])/i,
    /package(?:-lock)?\.json/i,
    /provider/i,
    /webhook/i,
    /sms/i,
    /email/i,
    /(?:^|[/.-])line(?:$|[/.-])/i,
    /push/i,
    /openai/i,
    /(?:^|[/.-])ai(?:$|[/.-])/i,
    /rag/i,
    /vector/i,
    /billing/i,
    /settlement/i,
  ];

  for (const [file, source] of Object.entries(sourcesByPath(DB_ADJACENT_SOURCE_FILES))) {
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

test('DB-adjacent source files do not read env DB URLs or perform real DB, global mount, provider, or workflow mutation calls', () => {
  const forbiddenSourcePatterns = [
    /process\.env/,
    /\bDATABASE_URL\b/,
    /\bPOSTGRES(?:QL)?_URL\b/,
    /postgres:\/\/|postgresql:\/\/|mysql:\/\/|mongodb:\/\//i,
    /\bnew\s+Pool\b/,
    /\bPool\s*\(/,
    /\bcreatePool\s*\(/,
    /\.connect\s*\(/,
    /\.transaction\s*\(/,
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
    /\bcompleteAppointment\s*\(/i,
    /\bstartTravel\s*\(/i,
    /\barrive(?:AtAppointment)?\s*\(/i,
    /\bupdateAppointment\s*\(/i,
    /\bcreateAppointment\s*\(/i,
    /\bupdateCase\s*\(/i,
  ];

  for (const [file, source] of Object.entries(sourcesByPath(DB_ADJACENT_SOURCE_FILES))) {
    assertNoPattern(source, forbiddenSourcePatterns, file);
  }
});

test('SQL builder stays SELECT-only, parameterized, query-spec-only, and scoped', () => {
  const source = read('src/engineerMobile/engineerMobileAssignedAppointmentSqlQueryBuilder.js');

  assertContainsAll(source, [
    /ASSIGNED_APPOINTMENT_SAFE_SELECTED_FIELDS = Object\.freeze\(\[/,
    /LIST_REQUIRED_PARAMS = Object\.freeze\(\[/,
    /DETAIL_REQUIRED_PARAMS = Object\.freeze\(\[/,
    /'organizationId'/,
    /'engineerUserId'/,
    /'appointmentId'/,
    /SELECT\n\s+em\.appointment_id AS appointment_id,/,
    /FROM engineer_mobile_task_read_models em/,
    /WHERE em\.organization_id = \$1/,
    /AND em\.assigned_engineer_id = \$2/,
    /AND em\.appointment_id = \$3/,
    /executable: false/,
    /Object\.freeze\(spec\.fields\)/,
    /Object\.freeze\(spec\.params\)/,
    /Object\.freeze\(spec\.values\)/,
  ], 'SQL builder');

  assertNoPattern(source, [
    /FROM appointments\b/,
    /JOIN cases\b/,
    /\ba\.organization_id\b/,
    /\ba\.assigned_engineer_id\b/,
    /\ba\.scheduled_start\b/,
    /\ba\.status\b/,
    /\bc\.case_reference\b/,
    /\bc\.customer_display_name\b/,
    /\bINSERT\b/i,
    /\bUPDATE\b/i,
    /\bDELETE\b/i,
    /\bUPSERT\b/i,
    /\bMERGE\b/i,
    /\bALTER\b/i,
    /\bDROP\b/i,
    /\bCREATE\b/i,
    /\bTRUNCATE\b/i,
    /\.query\s*\(/,
    /\bexecute\s*\(/,
  ], 'SQL builder');
});

test('DB repository adapter uses only injected query executor and maps rows before returning', () => {
  const source = read('src/engineerMobile/engineerMobileAssignedAppointmentDbRepository.js');

  assertContainsAll(source, [
    /function resolveExecutor\(queryExecutor\)/,
    /for \(const methodName of \['execute', 'query', 'run'\]\)/,
    /const execute = resolveExecutor\(queryExecutor\)/,
    /await execute\(spec\)/,
    /mapRowsForRepository\(normalizeRows\(await execute\(spec\)\), detail\)/,
    /mapAssignedAppointmentDetailDbRow/,
    /mapAssignedAppointmentListDbRow/,
    /SAFE_REPOSITORY_ADAPTER_ERROR_MESSAGE/,
    /query_executor_unavailable/,
    /missing_query_executor/,
  ], 'DB repository adapter');

  assertNoPattern(source, [
    /require\(['"](?:pg|postgres|postgresql|mysql|mysql2|knex|sequelize|prisma|typeorm)['"]\)/i,
    /\bnew\s+Pool\b/,
    /\.query\s*\(/,
    /process\.env/,
    /DATABASE_URL/,
  ], 'DB repository adapter');
});

test('DB row mapper remains pure allowlist mapping and strips forbidden DB fields', () => {
  const source = read('src/engineerMobile/engineerMobileAssignedAppointmentDbRowMapper.js');

  assertContainsAll(source, [
    /function mapAssignedAppointmentDbRow\(row\)/,
    /const mapped = \{\n\s+appointmentId,/,
    /assignIfPresent\(mapped, 'caseReference'/,
    /assignIfPresent\(mapped, 'customerDisplayName'/,
    /assignIfPresent\(mapped, 'locationLabel'/,
    /assignIfPresent\(mapped, 'publicCustomerNotes'/,
    /assignIfPresent\(mapped, 'checklistPreview'/,
    /return Object\.freeze\(mapped\)/,
  ], 'DB row mapper');

  assertNoPattern(source, [
    /\bfinalAppointmentId\b/,
    /\bfinal_appointment_id\b/,
    /\brawPhone\b/,
    /\braw_phone\b/,
    /\brawAddress\b/,
    /\braw_address\b/,
    /\binternal_notes?\b/i,
    /\brawSql\b/,
    /\braw_sql\b/,
    /\brawDbRow\b/,
    /\braw_db_row\b/,
    /\bproviderPayload\b/,
    /\bprovider_payload\b/,
    /\btoken\b/i,
    /\bcookie\b/i,
    /\bpassword\b/i,
    /\bsecret\b/i,
    /\bauthorization\b/i,
    /\bstack\b/i,
  ], 'DB row mapper');
});

test('query executor guard rejects unsafe SQL, raw SQL strings, unsafe intent, and unsafe metadata', () => {
  const source = read('src/engineerMobile/engineerMobileAssignedAppointmentQueryExecutorGuard.js');

  assertContainsAll(source, [
    /UNSAFE_SQL_VERBS = Object\.freeze\(\[/,
    /'INSERT'/,
    /'UPDATE'/,
    /'DELETE'/,
    /'ALTER'/,
    /'DROP'/,
    /function sanitizedQuerySpec\(querySpec\)/,
    /typeof querySpec\.sql === 'string' && querySpec\.name === undefined/,
    /!sqlIsSelectOnly\(querySpec\.sql\)/,
    /!fieldsMatchContract\(querySpec\.fields\)/,
    /!valuesMatchContract\(querySpec\.values, contract\)/,
    /normalizeIntent\(querySpec, contract\)/,
    /safeParamsForContract\(querySpec\.params, contract\)/,
    /Object\.freeze\(\{\n\s+executable: false,/,
    /reason: execute \? 'unsafe_query_spec' : 'missing_delegate_executor'/,
  ], 'query executor guard');

  assertNoPattern(source, [
    /\.query\s*\(/,
    /process\.env/,
    /DATABASE_URL/,
    /raw session/i,
    /raw user/i,
  ], 'query executor guard');
});

test('Workbench module uses DB adapter and query executor guard only through opt-in injected options', () => {
  const source = read('src/engineerMobile/engineerMobileWorkbenchReadOnlyModule.js');

  assertContainsAll(source, [
    /createEngineerMobileAssignedAppointmentQueryExecutorGuard/,
    /createEngineerMobileAssignedAppointmentDbRepository/,
    /function assignedAppointmentQueryExecutorFrom\(options\)/,
    /'assignedAppointmentQueryExecutor'/,
    /'assignedAppointmentDbQueryExecutor'/,
    /'queryExecutor'/,
    /function guardedAssignedAppointmentQueryExecutorFrom\(options\)/,
    /options\.useQueryExecutorGuard !== true && options\.queryExecutorGuardEnabled !== true/,
    /delegateExecutor: queryExecutor/,
    /queryExecutorGuardAuditLogger/,
    /assignedAppointmentQueryExecutorGuardAuditLogger/,
    /function assignedAppointmentDbRepositoryFrom\(options\)/,
    /queryExecutor,/,
    /useRepositoryGuard/,
    /repositoryGuardEnabled/,
  ], 'Workbench guarded DB adapter integration');

  assertNoPattern(source, [
    /process\.env/,
    /DATABASE_URL/,
    /\.query\s*\(/,
    /\.listen\s*\(/,
    /require\(['"](?:\.\.\/)?(?:app|server|routes)/,
  ], 'Workbench module');
});

test('synthetic HTTP acceptance keeps guarded query executor coverage and no-mutation assertions', () => {
  const source = read(SYNTHETIC_ACCEPTANCE_TEST);

  assertContainsAll(source, [
    /useQueryExecutorGuard: true/,
    /queryExecutorGuardAuditLogger/,
    /assertSafeQuerySpec/,
    /assert\.match\(querySpec\.intent, \/\^engineerMobileAssignedAppointments\\\.readOnly\//,
    /assert\.equal\(querySpec\.fields\.includes\('final_appointment_id'\), false\)/,
    /assert\.equal\(querySpec\.fields\.includes\('raw_phone'\), false\)/,
    /assert\.equal\(querySpec\.fields\.includes\('raw_address'\), false\)/,
    /assert\.deepEqual\(queryExecutor\.mutationCalls, \[\]\)/,
    /assert\.deepEqual\(app\.calls\.listen, \[\]\)/,
    /engineerMobile\.assignedAppointmentQueryExecutorGuard\.read/,
    /engineerMobileAssignedAppointments\.readOnlyList/,
    /engineerMobileAssignedAppointments\.readOnlyDetail/,
    /assertNoForbiddenLeak\(queryExecutor\.calls\)/,
    /assertNoForbiddenLeak\(listResponse\.body\)/,
    /assertNoForbiddenLeak\(detailResponse\.body\)/,
  ], 'synthetic HTTP acceptance');

  assertNoPattern(source, [
    /require\(['"]\.\.\/\.\.\/src\/app['"]\)/,
    /require\(['"]\.\.\/\.\.\/src\/server['"]\)/,
    /require\(['"]\.\.\/\.\.\/src\/routes\//,
    /\bchild_process\b/,
    /\bexec(?:File|Sync)?\s*\(/,
    /process\.env\.(?:DATABASE|POSTGRES)_URL/,
  ], 'synthetic HTTP acceptance');
});

test('forbidden field names stay out of DB-adjacent production sources', () => {
  const forbiddenProductionFieldPatterns = [
    /\bfinalAppointmentId\b/,
    /\bfinal_appointment_id\b/,
    /\braw_phone\b/,
    /\braw_address\b/,
    /\braw_sql\b/,
    /\braw_db_row\b/,
    /\binternal_notes?\b/i,
    /\bprovider_payload\b/,
    /\bproviderDebug\b/,
    /\btoken\b/i,
    /\bcookie\b/i,
    /\bpassword\b/i,
    /\bsecret\b/i,
    /\bauthorization\b/i,
  ];

  for (const [file, source] of Object.entries(sourcesByPath(DB_ADJACENT_SOURCE_FILES))) {
    assertNoPattern(source, forbiddenProductionFieldPatterns, file);
  }
});
