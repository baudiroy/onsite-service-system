'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '../..');

function readDoc(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function assertFileExists(relativePath) {
  assert.ok(fs.existsSync(path.join(repoRoot, relativePath)), `${relativePath} should exist`);
}

function assertContainsAll(source, patterns, label) {
  for (const pattern of patterns) {
    assert.match(source, pattern, `${label} is missing ${pattern}`);
  }
}

function assertNoRealLookingSensitiveValues(relativePath) {
  const source = readDoc(relativePath);

  assert.doesNotMatch(source, /(?<![A-Za-z0-9])sk-[A-Za-z0-9_-]{20,}/, `${relativePath} contains OpenAI-like key`);
  assert.doesNotMatch(source, /xox[baprs]-[A-Za-z0-9-]{20,}/i, `${relativePath} contains Slack-like token`);
  assert.doesNotMatch(source, /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, `${relativePath} contains JWT-like token`);
  assert.doesNotMatch(source, /\b(?:postgres(?:ql)?|mysql|mongodb):\/\/[^`\s<>)]+/i, `${relativePath} contains database URL`);
  assert.doesNotMatch(source, /\bBearer\s+[A-Za-z0-9._-]{20,}/i, `${relativePath} contains bearer token`);
  assert.doesNotMatch(source, /\bAIza[0-9A-Za-z_-]{20,}\b/, `${relativePath} contains Google API-key-like value`);
  assert.doesNotMatch(source, /\bU[a-f0-9]{32}\b/i, `${relativePath} contains raw LINE-user-id-like value`);
  assert.doesNotMatch(source, /\b09\d{2}[-\s]?\d{3}[-\s]?\d{3}\b/, `${relativePath} contains full Taiwan mobile-like value`);
  assert.doesNotMatch(source, /(?:LINE_)?(?:CHANNEL_)?(?:SECRET|TOKEN|ACCESS_TOKEN)\s*[:=]\s*['"]?[A-Za-z0-9._-]{12,}/i, `${relativePath} contains LINE secret/token-like assignment`);
  assert.doesNotMatch(source, /(?:token|secret|password)_should_not_leak/i, `${relativePath} contains secret sentinel`);
}

test('short instruction and guardrails files exist', () => {
  assertFileExists('docs/PROJECT_SHORT_INSTRUCTION.md');
  assertFileExists('docs/PROJECT_GUARDRAILS.md');
});

test('Project Short Instruction remains compact and points to source-of-truth docs', () => {
  const source = readDoc('docs/PROJECT_SHORT_INSTRUCTION.md');

  assert.ok(source.length < 8000, `PROJECT_SHORT_INSTRUCTION.md length is ${source.length}`);
  assert.match(source, /full source of truth is `docs\/PROJECT_GUARDRAILS\.md`/i);
  assert.match(source, /module details live under `docs\/design\/`/i);

  assert.doesNotMatch(source, /##\s+Future Module Scope/i, 'short instruction should not duplicate full module design sections');
  assert.doesNotMatch(source, /##\s+Current-stage Strategy/i, 'short instruction should not duplicate module implementation strategy sections');
  assert.doesNotMatch(source, /###\s+\d+\./, 'short instruction should not carry detailed numbered sub-sections');
  assert.doesNotMatch(source, /Task\d{3}/, 'short instruction should not carry historical task-note detail');
});

test('Project Short Instruction preserves core project boundaries', () => {
  const source = readDoc('docs/PROJECT_SHORT_INSTRUCTION.md');

  assertContainsAll(
    source,
    [
      /一張 Case 只能有一份正式完成報告/,
      /Field Service Report/,
      /field_service_reports\.case_id/,
      /一張 Case 可以有多筆 appointment \/ dispatch visit/,
      /finalAppointmentId.*backend \/ system/,
      /organization scope/,
      /permission/,
      /audit log/,
      /Customer-facing data/,
      /AI.*permission-aware.*tenant-isolated.*auditable.*RAG-grounded/,
      /SaaS.*multi-tenant/,
      /LINE 是目前主要入口，但不可寫死為唯一入口/,
      /line_user_id.*organization_id \+ line_channel_id \+ line_user_id/,
      /provider secret safety/,
      /Docs-only 任務不得修改 runtime/,
    ],
    'Project Short Instruction',
  );
});

test('Project Guardrails keeps source-of-truth references for current branch boundaries', () => {
  const source = readDoc('docs/PROJECT_GUARDRAILS.md');

  assertContainsAll(
    source,
    [
      /Brand Official LINE \/ Brand Channel Integration/,
      /brand-official-line-channel-integration\.md/,
      /Brand Referral/,
      /同一品牌或 organization 可有多個 official LINE channel/,
      /line_user_id.*organization_id \+ line_channel_id \+ line_user_id/,
      /Engineer Mobile Workbench/,
      /engineer-mobile-workbench\.md/,
      /Data correction \/ amendment governance/i,
      /data-correction-amendment-governance\.md/,
      /Phone changes require re-verification/,
      /ISO27001-aligned system controls roadmap/,
      /iso27001-system-controls-roadmap\.md/,
      /closed-domain、permission-aware、tenant-isolated、auditable、human-controlled、RAG-grounded/,
      /SaaS.*entitlement/,
      /add-on/,
    ],
    'Project Guardrails',
  );
});

test('Project Short Instruction and Guardrails do not contain real-looking sensitive values', () => {
  assertNoRealLookingSensitiveValues('docs/PROJECT_SHORT_INSTRUCTION.md');
  assertNoRealLookingSensitiveValues('docs/PROJECT_GUARDRAILS.md');
});

test('Project Short Instruction and Guardrails do not authorize paused DB or runtime branches', () => {
  const source = `${readDoc('docs/PROJECT_SHORT_INSTRUCTION.md')}\n${readDoc('docs/PROJECT_GUARDRAILS.md')}`;

  assert.doesNotMatch(source, /Migration 022[^.\n]*(?:approved|authorized|可執行|已授權)[^.\n]*(?:dry-run|apply|DDL|DB)/i);
  assert.doesNotMatch(source, /Migration 024[^.\n]*(?:approved|authorized|可執行|已授權)[^.\n]*(?:dry-run|apply|DDL|DB)/i);
  assert.doesNotMatch(source, /Brand Referral[^.\n]*(?:persistence promotion|real audit\/contact persistence|DB adoption)[^.\n]*(?:approved|authorized|已授權)/i);
  assert.doesNotMatch(source, /Engineer Mobile[^.\n]*(?:DB adoption|repository\/DB reads|completion writes)[^.\n]*(?:approved|authorized|已授權)/i);
  assert.doesNotMatch(source, /Case Binding runtime[^.\n]*(?:approved|authorized|已授權)/i);
  assert.doesNotMatch(source, /provider\/webhook runtime[^.\n]*(?:approved|authorized|已授權)/i);
  assert.doesNotMatch(source, /AI\/RAG runtime[^.\n]*(?:approved|authorized|已授權)/i);
});
