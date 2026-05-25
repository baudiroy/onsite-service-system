# Task 859 — ISO Controls AI Retrieval Guard Policy Baseline / Pure Module / No Provider No DB

## Goal

Create a pure AI/RAG retrieval guard policy module that decides whether a field or document chunk may be retrieved for AI assistance based on tenant scope, classification, field visibility, and synthetic permission context.

This task does not wire into AI providers, vector DB, prompts, embeddings, tool-calling, repository reads, or runtime RAG.

## Scope

Changed files:

- `src/security/aiRetrievalGuardPolicy.js`
- `tests/security/aiRetrievalGuardPolicy.unit.test.js`
- `docs/design/iso27001-system-controls-roadmap.md`
- `docs/task-859-iso-controls-ai-retrieval-guard-policy-baseline-no-provider-no-db.md`

## Runtime Boundary

The new module is pure and deterministic. It imports only existing `src/security` policy helpers and does not access:

- database
- vector database
- environment variables
- filesystem
- network
- AI providers
- prompt construction
- embeddings
- tool-calling
- repository reads
- LINE / SMS / App push
- audit writers
- routes, controllers, or services

## Supported Retrieval Purposes

- customer_support_ai
- dispatcher_ai
- engineer_ai
- auditor_ai

## Safety Decisions

- Missing organization / tenant scope fails closed.
- Unknown role fails closed.
- Unknown purpose fails closed.
- Cross-scope organization mismatch fails closed.
- Missing synthetic permission context fails closed.
- Restricted and secret fields/chunks are denied by default.
- Raw LINE id, full phone/address, audit raw payload, AI raw payload, internal note, billing/settlement internal data, token, secret, credential, DB URL, and provider secret are never retrievable by default.
- Customer-support AI retrieves only public or customer_visible data.
- Engineer AI retrieves only assigned task-visible data.
- Dispatcher and auditor AI retrieve only non-restricted scoped data.
- Decision results include `allowed`, `decision`, `reasonKey`, `classification`, safe `fieldKey`, safe `documentId`, safe `chunkId`, and `auditIntent` only; they do not include raw content, prompt, embedding, token, secret, full PII, DB URL, or payload.

## Non-goals

This task did not:

- add API routes, DTOs, controllers, services, or repositories.
- add DB schema, migrations, seed data, DDL, psql, vector DB, embeddings, or provider calls.
- change permission runtime or audit runtime.
- connect to AI/RAG runtime, provider calls, prompt construction, tools, exports, files, or customer-facing surfaces.
- add smoke or integration tests.
- introduce token, secret, DB URL, LINE access token, AI provider secret, full PII, raw payload, credential, raw content, prompt, embedding, or production data.

## Verification

Executed commands:

```bash
node --test tests/security/aiRetrievalGuardPolicy.unit.test.js # PASS, 7 passed / 0 failed
npm run check # PASS
git diff --check -- src/security/aiRetrievalGuardPolicy.js tests/security/aiRetrievalGuardPolicy.unit.test.js docs/task-859-iso-controls-ai-retrieval-guard-policy-baseline-no-provider-no-db.md docs/design/iso27001-system-controls-roadmap.md # PASS
```
