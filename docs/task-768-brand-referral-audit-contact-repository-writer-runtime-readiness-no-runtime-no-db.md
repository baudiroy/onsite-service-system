# Task768 - Brand Referral Audit Contact Repository Writer Runtime Readiness / No Runtime No DB

Status: completed

Scope: repository/writer readiness only / no runtime / no DB / no migration apply

## Summary

Task768 prepares the future repository/writer runtime slice for `brand_referral_contact_events`. It defines the intended writer contract, repository boundary, transaction expectations, redaction behavior, and future tests before implementation.

This task does not implement repository code, does not implement writer code, does not add DB access, does not add route wiring, does not add audit/contact persistence, does not add provider integration, does not add AI/RAG, and does not add smoke tests.

## Non-effects

Task768 does not implement:

- runtime behavior
- repository
- writer
- DB connection
- psql
- `db:migrate`
- DDL execution
- dry-run
- migration apply
- SQL execution
- route behavior change
- public response body change
- permission runtime
- entitlement runtime
- provider, LINE, SMS, App push, webhook, or email runtime
- AI/RAG runtime
- identity verification
- Case Binding
- repair intake creation
- Case creation
- admin UI
- smoke or integration test
- package changes

## Future Repository Contract

A future repository may write `brand_referral_contact_events` only through an injected synthetic `dbClient` or injected transaction object. The repository must not import a global DB client, must not read env configuration, must not access `DATABASE_URL`, and must not print credentials.

Future repository shape:

- input: safe event metadata only
- dependency: injected `dbClient` or transaction handle
- output: safe persistence result, such as inserted id and createdAt
- no provider calls
- no AI/RAG calls
- no identity verification
- no Case Binding
- no repair intake creation
- no customer access grant

The repository must be testable with an in-memory fake or synthetic DB adapter before any real DB use.

## Future Writer Contract

A future writer may consume only the safe `auditIntent` produced by the Task757/758 intent side-channel.

The writer must treat `auditIntent` as metadata, not as authorization to:

- verify identity
- bind a Case
- create a Case
- create repair intake
- grant customer access
- call LINE/SMS/App/webhook/email
- call AI/RAG
- expose customer case data

The writer must be optional and injected. If no writer is injected, the public route must continue to return the same safe normalization response.

## Safe Insert Fields

Future inserts may use only the migration 024 safe columns:

- `id`
- `organization_id`
- `brand_id`
- `source_channel`
- `referral_source`
- `entry_context`
- `line_channel_id`
- `event_type`
- `reason_key`
- `result_status`
- `request_id`
- `created_at`
- `retention_until`
- `deleted_at`

The writer may omit generated fields such as `id` and `created_at` when the DB supplies defaults, but it must not insert any unapproved columns.

## Forbidden Data

The writer and repository must not persist:

- raw `line_user_id`
- token
- secret
- LINE access token
- LINE channel secret
- binding token
- verification code
- full phone
- full address
- full customer name
- provider payload
- AI payload
- full customer payload
- credential
- `DATABASE_URL`
- stack trace with sensitive values
- SQL input
- customer case data
- internal note
- billing or settlement internal data
- cross-organization data

## Fail-closed Behavior

Future writer/runtime must fail closed for:

- missing `organization_id`
- missing `event_type`
- missing `result_status`
- unsafe or unknown `event_type`
- unsafe or unknown `result_status`
- unsafe extra fields
- cross-organization context
- invalid retention/deletion dates
- deleted record write attempt, unless explicitly supported by a future retention task
- duplicate `request_id`, if future idempotency policy treats it as duplicate
- DB error
- timeout
- transaction failure

Failure must not expose SQL text, stack traces, credentials, tokens, provider payload, AI payload, customer case data, internal note, or full PII.

## Route Writer Boundary

Future route wiring may use an optional injected writer after the guarded normalization path succeeds.

Required boundary:

- public response body must not expose writer internals
- public response body must not include DB errors or inserted row payload
- writer failure must not reveal internals
- writer failure behavior must be explicitly designed before implementation
- no writer may run before organization scope, permission, and entitlement guard
- no writer may turn metadata into identity verification, Case Binding, repair intake, or customer access

## Future Test Plan

Future runtime tests should cover:

- writer accepts safe `auditIntent`
- writer rejects missing `organization_id`
- writer rejects unsafe extra fields
- writer rejects unsafe event type
- writer rejects unsafe result status
- writer persists safe columns only with fake DB adapter
- writer handles duplicate `request_id` according to future idempotency policy
- writer handles DB error with safe redacted error
- writer is optional and route response stays unchanged when disabled
- route with injected writer does not expose inserted row details
- writer never creates Case, repair intake, identity verification, Case Binding, provider calls, or AI/RAG calls

## Current Pause Point

Implementation still requires a future bounded runtime task that explicitly allows:

- specific `src/**` repository/writer files
- injected DB adapter contract
- permission/audit behavior
- unit tests
- route wiring, if any
- idempotency handling
- transaction handling
- redaction policy
- failure behavior

Task768 itself authorizes none of the above.

## Verification

Run:

```bash
node --test tests/brandChannel/brandReferralAuditContactWriterReadiness.static.test.js
test -f docs/task-768-brand-referral-audit-contact-repository-writer-runtime-readiness-no-runtime-no-db.md
git diff --check -- docs/task-768-brand-referral-audit-contact-repository-writer-runtime-readiness-no-runtime-no-db.md tests/brandChannel/brandReferralAuditContactWriterReadiness.static.test.js docs/design/brand-official-line-channel-integration.md
```
