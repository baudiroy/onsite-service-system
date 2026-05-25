# Task 857 — ISO Controls Export Control Policy Baseline / Pure Module / No API No DB

## Goal

Create a pure export-control policy module that uses data classification and field-level visibility decisions to determine whether fields or datasets may be exported, and returns safe audit-intent metadata only.

This task does not wire the policy into real export jobs, APIs, files, downloads, signed URLs, or admin UI.

## Scope

Changed files:

- `src/security/exportControlPolicy.js`
- `tests/security/exportControlPolicy.unit.test.js`
- `docs/design/iso27001-system-controls-roadmap.md`
- `docs/task-857-iso-controls-export-control-policy-baseline-no-api-no-db.md`

## Runtime Boundary

The new module is pure and deterministic. It imports only existing `src/security` policy helpers and does not access:

- database
- environment variables
- filesystem
- network
- provider APIs
- real export jobs
- file generation
- downloads or signed URLs
- LINE / SMS / App push
- AI / RAG runtime
- repositories, controllers, routes, or services

## Safety Decisions

- Missing organization / tenant scope fails closed.
- Unknown role fails closed.
- Unknown purpose fails closed.
- Cross-scope organization mismatch fails closed.
- Restricted fields are denied by default for export.
- A synthetic `elevatedRestrictedExport` flag can allow restricted fields only for admin/auditor roles.
- Secret fields remain never exportable.
- Customer and engineer roles cannot export restricted or secret data.
- Decision results include `allowed`, `decision`, `reasonKey`, `allowedFields`, `deniedFields`, and `auditIntent` only; they do not include field values, raw payloads, tokens, secrets, full phone/address, raw LINE id, DB URL, or credentials.

## Non-goals

This task did not:

- add API routes, DTOs, controllers, services, or repositories.
- add DB schema, migrations, seed data, DDL, or psql usage.
- change permission runtime or audit runtime.
- connect to exports, files, downloads, signed URLs, AI/RAG, providers, or customer-facing surfaces.
- add smoke or integration tests.
- introduce token, secret, DB URL, LINE access token, AI provider secret, full PII, raw payload, credential, or production data.

## Verification

Executed commands:

```bash
node --test tests/security/exportControlPolicy.unit.test.js # PASS, 9 passed / 0 failed
npm run check # PASS
git diff --check -- src/security/exportControlPolicy.js tests/security/exportControlPolicy.unit.test.js docs/task-857-iso-controls-export-control-policy-baseline-no-api-no-db.md docs/design/iso27001-system-controls-roadmap.md # PASS
```
