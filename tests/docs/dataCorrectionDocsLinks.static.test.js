'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

function readDoc(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function assertNoSecretLikeValues(relativePath) {
  const source = readDoc(relativePath);

  assert.doesNotMatch(source, /(?<![A-Za-z0-9])sk-[A-Za-z0-9_-]{20,}/, `${relativePath} contains OpenAI-like key`);
  assert.doesNotMatch(source, /xox[baprs]-[A-Za-z0-9-]{20,}/i, `${relativePath} contains Slack-like token`);
  assert.doesNotMatch(source, /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, `${relativePath} contains JWT-like token`);
  assert.doesNotMatch(source, /postgres:\/\/(?!db-url-should-not-leak)[^\\s`)]+/i, `${relativePath} contains non-synthetic postgres URL`);
  assert.doesNotMatch(source, /token_should_not_leak|secret_should_not_leak|password_should_not_leak/i, `${relativePath} contains test secret sentinel`);
}

test('data correction design doc exists', () => {
  assert.equal(fs.existsSync(path.join(repoRoot, 'docs/design/data-correction-amendment-governance.md')), true);
});

test('Project Short Instruction includes data correction hard boundary and stays under 8000 chars', () => {
  const source = readDoc('docs/PROJECT_SHORT_INSTRUCTION.md');

  assert.match(source, /Data correction \/ amendment must protect phone identity changes/);
  assert.equal(source.length < 8000, true, `short instruction length is ${source.length}`);
});

test('Project Guardrails links to data correction design doc', () => {
  const source = readDoc('docs/PROJECT_GUARDRAILS.md');

  assert.match(source, /data-correction-amendment-governance\.md/);
  assert.match(source, /Phone changes require re-verification/);
});

test('design README links to data correction design doc', () => {
  const source = readDoc('docs/design/README.md');

  assert.match(source, /\[data-correction-amendment-governance\.md\]\(\.\/data-correction-amendment-governance\.md\)/);
});

test('docs README links to data correction design doc or design index', () => {
  const source = readDoc('docs/README.md');

  assert.match(source, /design\/data-correction-amendment-governance\.md|design\/README\.md/);
});

test('design doc mentions completed Task652 and Task653 runtime foundations', () => {
  const source = readDoc('docs/design/data-correction-amendment-governance.md');

  assert.match(source, /Task652/);
  assert.match(source, /Task653/);
});

test('design doc includes required governance concepts', () => {
  const source = readDoc('docs/design/data-correction-amendment-governance.md');

  assert.match(source, /Phone Change Re-verification Flow/);
  assert.match(source, /Post-departure \/ Route-started Freeze/);
  assert.match(source, /Unable-to-complete Terminal Appointment States/);
  assert.match(source, /Follow-up \/ Second-dispatch Appointment Principle/);
  assert.match(source, /No Second FSR Principle/);
});

test('updated docs do not contain credential-like values', () => {
  for (const relativePath of [
    'docs/PROJECT_SHORT_INSTRUCTION.md',
    'docs/PROJECT_GUARDRAILS.md',
    'docs/design/data-correction-amendment-governance.md',
    'docs/design/README.md',
    'docs/README.md',
  ]) {
    assertNoSecretLikeValues(relativePath);
  }
});
