# Task773 - Brand Referral Normalization and Audit-contact Branch Closure Checkpoint / No Runtime No DB

Status: completed.

Scope: branch closure checkpoint, docs/static guard only.

## Purpose

Task773 closes the current Brand Referral normalization and audit-contact branch from Task735 through Task772. This checkpoint records what is complete, what remains intentionally paused, and what still requires explicit future authorization.

## Completed Branch Phases

### Docs/static design baseline

Tasks 727-734 and later cross-references define Brand Official LINE / Brand Channel Integration, multiple official LINE channels, channel identity scope, customer verification, Case Binding boundary, Basic / Professional / Enterprise add-on packaging, and Brand Knowledge AI / Customer Case AI separation.

### Pure deterministic policies

Tasks 735-743 add pure policy helpers for:

- brand referral source recognition
- brand issue triage
- multi-LINE-channel allowed flow decisions
- safe composition between referral metadata, triage, and channel allowed-flow policy

These helpers do not grant identity, Case Binding, case-data access, provider calls, audit/contact writes, entitlement runtime, or AI/RAG runtime.

### Request normalization and guarded API envelope

Tasks 744-756 add safe request normalization, guarded normalization, route adapter, and public route mount at `POST /api/v1/public/brand-referral/normalize`.

The public route remains normalization-only:

- fails closed without injected access guard context
- returns only safe referral metadata and no-runtime grants
- does not create Case or repair intake records
- does not verify identity or bind Cases
- does not call provider, LINE, webhook, AI/RAG, entitlement, or DB runtime

### Audit/contact intent side-channel

Tasks 757-760 add a safe internal `auditIntent` side-channel and persistence readiness gate.

The public response body remains unchanged and never includes `auditIntent`.

### Migration 024 no-apply artifact

Tasks 761-767 define and create the authoring-only migration file:

- `migrations/024_create_brand_referral_contact_events.sql`

The SQL file exists but remains:

- not dry-run
- not applied
- not executed
- not connected to DB
- not authorized for shared/prod/staging/Zeabur targets

### Injected audit/contact writer path

Tasks 768-772 define, implement, test, and close the injected writer branch.

The accepted boundary is:

- injected-only repository/writer
- fake DB unit tests only
- optional injected route writer path
- public response body unchanged
- no default writer configured
- writer errors redacted
- no real DB or persistence promotion

## Still Paused / Not Authorized

This branch does not authorize:

- DB connection
- `psql`
- `db:migrate`
- DDL execution
- Migration 024 dry-run or apply
- real audit/contact persistence sink
- default writer configuration
- public API response body changes
- Case creation
- repair intake creation
- identity verification
- Case Binding
- customer access grant
- provider / LINE / SMS / App push / webhook / email delivery
- entitlement or billing runtime
- admin frontend
- package changes
- smoke or integration tests
- AI/RAG runtime

## Unsafe Data Boundary

The branch continues to forbid storing, echoing, logging, or returning:

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
- database URL
- stack trace
- SQL
- customer case data
- internal note
- billing internal data
- settlement internal data
- cross-organization data

## Future Decision Points

Future work must explicitly choose and authorize one bounded path:

1. Disposable local/test DB dry-run for Migration 024.
2. Real persistence wiring behind injected DB only.
3. Route-level persistence activation with unchanged public body.
4. Identity verification and Case Binding branch.
5. Repair intake handoff branch.
6. Provider / LINE / webhook branch.
7. Entitlement / usage / billing guard branch.
8. Admin UI or reporting branch.
9. AI/RAG branch.

Each future path must state allowed files, forbidden files, DB/migration permissions, API behavior, provider permissions, AI/RAG permissions, audit/permission scope, smoke/integration test scope, and sensitive-output rules.

## Verification

Required commands:

```bash
node --test tests/brandChannel/brandReferralBranchClosureCheckpoint.static.test.js
node --test tests/brandChannel/*.js
npm run check
git diff --check -- tests/brandChannel/brandReferralBranchClosureCheckpoint.static.test.js docs/task-773-brand-referral-normalization-audit-contact-branch-closure-checkpoint-no-runtime-no-db.md docs/design/brand-official-line-channel-integration.md
```
