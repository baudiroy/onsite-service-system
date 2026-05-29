'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

const sourceFiles = [
  'src/customerAccess/customerAccessResolver.js',
  'src/customerAccess/customerAccessResponseEnvelope.js',
  'src/customerAccess/customerAccessService.js',
  'src/customerAccess/customerAccessRequestMapper.js',
  'src/customerAccess/customerAccessFacade.js',
  'src/customerAccess/customerAccessHttpContextAdapter.js',
  'src/customerAccess/customerAccessHttpFacade.js',
  'src/customerAccess/customerAccessRouteRegistry.js',
  'src/controllers/customerAccessController.js',
  'src/routes/customerAccessRoutes.js',
];

const allowedImportsByFile = {
  'src/customerAccess/customerAccessResolver.js': [],
  'src/customerAccess/customerAccessResponseEnvelope.js': [],
  'src/customerAccess/customerAccessService.js': [
    './customerAccessResolver',
    './customerAccessResponseEnvelope',
  ],
  'src/customerAccess/customerAccessRequestMapper.js': [],
  'src/customerAccess/customerAccessFacade.js': [
    './customerAccessRequestMapper',
    './customerAccessService',
  ],
  'src/customerAccess/customerAccessHttpContextAdapter.js': [],
  'src/customerAccess/customerAccessHttpFacade.js': [
    './customerAccessHttpContextAdapter',
    './customerAccessFacade',
  ],
  'src/customerAccess/customerAccessRouteRegistry.js': [
    '../routes/customerAccessRoutes',
  ],
  'src/controllers/customerAccessController.js': [
    '../customerAccess/customerAccessHttpFacade',
  ],
  'src/routes/customerAccessRoutes.js': [
    '../customerAccess/customerAccessDbAdapter',
    '../customerAccess/customerAccessContextMiddleware',
    '../controllers/customerAccessController',
    '../customerAccess/customerServiceReportProjectionHandler',
  ],
};

const forbiddenImportPatterns = [
  /\.\.\/repositories(?:\/|$)/,
  /\/repositories\//,
  /\.\.\/services(?:\/|$)/,
  /src\/services/,
  /db\//,
  /knex/i,
  /sequelize/i,
  /prisma/i,
  /^pg$/,
  /pool/i,
  /database/i,
  /migration/i,
  /migrations/i,
  /providers?/i,
  /line/i,
  /sms/i,
  /email/i,
  /push/i,
  /ai/i,
  /rag/i,
  /vector/i,
  /openai/i,
  /audit/i,
];

const forbiddenRuntimePatterns = [
  /\btransaction\b/i,
  /\bfs\.write\b/,
  /\bwriteFile\b/,
  /\bcreateWriteStream\b/,
  /\bapp\.listen\b/,
  /\bexpress\s*\(/,
  /\brouter\.use\b/,
];

function readSource(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function importSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  while ((match = importRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

test('all customer access boundary source files exist', () => {
  for (const file of sourceFiles) {
    assert.equal(fs.existsSync(path.join(repoRoot, file)), true, `${file} should exist`);
  }
});

test('all customer access source files use only allowed dependency direction', () => {
  for (const file of sourceFiles) {
    const specifiers = importSpecifiers(readSource(file));
    const allowed = allowedImportsByFile[file];

    assert.deepEqual(specifiers, allowed, `${file} has unexpected imports`);
  }
});

test('customer access source files have no forbidden dependency imports', () => {
  for (const file of sourceFiles) {
    const specifiers = importSpecifiers(readSource(file));

    for (const specifier of specifiers) {
      for (const pattern of forbiddenImportPatterns) {
        assert.equal(
          pattern.test(specifier),
          false,
          `${file} imports forbidden dependency ${specifier} matching ${pattern}`,
        );
      }
    }
  }
});

test('controller does not import DB, repository, provider, or AI dependencies', () => {
  const specifiers = importSpecifiers(readSource('src/controllers/customerAccessController.js'));

  assert.deepEqual(specifiers, ['../customerAccess/customerAccessHttpFacade']);
});

test('route module and registry do not import app or server bootstrap', () => {
  const files = [
    'src/routes/customerAccessRoutes.js',
    'src/customerAccess/customerAccessRouteRegistry.js',
  ];

  for (const file of files) {
    const specifiers = importSpecifiers(readSource(file));

    for (const specifier of specifiers) {
      assert.equal(/app|server|bootstrap/i.test(specifier), false, `${file} imports bootstrap ${specifier}`);
    }
  }
});

test('customer access source files do not contain app listen, express construction, router.use, or write calls', () => {
  for (const file of sourceFiles) {
    const source = readSource(file);

    for (const pattern of forbiddenRuntimePatterns) {
      assert.equal(pattern.test(source), false, `${file} contains forbidden runtime pattern ${pattern}`);
    }
  }
});
