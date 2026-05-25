# Task 907 - AI Provider Abstraction Guardrail Sync

## Status

Completed.

## Goal

Synchronize the formal AI Provider Abstraction principle into the project guardrails and AI Assistance Layer design notes.

This is a Docs-only AI/security boundary task. It does not start AI runtime implementation.

## Modified Files

- `docs/PROJECT_GUARDRAILS.md`
- `docs/design/ai-assistance-layer.md`
- `tests/ai/aiProviderAbstractionGuardrail.static.test.js`
- `docs/task-907-ai-provider-abstraction-guardrail-sync-no-runtime-change.md`

No production source file was modified. No `src/**`, `admin/src/**`, `migrations/**`, DB/repository/transaction, API route/controller/service, provider runtime, OpenAI SDK integration, AI/RAG runtime, package/env/config/credential, smoke, or shared runtime file was modified.

## Guardrail Added

`docs/PROJECT_GUARDRAILS.md` now records that Phase 1 may use OpenAI API as the primary AI provider, but every AI call must go through an AI Gateway / Provider Abstraction layer.

The guardrail states that business/domain logic must not:

- import OpenAI SDKs directly
- hard-code OpenAI model names
- depend on provider-specific response shapes
- handle provider credentials

It also states that model choice must be task-tiered and policy-controlled, provider credentials must never enter repo/frontend/logs/prompts/RAG context/public responses/audit raw payloads, and AI output remains advisory/draft/suggestion unless an authorized human or deterministic approved runtime rule confirms the official action.

## Design Detail Added

`docs/design/ai-assistance-layer.md` now adds module-level sections for:

- Provider Abstraction / AI Gateway
- Model Tier Policy
- Future Provider / Agent Expansion
- Non-goals For This Design

The design note defines AI Gateway responsibilities, Provider Adapter responsibilities, policy-controlled model tiering, future provider/agent expansion, permission-aware retrieval and redaction boundaries, provider-neutral response envelopes, and explicit non-goals.

## Explicit Non-scope

- No runtime implementation.
- No SDK wiring.
- No provider call.
- No key/config change.
- No gateway code.
- No adapter code.
- No AI/RAG runtime.
- No DB.
- No migration.
- No API.
- No provider sending.
- No package/env/config/credential change.
- No smoke/shared runtime.

## Verification

Commands to run:

```sh
node --test tests/ai/aiProviderAbstractionGuardrail.static.test.js
git diff --check -- docs/PROJECT_GUARDRAILS.md docs/design/ai-assistance-layer.md docs/task-907-ai-provider-abstraction-guardrail-sync-no-runtime-change.md tests/ai/aiProviderAbstractionGuardrail.static.test.js
npm run check
find tests -type f -name '*.js' -exec node --test {} +
```

Current results:

- `node --test tests/ai/aiProviderAbstractionGuardrail.static.test.js`: PASS, 3 tests.
- `git diff --check -- docs/PROJECT_GUARDRAILS.md docs/design/ai-assistance-layer.md docs/task-907-ai-provider-abstraction-guardrail-sync-no-runtime-change.md tests/ai/aiProviderAbstractionGuardrail.static.test.js`: PASS.
- `npm run check`: PASS.
- `find tests -type f -name '*.js' -exec node --test {} +`: PASS, 2858 tests.
