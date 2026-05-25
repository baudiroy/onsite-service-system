# Task 855 — ISO Controls Data Classification Runtime Baseline / Pure Policy Module / No API No DB

## Goal

Create a small pure runtime data-classification policy module as the foundation for future field-level visibility, export control, file access, and AI/RAG retrieval guards.

This task does not wire the policy into API/runtime flows yet.

## Scope

Changed files:

- `src/security/dataClassificationPolicy.js`
- `tests/security/dataClassificationPolicy.unit.test.js`
- `docs/design/iso27001-system-controls-roadmap.md`
- `docs/task-855-iso-controls-data-classification-runtime-baseline-no-api-no-db.md`

## Runtime Boundary

The new module is pure and deterministic. It does not access:

- database
- environment variables
- filesystem
- network
- provider APIs
- LINE / SMS / App push
- AI / RAG runtime
- repositories, controllers, routes, or services

## Exports

The module exports:

- `DATA_CLASSIFICATIONS`
- `DATA_CLASSIFICATION_RANK`
- `DATA_ACCESS_PURPOSES`
- `DEFAULT_CLASSIFICATION`
- `classifyField`
- `canExposeClassificationForPurpose`
- `canExposeFieldForPurpose`
- `isAtLeastClassification`
- `normalizeFieldKey`

Classifications:

- `public`
- `customer_visible`
- `internal`
- `confidential`
- `restricted`
- `secret`

## Safety Decisions

- Unknown fields fail closed to `internal`, not `public` or `customer_visible`.
- Customer-visible purpose exposes only `public` and `customer_visible`.
- Export and RAG retrieval deny `restricted` and `secret` fields by default.
- Secret patterns include token, secret, credential, password, API key, access token, channel secret, webhook secret, database URL, private key.
- Restricted patterns include raw LINE id, full phone/address, signature, unmasked photo, audit raw payload, AI raw payload, internal note, billing internal data, settlement internal data.
- No organization or tenant bypass concept is introduced in this module.

## Non-goals

This task did not:

- add API routes, DTOs, controllers, services, or repositories.
- add DB schema, migrations, seed data, DDL, or psql usage.
- change permission runtime or audit runtime.
- connect to exports, files, AI/RAG, providers, or customer-facing surfaces.
- add smoke or integration tests.
- introduce token, secret, DB URL, LINE access token, AI provider secret, full PII, raw payload, credential, or production data.

## Verification

Executed commands:

```bash
node --test tests/security/dataClassificationPolicy.unit.test.js # PASS, 11 passed / 0 failed
npm run check # PASS
git diff --check -- src/security/dataClassificationPolicy.js tests/security/dataClassificationPolicy.unit.test.js docs/task-855-iso-controls-data-classification-runtime-baseline-no-api-no-db.md docs/design/iso27001-system-controls-roadmap.md # PASS
```
