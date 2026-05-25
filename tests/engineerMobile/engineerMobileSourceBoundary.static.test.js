'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const expectedSourceFiles = [
  'src/engineerMobile/engineerMobileTaskListService.js',
  'src/engineerMobile/engineerMobileTaskListReadModelMapper.js',
  'src/engineerMobile/engineerMobileTaskListReadRepository.js',
  'src/engineerMobile/engineerMobileTaskListReadProviderAdapter.js',
  'src/engineerMobile/engineerMobilePermissionMiddleware.js',
  'src/controllers/engineerMobileController.js',
  'src/routes/engineerMobileRoutes.js',
  'src/routes/index.js',
  'src/app.js',
  'src/server.js',
];

const engineerMobileLayerFiles = [
  'src/engineerMobile/engineerMobileTaskListService.js',
  'src/engineerMobile/engineerMobileTaskListReadModelMapper.js',
  'src/engineerMobile/engineerMobileTaskListReadRepository.js',
  'src/engineerMobile/engineerMobileTaskListReadProviderAdapter.js',
  'src/engineerMobile/engineerMobilePermissionMiddleware.js',
];

function absolutePath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function readSource(relativePath) {
  return fs.readFileSync(absolutePath(relativePath), 'utf8');
}

function sourceByPath(paths) {
  return Object.fromEntries(paths.map((relativePath) => [relativePath, readSource(relativePath)]));
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

function assertNoSpecifierMatches(relativePath, specifiers, patterns) {
  for (const specifier of specifiers) {
    for (const pattern of patterns) {
      assert.equal(
        pattern.test(specifier),
        false,
        `${relativePath} imports forbidden module ${specifier}`,
      );
    }
  }
}

function assertNoSourcePattern(relativePath, source, patterns) {
  for (const pattern of patterns) {
    assert.equal(
      pattern.test(source),
      false,
      `${relativePath} contains forbidden source pattern ${pattern}`,
    );
  }
}

test('expected Engineer Mobile source files exist', () => {
  for (const relativePath of expectedSourceFiles) {
    assert.equal(fs.existsSync(absolutePath(relativePath)), true, `${relativePath} missing`);
  }
});

test('Engineer Mobile source chain avoids DB, provider, notification, and AI imports', () => {
  const sources = sourceByPath([
    ...engineerMobileLayerFiles,
    'src/controllers/engineerMobileController.js',
    'src/routes/engineerMobileRoutes.js',
    'src/app.js',
  ]);
  const forbiddenImportPatterns = [
    /(^|[/.-])db($|[/.-])/i,
    /pool/i,
    /transaction/i,
    /repositories?/i,
    /lineProvider/i,
    /(^|[/.-])line($|[/.-])/i,
    /sms/i,
    /email/i,
    /push/i,
    /openai/i,
    /(^|[/.-])ai($|[/.-])/i,
    /rag/i,
    /vector/i,
  ];

  for (const [relativePath, source] of Object.entries(sources)) {
    const specifiers = requireSpecifiers(source).filter((specifier) => (
      relativePath !== 'src/app.js'
      || specifier !== './engineerMobile/engineerMobileTaskListReadProviderAdapter'
    ));

    assertNoSpecifierMatches(relativePath, specifiers, forbiddenImportPatterns);
  }
});

test('dependency direction stays route to controller to service, with app-only adapter wiring', () => {
  const sources = sourceByPath(expectedSourceFiles);
  const routeSpecifiers = requireSpecifiers(sources['src/routes/engineerMobileRoutes.js']);
  const controllerSpecifiers = requireSpecifiers(sources['src/controllers/engineerMobileController.js']);
  const appSpecifiers = requireSpecifiers(sources['src/app.js']);
  const serverSpecifiers = requireSpecifiers(sources['src/server.js']);
  const routeIndexSpecifiers = requireSpecifiers(sources['src/routes/index.js']);

  assert.deepEqual(routeSpecifiers, [
    '../controllers/engineerMobileController',
    '../engineerMobile/engineerMobilePermissionMiddleware',
  ]);
  assert.deepEqual(controllerSpecifiers, ['../engineerMobile/engineerMobileTaskListService']);
  assert.ok(appSpecifiers.includes('./engineerMobile/engineerMobileTaskListReadProviderAdapter'));
  assert.equal(routeIndexSpecifiers.includes('./engineerMobileRoutes'), true);
  assert.equal(
    routeIndexSpecifiers.some((specifier) => specifier.startsWith('../engineerMobile/')),
    false,
  );

  for (const relativePath of engineerMobileLayerFiles) {
    const specifiers = requireSpecifiers(sources[relativePath]);

    assertNoSpecifierMatches(relativePath, specifiers, [
      /routes?\//i,
      /controllers?\//i,
      /(^|[/.-])app($|[/.-])/i,
      /(^|[/.-])server($|[/.-])/i,
    ]);
  }

  assert.equal(
    serverSpecifiers.some((specifier) => /engineerMobile/i.test(specifier)),
    false,
    'server must not directly import Engineer Mobile modules',
  );
});

test('Engineer Mobile feature behavior does not read process.env directly', () => {
  const sources = sourceByPath([
    ...engineerMobileLayerFiles,
    'src/controllers/engineerMobileController.js',
    'src/routes/engineerMobileRoutes.js',
    'src/app.js',
  ]);
  const serverSource = readSource('src/server.js');

  for (const [relativePath, source] of Object.entries(sources)) {
    assert.equal(source.includes('process.env'), false, `${relativePath} reads process.env`);
  }

  assertNoSourcePattern('src/server.js', serverSource, [
    /ENGINEER_MOBILE[\s\S]{0,120}process\.env/i,
    /process\.env[\s\S]{0,120}ENGINEER_MOBILE/i,
  ]);
});

test('Engineer Mobile source avoids sensitive logging and raw output fields', () => {
  const sources = sourceByPath(expectedSourceFiles);
  const sensitiveOutputPatterns = [
    /\brawPhone\b/,
    /\brawAddress\b/,
    /\brawLineUserId\b/,
    /\blineUserId\b/,
    /\bDATABASE_URL\b/,
    /\binternalNote\b/,
    /\baiRawPayload\b/,
    /\bfinalAppointmentId\b/,
    /\btoken\b/i,
    /\bsecret\b/i,
  ];
  const unsafeLoggingPatterns = [
    /console\.(log|warn|error)\s*\([^)]*(payload|request|req|env|config|raw|token|secret)/i,
    /logger\.\w+\s*\([^)]*(payload|request|req|env|config|raw|token|secret)/i,
  ];

  for (const [relativePath, source] of Object.entries(sources)) {
    assertNoSourcePattern(relativePath, source, unsafeLoggingPatterns);

    if (relativePath === 'src/routes/index.js') {
      continue;
    }

    assertNoSourcePattern(relativePath, source, sensitiveOutputPatterns);
  }
});

test('Engineer Mobile source avoids official mutation patterns', () => {
  const sources = sourceByPath(expectedSourceFiles);
  const mutationPatterns = [
    /createFieldServiceReport/,
    /field_service_reports/,
    /finalAppointmentId\s*=/,
    /updateAppointment\s*\(/,
    /updateCase\s*\(/,
    /createAppointment\s*\(/,
  ];

  for (const [relativePath, source] of Object.entries(sources)) {
    assertNoSourcePattern(relativePath, source, mutationPatterns);
  }
});
