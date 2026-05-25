const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

test('PROJECT_GUARDRAILS records provider abstraction as a formal AI rule', () => {
  const guardrails = read('docs/PROJECT_GUARDRAILS.md');

  assert.match(guardrails, /Phase 1 may use OpenAI API as the primary AI provider/);
  assert.match(guardrails, /AI Gateway \/ Provider Abstraction/);
  assert.match(guardrails, /must not import OpenAI SDKs directly/);
  assert.match(guardrails, /hard-code OpenAI model names/);
  assert.match(guardrails, /Model choice must be task-tiered and policy-controlled/);
  assert.match(guardrails, /provider credentials must never enter repo, frontend, logs, prompts, RAG context, public responses, or audit raw payloads/);
  assert.match(guardrails, /AI output remains advisory \/ draft \/ suggestion/);
});

test('AI assistance design defines gateway adapter and model-tier boundaries', () => {
  const design = read('docs/design/ai-assistance-layer.md');

  assert.match(design, /## Provider Abstraction \/ AI Gateway/);
  assert.match(design, /OpenAI is an adapter-level dependency only/);
  assert.match(design, /provider-neutral AI Gateway \/ Provider Abstraction contract/);
  assert.match(design, /Provider Adapters are responsible/);
  assert.match(design, /## Model Tier Policy/);
  assert.match(design, /Individual modules must not hard-code a provider model name as a business rule/);
  assert.match(design, /## Future Provider \/ Agent Expansion/);
  assert.match(design, /## Non-goals For This Design/);
});

test('Task907 evidence document records docs-only scope and forbidden runtime areas', () => {
  const taskDoc = read('docs/task-907-ai-provider-abstraction-guardrail-sync-no-runtime-change.md');

  assert.match(taskDoc, /Docs-only/);
  assert.match(taskDoc, /No runtime implementation/);
  assert.match(taskDoc, /No SDK wiring/);
  assert.match(taskDoc, /No provider call/);
  assert.match(taskDoc, /No key\/config change/);
  assert.match(taskDoc, /No DB/);
  assert.match(taskDoc, /No migration/);
  assert.match(taskDoc, /No API/);
  assert.match(taskDoc, /No smoke\/shared runtime/);
});
