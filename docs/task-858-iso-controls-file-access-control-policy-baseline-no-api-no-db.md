# Task 858 — ISO Controls File Access Control Policy Baseline / Pure Module / No API No DB

## Goal

Create a pure file-access-control policy module for future attachment, download, and signed-URL controls. It uses classification and role/scope concepts to decide preview, download, and delete eligibility, and returns safe audit-intent metadata only.

This task does not wire the policy into real file storage, signed URLs, APIs, downloads, delete behavior, or admin UI.

## Scope

Changed files:

- `src/security/fileAccessControlPolicy.js`
- `tests/security/fileAccessControlPolicy.unit.test.js`
- `docs/design/iso27001-system-controls-roadmap.md`
- `docs/task-858-iso-controls-file-access-control-policy-baseline-no-api-no-db.md`

## Runtime Boundary

The new module is pure and deterministic. It does not access:

- database
- environment variables
- filesystem
- network
- provider APIs
- real file storage
- signed URL creation
- upload / download / delete runtime
- LINE / SMS / App push
- AI / RAG runtime
- repositories, controllers, routes, or services

## Supported Actions

- preview
- download
- delete

## Safety Decisions

- Missing organization / tenant scope fails closed.
- Unknown role fails closed.
- Unknown action fails closed.
- Unknown file classification fails closed.
- Cross-scope organization mismatch fails closed.
- Customer-visible files may be previewed/downloaded by in-scope customer actors.
- Customer cannot preview/download internal, confidential, restricted, or secret files.
- Engineer and subcontractor access requires assigned case relationship.
- Engineer and subcontractor cannot access confidential, restricted, or secret files.
- Secret files are never previewable, downloadable, or deletable through this policy.
- Delete requires an elevated admin/auditor synthetic context and is denied to customer, engineer, brand, serviceProvider, and subcontractor by default.
- Decision results include `allowed`, `decision`, `reasonKey`, `action`, `classification`, and `auditIntent` only; they do not include file content, signed URL, storage path, bucket, token, secret, full PII, raw LINE id, DB URL, or credential.

## Non-goals

This task did not:

- add API routes, DTOs, controllers, services, or repositories.
- add DB schema, migrations, seed data, DDL, or psql usage.
- change permission runtime or audit runtime.
- connect to real storage, upload, download, delete, signed URL, AI/RAG, providers, or customer-facing surfaces.
- add smoke or integration tests.
- introduce token, secret, DB URL, LINE access token, AI provider secret, full PII, raw payload, credential, storage path, signed URL, or production data.

## Verification

Executed commands:

```bash
node --test tests/security/fileAccessControlPolicy.unit.test.js # PASS, 7 passed / 0 failed
npm run check # PASS
git diff --check -- src/security/fileAccessControlPolicy.js tests/security/fileAccessControlPolicy.unit.test.js docs/task-858-iso-controls-file-access-control-policy-baseline-no-api-no-db.md docs/design/iso27001-system-controls-roadmap.md # PASS
```
