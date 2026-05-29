'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  route: 'src/routes/customerAccessRoutes.js',
  projectionHandler: 'src/customerAccess/customerServiceReportProjectionHandler.js',
  projectionService: 'src/customerAccess/customerServiceReportProjectionService.js',
  auditBoundary: 'src/customerAccess/customerServiceReportAuditBoundary.js',
  identityLinkResolver: 'src/customerAccess/customerIdentityLinkResolver.js',
  doc: 'docs/task-1885-customer-facing-report-runtime-hardening.md',
});

const runtimeBoundaryFiles = [
  FILES.route,
  FILES.projectionHandler,
  FILES.projectionService,
  FILES.auditBoundary,
  FILES.identityLinkResolver,
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
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

test('Task1885 runtime hardening files exist', () => {
  for (const file of Object.values(FILES)) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }
});

test('customer-facing report route keeps app-level 404 safe-deny and requestId audit boundary', () => {
  const route = read(FILES.route);
  const auditBoundary = read(FILES.auditBoundary);

  assert.match(route, /CUSTOMER_ACCESS_REPORT_ROUTE_PATH = '\/customer-access\/:caseId\/service-report\/:reportId'/);
  assert.match(route, /status\(404\)\.json\(SAFE_DENY_ENVELOPE\)/);
  assert.match(route, /buildServiceReportProjectionResponse/);
  assert.match(route, /catch \(error\) \{\s*return \{\s*statusCode: 404,\s*body: SAFE_DENY_ENVELOPE,\s*\};\s*\}/);
  assert.match(route, /recordAccessAudit\(req, response\.body\)/);
  assert.match(auditBoundary, /const requestId = identifierFrom\(request\.requestId, context\.requestId, input\.requestId\);/);
});

test('runtime boundary imports remain narrow and do not add DB migration provider AI or billing dependencies', () => {
  for (const file of runtimeBoundaryFiles) {
    const source = read(file);
    const serializedSpecifiers = JSON.stringify(requireSpecifiers(source));

    assert.doesNotMatch(serializedSpecifiers, /(^|[/"'])pg($|[/"'])|knex|sequelize|prisma|migrations?|provider|openai|rag|billing|stripe|line|sms|email/i, file);
    assert.doesNotMatch(source, /process\.env|DATABASE_URL|JWT_SECRET|new Pool|createPool|psql|npm run db|db:migrate|db:seed/i, file);
    assert.doesNotMatch(source, /fetch\(|axios|http\.request|https\.request|app\.listen|express\s*\(/i, file);
  }
});

test('customer-facing report runtime boundary cannot create publish or mutate operational records', () => {
  for (const file of runtimeBoundaryFiles) {
    const source = read(file);

    assert.doesNotMatch(source, /\binsert\s*\(|\bupdate\s*\(|\bdelete\s*\(|\bupsert\s*\(|\btransaction\b/i, file);
    assert.doesNotMatch(source, /create.*(CompletionReport|FieldServiceReport)|fieldServiceReport\s*=|completionReport\s*=/i, file);
    assert.doesNotMatch(source, /finalAppointmentId\s*=|caseStatus\s*=|appointmentStatus\s*=|publish\s*\(|revoke\s*\(/i, file);
    assert.doesNotMatch(source, /send(Line|Sms|SMS|Email|Webhook)|provider sending|billing event|createSettlement|runSettlement|\bsettlement\b/i, file);
  }
});

test('projection output allowlist does not expose raw internal DTO fields', () => {
  const projectionService = read(FILES.projectionService);

  assert.match(projectionService, /CUSTOMER_SERVICE_REPORT_RESPONSE_KEYS = Object\.freeze\(\[/);
  assert.match(projectionService, /CUSTOMER_PUBLIC_ATTACHMENT_RESPONSE_KEYS = Object\.freeze\(\[/);
  assert.match(projectionService, /SERVICE_INPUT_IDENTIFIER_KEYS = Object\.freeze\(\['caseId', 'reportId'\]\)/);
  assert.match(projectionService, /function isPlainProjectionRow\(value\)/);
  assert.match(projectionService, /const CUSTOMER_ACCESS_CONTEXT_KEYS = Object\.freeze/);
  assert.match(projectionService, /function serviceInputIdentifierValue\(value\)/);
  assert.match(projectionService, /function serviceInputIdentifiers\(options\)/);
  assert.match(projectionService, /function serviceInputScope\(options\)/);
  assert.match(projectionService, /function customerAccessContextScope\(context\)/);
  assert.match(projectionService, /function customerAccessContextIdentifierValue\(value\)/);
  assert.match(projectionService, /function customerServiceReportResponseAllowlist\(candidate\)/);
  assert.match(projectionService, /function customerPublicAttachmentResponseAllowlist\(candidate\)/);
  assert.match(projectionService, /function rowsFromResult\(result\)/);
  assert.match(projectionService, /if \(!isPlainObject\(result\)\) \{\s*return undefined;\s*\}/);
  assert.match(projectionService, /if \(!Array\.isArray\(result\.rows\)\) \{\s*return undefined;\s*\}/);
  assert.match(projectionService, /context\[key\] !== true/);
  assert.match(projectionService, /!hasOnlyCustomerAccessContextKeys\(context\)/);
  assert.match(projectionService, /for \(const key of SERVICE_INPUT_IDENTIFIER_KEYS\)/);
  assert.match(projectionService, /contextScope\.caseId !== identifiers\.caseId/);
  assert.match(projectionService, /const scope = serviceInputScope\(options\)/);
  assert.match(projectionService, /if \(!Array\.isArray\(rows\) \|\| rows\.length !== 1\) \{\s*return buildSafeDenyEnvelope\(\);\s*\}/);
  assert.match(projectionService, /serviceReport: allowlistedServiceReport/);
  assert.match(projectionService, /serviceReport\.customerReportReference = customerReportReference/);
  assert.match(projectionService, /serviceReport\.serviceSummary = serviceSummary/);
  assert.match(projectionService, /function isValidDateParts\(year, month, day\)/);
  assert.match(projectionService, /function completionTimeValue\(value\)/);
  assert.match(projectionService, /if \(!isPlainProjectionRow\(row\)\) \{\s*return undefined;\s*\}/);
  assert.match(projectionService, /if \(!isPlainProjectionRow\(row\)\) \{\s*return false;\s*\}/);
  assert.match(projectionService, /const completionTime = completionTimeValue\(rowValue\(row,\s*'completion_time'\)\)/);
  assert.match(projectionService, /const attachmentId = identifierValue\(value\.attachmentId \|\| value\.attachment_id \|\| value\.publicAttachmentId\)/);
  assert.match(projectionService, /return customerPublicAttachmentResponseAllowlist\(attachment\)/);
  assert.match(projectionService, /rowValue\(row,\s*'approved_service_summary'\)/);
  assert.doesNotMatch(projectionService, /if \(Array\.isArray\(result\)\)/);
  assert.doesNotMatch(projectionService, /rows\.find\(/);
  assert.doesNotMatch(
    projectionService,
    /rowValue\(row,\s*'serviceSummary',\s*'service_summary',\s*'approved_service_summary'\)/,
  );
  assert.doesNotMatch(
    projectionService,
    /completionTimeValue\(rowValue\(row,\s*'completionTime'|completionTimeValue\(rowValue\(row,[^)]*'completed_at'|rowValue\(row,[^)]*'created_at'|rowValue\(row,[^)]*'updated_at'|rowValue\(row,[^)]*'published_at'/,
  );
  assert.doesNotMatch(
    projectionService,
    /serviceReport\.(finalAppointmentId|internalNote|providerRawPayload|rawCasePayload|rawCompletionReport|sql|stack|token)\s*=/,
  );
  assert.doesNotMatch(
    projectionService,
    /serviceReport\s*=\s*(?:row|candidate|result|serviceResult)|Object\.assign\(\s*serviceReport\s*,\s*(?:row|candidate|result|serviceResult)\s*\)|\.\.\.\s*(?:row|candidate|result|serviceResult)/,
  );
  assert.doesNotMatch(
    projectionService,
    /Object\.assign\(\s*attachment\s*,\s*value\s*\)|\{\s*\.\.\.\s*value|serviceReport\.publicAttachments\s*=\s*row\.publicAttachments/,
  );
});

test('projection HTTP boundary validates service envelopes before serialization', () => {
  const projectionHandler = read(FILES.projectionHandler);

  assert.match(projectionHandler, /function safeHttpEnvelopeFromServiceResult\(serviceResult\)/);
  assert.match(projectionHandler, /function isSafeAllowEnvelope\(envelope\)/);
  assert.match(projectionHandler, /function isSafeDenyEnvelope\(envelope\)/);
  assert.match(projectionHandler, /function invokeProjectionService\(projectionService, input\)/);
  assert.match(projectionHandler, /const HTTP_ENVELOPE_KEYS = Object\.freeze/);
  assert.match(projectionHandler, /const SERVICE_REPORT_KEYS = Object\.freeze/);
  assert.match(projectionHandler, /const PUBLIC_ATTACHMENT_KEYS = Object\.freeze/);
  assert.match(projectionHandler, /isThenable\(serviceResult\)/);
  assert.match(projectionHandler, /envelope = safeDenyEnvelope\(\);/);
  assert.match(projectionHandler, /envelope = safeHttpEnvelopeFromServiceResult\(serviceResult\);/);
  assert.doesNotMatch(
    projectionHandler,
    /body:\s*serviceResult|body:\s*result|body:\s*raw|json\(serviceResult\)|json\(result\)|\.\.\.\s*serviceResult|\.\.\.\s*result/,
  );
});

test('projection HTTP boundary builds an explicit service input allowlist', () => {
  const projectionHandler = read(FILES.projectionHandler);

  assert.match(projectionHandler, /const SERVICE_INPUT_KEYS = Object\.freeze\(\['caseId', 'customerAccessContext', 'dbClient', 'reportId'\]\)/);
  assert.match(projectionHandler, /const CUSTOMER_ACCESS_CONTEXT_KEYS = Object\.freeze/);
  assert.match(projectionHandler, /function safeIdentifierValue\(value\)/);
  assert.match(projectionHandler, /function sanitizedCustomerAccessContextFromRequest\(request\)/);
  assert.match(projectionHandler, /function buildProjectionServiceInput\(options\)/);
  assert.match(projectionHandler, /const serviceInput = buildProjectionServiceInput\(options\)/);
  assert.match(projectionHandler, /invokeProjectionService\(projectionService, serviceInput\)/);
  assert.doesNotMatch(
    projectionHandler,
    /invokeProjectionService\(projectionService,\s*\{\s*request|projectionService\(\s*request|projectionService\(\s*req|customerAccessContext:\s*request\.customerAccessContext/,
  );
});

test('Task1885 documentation records no DB migration deploy smoke provider AI billing or publication mutation scope', () => {
  const doc = read(FILES.doc);

  assert.match(doc, /No DB/);
  assert.match(doc, /No migration/);
  assert.match(doc, /No deploy/);
  assert.match(doc, /No smoke/);
  assert.match(doc, /No provider sending/);
  assert.match(doc, /No AI\/RAG/);
  assert.match(doc, /No billing\/settlement/);
  assert.match(doc, /No Completion Report \/ Field Service Report creation/);
  assert.match(doc, /No finalAppointmentId mutation/);
  assert.match(doc, /No customer-visible publication mutation/);
});
