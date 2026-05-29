'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const FILES = Object.freeze({
  route: 'src/routes/customerAccessRoutes.js',
  customerAccessController: 'src/controllers/customerAccessController.js',
  customerAccessContextMiddleware: 'src/customerAccess/customerAccessContextMiddleware.js',
  customerAccessHttpContextAdapter: 'src/customerAccess/customerAccessHttpContextAdapter.js',
  projectionHandler: 'src/customerAccess/customerServiceReportProjectionHandler.js',
  projectionService: 'src/customerAccess/customerServiceReportProjectionService.js',
  auditBoundary: 'src/customerAccess/customerServiceReportAuditBoundary.js',
  identityLinkResolver: 'src/customerAccess/customerIdentityLinkResolver.js',
  internalTestRouteMount: 'src/customerAccess/customerAccessInternalTestRouteMount.js',
  projectionAppAdapter: 'src/customerAccess/customerServiceReportProjectionAppAdapter.js',
  routeIndex: 'src/routes/index.js',
  publicRoutes: 'src/routes/public.routes.js',
  app: 'src/app.js',
  server: 'src/server.js',
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
  assert.match(projectionService, /function buildQuerySpec\(\{ organizationId, customerId, caseId, reportId \}\)/);
  assert.match(projectionService, /function buildQuerySpec\(\{ organizationId, customerId, caseId, reportId \}\) \{\s*return Object\.freeze\(\{/);
  assert.match(projectionService, /name: 'customerServiceReportProjection',\s*readOnly: true,/);
  assert.match(projectionService, /function customerServiceReportResponseAllowlist\(candidate\)/);
  assert.match(projectionService, /function customerPublicAttachmentResponseAllowlist\(candidate\)/);
  assert.match(projectionService, /function rowsFromResult\(result\)/);
  assert.match(projectionService, /function dbClientQueryFunction\(dbClient\)/);
  assert.match(projectionService, /if \(!isPlainObject\(result\)\) \{\s*return undefined;\s*\}/);
  assert.match(projectionService, /if \(!Array\.isArray\(result\.rows\)\) \{\s*return undefined;\s*\}/);
  assert.match(projectionService, /if \(!isPlainObject\(dbClient\) \|\| typeof dbClient\.then === 'function'\) \{\s*return undefined;\s*\}/);
  assert.match(projectionService, /try \{\s*const query = dbClient\.query;\s*return typeof query === 'function' \? query : undefined;\s*\} catch \(error\) \{\s*return undefined;\s*\}/);
  assert.match(projectionService, /context\[key\] !== true/);
  assert.match(projectionService, /!hasOnlyCustomerAccessContextKeys\(context\)/);
  assert.match(projectionService, /for \(const key of SERVICE_INPUT_IDENTIFIER_KEYS\)/);
  assert.match(projectionService, /contextScope\.caseId !== identifiers\.caseId/);
  assert.match(projectionService, /const scope = serviceInputScope\(options\)/);
  assert.match(projectionService, /values: Object\.freeze\(\[organizationId, customerId, caseId, reportId\]\)/);
  assert.match(projectionService, /const querySpec = buildQuerySpec\(\{\s*organizationId: scope\.organizationId,\s*customerId: scope\.customerId,\s*caseId: scope\.caseId,\s*reportId: scope\.reportId,\s*\}\)/);
  assert.match(projectionService, /if \(!scope\) \{\s*return buildSafeDenyEnvelope\(\);\s*\}\s*const query = dbClientQueryFunction\(dbClient\)/);
  assert.match(projectionService, /const result = await query\.call\(dbClient, querySpec\)/);
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

test('case overview HTTP boundary uses params-only caseId and customerAccessContext DTO', () => {
  const controller = read(FILES.customerAccessController);
  const httpContextAdapter = read(FILES.customerAccessHttpContextAdapter);

  assert.match(controller, /function buildCustomerAccessOverviewInput\(req\)/);
  assert.match(controller, /safeProperty\(request,\s*'customerAccessRouteParams'\)/);
  assert.match(controller, /safeIdentifierValue\(safeProperty\(params,\s*'caseId'\)\)/);
  assert.match(controller, /safeProperty\(request,\s*'customerAccessContext'\)/);
  assert.match(controller, /return \{\s*caseId,\s*customerAccessContext,\s*\};/);
  assert.match(controller, /function safeEnvelopeFromFacadeResult\(facadeResult\)/);
  assert.match(controller, /function safeAllowEnvelopeFromFacadeResult\(facadeResult\)/);
  assert.match(controller, /function isUnsafeDisplayString\(value\)/);
  assert.match(controller, /function isSafeDisplayValue\(value\)/);
  assert.match(controller, /isUnsafeDisplayString\(value\)/);
  assert.match(controller, /const CUSTOMER_VISIBLE_CASE_NO_SOURCE_KEY = 'caseNo'/);
  assert.match(controller, /const CUSTOMER_VISIBLE_FINAL_APPOINTMENT_ID_SOURCE_KEY = 'finalAppointmentId'/);
  assert.match(controller, /const CUSTOMER_VISIBLE_PUBLIC_REPORT_ID_SOURCE_KEY = 'publicReportId'/);
  assert.match(controller, /const SERVICE_REPORT_BASE_RESPONSE_KEYS = Object\.freeze/);
  assert.match(controller, /const CUSTOMER_VISIBLE_STATUS_SOURCE_KEY = 'status'/);
  assert.match(controller, /const CUSTOMER_VISIBLE_SUMMARY_SOURCE_KEY = 'summary'/);
  assert.match(controller, /const SERVICE_REPORT_RESPONSE_KEYS = Object\.freeze/);
  assert.match(controller, /function customerVisibleCaseNoValue\(candidate\)/);
  assert.match(controller, /safeProperty\(candidate,\s*CUSTOMER_VISIBLE_CASE_NO_SOURCE_KEY\)/);
  assert.match(controller, /function customerVisibleFinalAppointmentIdValue\(candidate\)/);
  assert.match(controller, /safeProperty\(candidate,\s*CUSTOMER_VISIBLE_FINAL_APPOINTMENT_ID_SOURCE_KEY\)/);
  assert.match(controller, /function customerVisiblePublicReportIdValue\(candidate\)/);
  assert.match(controller, /safeProperty\(candidate,\s*CUSTOMER_VISIBLE_PUBLIC_REPORT_ID_SOURCE_KEY\)/);
  assert.match(controller, /function customerVisibleStatusValue\(candidate\)/);
  assert.match(controller, /safeProperty\(candidate,\s*CUSTOMER_VISIBLE_STATUS_SOURCE_KEY\)/);
  assert.match(controller, /function customerVisibleSummaryValue\(candidate\)/);
  assert.match(controller, /safeProperty\(candidate,\s*CUSTOMER_VISIBLE_SUMMARY_SOURCE_KEY\)/);
  assert.match(controller, /assignSafeDisplayValue\(\s*serviceReport,\s*CUSTOMER_VISIBLE_CASE_NO_SOURCE_KEY,\s*customerVisibleCaseNoValue\(candidate\),\s*\)/);
  assert.match(controller, /assignSafeDisplayValue\(\s*serviceReport,\s*CUSTOMER_VISIBLE_FINAL_APPOINTMENT_ID_SOURCE_KEY,\s*customerVisibleFinalAppointmentIdValue\(candidate\),\s*\)/);
  assert.match(controller, /assignSafeDisplayValue\(\s*serviceReport,\s*CUSTOMER_VISIBLE_PUBLIC_REPORT_ID_SOURCE_KEY,\s*customerVisiblePublicReportIdValue\(candidate\),\s*\)/);
  assert.match(controller, /assignSafeDisplayValue\(\s*serviceReport,\s*CUSTOMER_VISIBLE_STATUS_SOURCE_KEY,\s*customerVisibleStatusValue\(candidate\),\s*\)/);
  assert.match(controller, /assignSafeDisplayValue\(\s*serviceReport,\s*CUSTOMER_VISIBLE_SUMMARY_SOURCE_KEY,\s*customerVisibleSummaryValue\(candidate\),\s*\)/);
  assert.match(controller, /overviewInput = buildCustomerAccessOverviewInput\(req\)/);
  assert.match(controller, /if \(!overviewInput\) \{\s*return safeDenyEnvelope\(\);\s*\}/);
  assert.match(controller, /const facadeResult = facade\(overviewInput\)/);
  assert.match(controller, /envelope = safeEnvelopeFromFacadeResult\(facadeResult\)/);
  assert.match(controller, /catch \(error\) \{\s*envelope = safeDenyEnvelope\(\);\s*\}/);
  assert.match(controller, /function recordCaseOverviewAudit\(\{ auditWriter, envelope, overviewInput \}\)/);
  assert.match(controller, /buildCustomerAccessAuditEvent\(caseOverviewAuditInput\(\{/);
  assert.match(controller, /writeCustomerAccessAuditEvent\(\{\s*auditEvent: auditEventResult\.auditEvent,\s*writer: auditWriter,\s*\}\)\.catch\(\(\) => undefined\)/);
  assert.match(controller, /caseOverviewAuditEventType\(envelope\)/);
  assert.match(controller, /CUSTOMER_ACCESS_OVERVIEW_ROUTE = '\/customer-access\/:caseId'/);
  assert.match(controller, /CUSTOMER_ACCESS_OVERVIEW_AUDIT_SOURCE = 'customer_access_controller'/);
  assert.match(controller, /routeMatched: true/);
  assert.match(controller, /contextPresent: true/);
  assert.match(controller, /identifierValid: true/);
  assert.match(controller, /facadeResult\.catch\(\(\) => undefined\)/);
  assert.match(controller, /contextCaseId !== caseId/);
  assert.match(controller, /isPlainEnvelopeObject\(context\)/);
  assert.match(httpContextAdapter, /function contextFromInput\(input\)/);
  assert.match(httpContextAdapter, /const HTTP_CONTEXT_INPUT_DTO_KEYS = Object\.freeze\(\[/);
  assert.match(httpContextAdapter, /'caseId'/);
  assert.match(httpContextAdapter, /'customerAccessContext'/);
  assert.match(httpContextAdapter, /const CUSTOMER_ACCESS_CONTEXT_SECTIONS = Object\.freeze/);
  assert.match(httpContextAdapter, /const CUSTOMER_VISIBLE_DATA_KEYS = Object\.freeze\(\[\s*'serviceReport',\s*\]\)/);
  assert.match(httpContextAdapter, /const CUSTOMER_VISIBLE_SERVICE_REPORT_KEYS = Object\.freeze/);
  assert.match(httpContextAdapter, /function inputDtoFromInput\(input\)/);
  assert.match(httpContextAdapter, /for \(const key of HTTP_CONTEXT_INPUT_DTO_KEYS\)/);
  assert.match(httpContextAdapter, /dto\[key\] = safeProperty\(input,\s*key\)/);
  assert.match(httpContextAdapter, /function sanitizedCustomerVisibleServiceReport\(value\)/);
  assert.match(httpContextAdapter, /for \(const key of CUSTOMER_VISIBLE_SERVICE_REPORT_KEYS\)/);
  assert.match(httpContextAdapter, /for \(const key of CUSTOMER_ACCESS_CONTEXT_SECTIONS\)/);
  assert.match(httpContextAdapter, /context\[key\] = safeProperty\(customerAccessContext,\s*key\)/);
  assert.match(httpContextAdapter, /safeProperty\(inputDto,\s*'customerAccessContext'\)/);
  assert.match(httpContextAdapter, /const inputDto = inputDtoFromInput\(input\)/);
  assert.match(httpContextAdapter, /const caseId = stringValue\(safeProperty\(inputDto,\s*'caseId'\)\)/);
  assert.match(httpContextAdapter, /stringValue\(safeProperty\(params,\s*'caseId'\)\) !== caseId/);
  assert.match(httpContextAdapter, /isPlainObject\(customerAccessContext\)/);
  assert.match(httpContextAdapter, /isSuspicious|select|bearer|authorization|token/);
  assert.doesNotMatch(controller, /return buildCustomerAccessHttpResponse\(buildCustomerAccessOverviewInput\(req\)\)/);
  assert.doesNotMatch(controller, /return facadeResult|return result|json\(facadeResult\)|\.\.\.\s*facadeResult/);
  assert.doesNotMatch(controller, /rawStatus|internalStatus|workflowStatus|appointmentStatus|caseStatus|completionStatus|repairStatus|rawSummary|serviceSummary|service_summary|approved_service_summary|ai_draft_summary|ai_generated_summary|case_id|rawCaseNo|internalCaseNo|caseReference|customerCaseId|appointmentId|appointment_id|internalAppointmentId|final_appointment_id|visitId|engineerVisitId|appointmentReference|reportId|report_id|public_report_id|customerReportReference|internalReportId|privateReportId/);
  assert.doesNotMatch(httpContextAdapter, /return input;/);
  assert.doesNotMatch(
    controller,
    /request\.(auth|channel|access|customerVisibleData)|params:\s*request\.params|auth:\s*request\.auth|channel:\s*request\.channel|access:\s*request\.access|customerVisibleData:\s*request\.customerVisibleData/,
  );
  assert.doesNotMatch(
    controller,
    /request\.(query|body|headers|cookies|user|session|socket|connection)|req\.(query|body|headers|cookies|user|session|socket|connection)/,
  );
});

test('customer access context middleware rebuilds downstream context from explicit allowlist', () => {
  const middleware = read(FILES.customerAccessContextMiddleware);

  assert.match(middleware, /const CUSTOMER_ACCESS_CONTEXT_SECTIONS = Object\.freeze\(\[/);
  assert.match(middleware, /'params'/);
  assert.match(middleware, /'auth'/);
  assert.match(middleware, /'channel'/);
  assert.match(middleware, /'access'/);
  assert.match(middleware, /'customerVisibleData'/);
  assert.match(middleware, /const AUTH_KEYS = Object\.freeze\(\[/);
  assert.match(middleware, /'organizationId'/);
  assert.match(middleware, /'customerId'/);
  assert.match(middleware, /'customerIdentityVerified'/);
  assert.match(middleware, /const ACCESS_KEYS = Object\.freeze\(\[/);
  assert.match(middleware, /'organizationScopeMatched'/);
  assert.match(middleware, /'caseLinkedToCustomer'/);
  assert.match(middleware, /'publicationAllowed'/);
  assert.match(middleware, /'customerVisiblePolicyPassed'/);
  assert.match(middleware, /const CUSTOMER_VISIBLE_DATA_KEYS = Object\.freeze\(\[/);
  assert.match(middleware, /'serviceReport'/);
  assert.match(middleware, /const CUSTOMER_VISIBLE_DATA_SOURCE_KEY = 'customerVisibleData'/);
  assert.match(middleware, /const CUSTOMER_VISIBLE_SERVICE_REPORT_KEYS = Object\.freeze\(\[/);
  assert.match(middleware, /'caseNo'/);
  assert.match(middleware, /'finalAppointmentId'/);
  assert.match(middleware, /'publicReportId'/);
  assert.match(middleware, /'status'/);
  assert.match(middleware, /'summary'/);
  assert.match(middleware, /function sanitizedCustomerVisibleServiceReport\(value\)/);
  assert.match(middleware, /for \(const key of CUSTOMER_VISIBLE_SERVICE_REPORT_KEYS\)/);
  assert.match(middleware, /function sanitizedCustomerVisibleData\(value\)/);
  assert.match(middleware, /safeProperty\(source,\s*'serviceReport'\)/);
  assert.match(middleware, /function sanitizedCustomerAccessContext\(context\)/);
  assert.match(middleware, /params: sanitizedParams\(safeProperty\(safeContext,\s*'params'\)\)/);
  assert.match(middleware, /auth: sanitizedAuth\(safeProperty\(safeContext,\s*'auth'\)\)/);
  assert.match(middleware, /channel: \{\}/);
  assert.match(middleware, /access: sanitizedAccess\(safeProperty\(safeContext,\s*'access'\)\)/);
  assert.match(middleware, /customerVisibleData: sanitizedCustomerVisibleData/);
  assert.match(middleware, /function inputFromMiddleware\(getInput, req, res\)/);
  assert.match(middleware, /function customerVisibleDataSourceFromInput\(input\)/);
  assert.match(middleware, /safeProperty\(input,\s*CUSTOMER_VISIBLE_DATA_SOURCE_KEY\)/);
  assert.match(middleware, /function sanitizedInputForContext\(input\)/);
  assert.match(middleware, /hasOwn\(input,\s*CUSTOMER_VISIBLE_DATA_SOURCE_KEY\)/);
  assert.match(middleware, /const customerVisibleDataSource = customerVisibleDataSourceFromInput\(input\)/);
  assert.match(middleware, /\[CUSTOMER_VISIBLE_DATA_SOURCE_KEY\]: isPlainObject\(customerVisibleDataSource\)/);
  assert.match(middleware, /function contextFromMiddlewareInput\(input, repository\)/);
  assert.match(middleware, /buildCustomerAccessContext\(sanitizedInputForContext\(input\), \{ repository \}\)/);
  assert.match(middleware, /const routeParams = hasOwn\(req,\s*'customerAccessRouteParams'\)/);
  assert.match(middleware, /req\.params = \{\s*\.\.\.safeContext\.params,\s*\.\.\.routeParams,\s*\};/);
  assert.match(middleware, /req\.auth = safeContext\.auth/);
  assert.match(middleware, /req\.channel = safeContext\.channel/);
  assert.match(middleware, /req\.access = safeContext\.access/);
  assert.match(middleware, /req\.customerAccessContext = safeContext/);
  assert.doesNotMatch(middleware, /\.\.\.objectOrEmpty\(req\.(auth|channel|access)\)/);
  assert.doesNotMatch(middleware, /req\.customerAccessContext = context|req\.customerAccessContext = isObject/);
  assert.doesNotMatch(middleware, /req\.headers|req\.body|req\.query|req\.cookies|req\.session|req\.user|req\.socket|req\.connection/);
});

test('customer access public report route remains param based without new global mount dependency', () => {
  const route = read(FILES.route);
  const routeIndex = read(FILES.routeIndex);
  const publicRoutes = read(FILES.publicRoutes);
  const app = read(FILES.app);
  const server = read(FILES.server);

  assert.match(route, /CUSTOMER_ACCESS_REPORT_ROUTE_PATH = '\/customer-access\/:caseId\/service-report\/:reportId'/);
  assert.match(route, /function routeParamsSnapshot\(req\)/);
  assert.match(route, /function restoreReportRouteParams\(req, snapshot\)/);
  assert.match(route, /reportId: safeProperty\(snapshot,\s*'reportId'\)/);
  assert.match(route, /function serviceReportContextMiddleware\(customerAccessContextMiddleware\)/);
  assert.match(route, /restoreReportRouteParams\(req,\s*routeParams\)/);
  assert.match(route, /const customerAccessServiceReportContextMiddleware = serviceReportContextMiddleware/);
  assert.match(route, /registerGet\.call\(\s*router,\s*CUSTOMER_ACCESS_REPORT_ROUTE_PATH,\s*customerAccessServiceReportContextMiddleware,\s*reportRouteHandler,\s*\)/);
  assert.match(route, /buildCustomerAccessControllerResponse\(req\)/);
  assert.match(route, /handleCustomerServiceReportProjectionRequest\(\{\s*request: req,\s*dbClient,\s*\}\)/);
  assert.match(route, /function hasOwn\(value, key\)/);
  assert.match(route, /function hasValidExplicitDbClient\(options\)/);
  assert.match(route, /!hasOwn\(options,\s*'dbClient'\)/);
  assert.match(route, /typeof safeProperty\(dbClient,\s*'query'\) === 'function'/);
  assert.match(route, /function safeRegistrationFailed\(reasonCode = 'mount_target_invalid'\)/);
  assert.match(route, /messageKey: 'customerAccess\.unavailable'/);
  assert.match(route, /function safeRegistrationSucceeded\(\)/);
  assert.match(route, /registered: true,\s*routes: \[/);
  assert.match(route, /method: 'GET',\s*path: CUSTOMER_ACCESS_ROUTE_PATH/);
  assert.match(route, /method: 'GET',\s*path: CUSTOMER_ACCESS_REPORT_ROUTE_PATH/);
  assert.match(route, /try \{\s*const routeOptions = middlewareOptionsFromRouteOptions\(options\)/);
  assert.match(route, /registerGet\.call\(router,\s*CUSTOMER_ACCESS_ROUTE_PATH,\s*customerAccessContextMiddleware,\s*handleCustomerAccessRequest\)/);
  assert.match(route, /CUSTOMER_ACCESS_REPORT_ROUTE_PATH,\s*customerAccessServiceReportContextMiddleware,\s*reportRouteHandler/);
  assert.match(route, /catch \(error\) \{\s*return safeRegistrationFailed\('route_registration_failed'\)/);
  assert.match(route, /return safeRegistrationFailed\('mount_target_invalid'\)/);
  assert.match(route, /return safeRegistrationFailed\('db_client_invalid'\)/);
  assert.match(route, /return safeRegistrationFailed\('route_registration_failed'\)/);
  const safeRegistrationFailedSource = route.match(
    /function safeRegistrationFailed\(reasonCode = 'mount_target_invalid'\) \{[\s\S]*?\n\}/,
  )[0];
  assert.doesNotMatch(route, /return router;/);
  assert.doesNotMatch(route, /return \{\s*registered: true,[\s\S]*handler/);
  assert.doesNotMatch(safeRegistrationFailedSource, /routes:/);
  assert.doesNotMatch(route, /rawRouter|rawRoute|handler:/);
  assert.doesNotMatch(JSON.stringify(requireSpecifiers(route)), /src\/app|src\/server|public\.routes|routes\/index|pg|knex|sequelize|prisma|provider|openai|rag|billing|line|sms|email/i);
  assert.doesNotMatch(route, /process\.env|DATABASE_URL|JWT_SECRET|new Pool|createPool|psql|db:migrate|db:seed|\.listen\s*\(|app\.listen|server\.listen|express\s*\(/i);
  assert.match(routeIndex, /registerCustomerAccessRoutesWithOptions\(appRouter,\s*options\.customerAccess\)/);

  for (const [name, source] of [
    ['public.routes.js', publicRoutes],
    ['app.js', app],
    ['server.js', server],
  ]) {
    assert.doesNotMatch(source, /customerServiceReportProjection(AppAdapter|Handler)|registerCustomerServiceReportProjectionRoute|mountCustomerAccessInternalTestRoutes/i, name);
    assert.doesNotMatch(source, /\/customer-access\/:caseId\/service-report\/:reportId/, name);
  }
});

test('customer access production mount readiness guard stays injected only without production bootstrap work', () => {
  const route = read(FILES.route);
  const publicRoutes = read(FILES.publicRoutes);
  const app = read(FILES.app);
  const server = read(FILES.server);
  const routeSpecifiers = JSON.stringify(requireSpecifiers(route));

  assert.match(route, /function registerCustomerAccessRoutes\(router, options\)/);
  assert.match(route, /const registerGet = safeProperty\(router,\s*'get'\)/);
  assert.match(route, /typeof registerGet !== 'function'/);
  assert.match(route, /safeRegistrationFailed\('mount_target_invalid'\)/);
  assert.match(route, /function hasValidExplicitDbClient\(options\)/);
  assert.match(route, /safeRegistrationFailed\('db_client_invalid'\)/);
  assert.match(route, /registerGet\.call\(router,\s*CUSTOMER_ACCESS_ROUTE_PATH/);
  assert.match(route, /registerGet\.call\(\s*router,\s*CUSTOMER_ACCESS_REPORT_ROUTE_PATH/);
  assert.match(route, /function safeRegistrationSucceeded\(\)/);
  assert.match(route, /registered: true,\s*routes: \[/);
  assert.match(route, /method: 'GET',\s*path: CUSTOMER_ACCESS_ROUTE_PATH/);
  assert.match(route, /method: 'GET',\s*path: CUSTOMER_ACCESS_REPORT_ROUTE_PATH/);
  const safeRegistrationSucceededSource = route.match(
    /function safeRegistrationSucceeded\(\) \{[\s\S]*?\n\}/,
  )[0];
  assert.doesNotMatch(routeSpecifiers, /src\/app|src\/server|public\.routes|routes\/index/i);
  assert.doesNotMatch(
    routeSpecifiers,
    /(^|[/"'])(pg|knex|sequelize|prisma|mysql2?|sqlite3?|typeorm|mongoose|redis)($|[/"'])|database|pool|connection|env|zeabur|provider|openai|rag|billing|stripe|line|sms|email/i,
  );
  assert.doesNotMatch(
    route,
    /process\.env|DATABASE_URL|JWT_SECRET|new Pool|createPool|Pool\(|new Client\(|connect\(|\.listen\s*\(|app\.listen|server\.listen|express\s*\(|Router\s*\(|fetch\(|axios|http\.request|https\.request|smoke|healthz|provider|openai|rag|billing|stripe|line|sms|email/i,
  );
  assert.doesNotMatch(route, /\/__internal\/customer-access/);
  assert.doesNotMatch(route, /return router;|return target;|return app;/);
  assert.doesNotMatch(
    safeRegistrationSucceededSource,
    /routes:\s*router|routes:\s*target|handler:|dbClient:|projectionService:/,
  );

  for (const [name, source] of [
    ['public.routes.js', publicRoutes],
    ['app.js', app],
    ['server.js', server],
  ]) {
    assert.doesNotMatch(source, /\/customer-access\/:caseId|\/customer-access/i, name);
    assert.doesNotMatch(source, /registerCustomerAccessRoutes|customerAccessRoutes|customerAccessRouteRegistry/i, name);
  }
});

test('projection app adapter delegates through handler without passing raw request containers', () => {
  const appAdapter = read(FILES.projectionAppAdapter);

  assert.match(appAdapter, /const DEFAULT_INTERNAL_PROJECTION_PATH = '\/customer-access\/:caseId\/service-report\/:reportId'/);
  assert.match(appAdapter, /function safeProperty\(value, key\)/);
  assert.match(appAdapter, /function isSafeMountTarget\(value\)/);
  assert.match(appAdapter, /function mountTargetFromOptions\(options\)/);
  assert.match(appAdapter, /function safeNotRegistered\(reasonCode = 'mount_target_invalid'\)/);
  assert.match(appAdapter, /reasonCode/);
  assert.match(appAdapter, /createCustomerServiceReportProjectionHandler\(\{\s*dbClient: options\.dbClient,\s*projectionService: options\.projectionService,\s*\}\)/);
  assert.match(appAdapter, /registrationTarget\.get\.call\(registrationTarget\.target,\s*path,\s*handler\)/);
  assert.match(appAdapter, /Buffer\.isBuffer\(value\)/);
  assert.match(appAdapter, /value instanceof Date \|\| value instanceof Error/);
  assert.match(appAdapter, /typeof safeProperty\(value,\s*'then'\) === 'function'/);
  assert.match(appAdapter, /return typeof safeProperty\(value,\s*'get'\) === 'function'/);
  assert.match(appAdapter, /return safeNotRegistered\('route_registration_failed'\)/);
  assert.match(appAdapter, /return safeNotRegistered\('db_client_invalid'\)/);
  assert.doesNotMatch(appAdapter, /return \{\s*registered: true,\s*method: 'GET',\s*path,\s*handler,/);
  assert.doesNotMatch(appAdapter, /target\.get\(path,\s*handler\)/);
  assert.doesNotMatch(appAdapter, /route\(\)\.get|\.route\(|\.register\(/);
  assert.doesNotMatch(appAdapter, /projectionService\(\s*(req|request)|handler\(\s*\{\s*request|customerAccessContext:\s*request\.customerAccessContext/i);
  assert.doesNotMatch(appAdapter, /request\.(headers|authorization|cookies|query|body|socket|connection|session|user)/);
  assert.doesNotMatch(appAdapter, /req\.(headers|authorization|cookies|query|body|socket|connection|session|user)/);
  assert.doesNotMatch(appAdapter, /src\/app|src\/server|public\.routes|routes\/index|process\.env|\.listen\s*\(|app\.listen|server\.listen/);
});

test('internal test route mount remains injected only and isolated from global runtime dependencies', () => {
  const internalMount = read(FILES.internalTestRouteMount);
  const serializedSpecifiers = JSON.stringify(requireSpecifiers(internalMount));

  assert.match(internalMount, /const DEFAULT_INTERNAL_TEST_ROUTE_PATH = '\/__internal\/customer-access\/service-reports\/:caseId\/:reportId'/);
  assert.match(internalMount, /const target = options\.app \|\| options\.router/);
  assert.match(internalMount, /target\.get !== 'function'/);
  assert.match(internalMount, /path\.startsWith\('\/__internal\/'\)/);
  assert.match(internalMount, /path\.includes\(':caseId'\)/);
  assert.match(internalMount, /path\.includes\(':reportId'\)/);
  assert.match(internalMount, /registerCustomerServiceReportProjectionRoute\(\{\s*app: target,\s*dbClient: options\.dbClient,\s*path,\s*projectionService: options\.projectionService,\s*\}\)/);
  assert.doesNotMatch(serializedSpecifiers, /src\/app|src\/server|public\.routes|routes\/index|customerAccessRoutes|pg|knex|sequelize|prisma|provider|openai|rag|billing|line|sms|email/i);
  assert.doesNotMatch(internalMount, /process\.env|DATABASE_URL|JWT_SECRET|new Pool|createPool|psql|db:migrate|db:seed/i);
  assert.doesNotMatch(internalMount, /\.listen\s*\(|app\.listen|server\.listen|express\s*\(|Router\s*\(|fetch\(|axios|http\.request|https\.request/i);
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
