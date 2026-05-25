# Task 861 — ISO Controls Foundational Policy Integration Guard / Pure Unit Test / No API No DB

## Goal

Add a consolidation / integration guard proving ISO foundational policy modules from Task 855-860 compose safely:

- data classification
- field-level visibility
- export control
- file access control
- AI retrieval guard
- provider secret guard

This task adds no new runtime wiring.

## Scope

Changed files:

- `tests/security/isoControlsFoundationalPolicies.integration.test.js`
- `docs/design/iso27001-system-controls-roadmap.md`
- `docs/task-861-iso-controls-foundational-policy-integration-guard-no-api-no-db.md`

## Safety Assertions

The test proves:

- all six foundational ISO security modules are importable.
- restricted and secret fields are denied for customer-visible, export, file access, and AI retrieval paths.
- cross-scope organization mismatch fails closed across visibility, export, file, and AI policies.
- provider secret guard redacts before hypothetical export/log/prompt use.
- auditIntent metadata remains safe and contains no raw payload, full PII, token, secret, signed URL, prompt, embedding, file path, or DB URL.

## Non-goals

This task did not:

- modify `src/**`.
- add API routes, DTOs, controllers, services, or repositories.
- add DB schema, migrations, seed data, DDL, psql, vector DB, embeddings, or provider calls.
- change permission runtime or audit runtime.
- connect to AI/RAG runtime, provider calls, prompt construction, export runtime, file runtime, signed URLs, or customer-facing surfaces.
- add smoke tests.
- introduce token, secret, DB URL, LINE access token, AI provider secret, full PII, raw payload, credential, raw content, prompt, embedding, signed URL, or production data.

## Verification

Executed commands:

```bash
node --test tests/security/isoControlsFoundationalPolicies.integration.test.js # PASS, 5 passed / 0 failed
node --test tests/security/*.js # PASS, 56 passed / 0 failed
npm run check # PASS
git diff --check -- tests/security/isoControlsFoundationalPolicies.integration.test.js docs/task-861-iso-controls-foundational-policy-integration-guard-no-api-no-db.md docs/design/iso27001-system-controls-roadmap.md # PASS
```
