'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SERVER_PATH = path.join(REPO_ROOT, 'src/server.js');
const TEST_PATH = __filename;

function readServerSource() {
  return fs.readFileSync(SERVER_PATH, 'utf8');
}

function requireSpecifiers(source) {
  const specifiers = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(source)) !== null) {
    specifiers.push(match[1]);
  }

  return specifiers.sort();
}

function indexOfRequired(source, marker) {
  const index = source.indexOf(marker);
  assert.notEqual(index, -1, `missing marker: ${marker}`);

  return index;
}

function sliceBetweenRequired(source, startMarker, endMarker) {
  const start = indexOfRequired(source, startMarker);
  const end = indexOfRequired(source, endMarker);

  assert.ok(start < end, `${startMarker} should appear before ${endMarker}`);

  return source.slice(start, end);
}

test('Task1287 static baseline target exists', () => {
  assert.equal(fs.existsSync(SERVER_PATH), true);
});

test('Task1287 static baseline does not import src/server.js', () => {
  const testSource = fs.readFileSync(TEST_PATH, 'utf8');
  const specifiers = requireSpecifiers(testSource);

  assert.deepEqual(
    specifiers.filter((specifier) => specifier.includes('src/server') || specifier.includes('../../src/server')),
    []
  );
});

test('src/server.js direct startup is guarded by require.main === module', () => {
  const source = readServerSource();

  assert.match(
    source,
    /if\s*\(\s*require\.main\s*===\s*module\s*\)\s*{\s*startServer\(\);\s*}/
  );
});

test('src/server.js defines the observed bootstrap functions without forcing source edits', () => {
  const source = readServerSource();

  for (const functionName of [
    'createServerBootstrap',
    'startServer',
    'resolveServerApp',
    'resolvePort',
  ]) {
    assert.match(source, new RegExp(`function\\s+${functionName}\\s*\\(`));
  }
});

test('src/server.js exports the observed externally reachable bootstrap boundary', () => {
  const source = readServerSource();
  const exportBlock = source.slice(indexOfRequired(source, 'module.exports = {'));

  for (const exportName of [
    'createServerBootstrap',
    'resolveServerApp',
    'startServer',
  ]) {
    assert.match(exportBlock, new RegExp(`\\b${exportName}\\b`));
  }

  assert.doesNotMatch(exportBlock, /\bresolvePort\b/);
});

test('src/server.js listen call is inside startServer and not top-level unconditional', () => {
  const source = readServerSource();
  const startServerStart = indexOfRequired(source, 'function startServer(options = {})');
  const startupGuardStart = indexOfRequired(source, 'if (require.main === module)');
  const listenMatches = [...source.matchAll(/\.\s*listen\s*\(/g)];

  assert.equal(listenMatches.length, 1);
  assert.ok(
    listenMatches[0].index > startServerStart && listenMatches[0].index < startupGuardStart,
    'the only .listen( call should be inside startServer before the require.main startup guard'
  );
  assert.doesNotMatch(source.slice(0, startServerStart), /\.\s*listen\s*\(/);
});

test('src/server.js exposes bootstrap.start as a startServer delegate without listening during bootstrap creation', () => {
  const source = readServerSource();
  const bootstrapBlock = sliceBetweenRequired(
    source,
    'function createServerBootstrap(options = {})',
    'function startServer(options = {})'
  );

  assert.match(bootstrapBlock, /\bstart\s*\(\s*startOptions\s*=\s*{}\s*\)\s*{/);
  assert.match(bootstrapBlock, /return\s+startServer\s*\(/);
  assert.doesNotMatch(bootstrapBlock, /\.\s*listen\s*\(/);
});

test('src/server.js pool loading and signal registration stay behind startup paths', () => {
  const source = readServerSource();
  const startServerBlock = sliceBetweenRequired(
    source,
    'function startServer(options = {})',
    'if (require.main === module)'
  );
  const loadDefaultPoolBlock = sliceBetweenRequired(
    source,
    'function loadDefaultPool()',
    'function createServerBootstrap(options = {})'
  );

  assert.doesNotMatch(source, /require\(['"]\.\/db\/pool['"]\)/);
  assert.match(loadDefaultPoolBlock, /return\s+require\(poolModulePath\)\.pool;/);
  assert.match(startServerBlock, /async\s+function\s+closePool\s*\(\s*\)/);
  assert.match(startServerBlock, /const\s+pool\s*=\s*options\.pool\s*\|\|\s*loadDefaultPool\(\);/);
  assert.match(startServerBlock, /await\s+pool\.end\(\);/);
  assert.match(startServerBlock, /process\.on\(['"]SIGINT['"],\s*shutdown\);/);
  assert.match(startServerBlock, /process\.on\(['"]SIGTERM['"],\s*shutdown\);/);
  assert.doesNotMatch(source.slice(0, source.indexOf('function loadDefaultPool()')), /pool\.end\(\)/);
});
