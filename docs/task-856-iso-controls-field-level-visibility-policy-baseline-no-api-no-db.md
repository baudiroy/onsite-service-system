# Task 856 — ISO Controls Field-level Visibility Policy Baseline / Pure Module / No API No DB

## Goal

Create a pure field-level visibility policy module that uses Task 855 data classification to decide whether a field may be exposed for a role, purpose, and scope.

This task does not wire the policy into APIs, repositories, exports, files, or AI/RAG.

## Scope

Changed files:

- `src/security/fieldVisibilityPolicy.js`
- `tests/security/fieldVisibilityPolicy.unit.test.js`
- `docs/design/iso27001-system-controls-roadmap.md`
- `docs/task-856-iso-controls-field-level-visibility-policy-baseline-no-api-no-db.md`

## Runtime Boundary

The new module is pure and deterministic. It imports only `src/security/dataClassificationPolicy.js` and does not access:

- database
- environment variables
- filesystem
- network
- provider APIs
- LINE / SMS / App push
- AI / RAG runtime
- repositories, controllers, routes, or services

## Supported Synthetic Roles

- customer
- engineer
- dispatcher
- admin
- auditor
- brand
- serviceProvider
- subcontractor
- aiRetrieval

## Supported Purposes

- customer_visible
- engineer_task
- internal_view
- export
- rag_retrieval

## Safety Decisions

- Unknown role fails closed.
- Unknown purpose fails closed.
- Missing organization / tenant scope fails closed.
- Cross-scope organization mismatch fails closed.
- Customer-visible purpose only allows customer role to view public or customer_visible classifications.
- Engineer task-visible purpose allows only a bounded operational allow-list and denies full phone/address, raw LINE id, internal note, audit raw payload, AI raw payload, billing/settlement internal data, token, secret, credential fields.
- Export and RAG retrieval deny restricted and secret fields by default.
- Decision results include `allowed`, `decision`, `reasonKey`, and `classification` only; they do not include field values, raw payloads, tokens, or sensitive data.

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
node --test tests/security/fieldVisibilityPolicy.unit.test.js # PASS, 10 passed / 0 failed
npm run check # PASS
git diff --check -- src/security/fieldVisibilityPolicy.js tests/security/fieldVisibilityPolicy.unit.test.js docs/task-856-iso-controls-field-level-visibility-policy-baseline-no-api-no-db.md docs/design/iso27001-system-controls-roadmap.md # PASS
```
